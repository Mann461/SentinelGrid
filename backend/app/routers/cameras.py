from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, text
from typing import List, Optional
import math
from datetime import datetime, date

from app.database import get_db, IS_SQLITE
from app.models import Camera, Department, AuditLog
from app.schemas import (
    CameraCreate, CameraOut, CameraBulkUploadRequest, CameraBulkUploadResponse,
    AuditLogOut, UncoveredZoneRegion
)
from app.auth import get_current_user, UserContext

router = APIRouter(prefix="/cameras", tags=["Camera Registry & GIS Foundation"])

@router.post(
    "", 
    response_model=CameraOut, 
    status_code=status.HTTP_201_CREATED,
    summary="Manual Camera Onboarding",
    description="Registers a single camera with spatial coordinates, protocol, vendor, retention policy, and legacy status tags into the PostgreSQL PostGIS database."
)
async def onboard_single_camera(
    cam_in: CameraCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(get_current_user)
):
    """
    Onboard a single camera manually into the GIS registry.
    Validates latitude/longitude bounds and creates PostGIS Geography Point.
    """
    # Verify department exists or create standard
    dept_stmt = select(Department).where(Department.id == cam_in.department_id)
    dept_res = await db.execute(dept_stmt)
    dept = dept_res.scalars().first()
    
    if not dept:
        # Fallback query by department name
        dept_stmt2 = select(Department).where(Department.name == cam_in.department_id)
        dept_res2 = await db.execute(dept_stmt2)
        dept = dept_res2.scalars().first()
        if not dept:
            # Create standard default department if missing
            dept = Department(
                name="Gujarat Police",
                type="police",
                region="Ahmedabad",
                contact_info={"phone": "112"}
            )
            db.add(dept)
            await db.flush()

    # Construct Camera model
    camera = Camera(
        department_id=dept.id,
        name=cam_in.name,
        latitude=cam_in.latitude,
        longitude=cam_in.longitude,
        vendor=cam_in.vendor,
        protocol=cam_in.protocol,
        install_date=cam_in.install_date,
        status=cam_in.status,
        retention_policy_days=cam_in.retention_policy_days,
        feed_url=cam_in.feed_url or f"rtsp://10.100.{abs(hash(cam_in.name))%250}.{abs(hash(cam_in.name))%250}:554/live",
        is_legacy_infrastructure=cam_in.is_legacy_infrastructure,
        is_tagged_live_test=cam_in.is_tagged_live_test,
        dpdp_consent_verified=cam_in.dpdp_consent_verified
    )

    # Set spatial geography point if PostGIS
    if not IS_SQLITE:
        camera.location = func.ST_SetSRID(func.ST_MakePoint(cam_in.longitude, cam_in.latitude), 4326)

    db.add(camera)
    await db.flush()

    # Audit log entry
    audit = AuditLog(
        user_id=current_user.user_id,
        user_department=current_user.department,
        action="MANUAL_CAMERA_ONBOARD",
        target_camera_id=camera.id,
        details={"camera_name": camera.name, "vendor": camera.vendor, "coords": [camera.latitude, camera.longitude]}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(camera)

    out = CameraOut.model_validate(camera)
    out.department_name = dept.name
    return out

@router.post(
    "/bulk-upload", 
    response_model=CameraBulkUploadResponse,
    summary="Bulk Camera Onboarding (CSV / JSON)",
    description="Processes batch camera imports from CSV or JSON files with automated coordinate validation and PostGIS indexing."
)
async def bulk_upload_cameras(
    req: CameraBulkUploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(get_current_user)
):
    """
    Bulk onboard cameras from structured CSV/JSON payloads.
    Provides validation results and persists batch records in PostgreSQL.
    """
    total = len(req.cameras)
    successful = 0
    failed = 0
    errors = []

    # Get standard department map
    depts_res = await db.execute(select(Department))
    dept_list = depts_res.scalars().all()
    dept_map = {d.name: d.id for d in dept_list}
    
    if not dept_map:
        default_dept = Department(name="Gujarat Police", type="police", region="Ahmedabad")
        db.add(default_dept)
        await db.flush()
        dept_map = {"Gujarat Police": default_dept.id}

    default_dept_id = list(dept_map.values())[0]

    for idx, cam_in in enumerate(req.cameras):
        try:
            target_dept_id = dept_map.get(cam_in.department_id, default_dept_id)
            
            camera = Camera(
                department_id=target_dept_id,
                name=cam_in.name,
                latitude=cam_in.latitude,
                longitude=cam_in.longitude,
                vendor=cam_in.vendor,
                protocol=cam_in.protocol,
                install_date=cam_in.install_date,
                status=cam_in.status,
                retention_policy_days=cam_in.retention_policy_days,
                feed_url=cam_in.feed_url or f"rtsp://10.200.{idx%250}.{idx%250}:554/live",
                is_legacy_infrastructure=cam_in.is_legacy_infrastructure,
                is_tagged_live_test=cam_in.is_tagged_live_test,
                dpdp_consent_verified=cam_in.dpdp_consent_verified
            )
            if not IS_SQLITE:
                camera.location = func.ST_SetSRID(func.ST_MakePoint(cam_in.longitude, cam_in.latitude), 4326)

            db.add(camera)
            successful += 1
        except Exception as e:
            failed += 1
            errors.append(f"Row {idx+1} ({cam_in.name}): {str(e)}")

    # Add audit log for bulk onboarding
    audit = AuditLog(
        user_id=current_user.user_id,
        user_department=current_user.department,
        action="BULK_CAMERA_ONBOARD",
        details={"total": total, "successful": successful, "failed": failed}
    )
    db.add(audit)
    await db.commit()

    return CameraBulkUploadResponse(
        total_processed=total,
        successful=successful,
        failed=failed,
        errors=errors
    )

@router.get(
    "", 
    response_model=List[CameraOut],
    summary="Filterable Camera Registry Query",
    description="Queries camera registry filtered by department, region, online/offline status, legacy status, or tagged live-test subset. Role-based access control applies with cross-department view audit logging."
)
async def get_cameras(
    department_id: Optional[str] = Query(None, description="Filter by department ID or name"),
    region: Optional[str] = Query(None, description="Filter by region (e.g. Ahmedabad, Surat)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (online, offline, degraded, uncovered_zone)"),
    is_legacy: Optional[bool] = Query(None, description="Filter ageing infrastructure"),
    is_tagged_live_test: Optional[bool] = Query(None, description="Filter tagged 50-camera subset for live test"),
    cross_department: bool = Query(False, description="Enable cross-department view (logged in audit trail)"),
    db: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(get_current_user)
):
    """
    Retrieves filtered camera list.
    If cross_department toggle is set, logs cross-dept access in audit trail.
    """
    stmt = select(Camera, Department.name.label("department_name")).join(
        Department, Camera.department_id == Department.id, isouter=True
    )

    conditions = []
    
    if department_id and department_id != "ALL":
        conditions.append(or_(Camera.department_id == department_id, Department.name == department_id))

    if region and region != "ALL":
        conditions.append(Department.region == region)

    if status_filter and status_filter != "ALL":
        conditions.append(Camera.status == status_filter)

    if is_legacy is not None:
        conditions.append(Camera.is_legacy_infrastructure == is_legacy)

    if is_tagged_live_test is not None:
        conditions.append(Camera.is_tagged_live_test == is_tagged_live_test)

    if conditions:
        stmt = stmt.where(and_(*conditions))

    result = await db.execute(stmt)
    rows = result.all()

    output = []
    for cam, dept_name in rows:
        out = CameraOut.model_validate(cam)
        out.department_name = dept_name or "Gujarat Police"
        output.append(out)

    # Log cross department query if active
    if cross_department:
        audit = AuditLog(
            user_id=current_user.user_id,
            user_department=current_user.department,
            action="CROSS_DEPARTMENT_VIEW",
            details={"filters": {"department_id": department_id, "region": region, "total_returned": len(output)}}
        )
        db.add(audit)
        await db.commit()

    return output

@router.get(
    "/uncovered-zones", 
    response_model=List[UncoveredZoneRegion],
    summary="PostGIS Spatial Density & Gap Analysis",
    description="Executes a spatial PostGIS query analyzing camera density across regional clusters to detect high-risk uncovered zones."
)
async def get_uncovered_zones(
    radius_km: float = Query(5.0, description="Spatial cluster radius in kilometers"),
    min_density: int = Query(3, description="Minimum required camera count per region cluster"),
    db: AsyncSession = Depends(get_db)
):
    """
    PostGIS spatial gap analysis.
    Evaluates camera spatial density to identify surveillance coverage gaps across Gujarat corridors.
    """
    # Defined key strategic corridors in Gujarat to perform PostGIS spatial density analysis
    regions_config = [
        {"id": "zone-ahd-east", "name": "Ahmedabad East Industrial Belt (Naroda-Odhav)", "lat": 23.0450, "lng": 72.6450, "bbox": [[23.030, 72.630], [23.060, 72.660]]},
        {"id": "zone-srt-hazira", "name": "Surat Hazira Port & Highway Corridor", "lat": 21.1450, "lng": 72.6200, "bbox": [[21.120, 72.600], [21.170, 72.650]]},
        {"id": "zone-vad-express", "name": "Vadodara NE-1 Expressway Junction", "lat": 22.3400, "lng": 73.2100, "bbox": [[22.320, 73.190], [22.360, 73.230]]},
        {"id": "zone-rjt-bypass", "name": "Rajkot Morbi Highway Ring Bypass", "lat": 22.3300, "lng": 70.8000, "bbox": [[22.310, 70.780], [22.350, 70.820]]},
        {"id": "zone-bhv-coast", "name": "Bhavnagar Coastal Highway Gap", "lat": 21.7500, "lng": 72.1800, "bbox": [[21.730, 72.160], [21.770, 72.200]]},
        {"id": "zone-gnd-gift", "name": "Gandhinagar GIFT City Perimeter Outer Gap", "lat": 23.1650, "lng": 72.6900, "bbox": [[23.150, 72.670], [23.180, 72.710]]}
    ]

    uncovered_zones = []

    for zone in regions_config:
        # Calculate real camera count in proximity using spatial distance math
        lat, lng = zone["lat"], zone["lng"]
        
        if not IS_SQLITE:
            # PostGIS ST_DWithin geography spatial query (radius in meters)
            spatial_query = text("""
                SELECT COUNT(*) FROM cameras 
                WHERE ST_DWithin(
                    location, 
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 
                    :radius_meters
                );
            """)
            res = await db.execute(spatial_query, {"lng": lng, "lat": lat, "radius_meters": radius_km * 1000})
            cam_count = res.scalar() or 0
        else:
            # Haversine distance fallback for SQLite local dev
            cam_res = await db.execute(select(Camera))
            cams = cam_res.scalars().all()
            cam_count = 0
            for c in cams:
                dist = math.sqrt((c.latitude - lat)**2 + (c.longitude - lng)**2) * 111.0
                if dist <= radius_km:
                    cam_count += 1

        density_score = round(cam_count / (math.pi * (radius_km ** 2)), 2)
        
        status_label = "HIGH_RISK_GAP" if cam_count < min_density else ("MODERATE_COVERAGE" if cam_count < 8 else "OPTIMAL")
        rec_cams = max(0, min_density * 2 - cam_count)

        uncovered_zones.append(
            UncoveredZoneRegion(
                id=zone["id"],
                region_name=zone["name"],
                center_latitude=lat,
                center_longitude=lng,
                camera_count=cam_count,
                density_score=density_score,
                status=status_label,
                recommended_new_cameras=rec_cams,
                bounding_box=zone["bbox"]
            )
        )

    return uncovered_zones

@router.get(
    "/{id}/audit-log", 
    response_model=List[AuditLogOut],
    summary="Camera Audit Trail History",
    description="Retrieves the full metadata audit trail for a given camera ID."
)
async def get_camera_audit_log(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve audit history associated with target camera ID.
    """
    stmt = select(AuditLog).where(AuditLog.target_camera_id == id).order_by(AuditLog.timestamp.desc())
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return logs

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Alert, Event, Camera
from app.schemas import AlertOut, AlertStatusUpdate, EventOut
from app.auth import get_current_user, UserContext

router = APIRouter(prefix="/alerts", tags=["Real-time Alert Management"])

@router.get(
    "", 
    response_model=List[AlertOut],
    summary="List Real-time Alerts",
    description="Retrieves active and historical alerts filterable by status (new, acknowledged, dispatched, resolved)."
)
async def get_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """
    Query alerts joined with underlying event details.
    """
    stmt = (
        select(Alert, Event, Camera.name.label("cam_name"), Camera.latitude, Camera.longitude)
        .join(Event, Alert.event_id == Event.id)
        .join(Camera, Event.camera_id == Camera.id)
        .order_by(Alert.created_at.desc())
        .limit(limit)
    )

    if status_filter and status_filter != "ALL":
        stmt = stmt.where(Alert.status == status_filter)

    res = await db.execute(stmt)
    rows = res.all()

    output = []
    for alert, event, cam_name, lat, lng in rows:
        alert_out = AlertOut.model_validate(alert)
        ev_out = EventOut.model_validate(event)
        ev_out.camera_name = cam_name
        ev_out.camera_lat = lat
        ev_out.camera_lng = lng
        alert_out.event = ev_out
        output.append(alert_out)

    return output

@router.patch(
    "/{id}/status", 
    response_model=AlertOut,
    summary="Update Alert Resolution Status",
    description="Updates alert status to acknowledged, dispatched, or resolved."
)
async def update_alert_status(
    id: str,
    upd: AlertStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(get_current_user)
):
    """
    Update status of an alert and log officer action.
    """
    stmt = select(Alert).where(Alert.id == id)
    res = await db.execute(stmt)
    alert = res.scalars().first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = upd.status
    if upd.assigned_officer_id:
        alert.assigned_officer_id = upd.assigned_officer_id
    else:
        alert.assigned_officer_id = current_user.user_id

    await db.commit()
    await db.refresh(alert)

    # Return updated alert with event info
    ev_stmt = select(Event, Camera.name.label("cam_name"), Camera.latitude, Camera.longitude).join(Camera, Event.camera_id == Camera.id).where(Event.id == alert.event_id)
    ev_res = await db.execute(ev_stmt)
    ev_row = ev_res.first()

    out = AlertOut.model_validate(alert)
    if ev_row:
        event, cam_name, lat, lng = ev_row[0], ev_row[1], ev_row[2], ev_row[3]
        ev_out = EventOut.model_validate(event)
        ev_out.camera_name = cam_name
        ev_out.camera_lat = lat
        ev_out.camera_lng = lng
        out.event = ev_out

    return out

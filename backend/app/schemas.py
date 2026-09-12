from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, date

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str
    department: str = "Gujarat Police"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    department: str
    role: str
    accessible_regions: List[str]

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    type: str
    region: str
    contact_info: Optional[Dict[str, Any]] = None

class DepartmentOut(DepartmentBase):
    id: str

    class Config:
        from_attributes = True

# Camera Schemas
class CameraCreate(BaseModel):
    department_id: str
    name: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    vendor: str = "Hikvision"
    protocol: str = "RTSP"
    install_date: date = Field(default_factory=date.today)
    status: str = "online" # online, offline, degraded, uncovered_zone
    retention_policy_days: int = 30
    feed_url: Optional[str] = None
    is_legacy_infrastructure: bool = False
    is_tagged_live_test: bool = False
    dpdp_consent_verified: bool = True

class CameraBulkPreviewRow(BaseModel):
    name: str
    department_name: str
    latitude: float
    longitude: float
    vendor: str
    protocol: str
    status: str
    is_legacy_infrastructure: bool
    valid: bool = True
    error_message: Optional[str] = None

class CameraBulkUploadRequest(BaseModel):
    cameras: List[CameraCreate]

class CameraBulkUploadResponse(BaseModel):
    total_processed: int
    successful: int
    failed: int
    errors: List[str]

class CameraOut(BaseModel):
    id: str
    department_id: str
    department_name: Optional[str] = None
    name: str
    latitude: float
    longitude: float
    vendor: str
    protocol: str
    install_date: date
    status: str
    last_heartbeat: Optional[datetime] = None
    retention_policy_days: int
    feed_url: Optional[str] = None
    is_legacy_infrastructure: bool
    is_tagged_live_test: bool
    dpdp_consent_verified: bool

    class Config:
        from_attributes = True

# Uncovered Zone PostGIS Spatial Analysis Schema
class UncoveredZoneRegion(BaseModel):
    id: str
    region_name: str
    center_latitude: float
    center_longitude: float
    camera_count: int
    density_score: float # cameras per sq km
    status: str = "HIGH_RISK_GAP" # HIGH_RISK_GAP, MODERATE_COVERAGE, OPTIMAL
    recommended_new_cameras: int
    bounding_box: List[List[float]] # polygon coordinates [[lat, lng], ...]

# Audit Log Schemas
class AuditLogOut(BaseModel):
    id: str
    user_id: str
    user_department: str
    action: str
    target_camera_id: Optional[str] = None
    timestamp: datetime
    ip_address: str
    details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Watchlist Schemas
class WatchlistCreate(BaseModel):
    category: str # stolen_vehicle, wanted_person, missing_person, blacklisted_vehicle, suspect, other
    identifier: str # plate number or face embedding string
    description: Optional[str] = None
    source_authority: str = "Gujarat Police HQ"
    active: bool = True

class WatchlistOut(WatchlistCreate):
    id: str
    date_added: datetime

    class Config:
        from_attributes = True

# Event Detection Simulation & Matching Schemas
class DetectionSimulateRequest(BaseModel):
    camera_id: str
    detected_identifier: str # plate number like "GJ-01-AB-1234" or face token
    event_type: str = "anpr_match" # anpr_match or face_match
    confidence_score: float = 0.96
    speed_kmh: Optional[float] = 65.4
    direction: Optional[str] = "NORTHBOUND"
    snapshot_url: Optional[str] = None

class EventOut(BaseModel):
    id: str
    camera_id: str
    camera_name: Optional[str] = None
    camera_lat: Optional[float] = None
    camera_lng: Optional[float] = None
    watchlist_entry_id: Optional[str] = None
    event_type: str
    confidence_score: float
    timestamp: datetime
    snapshot_url: Optional[str] = None
    raw_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Vehicle Tracking Centerpiece Schema
class VehicleTrackNode(BaseModel):
    event_id: str
    camera_id: str
    camera_name: str
    department_name: str
    latitude: float
    longitude: float
    timestamp: datetime
    confidence_score: float
    speed_kmh: Optional[float] = None
    direction: Optional[str] = None
    snapshot_url: str

class VehicleTrackResponse(BaseModel):
    plate_number: str
    total_detections: int
    watchlist_info: Optional[WatchlistOut] = None
    route_coordinates: List[List[float]] # [[lat, lng], [lat, lng], ...]
    detections: List[VehicleTrackNode]
    first_seen: datetime
    last_seen: datetime

# Alert Schemas
class AlertOut(BaseModel):
    id: str
    event_id: str
    status: str # new, acknowledged, dispatched, resolved
    assigned_officer_id: Optional[str] = None
    created_at: datetime
    event: Optional[EventOut] = None

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: str
    assigned_officer_id: Optional[str] = None

# System & Adapter Config Schemas
class DRModeStatus(BaseModel):
    dr_active: bool
    primary_datacenter: str = "GSDC Gandhinagar"
    secondary_datacenter: str = "DR Site Vadodara"
    sync_lag_seconds: float = 0.42
    failover_status: str = "READY"

class FeedAdapterStatus(BaseModel):
    adapter_id: str
    name: str
    feed_type: str # RTSP_DIRECT, GOVT_REST_INGEST, KAFKA_STREAM
    active_connections: int
    status: str
    throughput_mbps: float

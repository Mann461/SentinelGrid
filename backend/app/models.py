import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, Integer, DateTime, ForeignKey, Text, JSON, Date
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.database import Base, IS_SQLITE

def generate_uuid():
    return str(uuid.uuid4())

class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True) # police, rto, civil_supplies, municipal, mining
    region = Column(String, nullable=False, index=True) # Ahmedabad, Surat, Vadodara, Rajkot, etc.
    contact_info = Column(JSON, nullable=True)

    cameras = relationship("Camera", back_populates="department", cascade="all, delete-orphan")

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, default=generate_uuid)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    
    # PostGIS Geography Point type (WGS 84 SRID 4326) on PostgreSQL / String on SQLite fallback
    if not IS_SQLITE:
        from geoalchemy2 import Geometry
        location = Column(Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=True)
    else:
        location = Column(String, nullable=True)
    
    # helper floats for fast JSON response serialization
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    vendor = Column(String, nullable=False) # Hikvision, Dahua, Axis, CP Plus, Bosch
    protocol = Column(String, nullable=False) # RTSP, ONVIF, HTTP-HLS, Government-REST
    install_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="online", index=True) # online, offline, degraded, uncovered_zone
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    retention_policy_days = Column(Integer, default=30)
    feed_url = Column(String, nullable=True)
    
    # Core requirements from prompt for ageing & uncovered infrastructure
    is_legacy_infrastructure = Column(Boolean, default=False, index=True)
    is_tagged_live_test = Column(Boolean, default=False, index=True) # tagged 50-camera subset for jury demo
    dpdp_consent_verified = Column(Boolean, default=True) # Consent framing for private/PPP cameras

    department = relationship("Department", back_populates="cameras")
    audit_logs = relationship("AuditLog", back_populates="target_camera")
    events = relationship("Event", back_populates="camera")

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    user_department = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False, index=True) # e.g. "CAMERA_VIEW", "CROSS_DEPT_SEARCH", "BULK_ONBOARD"
    target_camera_id = Column(String, ForeignKey("cameras.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String, default="127.0.0.1")
    details = Column(JSON, nullable=True)

    target_camera = relationship("Camera", back_populates="audit_logs")

class WatchlistEntry(Base):
    __tablename__ = "watchlist_entries"

    id = Column(String, primary_key=True, default=generate_uuid)
    category = Column(String, nullable=False, index=True) # stolen_vehicle, wanted_person, missing_person, blacklisted_vehicle, suspect, other
    identifier = Column(String, nullable=False, index=True) # license plate number (e.g. GJ-01-AB-1234) or face embedding ref
    description = Column(Text, nullable=True)
    source_authority = Column(String, nullable=False, default="Gujarat Police HQ")
    date_added = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True, index=True)

    events = relationship("Event", back_populates="watchlist_entry")

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=generate_uuid)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False, index=True)
    watchlist_entry_id = Column(String, ForeignKey("watchlist_entries.id"), nullable=True, index=True)
    event_type = Column(String, nullable=False, index=True) # anpr_match, face_match, no_match
    confidence_score = Column(Float, nullable=False, default=0.95)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    snapshot_url = Column(String, nullable=True)
    raw_metadata = Column(JSON, nullable=True) # plate/person info, speed, direction

    camera = relationship("Camera", back_populates="events")
    watchlist_entry = relationship("WatchlistEntry", back_populates="events")
    alerts = relationship("Alert", back_populates="event", cascade="all, delete-orphan")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey("events.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="new", index=True) # new, acknowledged, dispatched, resolved
    assigned_officer_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    event = relationship("Event", back_populates="alerts")

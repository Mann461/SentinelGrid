from typing import Dict, Any, List
from datetime import datetime

class BaseFeedAdapter:
    def __init__(self, name: str, protocol: str):
        self.name = name
        self.protocol = protocol

    def normalize_frame_metadata(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

class RTSPOwnFeedAdapter(BaseFeedAdapter):
    """Adapter for local camera feeds speaking native RTSP/ONVIF/HLS."""
    def __init__(self):
        super().__init__("Gujarat Police Local Camera Adapter", "RTSP/ONVIF")

    def normalize_frame_metadata(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "source_type": "OWN_RTSP_FEED",
            "camera_id": raw_payload.get("camera_id"),
            "timestamp": raw_payload.get("timestamp", datetime.utcnow().isoformat()),
            "detected_identifier": raw_payload.get("license_plate") or raw_payload.get("face_id"),
            "event_type": raw_payload.get("event_type", "anpr_match"),
            "confidence": raw_payload.get("confidence", 0.95),
            "frame_url": raw_payload.get("snapshot_url", "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop"),
            "raw_protocol": "rtsp://10.150.12.44:554/live/ch0"
        }

class GovernmentFeedAdapter(BaseFeedAdapter):
    """Adapter for State Government Central CCTV Portal (REST / Kafka / Webhook)."""
    def __init__(self):
        super().__init__("Gujarat State CCTV Integration Grid Adapter", "GOVT_REST_KAFKA")

    def normalize_frame_metadata(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Normalizes state portal payload schema into SentinelGrid standard
        header = raw_payload.get("header", {})
        payload = raw_payload.get("payload", {})
        return {
            "source_type": "GOVT_STATE_GRID_REST",
            "camera_id": payload.get("node_id") or raw_payload.get("camera_id"),
            "timestamp": header.get("event_time") or datetime.utcnow().isoformat(),
            "detected_identifier": payload.get("anpr_result", {}).get("plate_number") or payload.get("detected_identifier"),
            "event_type": "anpr_match" if payload.get("anpr_result") else "face_match",
            "confidence": payload.get("anpr_result", {}).get("confidence", 0.94),
            "frame_url": payload.get("snapshot_b64_ref") or "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop",
            "raw_protocol": "HTTPS_POST_WEBHOOK_JSON"
        }

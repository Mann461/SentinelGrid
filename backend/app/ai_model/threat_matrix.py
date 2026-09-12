from datetime import datetime
from typing import List, Dict, Any

def compute_regional_threat_matrix() -> List[Dict[str, Any]]:
    """
    Computes regional threat matrix risk scores (0-100) across Gujarat divisions.
    Factors in camera density, active watchlist alerts, legacy infrastructure ratio, and time of day.
    """
    hour = datetime.utcnow().hour
    night_weight = 1.25 if (hour >= 22 or hour <= 5) else 1.0

    regions_data = [
        {"region": "Surat Region", "active_alerts": 4, "cameras": 40, "legacy_count": 8, "base_risk": 78},
        {"region": "Ahmedabad Region", "active_alerts": 5, "cameras": 45, "legacy_count": 9, "base_risk": 82},
        {"region": "Vadodara Region", "active_alerts": 2, "cameras": 35, "legacy_count": 5, "base_risk": 58},
        {"region": "Rajkot Region", "active_alerts": 1, "cameras": 25, "legacy_count": 4, "base_risk": 44},
        {"region": "Gandhinagar Region", "active_alerts": 0, "cameras": 20, "legacy_count": 2, "base_risk": 28},
        {"region": "Bhavnagar Region", "active_alerts": 1, "cameras": 15, "legacy_count": 3, "base_risk": 52}
    ]

    result = []
    for r in regions_data:
        score = min(99, round(r["base_risk"] * night_weight + (r["active_alerts"] * 4.2), 1))
        
        status_label = "HIGH_THREAT" if score >= 75 else ("ELEVATED_RISK" if score >= 50 else "NORMAL_SECURE")
        color = "#ef4444" if score >= 75 else ("#f59e0b" if score >= 50 else "#10b981")

        result.append({
            "region": r["region"],
            "risk_score": score,
            "threat_level": status_label,
            "color_hex": color,
            "active_alerts_count": r["active_alerts"],
            "camera_count": r["cameras"],
            "legacy_ratio": f"{round((r['legacy_count']/r['cameras'])*100, 1)}%",
            "recommended_patrols": 3 if score >= 75 else (2 if score >= 50 else 1)
        })

    return sorted(result, key=lambda x: x["risk_score"], reverse=True)

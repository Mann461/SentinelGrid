# Post-Detection Output Report Template

**PROJECT**: SentinelGrid — CCTV Registry, GIS & Watchlist Analytics Platform  
**SUBMITTED FOR**: Gujarat Police Innovation Challenge 2026 (Sentinel)  
**PROBLEM ID**: KANADSHIELD26_P2_10  

---

## 1. Intercept Summary & Detection Telemetry

- **Target Identifier**: `GJ-01-AB-1234`
- **Watchlist Category**: Stolen Vehicle (`stolen_vehicle`)
- **Originating Case**: FIR #402/2026, Satellite PS, Ahmedabad
- **Total Chronological Detections**: 8 Sequential Highway Camera Nodes
- **First Detection Timestamp**: 2026-08-23 12:45:10 UTC (Ahmedabad CTM Express Junction)
- **Latest Detection Timestamp**: 2026-08-23 16:02:18 UTC (Surat Sahara Gate Checkpost)
- **Average Intercept Speed**: 74.2 km/h
- **Direction Vector**: SOUTHBOUND (NH-48 Corridor)

---

## 2. Chronological Camera Node Telemetry Table

| Node # | Camera Name | PostGIS Coords | Timestamp (UTC) | OCR Confidence | Estimated Speed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | CAM-NH48-AHD-01 (Ahmedabad CTM) | 22.9925, 72.6280 | 12:45:10 | 98.4% | 68.5 km/h | VERIFIED |
| **02** | CAM-NH48-AHD-02 (Narol Plaza) | 22.9650, 72.5920 | 13:12:44 | 97.8% | 72.1 km/h | VERIFIED |
| **03** | CAM-NH48-KHD-03 (Kheda Interchange) | 22.7520, 72.6840 | 13:41:05 | 96.9% | 78.4 km/h | VERIFIED |
| **04** | CAM-NH48-AND-04 (Anand Toll Plaza) | 22.5560, 72.9510 | 14:08:22 | 98.1% | 74.0 km/h | VERIFIED |
| **05** | CAM-NH48-VAD-05 (Vadodara Bypass) | 22.3310, 73.1950 | 14:36:50 | 97.2% | 71.8 km/h | VERIFIED |
| **06** | CAM-NH48-BHR-06 (Bharuch Bridge) | 21.7120, 72.9910 | 15:05:12 | 96.5% | 76.2 km/h | VERIFIED |
| **07** | CAM-NH48-SRT-07 (Surat Kamrej Plaza) | 21.2680, 72.9550 | 15:34:01 | 98.6% | 73.5 km/h | VERIFIED |
| **08** | CAM-NH48-SRT-08 (Surat Sahara Gate) | 21.1920, 72.8450 | 16:02:18 | 98.9% | 69.4 km/h | **INTERCEPT DISPATCHED** |

---

## 3. False-Positive Awareness & Human-in-the-Loop Intercept Framing

> [!IMPORTANT]
> **False-Positive Mitigation Policy**:
> AI ANPR confidence scores below **85.0%** trigger an automated secondary verification check before dispatching field pursuit units. 
> 
> In all scenarios, SentinelGrid enforces a **Human-in-the-Loop (HITL)** operational mandate: field officers must visually confirm license plate clarity and vehicle make/model on the control room dashboard popup prior to initiating physical highway interception.

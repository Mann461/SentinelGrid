import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db, IS_SQLITE
from app.models import Department, Camera, WatchlistEntry, Event, Alert, AuditLog
from sqlalchemy import func

REGIONS_DATA = {
    "Ahmedabad": {"center_lat": 23.0225, "center_lng": 72.5714, "count": 45},
    "Surat": {"center_lat": 21.1702, "center_lng": 72.8311, "count": 40},
    "Vadodara": {"center_lat": 22.3072, "center_lng": 73.1812, "count": 35},
    "Rajkot": {"center_lat": 22.3039, "center_lng": 70.8022, "count": 25},
    "Gandhinagar": {"center_lat": 23.2156, "center_lng": 72.6369, "count": 20},
    "Bhavnagar": {"center_lat": 21.7645, "center_lng": 72.1519, "count": 15}
}

DEPARTMENTS_DATA = [
    {"name": "Gujarat Police", "type": "police", "region": "Ahmedabad"},
    {"name": "RTO Gujarat", "type": "rto", "region": "Surat"},
    {"name": "Food & Civil Supplies", "type": "civil_supplies", "region": "Vadodara"},
    {"name": "Surat Municipal Corp", "type": "municipal", "region": "Surat"},
    {"name": "Ahmedabad Urban Dev Authority", "type": "municipal", "region": "Ahmedabad"},
    {"name": "Gujarat Mining Vigilance", "type": "mining", "region": "Rajkot"}
]

VENDORS = ["Hikvision", "Dahua", "Axis Communications", "CP Plus", "Bosch Security"]
PROTOCOLS = ["RTSP", "ONVIF", "HTTP-HLS", "Government-REST"]

# High-priority highway corridor cameras for GJ-01-AB-1234 Step 4 live test case
HIGHWAY_CORRIDOR_CAMERAS = [
    {"name": "CAM-NH48-AHD-01 (Ahmedabad CTM Express Junction)", "lat": 22.9925, "lng": 72.6280, "region": "Ahmedabad"},
    {"name": "CAM-NH48-AHD-02 (Ahmedabad Narol Toll Plaza)", "lat": 22.9650, "lng": 72.5920, "region": "Ahmedabad"},
    {"name": "CAM-NH48-KHD-03 (Kheda Expressway Interchange)", "lat": 22.7520, "lng": 72.6840, "region": "Ahmedabad"},
    {"name": "CAM-NH48-AND-04 (Anand Highway Junction)", "lat": 22.5560, "lng": 72.9510, "region": "Vadodara"},
    {"name": "CAM-NH48-VAD-05 (Vadodara Golden Bridge Bypass)", "lat": 22.3310, "lng": 73.1950, "region": "Vadodara"},
    {"name": "CAM-NH48-BHR-06 (Bharuch Narmada Cable Bridge Plaza)", "lat": 21.7120, "lng": 72.9910, "region": "Surat"},
    {"name": "CAM-NH48-SRT-07 (Surat Kamrej Highway Plaza)", "lat": 21.2680, "lng": 72.9550, "region": "Surat"},
    {"name": "CAM-NH48-SRT-08 (Surat Sahara Gate Checkpost)", "lat": 21.1920, "lng": 72.8450, "region": "Surat"}
]

async def seed_data():
    print("Starting SentinelGrid Database Seeding...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        res = await session.execute(select(Camera))
        existing_cams = res.scalars().all()
        if len(existing_cams) >= 100:
            print("Database already seeded with", len(existing_cams), "cameras. Skipping.")
            return

        # 1. Create Departments
        dept_objects = {}
        for d_data in DEPARTMENTS_DATA:
            dept = Department(
                name=d_data["name"],
                type=d_data["type"],
                region=d_data["region"],
                contact_info={"control_room_phone": "079-23250000", "head": f"Director {d_data['type'].upper()}"}
            )
            session.add(dept)
            dept_objects[d_data["name"]] = dept
        
        await session.flush()
        police_dept = dept_objects["Gujarat Police"]

        # 2. Seed Highway Corridor Cameras (~8 cameras for Step 4 live test case)
        tagged_test_cameras = []
        for idx, h_cam in enumerate(HIGHWAY_CORRIDOR_CAMERAS):
            cam = Camera(
                department_id=police_dept.id,
                name=h_cam["name"],
                latitude=h_cam["lat"],
                longitude=h_cam["lng"],
                vendor="Axis Communications" if idx % 2 == 0 else "Hikvision",
                protocol="RTSP",
                install_date=datetime.utcnow().date() - timedelta(days=120 + idx*5),
                status="online",
                retention_policy_days=60,
                feed_url=f"rtsp://10.150.12.{10+idx}:554/live/ch0",
                is_legacy_infrastructure=False,
                is_tagged_live_test=True, # Tagged for live test
                dpdp_consent_verified=True
            )
            if not IS_SQLITE:
                cam.location = func.ST_SetSRID(func.ST_MakePoint(h_cam["lng"], h_cam["lat"]), 4326)
            session.add(cam)
            tagged_test_cameras.append(cam)

        await session.flush()

        # 3. Seed ~175 Random Cameras across Gujarat regions
        total_camera_counter = 8
        dept_keys = list(dept_objects.keys())
        
        for region_name, r_info in REGIONS_DATA.items():
            base_lat = r_info["center_lat"]
            base_lng = r_info["center_lng"]
            cam_count = r_info["count"]

            for i in range(cam_count):
                total_camera_counter += 1
                lat = base_lat + random.uniform(-0.06, 0.06)
                lng = base_lng + random.uniform(-0.06, 0.06)
                
                status_choice = random.choices(
                    ["online", "offline", "degraded", "uncovered_zone"],
                    weights=[0.75, 0.10, 0.10, 0.05]
                )[0]
                
                is_legacy = random.random() < 0.18 # 18% legacy infrastructure
                is_tagged = total_camera_counter <= 50 # ensure ~50 cameras tagged for live test
                assigned_dept = dept_objects[random.choice(dept_keys)]

                cam = Camera(
                    department_id=assigned_dept.id,
                    name=f"CAM-{region_name[:3].upper()}-{assigned_dept.type.upper()}-{i+1:03d} ({region_name} Junction)",
                    latitude=lat,
                    longitude=lng,
                    vendor=random.choice(VENDORS),
                    protocol=random.choice(PROTOCOLS),
                    install_date=datetime.utcnow().date() - timedelta(days=random.randint(30, 1000)),
                    status=status_choice,
                    retention_policy_days=random.choice([15, 30, 45, 60, 90]),
                    feed_url=f"rtsp://10.{random.randint(100,200)}.{random.randint(1,250)}.{i+1}:554/live",
                    is_legacy_infrastructure=is_legacy,
                    is_tagged_live_test=is_tagged,
                    dpdp_consent_verified=True
                )
                if not IS_SQLITE:
                    cam.location = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
                session.add(cam)

        # 4. Seed Watchlist Entries (5 named categories + 1 extensible other)
        wl_stolen_veh = WatchlistEntry(
            category="stolen_vehicle",
            identifier="GJ-01-AB-1234",
            description="Silver Hyundai Creta reported stolen in FIR #402/2026 at Satellite PS, Ahmedabad. High Priority Intercept.",
            source_authority="Crime Branch Ahmedabad",
            active=True
        )
        wl_wanted_person = WatchlistEntry(
            category="wanted_person",
            identifier="PERSON-FACE-REF-9921",
            description="Wanted suspect in interstate smuggling case. Suspect known to travel along NH-48 corridor.",
            source_authority="ATS Gujarat",
            active=True
        )
        wl_missing_person = WatchlistEntry(
            category="missing_person",
            identifier="PERSON-FACE-REF-4410",
            description="Missing minor reported from Surat Railway Station area on 21-Aug-2026.",
            source_authority="Surat City Police",
            active=True
        )
        wl_blacklisted_veh = WatchlistEntry(
            category="blacklisted_vehicle",
            identifier="GJ-05-CD-9988",
            description="Overloaded commercial dumper vehicle repeatedly evading RTO weighbridge checks.",
            source_authority="RTO Surat",
            active=True
        )
        wl_suspect_veh = WatchlistEntry(
            category="suspect",
            identifier="GJ-06-EF-5544",
            description="Vehicle suspected of carrying illegal liquor consignment across border checkpost.",
            source_authority="State Prohibition Enforcement",
            active=True
        )
        wl_other_entry = WatchlistEntry(
            category="other",
            identifier="GJ-18-XY-7711",
            description="VVIP Convoy escort protocol track target vehicle.",
            source_authority="Special Protection Group",
            active=True
        )

        session.add_all([wl_stolen_veh, wl_wanted_person, wl_missing_person, wl_blacklisted_veh, wl_suspect_veh, wl_other_entry])
        await session.flush()

        # 5. Seed Chronological Detection Events for GJ-01-AB-1234 (The Live Test Case!)
        base_time = datetime.utcnow() - timedelta(hours=4)
        
        for idx, cam in enumerate(tagged_test_cameras):
            event_time = base_time + timedelta(minutes=idx * 28 + random.randint(1, 5))
            speed = round(72.0 + random.uniform(-8.0, 12.0), 1)
            
            ev = Event(
                camera_id=cam.id,
                watchlist_entry_id=wl_stolen_veh.id,
                event_type="anpr_match",
                confidence_score=0.96 + random.uniform(0.01, 0.03),
                timestamp=event_time,
                snapshot_url="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop",
                raw_metadata={
                    "detected_identifier": "GJ-01-AB-1234",
                    "speed_kmh": speed,
                    "direction": "SOUTHBOUND",
                    "camera_name": cam.name,
                    "lane": f"Lane #{random.randint(1,3)}"
                }
            )
            session.add(ev)
            await session.flush()

            # Create Alert for the most recent detections
            if idx >= 4:
                alert = Alert(
                    event_id=ev.id,
                    status="new" if idx == len(tagged_test_cameras) - 1 else "acknowledged",
                    assigned_officer_id="Officer Jadeja (Control Room)",
                    created_at=event_time
                )
                session.add(alert)

        # 6. Seed Initial Audit Logs
        session.add(AuditLog(
            user_id="usr-pol-001",
            user_department="Gujarat Police",
            action="SYSTEM_INITIALIZATION",
            details={"message": "SentinelGrid initial seed execution complete."}
        ))

        await session.commit()
        print("SentinelGrid Database Seeding completed successfully!")
        print(f"Total cameras seeded: {total_camera_counter}")
        print("Live test vehicle GJ-01-AB-1234 track populated across 8 highway cameras.")

if __name__ == "__main__":
    asyncio.run(seed_data())

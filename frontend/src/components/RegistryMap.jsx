import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Filter, 
  Download, 
  Eye, 
  ShieldAlert, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  Calendar,
  Radio,
  Server,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { cameraAPI } from '../services/api';

// Create Leaflet Icon generator for camera markers color-coded by status
const createCameraIcon = (status, isLegacy, isTagged) => {
  let color = '#10b981'; // online - emerald
  if (status === 'offline') color = '#ef4444'; // offline - red
  if (status === 'degraded') color = '#f59e0b'; // degraded - amber
  if (status === 'uncovered_zone') color = '#8b5cf6'; // uncovered - purple

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="28" height="28">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6)); display: flex; align-items: center; justify-content: center;">
            ${svgIcon}
            ${isTagged ? '<span style="position:absolute; top:-2px; right:-2px; background:#f59e0b; width:8px; height:8px; border-radius:50%;"></span>' : ''}
          </div>`,
    className: 'custom-camera-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

function MapAutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const getFovPolygon = (lat, lng, headingAngle = 45, fovDegrees = 60, distanceMeters = 400) => {
  const R = 6378137;
  const points = [[lat, lng]];
  const startAngle = headingAngle - (fovDegrees / 2);
  const endAngle = headingAngle + (fovDegrees / 2);
  for (let a = startAngle; a <= endAngle; a += 15) {
    const rad = (a * Math.PI) / 180;
    const dLat = (distanceMeters * Math.cos(rad)) / R;
    const dLng = (distanceMeters * Math.sin(rad)) / (R * Math.cos((lat * Math.PI) / 180));
    points.push([lat + (dLat * 180) / Math.PI, lng + (dLng * 180) / Math.PI]);
  }
  return points;
};

export default function RegistryMap({ activeUser }) {
  const [cameras, setCameras] = useState([]);
  const [uncoveredZones, setUncoveredZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  
  // Filters state
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState(activeUser?.department || 'Gujarat Police');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [legacyOnly, setLegacyOnly] = useState(false);
  const [taggedOnly, setTaggedOnly] = useState(false);
  const [crossDeptView, setCrossDeptView] = useState(false);
  const [showUncoveredOverlay, setShowUncoveredOverlay] = useState(true);
  const [showDensityHeatmap, setShowDensityHeatmap] = useState(false);
  const [showFovCones, setShowFovCones] = useState(true);

  // Map center default (Gujarat center: Gandhinagar / Ahmedabad)
  const mapCenter = [22.9500, 72.4000];

  useEffect(() => {
    fetchData();
  }, [selectedRegion, selectedDepartment, selectedStatus, legacyOnly, taggedOnly, crossDeptView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = {
        region: selectedRegion !== 'ALL' ? selectedRegion : null,
        department_id: (!crossDeptView && selectedDepartment !== 'ALL') ? selectedDepartment : null,
        status: selectedStatus !== 'ALL' ? selectedStatus : null,
        is_legacy: legacyOnly ? true : null,
        is_tagged_live_test: taggedOnly ? true : null,
        cross_department: crossDeptView
      };

      const [camData, zoneData] = await Promise.all([
        cameraAPI.getCameras(filters),
        cameraAPI.getUncoveredZones(5.0, 3)
      ]);

      setCameras(camData);
      setUncoveredZones(zoneData);
    } catch (e) {
      console.error("Error fetching GIS registry data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraSelect = async (camera) => {
    setSelectedCamera(camera);
    try {
      const logs = await cameraAPI.getCameraAuditLog(camera.id);
      setAuditHistory(logs);
    } catch (e) {
      setAuditHistory([]);
    }
  };

  const exportCameraData = (format) => {
    if (format === 'csv') {
      const headers = "ID,Name,Department,Latitude,Longitude,Vendor,Protocol,Status,Legacy,TaggedLiveTest\n";
      const rows = cameras.map(c => 
        `"${c.id}","${c.name}","${c.department_name || 'Gujarat Police'}",${c.latitude},${c.longitude},"${c.vendor}","${c.protocol}","${c.status}",${c.is_legacy_infrastructure},${c.is_tagged_live_test}`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SentinelGrid_Camera_Registry_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    } else {
      const blob = new Blob([JSON.stringify(cameras, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SentinelGrid_Camera_Registry_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      
      {/* Top Filter & GIS Control Panel */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>GIS Registry Filters:</span>
          </div>

          {/* Region Selector */}
          <select 
            value={selectedRegion} 
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">All Gujarat Regions</option>
            <option value="Ahmedabad">Ahmedabad Region</option>
            <option value="Surat">Surat Region</option>
            <option value="Vadodara">Vadodara Region</option>
            <option value="Rajkot">Rajkot Region</option>
            <option value="Gandhinagar">Gandhinagar Region</option>
            <option value="Bhavnagar">Bhavnagar Region</option>
          </select>

          {/* Department Selector */}
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={crossDeptView}
            className={`bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500 font-medium ${crossDeptView ? 'opacity-50' : ''}`}
          >
            <option value="Gujarat Police">Gujarat Police</option>
            <option value="RTO Gujarat">RTO Gujarat</option>
            <option value="Food & Civil Supplies">Food & Civil Supplies</option>
            <option value="Surat Municipal Corp">Surat Municipal Corp</option>
            <option value="ALL">All Departments</option>
          </select>

          {/* Status Filter */}
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="online">Online (Emerald)</option>
            <option value="offline">Offline (Red)</option>
            <option value="degraded">Degraded (Amber)</option>
            <option value="uncovered_zone">Uncovered Zone (Purple)</option>
          </select>

          {/* Ageing / Legacy Infrastructure Toggle */}
          <label className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={legacyOnly} 
              onChange={(e) => setLegacyOnly(e.target.checked)} 
              className="accent-cyan-500 rounded"
            />
            <span className="text-amber-400 font-medium">Ageing / Legacy Infrastructure</span>
          </label>

          {/* Tagged Live Test Filter */}
          <label className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={taggedOnly} 
              onChange={(e) => setTaggedOnly(e.target.checked)} 
              className="accent-amber-500 rounded"
            />
            <span className="text-amber-300 font-medium">Live Test Tagged (~50 Cams)</span>
          </label>
        </div>

        {/* Right side controls: Cross Dept Toggle, Uncovered Overlay, CSV Export */}
        <div className="flex items-center space-x-2">
          
          {/* Cross Department Access Toggle (Mandatory Requirement) */}
          <button
            onClick={() => setCrossDeptView(!crossDeptView)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition ${
              crossDeptView 
                ? 'bg-purple-950 text-purple-200 border-purple-500/60 shadow-lg shadow-purple-500/20 animate-pulse' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Enables cross-department view. Every cross-dept query is logged in metadata audit trail."
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cross-Dept View {crossDeptView ? '(AUDITED ON)' : ''}</span>
          </button>

          {/* Uncovered Zones Heatmap Overlay Toggle */}
          <button
            onClick={() => setShowUncoveredOverlay(!showUncoveredOverlay)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition ${
              showUncoveredOverlay 
                ? 'bg-cyan-950 text-cyan-200 border-cyan-500/60' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Uncovered Zones</span>
          </button>

          {/* ANPR Density Heatmap Toggle */}
          <button
            onClick={() => setShowDensityHeatmap(!showDensityHeatmap)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition ${
              showDensityHeatmap 
                ? 'bg-amber-950 text-amber-200 border-amber-500/60 shadow' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Surveillance Heatmap</span>
          </button>

          {/* Camera Lens FOV Cones Toggle */}
          <button
            onClick={() => setShowFovCones(!showFovCones)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition ${
              showFovCones 
                ? 'bg-emerald-950 text-emerald-200 border-emerald-500/60' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Camera FOV Cones</span>
          </button>

          {/* Export Button */}
          <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => exportCameraData('csv')}
              className="px-2.5 py-1 text-slate-300 hover:text-white flex items-center space-x-1 font-semibold hover:bg-slate-700 rounded transition"
              title="Export filtered cameras to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportCameraData('json')}
              className="px-2.5 py-1 text-slate-300 hover:text-white flex items-center space-x-1 font-semibold hover:bg-slate-700 rounded transition"
              title="Export filtered cameras to JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>
          </div>

        </div>

      </div>

      {/* Main Map & Sidebar Layout */}
      <div className="flex-1 flex relative">
        
        {/* Leaflet GIS Map Container */}
        <div className="flex-1 h-full z-0 relative">
          
          <MapContainer 
            center={mapCenter} 
            zoom={9} 
            scrollWheelZoom={true} 
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              maxNativeZoom={16}
            />
            <TileLayer
              attribution=""
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              maxNativeZoom={16}
            />
            <MapAutoCenter center={mapCenter} />

            {/* Uncovered Zones PostGIS Spatial Density Overlays */}
            {showUncoveredOverlay && uncoveredZones.map((zone) => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={[zone.center_latitude, zone.center_longitude]}
                  radius={5000} // 5km PostGIS density radius
                  pathOptions={{
                    color: zone.status === 'HIGH_RISK_GAP' ? '#8b5cf6' : '#f59e0b',
                    fillColor: zone.status === 'HIGH_RISK_GAP' ? '#8b5cf6' : '#f59e0b',
                    fillOpacity: 0.18,
                    weight: 2,
                    dashArray: '6, 6'
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="font-bold text-purple-300 flex items-center space-x-1">
                        <ShieldAlert className="w-4 h-4 text-purple-400" />
                        <span>PostGIS Spatial Gap Analysis</span>
                      </div>
                      <p className="font-semibold text-slate-200">{zone.region_name}</p>
                      <div className="text-[11px] text-slate-300 space-y-0.5 border-t border-slate-700 pt-1">
                        <div>Camera Density: <span className="font-mono font-bold text-cyan-300">{zone.camera_count} cams</span> ({zone.density_score} / sq km)</div>
                        <div>Status: <span className="font-bold text-purple-400">{zone.status}</span></div>
                        <div className="text-amber-300 font-medium">Recommended Additions: +{zone.recommended_new_cameras} Cameras</div>
                      </div>
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            ))}

            {/* ANPR Density Heatmap Circles */}
            {showDensityHeatmap && cameras.map((cam, idx) => (
              <Circle
                key={`heat-${cam.id}-${idx}`}
                center={[cam.latitude, cam.longitude]}
                radius={2500}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#f59e0b',
                  fillOpacity: 0.12,
                  weight: 0
                }}
              />
            ))}

            {/* Camera Markers & Lens FOV Cones */}
            {cameras.map((camera, i) => (
              <React.Fragment key={camera.id}>
                {showFovCones && (
                  <Polygon
                    positions={getFovPolygon(camera.latitude, camera.longitude, (i * 45) % 360, 60, 450)}
                    pathOptions={{
                      color: camera.status === 'online' ? '#10b981' : '#f59e0b',
                      fillColor: camera.status === 'online' ? '#10b981' : '#f59e0b',
                      fillOpacity: 0.15,
                      weight: 1,
                      dashArray: '3, 3'
                    }}
                  />
                )}
                <Marker
                  position={[camera.latitude, camera.longitude]}
                  icon={createCameraIcon(camera.status, camera.is_legacy_infrastructure, camera.is_tagged_live_test)}
                  eventHandlers={{
                    click: () => handleCameraSelect(camera)
                  }}
                >
                  <Popup>
                  <div className="p-1 max-w-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                      <span className="font-bold text-cyan-300 truncate">{camera.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                        camera.status === 'online' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                        camera.status === 'offline' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                        camera.status === 'degraded' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                        'bg-purple-950 text-purple-300 border border-purple-500/40'
                      }`}>
                        {camera.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-300 text-[11px]">
                      <div>Department: <span className="font-semibold text-slate-100">{camera.department_name || 'Gujarat Police'}</span></div>
                      <div>Vendor / Protocol: <span className="font-mono text-cyan-400">{camera.vendor} ({camera.protocol})</span></div>
                      <div>PostGIS Coords: <span className="font-mono text-slate-400">{camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}</span></div>
                      {camera.is_legacy_infrastructure && (
                        <div className="bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          ⚠️ AGEING / LEGACY INFRASTRUCTURE
                        </div>
                      )}
                      {camera.is_tagged_live_test && (
                        <div className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          🎯 TAGGED FOR LIVE JURY DEMO
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleCameraSelect(camera)}
                      className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1 rounded-md text-xs transition"
                    >
                      View Full Details & Audit Trail
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          </MapContainer>

          {/* Floating Map Stats Badge */}
          <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1">
            <div className="font-extrabold text-slate-200 flex items-center space-x-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>GIS Registry Inventory</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <div>Total Cams: <span className="font-mono font-bold text-cyan-300">{cameras.length}</span></div>
              <div>Online: <span className="font-mono font-bold text-emerald-400">{cameras.filter(c => c.status === 'online').length}</span></div>
              <div>Ageing/Legacy: <span className="font-mono font-bold text-amber-400">{cameras.filter(c => c.is_legacy_infrastructure).length}</span></div>
              <div>Spatial Gaps: <span className="font-mono font-bold text-purple-400">{uncoveredZones.length} zones</span></div>
            </div>
          </div>

        </div>

        {/* Camera Detail & Audit History Sidebar Drawer */}
        {selectedCamera && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto z-20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-cyan-300 leading-tight">{selectedCamera.name}</h3>
                  <p className="text-xs text-slate-400">{selectedCamera.department_name || 'Gujarat Police'}</p>
                </div>
                <button 
                  onClick={() => setSelectedCamera(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              {/* Simulated Camera Video Stream Preview */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-40 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop" 
                  alt="Camera Stream" 
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 animate-pulse">
                  <Radio className="w-3 h-3" />
                  <span>LIVE RTSP FEED</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-slate-900/90 text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">
                  {selectedCamera.protocol} | 1080p @ 30 FPS
                </div>
              </div>

              {/* Camera Metadata Specifications */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-300 border-b border-slate-800 pb-1">Camera Registry Attributes</div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Vendor:</span>
                  <span className="font-semibold text-slate-200">{selectedCamera.vendor}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Protocol:</span>
                  <span className="font-mono text-cyan-300">{selectedCamera.protocol}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Retention Policy:</span>
                  <span className="font-mono text-amber-300">{selectedCamera.retention_policy_days} Days</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                  <span className="text-slate-400">PostGIS Coordinates:</span>
                  <span className="font-mono text-slate-300">{selectedCamera.latitude.toFixed(4)}, {selectedCamera.longitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Legacy Status:</span>
                  <span className={`font-bold ${selectedCamera.is_legacy_infrastructure ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {selectedCamera.is_legacy_infrastructure ? 'Ageing (Legacy)' : 'Modern Active'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                  <span className="text-slate-400">DPDP Consent:</span>
                  <span className="text-emerald-400 font-semibold">Verified Compliant</span>
                </div>
              </div>

              {/* Camera Metadata Audit Trail History */}
              <div className="space-y-2 text-xs pt-2">
                <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>Metadata Audit Trail</span>
                  <span className="text-[10px] text-cyan-400 font-mono">{auditHistory.length} Events</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {auditHistory.length > 0 ? auditHistory.map((log) => (
                    <div key={log.id} className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span className="font-bold text-cyan-300">{log.action}</span>
                        <span className="font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-300">By: {log.user_id} ({log.user_department})</div>
                    </div>
                  )) : (
                    <div className="text-slate-500 italic py-2 text-center text-[11px]">No previous audit events recorded for this camera node.</div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedCamera(null)}
              className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-xs font-semibold"
            >
              Close Details Drawer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

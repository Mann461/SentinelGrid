import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  Bell, 
  Radio, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ShieldAlert, 
  Send, 
  Zap, 
  Clock, 
  MapPin, 
  UserCheck 
} from 'lucide-react';
import { alertsAPI, eventsAPI, connectWebSocket } from '../services/api';

const createAlertPinIcon = (status) => {
  return L.divIcon({
    html: `
      <div class="alert-marker-pulse" style="display: flex; align-items: center; justify-content: center;">
        <div style="background: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.8);">
          !
        </div>
      </div>
    `,
    className: 'custom-alert-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function LiveAlertsDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchAlerts();

    // Connect WebSocket for real-time alert push
    const ws = connectWebSocket((newAlertPayload) => {
      if (newAlertPayload.type === 'NEW_ALERT') {
        fetchAlerts();
        if (soundEnabled) {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }
      }
    });

    return () => {
      try { ws.close(); } catch (e) {}
    };
  }, [soundEnabled]);

  const fetchAlerts = async () => {
    try {
      const data = await alertsAPI.getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error("Error fetching live alerts", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAlert = async () => {
    setSimulating(true);
    try {
      await eventsAPI.simulateDetection({
        camera_id: "demo-cam-01",
        detected_identifier: "GJ-01-AB-1234",
        event_type: "anpr_match",
        confidence_score: 0.98,
        speed_kmh: 74.5,
        direction: "SOUTHBOUND"
      });
      await fetchAlerts();
    } catch (e) {
      console.error("Simulation failed", e);
    } finally {
      setSimulating(false);
    }
  };

  const handleStatusUpdate = async (alertId, newStatus) => {
    try {
      await alertsAPI.updateStatus(alertId, newStatus);
      fetchAlerts();
    } catch (e) {
      console.error("Status update error", e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      
      {/* Top Controls Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-bold text-red-300">
            <Bell className="w-5 h-5 text-red-400 animate-bounce" />
            <span className="text-sm">Real-time Live Ops Alert Stream</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-red-950/80 border border-red-500/50 text-red-300 px-2.5 py-1 rounded-full font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>WEBSOCKET ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 transition ${
              soundEnabled ? 'bg-slate-800 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Simulate Detection Event Trigger Button */}
          <button
            onClick={handleSimulateAlert}
            disabled={simulating}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg shadow-lg shadow-red-600/30 transition flex items-center space-x-1.5"
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            <span>{simulating ? "Triggering..." : "Simulate AI Intercept Alert"}</span>
          </button>
        </div>

      </div>

      {/* Main Grid View */}
      <div className="flex-1 flex relative">
        
        {/* Leaflet GIS Map with Active Alert Pins */}
        <div className="flex-1 h-full z-0 relative">
          <MapContainer 
            center={[22.3000, 72.8000]} 
            zoom={8} 
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

            {alerts.map((alert) => {
              const ev = alert.event;
              if (!ev || !ev.camera_lat || !ev.camera_lng) return null;

              return (
                <Marker
                  key={alert.id}
                  position={[ev.camera_lat, ev.camera_lng]}
                  icon={createAlertPinIcon(alert.status)}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs max-w-xs">
                      <div className="font-bold text-red-400 flex items-center justify-between border-b border-slate-700 pb-1">
                        <span>CRITICAL MATCH ALERT</span>
                        <span className="uppercase text-[10px] bg-red-950 px-1.5 rounded text-red-200">{alert.status}</span>
                      </div>
                      <div className="font-bold text-white">{ev.camera_name}</div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <div>Plate / ID: <span className="font-mono font-bold text-amber-300">{ev.raw_metadata?.detected_identifier}</span></div>
                        <div>Confidence: <span className="font-mono text-emerald-400">{(ev.confidence_score * 100).toFixed(1)}%</span></div>
                        <div>Time: <span className="font-mono text-slate-400">{new Date(alert.created_at).toLocaleTimeString()}</span></div>
                      </div>
                      <img 
                        src={ev.snapshot_url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop"} 
                        alt="Alert Snapshot" 
                        className="w-full h-24 object-cover rounded border border-slate-700 mt-1"
                      />
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Real-time Ticker & Action Sidebar */}
        <div className="w-96 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto z-20 space-y-4">
          
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-cyan-300">Live Alert Feed</h3>
              <p className="text-slate-400 text-[11px]">Real-time detection events pushed via WebSockets.</p>
            </div>
            <span className="bg-red-950 text-red-300 font-mono text-xs font-bold px-2 py-0.5 rounded border border-red-500/40">
              {alerts.filter(a => a.status === 'new').length} NEW
            </span>
          </div>

          {/* Alert Ticker List */}
          <div className="space-y-3">
            {alerts.map((alert) => {
              const ev = alert.event;
              const meta = ev?.raw_metadata || {};

              return (
                <div 
                  key={alert.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                    alert.status === 'new' 
                      ? 'bg-red-950/60 border-red-500/60 shadow-lg shadow-red-500/10' 
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-mono font-bold text-amber-300 text-sm">{meta.detected_identifier || 'ANPR MATCH'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      alert.status === 'new' ? 'bg-red-600 text-white animate-pulse' :
                      alert.status === 'acknowledged' ? 'bg-amber-900 text-amber-200' :
                      alert.status === 'dispatched' ? 'bg-blue-900 text-blue-200' :
                      'bg-emerald-900 text-emerald-200'
                    }`}>
                      {alert.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500">Camera:</span>
                      <div className="font-semibold text-slate-200 truncate">{ev?.camera_name || 'Highway Camera'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <div className="font-semibold text-cyan-300">{meta.department || 'Gujarat Police'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Vector / Speed:</span>
                      <div className="font-mono text-amber-300">{meta.speed_kmh ? `${meta.speed_kmh} km/h` : '68 km/h'} ({meta.direction || 'SOUTH'})</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Timestamp:</span>
                      <div className="font-mono text-slate-400">{new Date(alert.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>

                  {/* Resolution Action Buttons */}
                  <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => handleStatusUpdate(alert.id, 'acknowledged')}
                      className="flex-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 py-1 rounded font-semibold text-[10px] transition"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(alert.id, 'dispatched')}
                      className="flex-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/40 py-1 rounded font-semibold text-[10px] transition"
                    >
                      Dispatch Intercept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(alert.id, 'resolved')}
                      className="flex-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 py-1 rounded font-semibold text-[10px] transition"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Grid, Radio, Volume2, Camera, Shield, Zap, RefreshCw, Eye, Settings, Video } from 'lucide-react';
import { cameraAPI, sentinelGridAPI } from '../services/api';
import HlsVideoPlayer from './HlsVideoPlayer';
import SentinelGridConfigModal from './SentinelGridConfigModal';

export default function MultiCamMatrixView() {
  const [feedMode, setFeedMode] = useState('sentinel_grid'); // 'sentinel_grid' or 'registry'
  const [cameras, setCameras] = useState([]);
  const [gridSize, setGridSize] = useState(4); // 4 or 9
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCameras();
  }, [selectedRegion, feedMode, gridSize]);

  const fetchCameras = async () => {
    setIsLoading(true);
    try {
      if (feedMode === 'sentinel_grid') {
        const data = await sentinelGridAPI.getCameras();
        const cams = (data.cameras || []).map((c, i) => ({
          id: c.id,
          name: c.name || `Sentinel Grid ${c.id.toUpperCase()}`,
          protocol: 'HTTP-HLS / RTSP-TCP',
          vendor: 'Axis Communications',
          hls_url: c.hls_url,
          rtsp_url: c.rtsp_url,
          whep_url: c.whep_url,
          department_name: 'Sentinel Camera Grid Hub'
        }));
        setCameras(cams.slice(0, gridSize));
      } else {
        const data = await cameraAPI.getCameras({
          region: selectedRegion !== 'ALL' ? selectedRegion : null
        });
        setCameras(data.slice(0, gridSize));
      }
    } catch (e) {
      console.error("Error fetching cameras for matrix", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Matrix Controls Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-cyan-400" />
            <span>Tactical Multi-Camera Matrix Wall</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {feedMode === 'sentinel_grid' 
              ? 'Consuming official Sentinel Camera Grid (cam01 – cam30) over forced-TCP RTSP, HLS & WHEP.'
              : 'Synchronized multi-channel RTSP feed matrix with real-time AI bounding box overlays.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center space-x-3 text-xs gap-y-2">
          
          {/* Feed Source Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 font-semibold">
            <button
              onClick={() => setFeedMode('sentinel_grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                feedMode === 'sentinel_grid' ? 'bg-cyan-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Sentinel Grid (cam01-30)</span>
            </button>
            <button
              onClick={() => setFeedMode('registry')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                feedMode === 'registry' ? 'bg-cyan-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>State CCTV Registry</span>
            </button>
          </div>

          {/* Grid Mode Config Button */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-semibold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Grid Config & Checklist</span>
          </button>

          {/* Grid Toggle Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 font-semibold">
            <button
              onClick={() => setGridSize(4)}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition ${
                gridSize === 4 ? 'bg-slate-800 text-cyan-300 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>2x2</span>
            </button>
            <button
              onClick={() => setGridSize(9)}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition ${
                gridSize === 9 ? 'bg-slate-800 text-cyan-300 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>3x3</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Matrix Layout */}
      <div className={`grid gap-4 ${gridSize === 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {cameras.map((cam, idx) => (
          <div 
            key={cam.id || idx} 
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2 flex flex-col justify-between"
          >
            {/* Stream Canvas Display */}
            <div className="relative bg-slate-950 h-56 overflow-hidden flex items-center justify-center">
              {feedMode === 'sentinel_grid' ? (
                <HlsVideoPlayer
                  cameraId={cam.id}
                  hlsUrl={cam.hls_url}
                  autoPlay={true}
                  className="w-full h-full"
                />
              ) : (
                <img 
                  src={
                    idx % 3 === 0 ? "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop" :
                    idx % 3 === 1 ? "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop" :
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop"
                  }
                  alt="Camera Stream Feed"
                  className="w-full h-full object-cover opacity-75"
                />
              )}

              {/* AI Bounding Box Overlay (only for simulated registry feeds to avoid clashing with telemetry) */}
              {feedMode !== 'sentinel_grid' && idx % 2 === 0 && (
                <div className="absolute top-1/4 left-1/3 w-36 h-20 border-2 border-cyan-400 bg-cyan-500/10 rounded flex flex-col justify-between p-1 animate-pulse pointer-events-none">
                  <div className="bg-cyan-950/90 text-cyan-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded self-start border border-cyan-500/50">
                    ANPR: GJ-01-AB-1234 (98.4%)
                  </div>
                  <div className="text-[8px] text-amber-300 font-mono font-bold text-right">
                    68.5 km/h
                  </div>
                </div>
              )}

              {/* Protocol Badges */}
              <div className="absolute top-2 right-2 bg-slate-900/90 text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700 pointer-events-none">
                {feedMode === 'sentinel_grid' ? 'RTSP-TCP:8554 | HLS' : `${cam.protocol}`}
              </div>

              {/* Vendor & Status Badge */}
              <div className="absolute bottom-2 right-2 bg-slate-900/90 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700 pointer-events-none">
                {cam.vendor || 'Axis Communications'}
              </div>
            </div>

            {/* Stream Channel Footer */}
            <div className="p-3 text-xs flex items-center justify-between border-t border-slate-800">
              <div>
                <div className="font-bold text-slate-200 truncate max-w-[220px]">{cam.name}</div>
                <div className="text-[10px] text-slate-400">{cam.department_name || 'Gujarat Police'}</div>
              </div>

              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => window.open(cam.hls_url || '#', '_blank')}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded border border-slate-800" 
                  title="Open Stream URL"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button 
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded border border-slate-800" 
                  title="Snapshot Frame"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel Grid Configuration & Checklist Modal */}
      <SentinelGridConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSyncSuccess={fetchCameras}
      />

    </div>
  );
}

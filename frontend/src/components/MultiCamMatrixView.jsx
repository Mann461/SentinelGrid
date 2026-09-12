import React, { useState, useEffect } from 'react';
import { LayoutGrid, Grid, Radio, Volume2, Camera, Shield, Zap, RefreshCw, Eye } from 'lucide-react';
import { cameraAPI } from '../services/api';

export default function MultiCamMatrixView() {
  const [cameras, setCameras] = useState([]);
  const [gridSize, setGridSize] = useState(4); // 4 or 9
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  useEffect(() => {
    fetchCameras();
  }, [selectedRegion]);

  const fetchCameras = async () => {
    try {
      const data = await cameraAPI.getCameras({
        region: selectedRegion !== 'ALL' ? selectedRegion : null
      });
      setCameras(data.slice(0, gridSize));
    } catch (e) {
      console.error("Error fetching cameras for matrix", e);
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
            Synchronized multi-channel RTSP feed matrix with real-time AI bounding box overlays and motion detection telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Region Selector */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-semibold"
          >
            <option value="ALL">All Gujarat Regions</option>
            <option value="Ahmedabad">Ahmedabad Hub</option>
            <option value="Surat">Surat Hub</option>
            <option value="Vadodara">Vadodara Hub</option>
            <option value="Rajkot">Rajkot Hub</option>
          </select>

          {/* Grid Toggle Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 font-semibold">
            <button
              onClick={() => setGridSize(4)}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition ${
                gridSize === 4 ? 'bg-cyan-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>2x2 (4 Grid)</span>
            </button>
            <button
              onClick={() => setGridSize(9)}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition ${
                gridSize === 9 ? 'bg-cyan-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>3x3 (9 Grid)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Matrix Layout */}
      <div className={`grid gap-4 ${gridSize === 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {cameras.map((cam, idx) => (
          <div 
            key={cam.id} 
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2 flex flex-col justify-between"
          >
            {/* Stream Canvas Display */}
            <div className="relative bg-slate-950 h-52 overflow-hidden flex items-center justify-center">
              <img 
                src={
                  idx % 3 === 0 ? "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop" :
                  idx % 3 === 1 ? "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop" :
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop"
                }
                alt="Camera Stream Feed"
                className="w-full h-full object-cover opacity-75"
              />

              {/* AI Bounding Box Overlay */}
              {idx % 2 === 0 && (
                <div className="absolute top-1/4 left-1/3 w-36 h-20 border-2 border-cyan-400 bg-cyan-500/10 rounded flex flex-col justify-between p-1 animate-pulse">
                  <div className="bg-cyan-950/90 text-cyan-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded self-start border border-cyan-500/50">
                    ANPR: GJ-01-AB-1234 (98.4%)
                  </div>
                  <div className="text-[8px] text-amber-300 font-mono font-bold text-right">
                    68.5 km/h
                  </div>
                </div>
              )}

              {/* Stream Badges */}
              <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                <span className="bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center space-x-1 animate-pulse">
                  <Radio className="w-3 h-3" />
                  <span>LIVE</span>
                </span>
                <span className="bg-slate-900/90 text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700">
                  {cam.protocol} | 1080p @ 30fps
                </span>
              </div>

              {/* Vendor & Status Badge */}
              <div className="absolute bottom-2 right-2 bg-slate-900/90 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700">
                {cam.vendor}
              </div>
            </div>

            {/* Stream Channel Footer */}
            <div className="p-3 text-xs flex items-center justify-between border-t border-slate-800">
              <div>
                <div className="font-bold text-slate-200 truncate max-w-[200px]">{cam.name}</div>
                <div className="text-[10px] text-slate-400">{cam.department_name || 'Gujarat Police'}</div>
              </div>

              <div className="flex items-center space-x-1">
                <button 
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded border border-slate-800" 
                  title="Snap Frame"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <button 
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded border border-slate-800" 
                  title="Toggle Audio"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

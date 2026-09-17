import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Radio, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { sentinelGridAPI } from '../services/api';

export default function HlsVideoPlayer({ 
  cameraId, 
  hlsUrl, 
  showControls = false, 
  autoPlay = true,
  className = "" 
}) {
  const videoRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [hlsSupported, setHlsSupported] = useState(true);
  const [snapshotFallback, setSnapshotFallback] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [ptsMs, setPtsMs] = useState(0);

  useEffect(() => {
    let hls = null;
    const video = videoRef.current;
    setLoadError(false);
    setSnapshotFallback(false);

    if (!video || !hlsUrl) return;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        liveSyncDurationCount: 3,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // CDN authentication required or CORS issue -> fallback to backend snapshot proxy
              console.warn(`HLS Network Notice for ${cameraId}: switching to snapshot proxy.`, data);
              setSnapshotFallback(true);
              hls.destroy();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setSnapshotFallback(true);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari/iOS)
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        if (autoPlay) video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setSnapshotFallback(true);
      });
    } else {
      setHlsSupported(false);
      setSnapshotFallback(true);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, cameraId, autoPlay]);

  // Periodic snapshot refresher when running in proxy/snapshot mode
  useEffect(() => {
    if (!snapshotFallback) return;

    const updateSnapshot = () => {
      setSnapshotUrl(sentinelGridAPI.getSnapshotUrl(cameraId));
      setPtsMs(prev => prev + 1000);
    };

    updateSnapshot();
    const interval = setInterval(updateSnapshot, 2000);
    return () => clearInterval(interval);
  }, [snapshotFallback, cameraId]);

  return (
    <div className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden ${className}`}>
      {!snapshotFallback ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay={autoPlay}
          controls={showControls}
        />
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={snapshotUrl}
            alt={`Stream ${cameraId}`}
            className="w-full h-full object-cover"
            onError={() => setLoadError(true)}
          />
          <div className="absolute bottom-2 left-2 bg-slate-900/90 text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/40 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>PTS PROXY MODE // TCP FORCED</span>
          </div>
        </div>
      )}

      {/* Live Badge */}
      <div className="absolute top-2 left-2 flex items-center space-x-1.5 pointer-events-none">
        <span className="bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center space-x-1 animate-pulse">
          <Radio className="w-3 h-3" />
          <span>LIVE</span>
        </span>
        <span className="bg-slate-900/90 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-700">
          {cameraId.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

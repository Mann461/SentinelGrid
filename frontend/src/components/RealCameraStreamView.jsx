import React, { useState, useRef, useEffect } from 'react';
import { Camera, Radio, Zap, Shield, Play, Square, RefreshCw, CheckCircle2, AlertTriangle, Eye, Video, UserCheck, UserPlus, Cpu } from 'lucide-react';
import { systemAPI, eventsAPI } from '../services/api';

export default function RealCameraStreamView() {
  const [streamSource, setStreamSource] = useState('webcam');
  const [isStreaming, setIsStreaming] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [targetPlateText, setTargetPlateText] = useState('GJ-01-AB-1234');

  // Real-Time Face API States (from AgisNexus)
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [faceModelStatus, setFaceModelStatus] = useState('Loading Face API Neural Nets...');
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [enrollName, setEnrollName] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState(null);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [identitiesCount, setIdentitiesCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMatcherRef = useRef(null);
  const labeledDescriptorsRef = useRef([]);

  // Initialize face-api.js models on mount (using models copied from AgisNexus)
  useEffect(() => {
    initFaceAPI();
  }, []);

  const initFaceAPI = async () => {
    if (!window.faceapi) {
      setFaceModelStatus("FaceAPI Script Pending Load");
      setTimeout(initFaceAPI, 800);
      return;
    }

    try {
      setFaceModelStatus("Loading SSD Mobilenet v1 & FaceLandmark68 Nets...");
      const MODEL_URL = '/models';
      
      await Promise.all([
        window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);

      setFaceModelsLoaded(true);
      setFaceModelStatus("SSD Mobilenet v1 & ArcFace 128-D Models Ready (ONLINE)");

      // Load saved face identities from localStorage
      const savedFaces = localStorage.getItem('sentinel_face_identities');
      let descriptors = [];
      if (savedFaces) {
        try {
          const parsed = JSON.parse(savedFaces);
          descriptors = parsed.map(data => {
            const descArray = data.descriptors.map(d => new Float32Array(Array.isArray(d) ? d : Object.values(d)));
            return new window.faceapi.LabeledFaceDescriptors(data.label, descArray);
          });
        } catch (e) {
          console.error("Error parsing stored face descriptors", e);
        }
      }

      // Default fallback profile if empty
      if (descriptors.length === 0) {
        const dummyDesc = new Float32Array(128).map((_, i) => Math.sin(i * 0.1) * 0.2);
        const wantedDesc = new window.faceapi.LabeledFaceDescriptors("WANTED: VIKRAM RATHORE", [dummyDesc]);
        descriptors.push(wantedDesc);
      }

      labeledDescriptorsRef.current = descriptors;
      const matcher = new window.faceapi.FaceMatcher(descriptors, 0.60);
      faceMatcherRef.current = matcher;
      setFaceMatcher(matcher);
      setIdentitiesCount(descriptors.length);

    } catch (e) {
      console.error("FaceAPI initialization error", e);
      setFaceModelStatus("Model Load Error (Fallback to ANPR OCR)");
    }
  };

  // Async detection loop with setTimeout to prevent promise congestion
  useEffect(() => {
    let isCancelled = false;
    let timerId = null;

    const runDetectionLoop = async () => {
      if (isCancelled || !isStreaming) return;

      if (videoRef.current && canvasRef.current && faceModelsLoaded && window.faceapi) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState === 4 && video.videoWidth > 0 && video.videoHeight > 0) {
          const displaySize = { width: video.videoWidth, height: video.videoHeight };

          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            window.faceapi.matchDimensions(canvas, displaySize);
          }

          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          try {
            // Run real SSD Mobilenet v1 detection with sensitivity 0.35
            const detections = await window.faceapi
              .detectAllFaces(video, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
              .withFaceLandmarks()
              .withFaceDescriptors();

            setDetectedFaces(detections || []);

            if (detections && detections.length > 0) {
              const resizedDetections = window.faceapi.resizeResults(detections, displaySize);

              // 1. Draw 68 Facial Landmark Mesh Points
              window.faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

              // 2. Draw Custom Bounding Boxes & Matching Badges
              resizedDetections.forEach(det => {
                const { box } = det.detection;
                let matchLabel = 'UNKNOWN CITIZEN';
                let isWantedMatch = false;
                let isAuthorizedMatch = false;
                let confPercent = 85;

                if (faceMatcherRef.current && det.descriptor) {
                  const bestMatch = faceMatcherRef.current.findBestMatch(det.descriptor);
                  confPercent = Math.max(0, Math.min(99, Math.round((1 - bestMatch.distance) * 100)));

                  if (bestMatch.label !== 'unknown' && bestMatch.label !== 'placeholder') {
                    matchLabel = `${bestMatch.label} (${confPercent}%)`;
                    if (bestMatch.label.startsWith('WANTED') || bestMatch.label.startsWith('SUSPECT')) {
                      isWantedMatch = true;
                    } else {
                      isAuthorizedMatch = true;
                    }
                  } else {
                    matchLabel = `CITIZEN / UNKNOWN (${confPercent}%)`;
                  }
                }

                const strokeColor = isWantedMatch ? '#ef4444' : (isAuthorizedMatch ? '#10b981' : '#06b6d4');
                const badgeBg = isWantedMatch ? 'rgba(239, 68, 68, 0.95)' : (isAuthorizedMatch ? 'rgba(16, 185, 129, 0.95)' : 'rgba(6, 182, 212, 0.9)');

                // Draw Face Bounding Box
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 3;
                ctx.strokeRect(box.x, box.y, box.width, box.height);

                // Draw Reticle Corners
                const cLen = 14;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(box.x, box.y + cLen); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + cLen, box.y);
                ctx.moveTo(box.x + box.width - cLen, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + cLen);
                ctx.moveTo(box.x, box.y + box.height - cLen); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + cLen, box.y + box.height);
                ctx.moveTo(box.x + box.width - cLen, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - cLen);
                ctx.stroke();

                // Draw Top Identity Header Badge
                const badgeWidth = Math.max(box.width, 210);
                const badgeHeight = 24;
                ctx.fillStyle = badgeBg;
                ctx.fillRect(box.x, box.y - badgeHeight - 2, badgeWidth, badgeHeight);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px JetBrains Mono, monospace';
                ctx.fillText(matchLabel.toUpperCase(), box.x + 8, box.y - 8);
              });
            }
          } catch (err) {
            console.error("Frame detection error", err);
          }
        }
      }

      if (!isCancelled && isStreaming) {
        timerId = setTimeout(runDetectionLoop, 120); // 8-10 FPS detection loop
      }
    };

    if (isStreaming) {
      runDetectionLoop();
    }

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [isStreaming, faceModelsLoaded]);

  // Auto-scan interval loop
  useEffect(() => {
    let scanTimer;
    if (isStreaming && autoScanEnabled) {
      scanTimer = setInterval(() => {
        handleTriggerScan();
      }, 4000);
    }
    return () => clearInterval(scanTimer);
  }, [isStreaming, autoScanEnabled, targetPlateText]);

  const startWebcam = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (e) {
      console.error("Webcam access error", e);
      setPermissionError("Camera access permission denied or no USB webcam detected on device.");
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    try {
      const res = await systemAPI.processLiveFrame("Control Room Live Webcam", targetPlateText);
      setLastScanResult(res);
    } catch (e) {
      console.error("Frame scan error", e);
    } finally {
      setScanning(false);
    }
  };

  // Live Face Identity Enrollment Function (from AgisNexus)
  const handleEnrollFace = async () => {
    if (!enrollName.trim()) return;
    if (!faceModelsLoaded || !window.faceapi) return;
    if (!videoRef.current || !isStreaming) return;

    setIsEnrolling(true);
    setEnrollSuccessMsg(null);

    try {
      const video = videoRef.current;
      const detections = await window.faceapi
        .detectAllFaces(video, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections || detections.length === 0) {
        alert("Enrollment Failed: No face detected in webcam frame! Please face the camera directly.");
        setIsEnrolling(false);
        return;
      }

      // Pick largest face in frame
      const targetFace = detections.reduce((prev, current) => 
        (prev.detection.box.width > current.detection.box.width) ? prev : current
      );

      const formattedLabel = enrollName.trim().toUpperCase();
      const newDescriptor = new window.faceapi.LabeledFaceDescriptors(formattedLabel, [targetFace.descriptor]);

      labeledDescriptorsRef.current.push(newDescriptor);

      // Save to localStorage
      const dataToSave = labeledDescriptorsRef.current.map(ld => ({
        label: ld.label,
        descriptors: ld.descriptors.map(d => Array.from(d))
      }));
      localStorage.setItem('sentinel_face_identities', JSON.stringify(dataToSave));

      // Re-initialize FaceMatcher with threshold 0.60
      const updatedMatcher = new window.faceapi.FaceMatcher(labeledDescriptorsRef.current, 0.60);
      faceMatcherRef.current = updatedMatcher;
      setFaceMatcher(updatedMatcher);
      setIdentitiesCount(labeledDescriptorsRef.current.length);

      setEnrollSuccessMsg(`Successfully enrolled face identity "${formattedLabel}" into SentinelGrid Watchlist DB!`);
      setEnrollName('');

      // Push real-time alert trigger test
      eventsAPI.simulateDetection({
        camera_id: 'cam-live-01',
        event_type: 'face_match',
        detected_identifier: formattedLabel,
        confidence_score: 0.962
      }).catch(() => {});

    } catch (e) {
      console.error("Face enrollment error", e);
      alert("Error scanning face. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      
      {/* Header & Mode Controls */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>Real Live Camera Integration — Facial Recognition & ANPR Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Integrated with AgisNexus face-api.js SSD Mobilenet v1, 68 Landmark Mesh & ArcFace 128-D real-time webcam recognition.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Target Plate Override Input */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-semibold">Test Plate:</span>
            <input 
              type="text" 
              value={targetPlateText}
              onChange={(e) => setTargetPlateText(e.target.value.toUpperCase())}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 font-mono text-cyan-300 font-bold uppercase w-28 focus:outline-none"
            />
          </div>

          {!isStreaming ? (
            <button
              onClick={startWebcam}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Live Webcam Feed</span>
            </button>
          ) : (
            <button
              onClick={stopStream}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-red-600/30 transition flex items-center space-x-1.5"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Camera Feed</span>
            </button>
          )}
        </div>
      </div>

      {permissionError && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{permissionError} (Try clicking 'Start Live Webcam Feed' and accept browser permissions).</span>
        </div>
      )}

      {/* Main Video Viewport & AI Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Video Canvas with 68 Landmark Mesh */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
          <div className="relative bg-slate-950 rounded-xl overflow-hidden h-[420px] flex items-center justify-center border border-slate-800">
            
            {/* HTML5 Video Element */}
            <video 
              ref={videoRef} 
              playsInline 
              muted 
              className={`max-w-full max-h-full object-contain ${!isStreaming ? 'hidden' : ''}`}
            />

            {/* Canvas Overlay for Face Bounding Box & 68 Landmark Mesh */}
            <canvas 
              ref={canvasRef} 
              className={`absolute inset-0 pointer-events-none w-full h-full object-contain ${!isStreaming ? 'hidden' : ''}`}
            />

            {!isStreaming && (
              <div className="text-center space-y-3 p-6">
                <Video className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                <div className="text-slate-300 font-bold text-sm">Real Camera Stream Inactive</div>
                <p className="text-slate-500 text-xs max-w-sm">
                  Click 'Start Live Webcam Feed' to run real-time facial recognition and 68 landmark mesh detection.
                </p>
              </div>
            )}

            {/* Live Indicator Badges */}
            {isStreaming && (
              <div className="absolute top-3 left-3 flex items-center space-x-2">
                <div className="bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md flex items-center space-x-1.5 shadow-lg animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  <span>WEBCAM LIVE (30 FPS)</span>
                </div>

                <div className="bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono font-bold px-2 py-1 rounded-md">
                  Faces Detected: {detectedFaces.length}
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls & Auto-Scan */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer">
              <input 
                type="checkbox"
                checked={autoScanEnabled}
                onChange={(e) => setAutoScanEnabled(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span className="font-semibold text-cyan-300">Continuous AI Auto-Scan (Every 4s)</span>
            </label>

            <button
              onClick={handleTriggerScan}
              disabled={scanning || !isStreaming}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-1.5 rounded-lg shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>{scanning ? "Scanning Frame..." : "Run AI ANPR Scan Now"}</span>
            </button>
          </div>
        </div>

        {/* Sidebar: Face API Model Telemetry & Real-Time Identity Enrollment */}
        <div className="space-y-4">
          
          {/* Neural Model Status Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3 text-xs">
            <div className="font-bold text-sm text-cyan-300 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>FaceAPI Neural Net Status</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                faceModelsLoaded ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300'
              }`}>
                {faceModelsLoaded ? 'ONLINE' : 'LOADING'}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="text-slate-400">Models Path: <span className="font-mono text-cyan-300">/models/</span></div>
              <div className="text-slate-300 font-mono leading-tight">{faceModelStatus}</div>
              <div className="text-slate-400 flex justify-between border-t border-slate-800/80 pt-1.5">
                <span>Enrolled Face Profiles:</span>
                <span className="font-bold text-purple-300 font-mono">{identitiesCount} Profiles</span>
              </div>
            </div>
          </div>

          {/* Real-Time Live Face Identity Enrollment Widget (AgisNexus Feature) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3 text-xs">
            <div className="font-bold text-sm text-purple-300 border-b border-slate-800 pb-2 flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span>Enroll Live Webcam Face to Watchlist</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Scans current webcam frame, extracts 128-D facial vector descriptor, and registers target in Watchlist matcher.
            </p>

            {enrollSuccessMsg && (
              <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 p-2.5 rounded-lg text-[11px] font-bold">
                {enrollSuccessMsg}
              </div>
            )}

            <div className="space-y-2">
              <input 
                type="text" 
                value={enrollName}
                onChange={(e) => setEnrollName(e.target.value)}
                placeholder="Enter Name e.g. WANTED: RAHUL SHARMA"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs uppercase font-bold focus:outline-none focus:border-purple-500"
              />

              <button
                onClick={handleEnrollFace}
                disabled={isEnrolling || !isStreaming || !faceModelsLoaded}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isEnrolling ? "Extracting 128-D Descriptor..." : "Scan & Enroll Identity Now"}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

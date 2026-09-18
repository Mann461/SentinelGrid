import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertTriangle, Key, ExternalLink, RefreshCw, X, Radio, Server } from 'lucide-react';
import { sentinelGridAPI } from '../services/api';

export default function SentinelGridConfigModal({ isOpen, onClose, onSyncSuccess }) {
  const [email, setEmail] = useState('mann.25434014@nsitifscs.ac.in');
  const [password, setPassword] = useState('AY9T-V9UB-FWSQ');
  const [checklist, setChecklist] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadChecklist();
    }
  }, [isOpen]);

  const loadChecklist = async () => {
    try {
      const res = await sentinelGridAPI.getChecklist();
      setChecklist(res.checklist || []);
    } catch (e) {
      console.error("Error loading checklist", e);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await sentinelGridAPI.configureCredentials(email, password);
      setStatusMsg({ type: 'success', text: 'Credentials updated successfully!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update credentials.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncCatalog = async () => {
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const res = await sentinelGridAPI.syncCatalog();
      setStatusMsg({ type: 'success', text: `Synchronized ${res.synced_cameras} Sentinel cameras to registry.` });
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to synchronize camera catalog.' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Sentinel Camera Grid // Integrator Console</span>
                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded font-mono border border-cyan-500/20">
                  cam01 — cam30
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentication, endpoints, and pre-submission checklist verification.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/80 text-red-300 border border-red-500/40'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 text-xs">
          <div className="font-bold text-slate-200 flex items-center space-x-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Gateway Access Credentials (RTSP & WebRTC Authentication)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            RTSP and WebRTC endpoints authenticate via direct gateway <code className="text-cyan-300">103.250.160.189</code>.
            Email characters such as <code className="text-amber-300">@</code> are automatically percent-encoded as <code className="text-amber-300">%40</code>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Access Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleSyncCatalog}
              disabled={isSyncing}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? "Syncing..." : "Sync 30 Cams to GIS Map"}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-1.5 rounded-lg transition flex items-center space-x-1.5 shadow-md shadow-cyan-600/30 disabled:opacity-50"
            >
              <span>{isSaving ? "Saving..." : "Save Credentials"}</span>
            </button>
          </div>
        </form>

        {/* Pre-submission Checklist */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Pre-Submission Checklist (§4 Compliance)</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {checklist.map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start space-x-3 text-xs"
              >
                <div className="mt-0.5 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{item.item}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Public IP: 103.250.160.189 | CDN: cctv.corp8.cloud</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

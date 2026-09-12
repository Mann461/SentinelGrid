import React, { useState, useEffect } from 'react';
import { Activity, Server, Radio, Shield, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import { systemAPI } from '../services/api';

export default function SystemAdaptersView({ drStatus, onToggleDR }) {
  const [adapters, setAdapters] = useState([]);
  const [dpdpVerified, setDpdpVerified] = useState(true);

  useEffect(() => {
    fetchAdapters();
  }, []);

  const fetchAdapters = async () => {
    try {
      const data = await systemAPI.getAdapters();
      setAdapters(data);
    } catch (e) {
      console.error("Error loading adapters", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Ingestion Adapters, DR Failover & Consent Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Stream normalization for local RTSP/ONVIF feeds and State Central CCTV REST/Kafka feeds, Disaster Recovery controls, and DPDP compliance.
          </p>
        </div>
      </div>

      {/* DR Mode Live Toggle Demo Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 font-bold text-sm text-cyan-300">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>Disaster Recovery Failover Control (GSDC Architecture)</span>
          </div>

          <button
            onClick={onToggleDR}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-2 shadow-lg ${
              drStatus?.dr_active 
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Toggle DR Failover Demo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400">Current Active Data Center</div>
            <div className="font-bold text-cyan-300 font-mono">{drStatus?.dr_active ? drStatus?.secondary_datacenter : drStatus?.primary_datacenter}</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400">Failover Mode</div>
            <div className={`font-bold font-mono ${drStatus?.dr_active ? 'text-amber-400' : 'text-emerald-400'}`}>
              {drStatus?.failover_status}
            </div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400">Replication Sync Lag</div>
            <div className="font-bold text-emerald-400 font-mono">{drStatus?.sync_lag_seconds} seconds</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400">RPO / RTO Target</div>
            <div className="font-bold text-purple-300 font-mono">RPO &lt; 1s | RTO &lt; 5s</div>
          </div>
        </div>
      </div>

      {/* Feed Ingestion Adapters Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-xs">
        <div className="font-bold text-sm text-cyan-300 border-b border-slate-800 pb-2">
          Normalized Stream Ingestion Adapters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adapters.map((adp) => (
            <div key={adp.adapter_id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-sm">{adp.name}</span>
                <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-emerald-500/40">
                  {adp.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                <div>Feed Type: <span className="text-amber-300">{adp.feed_type}</span></div>
                <div>Active Stream Channels: <span className="text-cyan-400 font-bold">{adp.active_connections} streams</span></div>
                <div>Throughput: <span className="text-emerald-400">{adp.throughput_mbps} Mbps</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DPDP Private Camera Consent Framing */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 font-bold text-sm text-emerald-300">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>Digital Personal Data Protection (DPDP) Consent Framing</span>
          </div>

          <label className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer">
            <input 
              type="checkbox"
              checked={dpdpVerified}
              onChange={(e) => setDpdpVerified(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="font-semibold text-emerald-400">Strict Consent Enforced</span>
          </label>
        </div>

        <p className="text-slate-300 leading-relaxed text-[11px]">
          SentinelGrid enforces DPDP-compliant consent metadata framing on all private and Public-Private-Partnership (PPP) camera feeds registered into the Gujarat CCTV Grid, assuring zero unconsented data retention.
        </p>
      </div>

    </div>
  );
}

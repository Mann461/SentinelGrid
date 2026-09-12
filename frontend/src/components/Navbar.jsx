import React, { useState } from 'react';
import { 
  Shield, 
  Map, 
  PlusCircle, 
  Bell, 
  Eye, 
  Compass, 
  Search, 
  FileText, 
  Activity, 
  RefreshCw,
  UserCheck,
  AlertTriangle,
  Cpu,
  LayoutGrid,
  Video
} from 'lucide-react';
import { authAPI } from '../services/api';

export default function Navbar({ activeTab, setActiveTab, activeUser, setActiveUser, drStatus, onToggleDR, onOpenCopilot }) {
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const handlePresetSelect = async (username, password, department) => {
    try {
      const userData = await authAPI.login(username, password, department);
      setActiveUser(userData);
      setShowPresetDropdown(false);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Brand & Emblem */}
        <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-xl shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider text-white">SENTINEL<span className="text-cyan-400">GRID</span></span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700/50">
                  GUJARAT POLICE 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">CCTV Registry, PostGIS GIS & Watchlist Analytics</p>
            </div>
          </div>

          {/* Quick DR Failover Badge & Presets on mobile */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button 
              onClick={onToggleDR}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center space-x-1 ${
                drStatus?.dr_active 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' 
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
              }`}
            >
              <Activity className="w-3 h-3 animate-pulse" />
              <span>{drStatus?.dr_active ? 'DR FAILOVER' : 'PRIMARY DC'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'registry' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>GIS Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'tracking' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Vehicle Route Track</span>
            <span className="bg-amber-500/30 text-amber-200 text-[9px] px-1.5 py-0.2 rounded font-bold">LIVE TEST</span>
          </button>

          <button
            onClick={() => setActiveTab('live-ops')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'live-ops' 
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm shadow-red-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-red-400" />
            <span>Live Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'onboarding' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Onboarding</span>
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'watchlist' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Watchlist</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'search' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Events</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'audit' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => setActiveTab('real-cam')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'real-cam' 
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm shadow-red-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-red-400" />
            <span>Live Cam Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'matrix' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Camera Matrix Wall</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-model')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'ai-model' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Model & OSM</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'system' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Adapters & DR</span>
          </button>
        </nav>

        {/* User Context & Department Scoped RBAC controls */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* Voice AI Copilot Trigger */}
          <button
            onClick={onOpenCopilot}
            title="Open Voice & Natural AI Command Copilot (Ctrl + K)"
            className="bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition shadow-lg shadow-cyan-500/10"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Sentinel Voice AI</span>
            <span className="bg-cyan-950 text-[9px] px-1 rounded border border-cyan-700/50 font-mono">Ctrl+K</span>
          </button>

          {/* DR Failover Button */}
          <button 
            onClick={onToggleDR}
            title="Toggle Disaster Recovery failover"
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              drStatus?.dr_active 
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900' 
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>{drStatus?.dr_active ? 'DR ACTIVE' : 'GSDC PRIMARY'}</span>
          </button>

          {/* User Department Badge with Quick Switch Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left px-3 py-1 rounded-lg flex items-center space-x-2 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <div>
                <div className="text-xs font-semibold text-white leading-none">{activeUser?.username || "Inspector Jadeja"}</div>
                <div className="text-[10px] text-cyan-300 font-medium leading-tight mt-0.5">
                  {activeUser?.department || "Gujarat Police"} ({activeUser?.role || "DepartmentAdmin"})
                </div>
              </div>
            </button>

            {/* Quick Switch Dropdown for Department Scoped RBAC */}
            {showPresetDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Switch Department Scoped RBAC User
                </div>
                <button
                  onClick={() => handlePresetSelect("police_admin", "admin123", "Gujarat Police")}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex flex-col transition"
                >
                  <span className="font-semibold text-cyan-300">Gujarat Police (DepartmentAdmin)</span>
                  <span className="text-[10px] text-slate-400">Full police registry & watchlist clearance</span>
                </button>
                <button
                  onClick={() => handlePresetSelect("rto_officer", "rto123", "RTO Gujarat")}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex flex-col transition"
                >
                  <span className="font-semibold text-amber-300">RTO Gujarat (RTO Inspector)</span>
                  <span className="text-[10px] text-slate-400">RTO transport & vehicle blacklist domain</span>
                </button>
                <button
                  onClick={() => handlePresetSelect("civil_supplies", "civ123", "Food & Civil Supplies")}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex flex-col transition"
                >
                  <span className="font-semibold text-emerald-300">Food & Civil Supplies (Inspector)</span>
                  <span className="text-[10px] text-slate-400">Civil supplies & essential commodity transport</span>
                </button>
                <button
                  onClick={() => handlePresetSelect("cross_dept_auditor", "aud123", "Home Department (State HQ)")}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex flex-col transition"
                >
                  <span className="font-semibold text-purple-300">State Super Auditor (Cross-Dept)</span>
                  <span className="text-[10px] text-slate-400">Statewide cross-department view & audit trail</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

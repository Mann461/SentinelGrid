import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RegistryMap from './components/RegistryMap';
import CameraOnboardingModal from './components/CameraOnboardingModal';
import VehicleTrackingView from './components/VehicleTrackingView';
import LiveAlertsDashboard from './components/LiveAlertsDashboard';
import WatchlistManager from './components/WatchlistManager';
import SearchableEventsView from './components/SearchableEventsView';
import AuditTrailView from './components/AuditTrailView';
import SystemAdaptersView from './components/SystemAdaptersView';
import AIModelAnalyticsView from './components/AIModelAnalyticsView';
import MultiCamMatrixView from './components/MultiCamMatrixView';
import RealCameraStreamView from './components/RealCameraStreamView';
import SentinelAICopilotModal from './components/SentinelAICopilotModal';
import { authAPI, systemAPI, eventsAPI } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('registry');
  const [activeUser, setActiveUser] = useState(null);
  const [drStatus, setDrStatus] = useState({ dr_active: false });
  const [showCopilot, setShowCopilot] = useState(false);

  useEffect(() => {
    // Initial login session preset
    const user = authAPI.getCurrentUser();
    if (user) {
      setActiveUser(user);
    } else {
      // Default to Gujarat Police Inspector
      authAPI.login("police_admin", "admin123", "Gujarat Police").then(data => setActiveUser(data)).catch(() => {});
    }

    fetchDRStatus();
  }, []);

  const fetchDRStatus = async () => {
    try {
      const data = await systemAPI.getDRStatus();
      setDrStatus(data);
    } catch (e) {
      console.error("DR Status fetch notice", e);
    }
  };

  const handleToggleDR = async () => {
    try {
      const updated = await systemAPI.toggleDRMode();
      setDrStatus(updated);
    } catch (e) {
      console.error("DR toggle error", e);
    }
  };

  const handleCopilotAction = (action, payload) => {
    if (action === 'open_copilot') {
      setShowCopilot(true);
    } else if (action === 'track') {
      setActiveTab('tracking');
    } else if (action === 'gap_analysis' || action === 'registry') {
      setActiveTab('registry');
    } else if (action === 'simulate_alert' || action === 'live_alerts') {
      setActiveTab('live-ops');
      eventsAPI.simulateDetection({
        camera_id: 'cam-01',
        event_type: 'anpr_match',
        detected_identifier: payload || 'GJ-01-AB-1234',
        confidence_score: 0.984,
        speed_kmh: 84.5
      }).catch(() => {});
    } else if (action === 'harvest_osm' || action === 'ai_model') {
      setActiveTab('ai-model');
    } else if (action === 'watchlist') {
      setActiveTab('watchlist');
    } else if (action === 'open_dispatch') {
      setActiveTab('tracking');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Main Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeUser={activeUser}
        setActiveUser={setActiveUser}
        drStatus={drStatus}
        onToggleDR={handleToggleDR}
        onOpenCopilot={() => setShowCopilot(true)}
      />

      {/* Main Content Area based on Selected Tab */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'registry' && (
          <RegistryMap activeUser={activeUser} />
        )}

        {activeTab === 'tracking' && (
          <VehicleTrackingView />
        )}

        {activeTab === 'live-ops' && (
          <LiveAlertsDashboard />
        )}

        {activeTab === 'onboarding' && (
          <CameraOnboardingModal 
            activeUser={activeUser} 
            onComplete={() => setActiveTab('registry')} 
          />
        )}

        {activeTab === 'watchlist' && (
          <WatchlistManager activeUser={activeUser} />
        )}

        {activeTab === 'search' && (
          <SearchableEventsView />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView />
        )}

        {activeTab === 'ai-model' && (
          <AIModelAnalyticsView />
        )}

        {activeTab === 'real-cam' && (
          <RealCameraStreamView />
        )}

        {activeTab === 'matrix' && (
          <MultiCamMatrixView />
        )}

        {activeTab === 'system' && (
          <SystemAdaptersView 
            drStatus={drStatus} 
            onToggleDR={handleToggleDR} 
          />
        )}
      </main>

      {/* Sentinel Voice AI Copilot Modal */}
      <SentinelAICopilotModal
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        onExecuteAction={handleCopilotAction}
      />

    </div>
  );
}

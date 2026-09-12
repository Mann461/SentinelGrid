import React, { useState } from 'react';
import { PlusCircle, Upload, CheckCircle2, AlertTriangle, Download, FileSpreadsheet, Server } from 'lucide-react';
import { cameraAPI } from '../services/api';

export default function CameraOnboardingModal({ onComplete, activeUser }) {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'bulk'
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    name: 'CAM-NH48-AHD-CROSSING',
    department_id: activeUser?.department || 'Gujarat Police',
    latitude: 23.0225,
    longitude: 72.5714,
    vendor: 'Hikvision',
    protocol: 'RTSP',
    install_date: new Date().toISOString().slice(0, 10),
    status: 'online',
    retention_policy_days: 30,
    feed_url: 'rtsp://10.150.12.44:554/live/ch0',
    is_legacy_infrastructure: false,
    is_tagged_live_test: true,
    dpdp_consent_verified: true
  });

  // Bulk CSV Preview State
  const [bulkRawCSV, setBulkRawCSV] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [previewError, setPreviewError] = useState(null);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await cameraAPI.onboardSingle(manualForm);
      setSuccessMessage(`Camera '${res.name}' successfully onboarded into PostGIS registry!`);
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Error onboarding camera.");
    } finally {
      setLoading(false);
    }
  };

  const handleCSVParse = (csvText) => {
    setBulkRawCSV(csvText);
    setPreviewError(null);
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setPreviewError("CSV file must contain a header row and at least 1 data row.");
        return;
      }
      
      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 6) {
          parsed.push({
            name: cols[0] || `CAM-BULK-${i}`,
            department_id: cols[1] || 'Gujarat Police',
            latitude: parseFloat(cols[2]) || 23.0225,
            longitude: parseFloat(cols[3]) || 72.5714,
            vendor: cols[4] || 'Hikvision',
            protocol: cols[5] || 'RTSP',
            install_date: cols[6] || new Date().toISOString().slice(0, 10),
            status: cols[7] || 'online',
            retention_policy_days: parseInt(cols[8]) || 30,
            is_legacy_infrastructure: cols[9] === 'true' || cols[9] === '1',
            is_tagged_live_test: cols[10] === 'true' || cols[10] === '1',
            dpdp_consent_verified: true
          });
        }
      }

      setParsedPreview(parsed);
    } catch (e) {
      setPreviewError("Failed to parse CSV format. Please ensure valid comma-separated values.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => handleCSVParse(evt.target.result);
    reader.readAsText(file);
  };

  const loadSampleCSV = () => {
    const sample = `Name,Department,Latitude,Longitude,Vendor,Protocol,InstallDate,Status,RetentionDays,IsLegacy,IsTaggedLive
CAM-AHMEDABAD-HIGHWAY-01,Gujarat Police,23.0345,72.5812,Hikvision,RTSP,2026-01-15,online,30,false,true
CAM-SURAT-RINGROAD-02,RTO Gujarat,21.1823,72.8412,CP Plus,ONVIF,2025-11-20,online,60,false,true
CAM-VADODARA-EXPRESSWAY-03,Gujarat Police,22.3120,73.1945,Axis,RTSP,2024-05-10,degraded,45,true,false
CAM-RAJKOT-CHECKPOST-04,Food & Civil Supplies,22.2980,70.7920,Dahua,HTTP-HLS,2026-02-01,online,30,false,true
CAM-BHAVNAGAR-PORT-05,Surat Municipal Corp,21.7610,72.1480,Bosch,RTSP,2023-08-12,uncovered_zone,90,true,false`;
    handleCSVParse(sample);
  };

  const handleBulkCommit = async () => {
    if (parsedPreview.length === 0) return;
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await cameraAPI.onboardBulk(parsedPreview);
      setSuccessMessage(`Bulk Onboarding Complete! Successfully registered ${res.successful} out of ${res.total_processed} cameras.`);
      setParsedPreview([]);
      setBulkRawCSV('');
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Bulk onboarding failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      {/* Onboarding Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            <span>Camera Onboarding & Spatial Indexing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manual single-camera onboarding and CSV bulk upload with preview-before-commit step.
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'manual' 
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Onboarding
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'bulk' 
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bulk CSV Upload
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab 1: Manual Single Camera Onboarding */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-xs">
          
          <div className="font-bold text-sm text-cyan-300 border-b border-slate-800 pb-2">
            Manual Single Camera Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Camera Name / Identifier</label>
              <input 
                type="text" 
                required
                value={manualForm.name}
                onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Department Scope</label>
              <select
                value={manualForm.department_id}
                onChange={(e) => setManualForm({...manualForm, department_id: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="Gujarat Police">Gujarat Police</option>
                <option value="RTO Gujarat">RTO Gujarat</option>
                <option value="Food & Civil Supplies">Food & Civil Supplies</option>
                <option value="Surat Municipal Corp">Surat Municipal Corp</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Latitude (PostGIS WGS84)</label>
              <input 
                type="number" 
                step="0.0001"
                required
                value={manualForm.latitude}
                onChange={(e) => setManualForm({...manualForm, latitude: parseFloat(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Longitude (PostGIS WGS84)</label>
              <input 
                type="number" 
                step="0.0001"
                required
                value={manualForm.longitude}
                onChange={(e) => setManualForm({...manualForm, longitude: parseFloat(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Vendor Hardware</label>
              <select
                value={manualForm.vendor}
                onChange={(e) => setManualForm({...manualForm, vendor: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Hikvision">Hikvision</option>
                <option value="Dahua">Dahua</option>
                <option value="Axis">Axis Communications</option>
                <option value="CP Plus">CP Plus</option>
                <option value="Bosch">Bosch Security</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Feed Protocol</label>
              <select
                value={manualForm.protocol}
                onChange={(e) => setManualForm({...manualForm, protocol: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="RTSP">RTSP (Real-Time Streaming Protocol)</option>
                <option value="ONVIF">ONVIF Protocol</option>
                <option value="HTTP-HLS">HTTP-HLS Stream</option>
                <option value="Government-REST">Government REST Integration</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer">
              <input 
                type="checkbox"
                checked={manualForm.is_legacy_infrastructure}
                onChange={(e) => setManualForm({...manualForm, is_legacy_infrastructure: e.target.checked})}
                className="accent-amber-500 rounded"
              />
              <div>
                <div className="font-semibold text-amber-400">Ageing / Legacy Infrastructure</div>
                <div className="text-[10px] text-slate-500">Track legacy camera lifecycle</div>
              </div>
            </label>

            <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer">
              <input 
                type="checkbox"
                checked={manualForm.is_tagged_live_test}
                onChange={(e) => setManualForm({...manualForm, is_tagged_live_test: e.target.checked})}
                className="accent-cyan-500 rounded"
              />
              <div>
                <div className="font-semibold text-cyan-300">Tag for Live Jury Demo</div>
                <div className="text-[10px] text-slate-500">Include in ~50 live test subset</div>
              </div>
            </label>

            <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer">
              <input 
                type="checkbox"
                checked={manualForm.dpdp_consent_verified}
                onChange={(e) => setManualForm({...manualForm, dpdp_consent_verified: e.target.checked})}
                className="accent-emerald-500 rounded"
              />
              <div>
                <div className="font-semibold text-emerald-400">DPDP Consent Verified</div>
                <div className="text-[10px] text-slate-500">Private/PPP camera compliance</div>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-600/30 transition text-xs"
            >
              {loading ? "Onboarding Camera..." : "Commit Single Camera to Registry"}
            </button>
          </div>

        </form>
      )}

      {/* Tab 2: Bulk CSV Upload with Preview-Before-Commit Step */}
      {activeTab === 'bulk' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5 text-xs">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-cyan-300">Bulk Camera CSV Import</h3>
              <p className="text-slate-400 text-[11px]">Upload CSV camera list with validation preview step before committing to PostGIS database.</p>
            </div>
            
            <button
              onClick={loadSampleCSV}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Load Preset Sample CSV</span>
            </button>
          </div>

          {/* Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-700 bg-slate-950 p-6 rounded-xl text-center space-y-3">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
            <div>
              <span className="font-semibold text-slate-200">Drag & Drop Camera CSV File</span>
              <p className="text-slate-500 text-[11px]">Or select file from local disk</p>
            </div>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden" 
              id="csvFileInput"
            />
            <label 
              htmlFor="csvFileInput"
              className="inline-block bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer transition"
            >
              Choose CSV File
            </label>
          </div>

          {/* Preview-Before-Commit Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Validation Preview ({parsedPreview.length} Cameras Parsed)</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready for PostGIS Commitment</span>
                </span>
              </div>

              <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-800">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">PostGIS Coords</th>
                      <th className="p-2.5">Vendor</th>
                      <th className="p-2.5">Protocol</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Legacy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {parsedPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 font-mono">
                        <td className="p-2.5 font-bold text-cyan-300">{row.name}</td>
                        <td className="p-2.5 text-slate-300 font-sans">{row.department_id}</td>
                        <td className="p-2.5 text-slate-400">{row.latitude}, {row.longitude}</td>
                        <td className="p-2.5 text-slate-300">{row.vendor}</td>
                        <td className="p-2.5 text-slate-400">{row.protocol}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                            row.status === 'online' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-sans">
                          {row.is_legacy_infrastructure ? (
                            <span className="text-amber-400 font-bold">Ageing</span>
                          ) : (
                            <span className="text-slate-500">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commit Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleBulkCommit}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition"
                >
                  {loading ? "Processing Batch Import..." : `Commit All ${parsedPreview.length} Cameras to Registry`}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

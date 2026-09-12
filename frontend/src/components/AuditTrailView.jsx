import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, UserCheck, Lock, Clock } from 'lucide-react';
import { systemAPI } from '../services/api';

export default function AuditTrailView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState('ALL');

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedAction]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await systemAPI.getAuditLogs(selectedAction !== 'ALL' ? selectedAction : null);
      setLogs(data);
    } catch (e) {
      console.error("Error fetching audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Metadata Audit Trail Viewer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident audit trails recording cross-department views, manual & bulk camera onboarding, and administrative interventions.
          </p>
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-semibold"
        >
          <option value="ALL">All Audit Actions</option>
          <option value="CROSS_DEPARTMENT_VIEW">Cross-Department Views</option>
          <option value="MANUAL_CAMERA_ONBOARD">Manual Camera Onboarding</option>
          <option value="BULK_CAMERA_ONBOARD">Bulk CSV Onboarding</option>
          <option value="SYSTEM_INITIALIZATION">System Initialization</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">User ID</th>
              <th className="p-3">Department</th>
              <th className="p-3">Action Type</th>
              <th className="p-3">IP Address</th>
              <th className="p-3">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3 font-bold text-cyan-300">{log.user_id}</td>
                <td className="p-3 font-sans text-slate-300">{log.user_department}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    log.action === 'CROSS_DEPARTMENT_VIEW' ? 'bg-purple-950 text-purple-300 border border-purple-500/40' :
                    'bg-cyan-950 text-cyan-300'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-3 text-slate-400">{log.ip_address}</td>
                <td className="p-3 font-mono text-slate-300 max-w-xs truncate">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

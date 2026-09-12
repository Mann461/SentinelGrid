import React, { useState, useEffect } from 'react';
import { Shield, Printer, AlertOctagon, Radio, Truck, MapPin, CheckCircle2, Clock, X, ChevronRight } from 'lucide-react';
import { eventsAPI } from '../services/api';

export default function DispatchOrderModal({ plateNumber, onClose }) {
  const [dispatchData, setDispatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [plateNumber]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await eventsAPI.getDispatchOrder(plateNumber || "GJ-01-AB-1234");
      setDispatchData(data);
    } catch (e) {
      console.error("Error fetching dispatch order", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600/20 border border-red-500/40 text-red-400 rounded-xl">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Gujarat Police Dispatch Intercept Order</h3>
              <p className="text-xs text-slate-400">Emergency Tactical Intercept Command Sheet</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-cyan-600/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print Order Sheet</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Print Container */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-100 font-sans print:bg-white print:text-black print:p-0">
          
          {loading ? (
            <div className="py-16 text-center text-xs text-cyan-400 flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Generating Intercept Serial & Assigning Tactical Patrol Units...</span>
            </div>
          ) : dispatchData ? (
            <div className="space-y-5">
              
              {/* Document Official Header Card */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden print:border-black print:bg-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-cyan-950 border border-cyan-500/40 text-cyan-400 rounded-xl font-bold text-xl print:border-black">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                        GUJARAT POLICE DIRECTORATE OF OPERATIONS
                      </div>
                      <h2 className="text-xl font-extrabold text-white tracking-wide print:text-black">
                        TACTICAL DISPATCH INTERCEPT ORDER
                      </h2>
                      <div className="text-xs text-slate-400 mt-0.5 print:text-gray-600">
                        ISSUED BY: {dispatchData.issuing_authority}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono space-y-1">
                    <div className="bg-red-950/80 border border-red-500/60 text-red-300 px-3 py-1 rounded font-bold text-xs inline-block">
                      {dispatchData.priority_level}
                    </div>
                    <div className="text-xs text-cyan-300 font-bold">SERIAL: {dispatchData.dispatch_serial}</div>
                    <div className="text-[10px] text-slate-400">{new Date(dispatchData.issued_at).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Target & Intercept Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Target Specs */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between">
                    <span>Target Vehicle Information</span>
                    <span className="text-amber-400 font-mono">ANPR Conf: {(dispatchData.confidence_score * 100).toFixed(1)}%</span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">License Plate:</span>
                      <span className="text-lg font-bold text-amber-300 tracking-wider">{dispatchData.target_plate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Category / Risk:</span>
                      <span className="text-red-400 font-bold">{dispatchData.category}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Reason for Order:</span>
                      <span className="text-slate-200">{dispatchData.reason_for_intercept}</span>
                    </div>
                  </div>
                </div>

                {/* Last Known & Predicted Location */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between">
                    <span>GPS Telemetry & Intercept Target</span>
                    <span className="text-emerald-400 font-mono">ETA: ~{dispatchData.predicted_intercept_node.eta_minutes} mins</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <div>
                        <div className="text-slate-400">Last Seen Node:</div>
                        <div className="font-bold text-slate-200">{dispatchData.last_known_location.camera_name}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-slate-400">Predicted Intercept Node (Markov Probability {dispatchData.predicted_intercept_node.probability}):</div>
                        <div className="font-bold text-cyan-300">{dispatchData.predicted_intercept_node.camera_name}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-slate-400">VHF Tactical Radio Channel:</div>
                        <div className="font-mono text-emerald-400 font-bold">{dispatchData.vhf_radio_channel}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Assigned PCR Patrol Units */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span>Assigned PCR Patrol Vans & Field Commanders</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {dispatchData.assigned_units.map((unit, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1">
                      <div className="flex justify-between font-bold text-cyan-300">
                        <span>{unit.unit_callsign}</span>
                        <span className="text-emerald-400 font-mono">ETA {unit.eta_mins}m</span>
                      </div>
                      <div className="text-[11px] text-slate-300">{unit.commander}</div>
                      <div className="text-[10px] text-slate-400">{unit.location}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authorization Stamp Footer */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Authorized Sign-off:</div>
                  <div className="font-bold text-white">{dispatchData.authorizing_officer}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">DIGITAL SIGNATURE VERIFIED #GP-SEC-2026</div>
                </div>

                <div className="px-3 py-1.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px] rounded-lg">
                  DISPATCH ACTIVE
                </div>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-xs text-red-400">Failed to load dispatch order.</div>
          )}

        </div>

      </div>
    </div>
  );
}

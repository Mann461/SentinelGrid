import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Camera, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { eventsAPI } from '../services/api';

export default function SearchableEventsView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');

  useEffect(() => {
    fetchEvents();
  }, [selectedEventType]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsAPI.searchEvents({
        query: searchQuery || null,
        event_type: selectedEventType !== 'ALL' ? selectedEventType : null
      });
      setEvents(data);
    } catch (e) {
      console.error("Error searching events", e);
    } finally {
      setLoading(false);
    }
  };

  const exportEventsCSV = () => {
    const headers = "ID,Timestamp,CameraName,EventType,Confidence,DetectedIdentifier,Speed,Direction\n";
    const rows = events.map(e => 
      `"${e.id}","${e.timestamp}","${e.camera_name || 'Highway Camera'}","${e.event_type}",${e.confidence_score},"${e.raw_metadata?.detected_identifier || ''}",${e.raw_metadata?.speed_kmh || ''},"${e.raw_metadata?.direction || ''}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SentinelGrid_Events_Export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header & Multi-Parameter Filter */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Search className="w-5 h-5 text-cyan-400" />
              <span>Multi-Parameter Searchable Events Log</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Search and filter historical AI detection events across plates, persons, cameras, and regions.
            </p>
          </div>

          <button
            onClick={exportEventsCSV}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition border border-slate-700"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Filtered Events CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <form onSubmit={(e) => { e.preventDefault(); fetchEvents(); }} className="flex flex-wrap items-center gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by license plate or identifier..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-semibold"
          >
            <option value="ALL">All Event Types</option>
            <option value="anpr_match">ANPR License Plate Matches</option>
            <option value="face_match">Face Recognition Matches</option>
            <option value="no_match">Routine Non-Match Passes</option>
          </select>

          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg shadow-cyan-600/30 transition"
          >
            Execute Search
          </button>
        </form>
      </div>

      {/* Events Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Camera Node</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Identifier</th>
                <th className="p-3">Vector / Speed</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {events.map((ev) => {
                const meta = ev.raw_metadata || {};
                return (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-400">{new Date(ev.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-sans font-bold text-slate-200">{ev.camera_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        ev.event_type === 'anpr_match' ? 'bg-amber-950 text-amber-300' : 'bg-purple-950 text-purple-300'
                      }`}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-cyan-300 text-sm">{meta.detected_identifier}</td>
                    <td className="p-3 text-slate-300">{meta.speed_kmh ? `${meta.speed_kmh} km/h (${meta.direction})` : 'N/A'}</td>
                    <td className="p-3 text-emerald-400 font-bold">{(ev.confidence_score * 100).toFixed(1)}%</td>
                    <td className="p-3">
                      <img 
                        src={ev.snapshot_url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop"} 
                        alt="Snapshot" 
                        className="w-12 h-8 object-cover rounded border border-slate-700"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

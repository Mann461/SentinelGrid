import React, { useState, useEffect } from 'react';
import { Eye, PlusCircle, Car, User, ShieldAlert, CheckCircle2, FileText, Search } from 'lucide-react';
import { watchlistAPI } from '../services/api';

export default function WatchlistManager({ activeUser }) {
  const [entries, setEntries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    category: 'stolen_vehicle',
    identifier: 'GJ-01-AB-1234',
    description: 'High-priority target reported in theft FIR.',
    source_authority: activeUser?.department ? `${activeUser.department} HQ` : 'Gujarat Police HQ',
    active: true
  });

  useEffect(() => {
    fetchEntries();
  }, [selectedCategory]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await watchlistAPI.getEntries(selectedCategory !== 'ALL' ? selectedCategory : null);
      setEntries(data);
    } catch (e) {
      console.error("Error fetching watchlist", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await watchlistAPI.createEntry(form);
      setShowAddModal(false);
      fetchEntries();
    } catch (e) {
      console.error("Error adding watchlist entry", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <span>Watchlist Analytics & Intercept Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Active watchlist entries across 5 named categories (Stolen Vehicles, Wanted Persons, Missing Persons, Blacklisted Vehicles, Suspects) + Extensible Other.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Category Filter */}
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-semibold"
          >
            <option value="ALL">All Watchlist Categories</option>
            <option value="stolen_vehicle">Stolen Vehicles</option>
            <option value="wanted_person">Wanted Persons</option>
            <option value="missing_person">Missing Persons</option>
            <option value="blacklisted_vehicle">Blacklisted Vehicles</option>
            <option value="suspect">Suspects</option>
            <option value="other">Extensible Other</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-cyan-600/30 transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Watchlist Target</span>
          </button>
        </div>
      </div>

      {/* Grid of Watchlist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3 text-xs relative">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                entry.category === 'stolen_vehicle' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                entry.category === 'wanted_person' ? 'bg-purple-950 text-purple-300 border border-purple-500/40' :
                entry.category === 'missing_person' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                'bg-blue-950 text-blue-300 border border-blue-500/40'
              }`}>
                {entry.category.replace('_', ' ')}
              </span>

              <span className="text-emerald-400 font-bold text-[10px] flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>ACTIVE INTERCEPT</span>
              </span>
            </div>

            <div>
              <div className="font-mono font-extrabold text-white text-base bg-slate-950 p-2 rounded-lg border border-slate-800 text-center tracking-wider text-cyan-300">
                {entry.identifier}
              </div>
              <p className="text-slate-300 text-[11px] mt-2 leading-relaxed">{entry.description}</p>
            </div>

            <div className="border-t border-slate-800 pt-2 text-[10px] text-slate-400 flex justify-between">
              <span>Authority: <strong className="text-slate-200">{entry.source_authority}</strong></span>
              <span>Added: <strong className="text-slate-200">{new Date(entry.date_added).toLocaleDateString()}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* 512-D Facial Embedding Vector Matcher Widget */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-cyan-300 flex items-center space-x-2">
              <User className="w-4 h-4 text-purple-400" />
              <span>ArcFace 512-D Facial Vector Distance Matcher</span>
            </h3>
            <p className="text-xs text-slate-400">Cosine similarity thresholding against facial recognition watchlist embeddings.</p>
          </div>
          <span className="bg-purple-950 text-purple-300 font-mono text-[10px] px-2.5 py-1 rounded font-bold border border-purple-500/40">
            COSINE SIMILARITY 0.942 (MATCH)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Probe Image */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Probe Surveillance Snapshot</div>
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop" 
              alt="Probe Face"
              className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 mx-auto shadow-lg"
            />
            <div className="font-mono text-cyan-300 font-bold">FACE-2026-SUSPECT-001</div>
          </div>

          {/* Match Score Center Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-center text-center">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">94.2% Match</div>
            <div className="text-[11px] text-slate-300">Euclidean Distance: <span className="font-mono text-amber-300 font-bold">0.3406</span></div>
            <div className="text-[10px] text-slate-400 font-mono">Landmark Alignment Score: 96.8%</div>
            <div className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded text-[10px] font-bold inline-block mx-auto">
              VERIFIED SUSPECT MATCH
            </div>
          </div>

          {/* Gallery Watchlist Image */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Gallery Watchlist Profile</div>
            <img 
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop" 
              alt="Gallery Face"
              className="w-24 h-24 rounded-full object-cover border-2 border-purple-400 mx-auto shadow-lg"
            />
            <div className="font-mono text-purple-300 font-bold">WL-PERSON-001</div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 text-xs">
            <div className="font-bold text-sm text-cyan-300 border-b border-slate-800 pb-2">
              Add New Watchlist Target
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Target Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              >
                <option value="stolen_vehicle">Stolen Vehicle</option>
                <option value="wanted_person">Wanted Person</option>
                <option value="missing_person">Missing Person</option>
                <option value="blacklisted_vehicle">Blacklisted Vehicle</option>
                <option value="suspect">Suspect</option>
                <option value="other">Extensible Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Identifier (Plate No or Face Embedding Ref)</label>
              <input 
                type="text" 
                required
                value={form.identifier}
                onChange={(e) => setForm({...form, identifier: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Description & FIR Case Metadata</label>
              <textarea 
                rows="3"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
              >
                Save Watchlist Entry
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

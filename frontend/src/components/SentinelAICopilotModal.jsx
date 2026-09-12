import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Cpu, Shield, Compass, Map, Bell, Globe, Zap, ArrowRight, X } from 'lucide-react';

export default function SentinelAICopilotModal({ isOpen, onClose, onExecuteAction }) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Greetings Commander. Sentinel AI Copilot active. Speak or type commands like "Track plate GJ-01-AB-1234", "Show spatial gaps in Surat", or "Simulate AI alert".',
      quickActions: [
        { label: 'Track Target Plate GJ-01-AB-1234', action: 'track', plate: 'GJ-01-AB-1234' },
        { label: 'Show Spatial Gap Analysis', action: 'gap_analysis' },
        { label: 'Simulate Real-Time AI Alert', action: 'simulate_alert' },
        { label: 'Harvest OpenStreetMap CCTV', action: 'harvest_osm' }
      ]
    }
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onExecuteAction('open_copilot');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Speech recognition API is not supported in this browser. Please type your command.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
      processCommand(speechToText);
    };

    recognition.start();
  };

  const processCommand = (inputText) => {
    if (!inputText.trim()) return;

    const userMsg = { sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');

    const lower = inputText.toLowerCase();

    let aiReply = "I am processing your command across Gujarat SentinelGrid telemetry...";
    let quickActions = [];

    if (lower.includes('track') || lower.includes('plate') || lower.includes('route') || lower.includes('vehicle')) {
      const match = inputText.match(/gj[- ]?\d{2}[- ]?[a-z]{1,2}[- ]?\d{4}/i);
      const targetPlate = match ? match[0].toUpperCase() : 'GJ-01-AB-1234';

      aiReply = `Understood. Opening Chronological Route Tracking for target vehicle plate: ${targetPlate}. PostGIS camera polyline rendered.`;
      quickActions = [{ label: `Open Vehicle Track (${targetPlate})`, action: 'track', plate: targetPlate }];
      onExecuteAction('track', targetPlate);
    } else if (lower.includes('gap') || lower.includes('uncovered') || lower.includes('gis') || lower.includes('map')) {
      aiReply = `Switching to GIS Registry map and activating spatial coverage gap analysis (ST_DWithin PostGIS buffer).`;
      quickActions = [{ label: 'View Uncovered Zones Overlay', action: 'gap_analysis' }];
      onExecuteAction('gap_analysis');
    } else if (lower.includes('dispatch') || lower.includes('intercept') || lower.includes('order')) {
      aiReply = `Generating Official Police Emergency Intercept Order for high-priority target vehicle.`;
      quickActions = [{ label: 'View Intercept Dispatch Sheet', action: 'open_dispatch', plate: 'GJ-01-AB-1234' }];
      onExecuteAction('open_dispatch', 'GJ-01-AB-1234');
    } else if (lower.includes('alert') || lower.includes('simulate') || lower.includes('anpr')) {
      aiReply = `Executing sub-100ms real-time AI ANPR alert simulation... Broadcasted via WebSocket stream.`;
      quickActions = [{ label: 'View Live Alerts Dashboard', action: 'live_alerts' }];
      onExecuteAction('simulate_alert');
    } else if (lower.includes('osm') || lower.includes('harvest') || lower.includes('camera')) {
      aiReply = `Querying OpenStreetMap Overpass API for real CCTV camera nodes across Gujarat.`;
      quickActions = [{ label: 'View AI & Dataset Telemetry', action: 'ai_model' }];
      onExecuteAction('harvest_osm');
    } else {
      aiReply = `Command recognized: "${inputText}". Choose a quick action below to execute immediately.`;
      quickActions = [
        { label: 'Vehicle Route Track', action: 'track', plate: 'GJ-01-AB-1234' },
        { label: 'GIS Map Registry', action: 'registry' },
        { label: 'Watchlist Analytics', action: 'watchlist' }
      ];
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'ai', text: aiReply, quickActions }]);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
        
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">Sentinel Voice & Natural AI Copilot</span>
                <span className="bg-cyan-950 text-cyan-300 font-mono text-[9px] px-2 py-0.5 rounded border border-cyan-500/40">
                  Ctrl + K
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Natural Language Control for Gujarat Police Command & Control</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3.5 ${
                msg.sender === 'user' 
                  ? 'bg-cyan-600 text-white font-medium rounded-br-none' 
                  : 'bg-slate-950 border border-slate-800 text-slate-200 space-y-2.5 rounded-bl-none'
              }`}>
                <div>{msg.text}</div>

                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onExecuteAction(qa.action, qa.plate);
                          onClose();
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-semibold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1 transition shadow"
                      >
                        <span>{qa.label}</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Command Input Footer */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 flex items-center space-x-2">
          <button
            onClick={handleVoiceInput}
            title="Speak Natural Language Command"
            className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
              isListening
                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processCommand(query)}
            placeholder="Type command e.g. 'Track plate GJ-01-AB-1234'..."
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => processCommand(query)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-xl transition flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

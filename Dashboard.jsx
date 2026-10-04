import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle, Play, Square, Activity, Shield, Navigation } from 'lucide-react';

const Dashboard = ({ alerts }) => {
  const [demoRunning, setDemoRunning] = useState(false);
  const [stats, setStats] = useState({ active_workers: 0, critical_alerts: 0, ppe_compliance: 0 });

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
      
    fetch('http://127.0.0.1:8000/api/system-status')
      .then(res => res.json())
      .then(data => setDemoRunning(data.DemoMode));
  }, []);

  const toggleDemo = () => {
    const endpoint = demoRunning ? 'reset' : 'start';
    fetch(`http://127.0.0.1:8000/api/demo/${endpoint}`, { method: 'POST' })
      .then(() => setDemoRunning(!demoRunning));
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Live Safety Monitor</h2>
        <div className="flex gap-4">
          <button 
            onClick={toggleDemo}
            className={`flex items-center gap-2 px-4 py-2 rounded font-bold ${demoRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {demoRunning ? <Square size={16} /> : <Play size={16} />}
            {demoRunning ? 'STOP DEMO' : 'START LIVE DEMO'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Active Workers</div>
          <div className="text-3xl font-bold">{stats.active_workers}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">PPE Compliance</div>
          <div className="text-3xl font-bold text-green-400">{stats.ppe_compliance}%</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-red-900/30">
          <div className="text-gray-400 text-sm">Critical Alerts</div>
          <div className="text-3xl font-bold text-red-500">{stats.critical_alerts}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">AI Pipeline</div>
          <div className="text-lg font-bold text-blue-400 mt-2">REAL + SIMULATED</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        <div className="col-span-2 bg-black rounded-lg border border-gray-700 relative overflow-hidden flex items-center justify-center">
           {/* Mock Video Feed */}
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>
           
           {/* UI Overlay */}
           <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded text-sm font-mono text-green-400 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             CAM-01 | Main Industrial Zone | FPS: 24
           </div>
           
           <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded text-sm font-mono text-blue-400">
             {demoRunning ? 'DEMO SIMULATION' : 'AWAITING FEED'}
           </div>

           {demoRunning && alerts.length > 0 && (
              <div className="absolute bottom-10 inset-x-10 border-2 border-red-500 bg-red-500/20 p-4 rounded backdrop-blur-sm">
                <div className="text-red-400 font-bold mb-1">TRACKING: W-002</div>
                <div className="text-white">Action: {alerts[alerts.length-1].worker.action.toUpperCase()}</div>
                <div className="text-white">Proximity: {alerts[alerts.length-1].worker.distance}m from hazard</div>
              </div>
           )}
           
           {!demoRunning && (
             <div className="text-center text-gray-500 relative z-10 flex flex-col items-center">
               <Camera size={48} className="mb-4 opacity-50" />
               <p>No active feed.</p>
               <p className="text-sm">Click "Start Live Demo" to run the simulation.</p>
             </div>
           )}
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 font-bold flex items-center gap-2">
            <AlertCircle className="text-red-400" /> Live Alerts
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {alerts.length === 0 ? (
               <div className="text-gray-500 text-sm text-center mt-10">No active alerts</div>
            ) : (
              [...alerts].reverse().map((a, i) => (
                <div key={i} className={`p-4 rounded border ${a.risk.severity === 'CRITICAL' ? 'bg-red-900/20 border-red-500/50' : 'bg-orange-900/20 border-orange-500/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${a.risk.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {a.risk.severity} - {a.risk.score}
                    </span>
                    <span className="text-xs text-gray-400">W-002</span>
                  </div>
                  <div className="text-sm font-bold mb-2">Why did this fire?</div>
                  <ul className="text-xs text-gray-300 space-y-1 mb-3">
                    {a.risk.reasons.map((r, idx) => (
                      <li key={idx} className="flex gap-2"><span className="text-red-400">⚠</span> {r}</li>
                    ))}
                  </ul>
                  <div className="text-xs">
                    <span className="text-gray-400">Root Cause: </span>
                    <span className="text-blue-300 font-mono">{a.risk.root_cause}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

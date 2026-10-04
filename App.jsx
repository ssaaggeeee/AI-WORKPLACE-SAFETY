import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Users, Settings, BarChart2, Video } from 'lucide-react'
import Dashboard from './pages/Dashboard'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // When running under vite dev server proxy, or directly from FastAPI
    let wsUrl = `${protocol}//${window.location.host}/ws/alerts`;
    
    // For localhost dev without vite proxy
    if (window.location.port === '5173') {
        wsUrl = `ws://127.0.0.1:8000/ws/alerts`;
    }

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'alert') {
        setAlerts(prev => [...prev, data].slice(-5)); // keep last 5
        // Voice alert
        if (data.risk && data.risk.severity === 'CRITICAL') {
           const utterance = new SpeechSynthesisUtterance(`Critical safety alert for worker ${data.worker.worker_id}. ${data.risk.reasons[0]}`);
           window.speechSynthesis.speak(utterance);
        }
      }
    };

    return () => ws.close();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard alerts={alerts} />;
      default:
        return <div className="p-8 text-gray-400">Section {activeTab} coming soon...</div>;
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <Activity /> SafeSight AI
          </h1>
          <p className="text-xs text-gray-400 mt-1">Group 173 Prototype</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: Video, label: 'Live Monitor' },
            { id: 'incidents', icon: AlertTriangle, label: 'Incidents' },
            { id: 'workers', icon: Users, label: 'Workers' },
            { id: 'analytics', icon: BarChart2, label: 'Analytics' },
            { id: 'settings', icon: Settings, label: 'System Status' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-900 rounded p-3 text-xs border border-gray-700">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">AI Inference</span>
              <span className="text-green-400">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Processing</span>
              <span className="text-blue-400">EDGE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  )
}

export default App

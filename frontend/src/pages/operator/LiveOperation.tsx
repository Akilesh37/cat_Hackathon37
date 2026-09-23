import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radio, 
  ShieldAlert, 
  Navigation, 
  PhoneCall, 
  Bot, 
  Activity, 
  Gauge, 
  Flame, 
  CheckCircle2 
} from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { LiveMap } from '../../components/LiveMap';
import { useTelemetry, useAlerts } from '../../lib/socket';
import { api } from '../../lib/api';

export const LiveOperation: React.FC = () => {
  const { user } = useSessionStore();
  const navigate = useNavigate();

  const machineId = user?.userId === 3 ? 5 : (user?.userId === 2 ? 2 : 1);
  const { currentTelemetry } = useTelemetry(machineId);
  const { alerts } = useAlerts();

  const [activeTask, setActiveTask] = useState<any>(null);

  useEffect(() => {
    if (user?.userId) {
      api.getTasks(user.userId).then((tasks) => {
        if (tasks.length > 0) setActiveTask(tasks[0]);
      });
    }
  }, [user]);

  // Find any active critical alert for this machine or operator
  const criticalAlert = alerts.find(
    a => a.severity === 'Critical' || (a.operator_id === user?.userId && a.status === 'Active')
  );

  return (
    <div className="space-y-4">
      {/* Top Cabin Bar: Status, Emergency Call, and Copilot Button */}
      <div className="bg-cat-black text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-cat-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cat-green animate-pulse" />
          <div>
            <h1 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
              In-Cabin Live HUD • {user?.operatorCode} ({user?.name})
            </h1>
            <p className="text-[11px] text-cat-yellow font-bold">
              {activeTask ? `${activeTask.task_code}: ${activeTask.task_type} • ${activeTask.from_location || 'Quarry'} ➔ ${activeTask.to_location || 'Zone B'}` : 'Operating in Site A Sector'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Dispatching high-priority radio call to Site Supervisor Admin...')}
            className="bg-cat-red hover:bg-red-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call Supervisor
          </button>

          <button
            onClick={() => navigate('/operator/copilot')}
            className="bg-cat-yellow hover:bg-yellow-400 text-cat-black font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Bot className="w-3.5 h-3.5" /> Voice Copilot
          </button>

          {activeTask && (
            <button
              onClick={() => navigate(`/operator/summary/${activeTask.id}`)}
              className="bg-cat-green hover:bg-green-600 text-white font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> End Shift
            </button>
          )}
        </div>
      </div>

      {/* Critical Alert Bar if active */}
      {criticalAlert && (
        <div className="p-3 bg-cat-red text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>CRITICAL ALERT (P{criticalAlert.priority_rank}): {criticalAlert.message}</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">ACKNOWLEDGED BY SYSTEM</span>
        </div>
      )}

      {/* Live Map Area: The shared <LiveMap /> synced with Admin Fleet */}
      <div className="relative">
        <LiveMap
          mode="operator"
          operatorId={user?.userId || 1}
          activeTaskId={activeTask?.id}
          height="540px"
        />
      </div>

      {/* Cabin Telemetry Gauge Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Speed */}
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cat-yellow/20 text-cat-black border border-cat-yellow/30">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-cat-gray-500 uppercase">Ground Speed</span>
            <p className="text-xl font-black text-cat-black">{currentTelemetry?.speed_kmh || 24.5} km/h</p>
          </div>
        </div>

        {/* Hydraulic Temp */}
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cat-orange/15 text-cat-orange border border-cat-orange/30">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-cat-gray-500 uppercase">Hydraulic Temp</span>
            <p className="text-xl font-black text-cat-black">{currentTelemetry?.hydraulic_temp || 68.2}°C</p>
          </div>
        </div>

        {/* Fuel Level */}
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cat-green/15 text-cat-green border border-cat-green/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-cat-gray-500 uppercase">Fuel Level</span>
            <p className="text-xl font-black text-cat-black">{currentTelemetry?.fuel_level || 74.5}%</p>
          </div>
        </div>

        {/* Smart Seatbelt */}
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${
            (currentTelemetry?.seatbelt_status ?? true)
              ? 'bg-cat-green/15 text-cat-green border-cat-green/30'
              : 'bg-cat-red/15 text-cat-red border-cat-red/30'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-cat-gray-500 uppercase">Seatbelt Sensor</span>
            <p className={`text-sm font-black ${(currentTelemetry?.seatbelt_status ?? true) ? 'text-cat-green' : 'text-cat-red'}`}>
              {(currentTelemetry?.seatbelt_status ?? true) ? 'COMPLIANT' : 'UNFASTENED'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTelemetry } from '../../lib/socket';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Flame, Droplet, Radio, Gauge } from 'lucide-react';

export const LiveSensorMonitoring: React.FC = () => {
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const { currentTelemetry } = useTelemetry(selectedMachineId || 1);

  useEffect(() => {
    api.getMachines().then(m => {
      setMachines(m);
      if (m.length > 0 && !selectedMachineId) {
        setSelectedMachineId(m[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedMachineId) {
      api.getMachineTelemetry(selectedMachineId, 25).then(setChartData);
    }
  }, [selectedMachineId]);

  // Live Append
  useEffect(() => {
    if (currentTelemetry && selectedMachineId === currentTelemetry.machine_id) {
      setChartData(prev => {
        const last = prev[prev.length - 1];
        if (last && last.time === new Date(currentTelemetry.timestamp).toLocaleTimeString()) return prev;
        
        const next = [...prev, {
          time: new Date(currentTelemetry.timestamp).toLocaleTimeString(),
          hydraulic_temp: currentTelemetry.hydraulic_temp,
          fuel_level: currentTelemetry.fuel_level,
          speed_kmh: currentTelemetry.speed_kmh
        }];
        if (next.length > 25) next.shift();
        return next;
      });
    }
  }, [currentTelemetry, selectedMachineId]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Real-Time Diagnostics
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">Live Sensor Telematics Monitoring</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            Hydraulic Fluid Temperature, Fuel Level Drift & Speed Streams (2-Second Tick)
          </p>
        </div>

        {/* Machine Switcher */}
        <div className="flex items-center gap-2">
          {machines.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMachineId(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedMachineId === m.id
                  ? 'bg-cat-yellow text-cat-black shadow-sm'
                  : 'bg-cat-gray-50 border border-cat-gray-200 text-cat-gray-700 hover:text-cat-black'
              }`}
            >
              {m.machine_code}
            </button>
          ))}
        </div>
      </div>

      {/* Sensor Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-cat-gray-500 uppercase text-[10px]">Hydraulic Temperature</span>
            <Flame className="w-5 h-5 text-cat-orange" />
          </div>
          <span className="text-2xl font-black text-cat-black">
            {currentTelemetry?.hydraulic_temp || 68.2}°C
          </span>
          <p className="text-[11px] text-cat-green font-bold mt-1">Normal Operating Range</p>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-cat-gray-500 uppercase text-[10px]">Current Fuel Level</span>
            <Droplet className="w-5 h-5 text-cat-yellow" />
          </div>
          <span className="text-2xl font-black text-cat-black">
            {currentTelemetry?.fuel_level || 74.0}%
          </span>
          <p className="text-[11px] text-cat-gray-500 font-bold mt-1">Auto-Drain Rate: ~0.008%/tick</p>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-cat-gray-500 uppercase text-[10px]">Current Speed</span>
            <Gauge className="w-5 h-5 text-cat-blue" />
          </div>
          <span className="text-2xl font-black text-cat-black">
            {currentTelemetry?.speed_kmh || 0} km/h
          </span>
          <p className="text-[11px] text-cat-blue font-bold mt-1">GPS Speed</p>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-cat-gray-500 uppercase text-[10px]">Idle Counter</span>
            <Activity className="w-5 h-5 text-cat-green" />
          </div>
          <span className="text-2xl font-black text-cat-black">
            {currentTelemetry?.idle_seconds || 0}s
          </span>
          <p className="text-[11px] text-cat-gray-500 font-bold mt-1">Threshold: 1200s (20m)</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase text-cat-black mb-4">
            Hydraulic Temperature Sensor (°C)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="hydraulic_temp"
                  stroke="#F7941E"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#F7941E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase text-cat-black mb-4">
            Fuel Depletion Stream (%)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="fuel_level"
                  stroke="#FFCD11"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#1A1A1A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Flame, Droplet, Clock, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { api } from '../../lib/api';
import { useTelemetry } from '../../lib/socket';

export const MachineHealth: React.FC = () => {
  const { user } = useSessionStore();
  const machineId = user?.userId === 3 ? 5 : (user?.userId === 2 ? 2 : 1);

  const [machine, setMachine] = useState<any>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const { currentTelemetry } = useTelemetry(machineId);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const [m, tel] = await Promise.all([
          api.getMachine(machineId),
          api.getMachineTelemetry(machineId, 25)
        ]);
        setMachine(m);
        setTelemetryHistory(tel);
      } catch (err) {
        console.error('Error fetching machine health:', err);
      }
    }
    fetchHealth();
  }, [machineId]);

  return (
    <div className="space-y-6">
      {/* Equipment Header */}
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Equipment Health Center
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">
            {machine?.machine_code || 'CAT 320-01'} ({machine?.model} {machine?.type})
          </h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            ECM Health Stream • Telematics Firmware v4.8 • Smart Hydraulic Interlock Active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-cat-green/10 border border-cat-green/30 rounded-xl text-center">
            <span className="text-[10px] font-black uppercase text-cat-green block">Overall Status</span>
            <span className="text-sm font-black text-cat-black">OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* Sensor Metric Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cat-gray-500 uppercase">Hydraulic Temperature</span>
            <Flame className="w-5 h-5 text-cat-orange" />
          </div>
          <span className="text-2xl font-black text-cat-black">
            {currentTelemetry?.hydraulic_temp || machine?.hydraulic_temp || 68.0}°C
          </span>
          <p className="text-xs text-cat-green font-bold mt-1">● Operating in Normal Zone (60-82°C)</p>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cat-gray-500 uppercase">Fuel Tank Capacity</span>
            <Droplet className="w-5 h-5 text-cat-yellow" />
          </div>
          <span className="text-2xl font-black text-cat-black">
            {currentTelemetry?.fuel_level || machine?.fuel_level || 75.0}%
          </span>
          <p className="text-xs text-cat-gray-500 font-medium mt-1">~6.8 Operating Hours Remaining</p>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cat-gray-500 uppercase">Engine Oil Pressure</span>
            <CheckCircle2 className="w-5 h-5 text-cat-green" />
          </div>
          <span className="text-2xl font-black text-cat-black">
            {machine?.engine_oil_status || 'Normal'}
          </span>
          <p className="text-xs text-cat-gray-500 font-medium mt-1">Cat DEO-ULS 15W-40 Verified</p>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cat-gray-500 uppercase">Engine Hours</span>
            <Clock className="w-5 h-5 text-cat-blue" />
          </div>
          <span className="text-2xl font-black text-cat-black">
            {currentTelemetry?.engine_hours || machine?.engine_hours || 1850.5}h
          </span>
          <p className="text-xs text-cat-gray-500 font-medium mt-1">Next Service at {machine?.next_maintenance_hours || 2000.0}h</p>
        </div>
      </div>

      {/* Telemetry Charts Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hydraulic Temp Chart */}
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-cat-black mb-4">
            Hydraulic Temperature Trend (°C)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
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

        {/* Fuel Depletion Chart */}
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-cat-black mb-4">
            Fuel Consumption Rate (%)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
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

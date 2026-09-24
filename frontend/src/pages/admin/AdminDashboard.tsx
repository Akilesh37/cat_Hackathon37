import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Users, Package, Mountain, Scissors, Clock, Fuel, Wrench, Search,
  Bell, ChevronDown, ArrowRight, MapPin, Eye, RefreshCcw
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAlerts, useLiveLocation, useTelemetry } from '../../lib/socket';

const MACHINE_IMGS: Record<string, string> = {
  'Excavator': 'https://www.cat.com/content/dam/catdotcom/en_US/products/new/equipment/excavators/medium-excavators/1000029826.png',
  'Loader': 'https://www.cat.com/content/dam/catdotcom/en_US/products/new/equipment/wheel-loaders/small-wheel-loaders/1000029830.png',
  'Truck': 'https://www.cat.com/content/dam/catdotcom/en_US/products/new/equipment/off-highway-trucks/off-highway-trucks/1000030109.png',
  'Hydraulic Excavator': 'https://www.cat.com/content/dam/catdotcom/en_US/products/new/equipment/excavators/medium-excavators/1000029826.png',
  'Dump Truck': 'https://www.cat.com/content/dam/catdotcom/en_US/products/new/equipment/off-highway-trucks/off-highway-trucks/1000030109.png',
};

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function MachineCard({ machine, operator, task }: any) {
  const isExcavator = machine?.type?.includes('Excavator');
  const isLoader = machine?.type?.includes('Loader');
  const isTruck = machine?.type?.includes('Truck') || machine?.type?.includes('Tipper');
  
  const completed = task?.completed_quantity || 0;
  const target = task?.target_quantity || 100;
  const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" /> Running
        </span>
        <span className="font-bold text-sm text-gray-800">{machine?.model || 'CAT Machine'}</span>
        <span className="text-xs text-gray-500">{machine?.type}</span>
      </div>

      <div className="flex gap-3">
        <img
          src={MACHINE_IMGS[machine?.type] || MACHINE_IMGS['Excavator']}
          alt={machine?.type}
          className="w-28 h-20 object-contain rounded-lg bg-gray-50 border border-gray-100 shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="flex-1 space-y-1.5 text-xs min-w-0">
            <>
              <div className="flex justify-between"><span className="text-gray-500">Progress</span><span className="font-bold text-gray-800">{completed} / {target} {task?.unit}</span></div>
              <div className="flex justify-between items-center"><ProgressBar pct={pct} color="#2E6FDB" /><span className="ml-2 font-bold text-[#2E6FDB]">{pct}%</span></div>
            </>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <div className="flex items-center gap-1 text-gray-600"><span className="text-[#4A4A4A]">👤</span> {operator?.name || 'Unassigned'}</div>
        <div className="flex items-center gap-1 text-[#F7941E]"><Fuel className="w-3 h-3" /> Fuel: {machine?.fuel_level?.toFixed(1) || 0}%</div>
        <div className="flex items-center gap-1 text-gray-500"><Clock className="w-3 h-3" /> Engine: {machine?.engine_hours?.toFixed(1) || 0} h</div>
      </div>
    </div>
  );
}

// Admin Control Panel Component
const AdminControlPanel = () => {
    const triggerScenario = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:51098/api/admin/trigger_scenario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ scenario_id: id })
            });
            alert(`Scenario ${id} triggered!`);
        } catch (e) {
            console.error(e);
            alert("Failed to trigger scenario");
        }
    };

    return (
        <div className="bg-gray-800 text-white p-4 rounded-xl shadow-lg border border-gray-700 space-y-3 mb-4">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-400" /> Simulator Control Panel
                </h3>
            </div>
            <div className="flex gap-4">
                <button onClick={() => triggerScenario(9)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors">Toggle Rain (9)</button>
                <button onClick={() => triggerScenario(6)} className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors">Trigger Overheat (6)</button>
                <button onClick={() => triggerScenario(1)} className="bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors">Trigger Seatbelt (1)</button>
                <button onClick={() => triggerScenario(5)} className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors">Trigger Proximity (5)</button>
            </div>
        </div>
    );
}

import { useGlobalStore } from '../../store/globalStore';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const machines = useGlobalStore(state => state.machines);
  const tasks = useGlobalStore(state => state.tasks);
  const operators = useGlobalStore(state => state.operators);
  const alerts = useGlobalStore(state => state.alerts);
  const positions = useGlobalStore(state => state.livePositions);
  const telemetry = useGlobalStore(state => state.liveTelemetry);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  // Merge telemetry with machines
  const mergedMachines = (machines || []).map(m => {
    const t = telemetry && m ? telemetry[m.id] : null;
    if (t) {
      return { ...m, fuel_level: t.fuel_level, hydraulic_temp: t.hydraulic_temp, engine_hours: t.engine_hours };
    }
    return m;
  });

  const runningMachines = mergedMachines.filter(m => m?.status === 'running').length || 0;
  const idleMachines = mergedMachines.filter(m => m?.status === 'idle').length || 0;
  const maintenanceMachines = mergedMachines.filter(m => m?.status === 'maintenance').length || 0;
  const breakdownMachines = mergedMachines.filter(m => m?.status === 'breakdown').length || 0;
  const totalMachines = mergedMachines.length;
  const activeOps = (operators || []).length;
  
  const totalFuel = mergedMachines.reduce((sum, m) => sum + (100 - (m?.fuel_level || 100)), 0) * 10;
  const totalHours = mergedMachines.reduce((sum, m) => sum + (m?.engine_hours || 0), 0);

  const excavator = mergedMachines.find(m => (m?.type || '').includes('Excavator')) || mergedMachines[0] || null;
  const loader = mergedMachines.find(m => (m?.type || '').includes('Loader')) || mergedMachines[1] || null;
  const truck = mergedMachines.find(m => (m?.type || '').includes('Truck')) || mergedMachines[2] || null;

  const criticalAlerts = (alerts || []).filter(a => a?.severity === 'Critical' || a?.priority_rank <= 2);

  const shiftStart = new Date(now); shiftStart.setHours(6, 0, 0, 0);
  const elapsed = Math.max(0, Math.floor((now.getTime() - shiftStart.getTime()) / 60000));
  const shiftTotalMin = 480;
  const elapsedH = Math.floor(elapsed / 60);
  const elapsedM = elapsed % 60;
  const remainingMin = Math.max(0, shiftTotalMin - elapsed);
  const remH = Math.floor(remainingMin / 60);
  const remM = remainingMin % 60;
  const shiftPct = Math.min(100, Math.round((elapsed / shiftTotalMin) * 100));

  return (
    <div className="space-y-4 text-sm">
      <AdminControlPanel />
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { icon: <Truck className="w-5 h-5 text-green-600" />, value: runningMachines, label: 'Active Machines', sub: `Total: ${totalMachines}`, bg: 'bg-green-50 border-green-200' },
          { icon: <Users className="w-5 h-5 text-blue-600" />, value: activeOps, label: 'Active Operators', sub: `Total: ${operators.length}`, bg: 'bg-blue-50 border-blue-200' },
          { icon: <Package className="w-5 h-5 text-[#F7941E]" />, value: tasks.filter(t => t.status==='Completed').length, label: 'Tasks Done', sub: '', bg: 'bg-orange-50 border-orange-200' },
          { icon: <Mountain className="w-5 h-5 text-purple-600" />, value: tasks.reduce((sum, t) => sum + (t.completed_quantity || 0), 0) + ' m³', label: 'Material Moved', sub: '', bg: 'bg-purple-50 border-purple-200' },
          { icon: <Clock className="w-5 h-5 text-yellow-600" />, value: `${totalHours.toFixed(0)} h`, label: 'Machine Hours', sub: 'Total', bg: 'bg-yellow-50 border-yellow-200' },
          { icon: <Fuel className="w-5 h-5 text-gray-600" />, value: `${totalFuel.toFixed(0)} L`, label: 'Fuel Consumed', sub: 'Est.', bg: 'bg-gray-50 border-gray-200' },
        ].map((k, i) => (
          <div key={i} className={`border rounded-xl p-3 ${k.bg} flex flex-col gap-1`}>
            <div className="flex items-center gap-2">{k.icon}<span className="font-black text-gray-800 text-base leading-none">{k.value}</span></div>
            <div className="text-[11px] font-semibold text-gray-700 leading-tight">{k.label}</div>
            {k.sub && <div className="text-[10px] text-gray-500">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">Live Machine &amp; Operator Status</h3>
          <button onClick={() => navigate('/admin/fleet')} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">View All <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MachineCard machine={excavator} operator={operators.find(o => o.id === excavator?.id)} task={tasks.find(t => t.machine_id === excavator?.id)} />
          <MachineCard machine={loader} operator={operators.find(o => o.id === loader?.id)} task={tasks.find(t => t.machine_id === loader?.id)} />
          <MachineCard machine={truck} operator={operators.find(o => o.id === truck?.id)} task={tasks.find(t => t.machine_id === truck?.id)} />
        </div>
      </div>
      
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-red-700 text-xs font-bold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} — {criticalAlerts[0]?.message}
          </div>
          <button onClick={() => navigate('/admin/incidents')} className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1">
            View <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

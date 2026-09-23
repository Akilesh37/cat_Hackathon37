import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Phone, Info, Navigation, Activity, Clock, Fuel,
  MessageSquare, X, Send, Paperclip, HelpCircle, ChevronDown, MapPin
} from 'lucide-react';
import { LiveMap } from '../../components/LiveMap';
import { useSessionStore } from '../../store/sessionStore';
import { api } from '../../lib/api';
import { useTelemetry, useAlerts } from '../../lib/socket';

// ─── Machine Status Panel ──────────────────────────────────────────────────────

function MachineStatusPanel({ machine, telemetry }: { machine: any; telemetry: any }) {
  const engineHours = telemetry?.engine_hours ?? machine?.engine_hours ?? 5.6;
  const totalHours = 1283;
  const fuelLevel = telemetry?.fuel_level ?? machine?.fuel_level ?? 62;
  const engineTemp = telemetry?.engine_temp ?? machine?.engine_temp ?? 82;
  const hydraulicTemp = telemetry?.hydraulic_temp ?? machine?.hydraulic_temp ?? 68;
  const engineOil = 'Normal';
  const hydraulicOil = 'Normal';

  function Bar({ pct, color }: { pct: number; color: string }) {
    return (
      <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    );
  }

  return (
    <div className="bg-[#1E2128] border border-gray-700 rounded-xl p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-sm">Machine Status</h3>
        <span className="text-[10px] bg-green-900/60 text-green-400 border border-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Running
        </span>
      </div>

      {/* Machine image */}
      <div className="text-center mb-3">
        <img
          src="https://www.cat.com/content/dam/catdotcom/en_US/products/new/equipment/excavators/medium-excavators/1000029826.png"
          alt="CAT 320"
          className="w-full h-24 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '';
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="font-black text-white text-base mt-1">CAT 320</div>
        <div className="text-xs text-gray-400">Excavator</div>
        <div className="text-[10px] text-gray-500">ID: CAT320-01</div>
      </div>

      {/* Stats */}
      <div className="space-y-2.5 text-[11px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300"><Clock className="w-3 h-3 text-yellow-400" /> Engine Hours (Today)</div>
          <span className="font-bold text-white">{engineHours.toFixed(1)} h</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300"><Clock className="w-3 h-3 text-gray-400" /> Total Engine Hours</div>
          <span className="font-bold text-white">{totalHours.toLocaleString()} h</span>
        </div>

        {/* Fuel Level with bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-gray-300"><Fuel className="w-3 h-3 text-green-400" /> Fuel Level</div>
            <span className="font-bold text-green-400">{fuelLevel}%</span>
          </div>
          <Bar pct={fuelLevel} color="#2FA84F" />
        </div>

        {/* Engine Temp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300"><Activity className="w-3 h-3 text-orange-400" /> Engine Temp</div>
          <span className="font-bold text-orange-400">{engineTemp} °C</span>
        </div>

        {/* Hydraulic Temp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300"><Activity className="w-3 h-3 text-blue-400" /> Hydraulic Temp</div>
          <span className="font-bold text-white">{hydraulicTemp} °C</span>
        </div>

        {/* Engine Oil */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Engine Oil</div>
          <span className="font-bold text-green-400">{engineOil}</span>
        </div>

        {/* Hydraulic Oil */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Hydraulic Oil</div>
          <span className="font-bold text-green-400">{hydraulicOil}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Message Widget ────────────────────────────────────────────────────────────

function MessageWidget({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'message' | 'report'>('message');
  const [msg, setMsg] = useState("Hi, there is a hard rock layer in the current excavation area. Do we need to change the depth or use a breaker?");

  return (
    <div className="fixed bottom-20 right-6 w-80 bg-[#1E2128] border border-gray-600 rounded-xl shadow-2xl z-50">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <span className="text-white font-bold text-xs">Message Admin / Report Issue</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex border-b border-gray-700">
        <button onClick={() => setTab('message')} className={`flex-1 py-2 text-[11px] font-semibold ${tab === 'message' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
          <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Send Message
        </button>
        <button onClick={() => setTab('report')} className={`flex-1 py-2 text-[11px] font-semibold ${tab === 'report' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />Report Issue
        </button>
      </div>
      <div className="p-3">
        <textarea
          className="w-full bg-[#252930] border border-gray-600 text-white text-xs rounded-lg p-2.5 resize-none h-20 focus:outline-none focus:border-blue-500"
          value={msg}
          onChange={e => setMsg(e.target.value)}
        />
        <div className="flex items-center justify-between mt-2">
          <button className="text-gray-400 text-[11px] flex items-center gap-1 hover:text-white">
            <Paperclip className="w-3.5 h-3.5" /> Attach Photo
          </button>
          <button className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700">
            <Send className="w-3 h-3" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Operator Dashboard ───────────────────────────────────────────────────

export const OperatorDashboard: React.FC = () => {
  const { user } = useSessionStore();
  const navigate = useNavigate();

  const [activeTask, setActiveTask] = useState<any>(null);
  const [machine, setMachine] = useState<any>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  const machineId = user?.userId === 3 ? 5 : (user?.userId === 2 ? 2 : 1);
  const { currentTelemetry } = useTelemetry(machineId);
  const { alerts } = useAlerts();

  useEffect(() => {
    async function load() {
      try {
        if (user?.userId) {
          const tasks = await api.getTasks(user.userId);
          if (tasks.length > 0) setActiveTask(tasks[0]);
        }
        const ms = await api.getMachines();
        setMachine(ms.find((m: any) => m.id === machineId) || ms[0]);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [user, machineId]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Progress values
  const excavationDone = 145;
  const excavationTarget = 200;
  const excavationPct = Math.round((excavationDone / excavationTarget) * 100);

  const shiftStart = new Date(now); shiftStart.setHours(6, 0, 0, 0);
  const elapsed = Math.max(0, Math.floor((now.getTime() - shiftStart.getTime()) / 60000));
  const shiftPct = Math.min(100, Math.round((elapsed / 480) * 100));
  const shiftElapsedH = Math.floor(elapsed / 60);
  const shiftElapsedM = elapsed % 60;
  const shiftRemH = Math.floor((480 - elapsed) / 60);
  const shiftRemM = (480 - elapsed) % 60;

  const criticalAlert = alerts.find(a => a.priority_rank <= 2);

  return (
    <div className="min-h-screen bg-[#111318] text-white flex flex-col space-y-0 -m-4 md:-m-6">
      {/* ── Operator Topbar ─────────────────────────────────────────────── */}
      <div className="bg-[#1A1D23] border-b border-gray-700 px-5 py-3 flex items-center justify-between shrink-0">
        <div>
          <div className="text-lg font-black text-white flex items-center gap-2">
            Good Morning, {user?.name || 'Ravi Kumar'} <span>👋</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Stay safe. Complete your tasks.</div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-gray-300">
          <span>{dateStr}</span>
          <span className="font-bold text-white">{timeStr}</span>
          <span className="flex items-center gap-1.5 text-green-400 font-semibold">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-gray-700 transition-all">
            <AlertTriangle className="w-5 h-5 text-gray-300" />
            {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{alerts.length}</span>}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#FFCD11] text-black font-extrabold text-sm flex items-center justify-center">
              {user?.name ? user.name[0] : 'R'}
            </div>
            <div>
              <div className="font-bold text-white text-xs">{user?.name || 'Ravi Kumar'}</div>
              <div className="text-[10px] text-gray-400">Operator ({user?.operatorCode || 'OP-001'})</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Current Task Banner ──────────────────────────────────────────── */}
      <div className="bg-[#1A1D23] border-b border-gray-700 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#FFCD11]/20 border border-[#FFCD11]/40 rounded-lg flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-[#FFCD11]" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Current Task</div>
            <div className="font-black text-white text-sm flex items-center gap-2">
              {activeTask?.task_type || 'Excavate Foundation Area'}
              <span className="text-[10px] bg-blue-900/60 text-blue-400 border border-blue-700 px-2 py-0.5 rounded-full font-bold">In Progress</span>
            </div>
            <div className="text-[11px] text-gray-400">{activeTask?.location_zone || 'Zone A - Sector 1'}</div>
          </div>
        </div>
        <div className="flex items-center gap-8 text-[11px]">
          <div className="text-center">
            <div className="text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Start Time</div>
            <div className="font-bold text-white">06:30 AM</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Expected End</div>
            <div className="font-bold text-white">09:30 AM</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 flex items-center gap-1"><Navigation className="w-3 h-3" /> Target</div>
            <div className="font-bold text-white">200 m³</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 flex items-center gap-1"><Info className="w-3 h-3" /> Material</div>
            <div className="font-bold text-white">Soil</div>
          </div>
        </div>
        <button onClick={() => navigate('/operator/tasks')} className="bg-[#FFCD11] text-black font-black text-xs px-5 py-2.5 rounded-xl hover:bg-yellow-400 transition-all">
          View Details
        </button>
      </div>

      {/* ── Main Content: Map | Machine Status ──────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
        {/* Map (9 cols) */}
        <div className="col-span-9 flex flex-col">
          {/* Map header */}
          <div className="bg-[#1A1D23] border-b border-r border-gray-700 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex gap-1">
              {['Map', 'Satellite', 'Terrain'].map((v, i) => (
                <button key={v} className={`text-[10px] px-3 py-1 rounded font-semibold flex items-center gap-1 ${i === 1 ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <MapPin className="w-3 h-3" /> Site A - Main Project
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          {/* Live Map */}
          <div className="flex-1 relative border-r border-gray-700">
            <LiveMap
              mode="operator"
              operatorId={user?.userId || 1}
              height="100%"
            />
          </div>

          {/* ── Progress Gauges Row ──────────────────────────────────────── */}
          <div className="bg-[#1A1D23] border-t border-r border-gray-700 grid grid-cols-4 divide-x divide-gray-700 shrink-0">
            {/* Excavation Progress */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[#FFCD11]" />
                <span className="text-[11px] text-gray-300 font-semibold">Excavation Progress</span>
              </div>
              <div className="font-black text-xl text-white">{excavationDone} / {excavationTarget} m³ <span className="text-[#FFCD11] text-sm">{excavationPct}%</span></div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="h-2 rounded-full bg-[#FFCD11]" style={{ width: `${excavationPct}%` }} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-gray-400">
                <div>Remaining<div className="font-bold text-white">55 m³</div></div>
                <div>Current Rate<div className="font-bold text-white">26.7 m³/h</div></div>
                <div>Required<div className="font-bold text-white">22.9 m³/h</div></div>
              </div>
            </div>

            {/* Shift Progress */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] text-gray-300 font-semibold">Shift Progress</span>
              </div>
              <div className="font-black text-xl text-white">{shiftElapsedH}h {shiftElapsedM}m / 8h <span className="text-blue-400 text-sm">{shiftPct}%</span></div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${shiftPct}%` }} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-gray-400">
                <div>Time Remaining<div className="font-bold text-white">{shiftRemH}h {shiftRemM}m</div></div>
                <div>Expected Finish<div className="font-bold text-white">11:18 AM</div></div>
              </div>
              <div className="mt-1 text-[10px] text-green-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> On Track
              </div>
            </div>

            {/* Distance to Task */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4 text-green-400" />
                <span className="text-[11px] text-gray-300 font-semibold">Distance to Task Area</span>
              </div>
              <div className="font-black text-3xl text-white mt-2">450 m</div>
              <div className="text-[11px] text-gray-400 mt-1">≈ 3 min</div>
              <button onClick={() => navigate('/operator/live')} className="mt-3 w-full bg-[#2E6FDB] text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <Navigation className="w-3.5 h-3.5" /> Navigate
              </button>
            </div>

            {/* Today's Targets */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4 text-[#FFCD11]" />
                <span className="text-[11px] text-gray-300 font-semibold">Today's Targets</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between"><span className="text-gray-400 flex items-center gap-1"><span className="text-green-400">▲</span> Excavate</span><span className="font-bold text-white">200 m³</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-400 flex items-center gap-1"><span className="text-blue-400">▲</span> Loading (est.)</span><span className="font-bold text-white">0 / 10 loads</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-400">● Area Coverage</span><span className="font-bold text-white">800 m²</span></div>
              </div>
            </div>
          </div>

          {/* ── Task Instructions & Site Notes ──────────────────────────── */}
          <div className="bg-[#1A1D23] border-t border-r border-gray-700 grid grid-cols-2 divide-x divide-gray-700 shrink-0">
            {/* Task Instructions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-xs flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[#FFCD11]" /> Task Instructions
                </h3>
                <button className="text-[10px] text-blue-400 hover:underline font-semibold flex items-center gap-1">
                  <span>📋</span> View Drawing
                </button>
              </div>
              <ol className="space-y-1 text-[11px] text-gray-300 list-none">
                {[
                  'Excavate the marked foundation area as per drawing FND-A1.',
                  'Maintain required depth: 2.5 m (±0.1 m).',
                  'Avoid over-excavation; stockpile sides as indicated.',
                  'Coordinate with loading operator for truck loading.',
                  'Report any issues (rock, water seepage, utility lines, etc.).',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#FFCD11]/20 text-[#FFCD11] text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>

            {/* Site Notes */}
            <div className="p-4">
              <h3 className="font-bold text-white text-xs flex items-center gap-2 mb-2">
                <Info className="w-3.5 h-3.5 text-blue-400" /> Site Notes
              </h3>
              <ul className="space-y-1 text-[11px] text-gray-300">
                {[
                  'Depth: 2.5 m',
                  'Material: Soil (mixed with gravel)',
                  'Keep 1 m clearance from boundary line',
                  'Watch for underground utilities (marked in red)',
                  'Contact supervisor if unusual material found',
                ].map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>{note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Machine Status (3 cols) */}
        <div className="col-span-3 bg-[#111318] border-l border-gray-700 p-4 overflow-y-auto">
          <MachineStatusPanel machine={machine} telemetry={currentTelemetry} />
        </div>
      </div>

      {/* ── Bottom Action Bar ────────────────────────────────────────────── */}
      <div className="bg-[#1A1D23] border-t border-gray-700 flex items-center shrink-0">
        {/* SOS */}
        <button
          onClick={() => setShowSOS(true)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-sm py-4 flex items-center justify-center gap-2 transition-all"
        >
          <AlertTriangle className="w-5 h-5" /> SOS / Emergency
        </button>

        {/* Call Supervisor */}
        <button className="flex-1 border-l border-r border-gray-700 bg-[#1E2128] hover:bg-gray-700 text-white font-bold text-sm py-4 flex items-center justify-center gap-2 transition-all">
          <Phone className="w-5 h-5" /> Call Supervisor
        </button>

        {/* Site Info */}
        <button className="flex-1 bg-[#1E2128] hover:bg-gray-700 text-gray-300 font-bold text-sm py-4 flex items-center justify-center gap-2 transition-all">
          <Info className="w-5 h-5" /> Site Info
        </button>

        {/* Need Help */}
        <button
          onClick={() => setShowMessage(!showMessage)}
          className="bg-[#252930] border-l border-gray-700 px-6 py-4 flex items-center gap-2 text-white text-sm font-bold hover:bg-gray-700 transition-all"
        >
          <HelpCircle className="w-5 h-5 text-[#FFCD11]" /> Need Help?
        </button>
      </div>

      {/* Message Widget */}
      {showMessage && <MessageWidget onClose={() => setShowMessage(false)} />}

      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-[#1E2128] border border-red-600 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">SOS Emergency</h2>
            <p className="text-gray-400 text-sm mb-6">This will immediately alert all supervisors and nearby operators. Confirm to send emergency signal.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSOS(false)} className="flex-1 border border-gray-600 text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-700">Cancel</button>
              <button onClick={() => { alert('SOS SIGNAL SENT — Help is on the way!'); setShowSOS(false); }} className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700">SEND SOS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

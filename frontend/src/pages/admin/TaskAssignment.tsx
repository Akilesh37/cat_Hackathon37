import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Truck, Package, TrendingUp, AlertTriangle, ArrowRight, Eye, Plus, Clock } from 'lucide-react';
import { LiveMap } from '../../components/LiveMap';
import { api } from '../../lib/api';
import { useAlerts } from '../../lib/socket';

// ─── Constants ──────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Assigned': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-green-100 text-green-700',
  'Pending': 'bg-gray-100 text-gray-600',
};

const PROGRESS_COLOR: Record<string, string> = {
  'In Progress': '#2E6FDB',
  'Assigned': '#FFCD11',
  'Completed': '#2FA84F',
  'Pending': '#8A8A8A',
};

// ─── Task Assign Form ──────────────────────────────────────────────────────────

function TaskAssignForm({ onCreated, machines = [], operators = [] }: { onCreated: (task: any) => void, machines?: any[], operators?: any[] }) {
  const [form, setForm] = useState({
    task_type: 'Transport (Truck)',
    operator: '',
    vehicle: '',
    material_type: 'Sand',
    target_quantity: '12',
    unit: 'trips',
    pickup_location: 'Quarry - Site A',
    drop_location: 'Site A - Zone B',
    priority: 'High',
    start_time: '14:00',
    end_time: '22:00',
    notes: 'Use Route 2. Maintain speed limit.\nCheck load weight at gate.',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Set default values when data loads
  useEffect(() => {
      if (operators.length > 0 && !form.operator) set('operator', operators[0].id.toString());
      if (machines.length > 0 && !form.vehicle) set('vehicle', machines[0].id.toString());
  }, [operators, machines]);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const today = new Date();
      const [startH, startM] = form.start_time.split(':').map(Number);
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startH, startM, 0);
      
      const [endH, endM] = form.end_time.split(':').map(Number);
      let endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endH, endM, 0);
      
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1); // next day
      }

      const taskData = {
        task_code: 'TSK-' + Math.floor(Math.random() * 10000).toString(),
        task_type: form.task_type,
        operator_id: parseInt(form.operator),
        machine_id: parseInt(form.vehicle),
        target_quantity: parseFloat(form.target_quantity) * (form.unit === 'trips' ? 18 : 1),
        quantity_unit: 'm³',
        pickup_location: form.pickup_location,
        drop_location: form.drop_location,
        location_zone: 'Zone B',
        priority: form.priority,
        start_time: startDate.toISOString(),
        expected_end_time: endDate.toISOString(),
        notes: form.notes,
      };

      const task = await api.createTask(taskData);
      // Wait, api.createTask might return { success: true, assignment: ... } or just task.
      const assignedTask = task.assignment || task;
      
      onCreated(assignedTask);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to create task:', err);
      alert(err.message || 'Failed to assign task. Please check details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = 'block text-[11px] font-semibold text-gray-600 mb-1';
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#FFCD11] bg-white';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 h-full space-y-3">
      <h3 className="font-bold text-gray-800 text-sm mb-1">Assign Task</h3>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold p-2 rounded-lg">
          ✓ Task assigned successfully! Map updated.
        </div>
      )}

      <div>
        <label className={labelCls}>Task Type</label>
        <select className={selectCls} value={form.task_type} onChange={e => set('task_type', e.target.value)}>
          {['Transport (Truck)', 'Excavation', 'Loading', 'Grading', 'Compaction'].map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Operator / Driver</label>
        <select className={selectCls} value={form.operator} onChange={e => set('operator', e.target.value)}>
          {operators.map((o: any) => <option key={o.id} value={o.id.toString()}>{o.name} ({o.operator_code})</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Vehicle / Machine</label>
        <select className={selectCls} value={form.vehicle} onChange={e => set('vehicle', e.target.value)}>
          {machines.map((m: any) => <option key={m.id} value={m.id.toString()}>{m.machine_code} - {m.model}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Material Type</label>
        <select className={selectCls} value={form.material_type} onChange={e => set('material_type', e.target.value)}>
          {['Sand', 'Soil', 'Gravel', 'Mixed'].map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Target Quantity</label>
        <div className="flex gap-2">
          <input type="number" className={`${inputCls} flex-1`} value={form.target_quantity} onChange={e => set('target_quantity', e.target.value)} />
          <select className="border border-gray-200 rounded-lg px-2 text-xs text-gray-700 bg-white focus:outline-none cursor-pointer" value={form.unit} onChange={e => set('unit', e.target.value)}>
            <option>trips</option><option>m³</option><option>loads</option>
          </select>
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          (~ {form.unit === 'trips' ? parseInt(form.target_quantity || '0') * 18 : form.target_quantity} m³)
        </div>
      </div>

      <div>
        <label className={labelCls}>Pickup Location</label>
        <select className={selectCls} value={form.pickup_location} onChange={e => set('pickup_location', e.target.value)}>
          {['Quarry - Site A', 'Zone A', 'Zone B', 'Zone C'].map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Drop Location</label>
        <select className={selectCls} value={form.drop_location} onChange={e => set('drop_location', e.target.value)}>
          {['Site A - Zone B', 'Zone A', 'Zone C', 'Quarry'].map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Priority</label>
        <select className={selectCls} value={form.priority} onChange={e => set('priority', e.target.value)}>
          {['High', 'Medium', 'Low'].map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Start Time</label>
          <input type="time" className={inputCls} value={form.start_time} onChange={e => set('start_time', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Expected End Time</label>
          <input type="time" className={inputCls} value={form.end_time} onChange={e => set('end_time', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes (Optional)</label>
        <textarea className={`${inputCls} resize-none h-16`} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#2E6FDB] hover:bg-blue-700 text-white font-black text-sm py-2.5 rounded-lg transition-all disabled:opacity-60"
      >
        {submitting ? 'Assigning...' : 'Assign Task'}
      </button>
    </form>
  );
}

// ─── Task Details Panel ────────────────────────────────────────────────────────

function TaskDetailsPanel() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-sm">Task Details</h3>
        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Assigning Task</span>
      </div>
      <div className="flex gap-3 mb-3">
        <img
          src="https://www.cat.com/content/dam/catdotcom/en_US/products/new/equipment/off-highway-trucks/off-highway-trucks/1000030109.png"
          alt="Tipper"
          className="w-20 h-16 object-contain bg-gray-50 border border-gray-100 rounded-lg shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="text-[11px] space-y-1 flex-1">
          <div className="flex justify-between"><span className="text-gray-500">Task</span><span className="font-semibold text-gray-800">Sand Transport</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Operator</span><span className="font-semibold text-gray-800">Kumar R. (OP-003)</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="font-semibold text-gray-800">Tipper TN-XX-1234</span></div>
          <div className="flex justify-between"><span className="text-gray-500">From</span><span className="font-semibold text-gray-800">Quarry - Site A</span></div>
          <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-semibold text-gray-800">Site A - Zone B</span></div>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-[11px]">
        {[
          ['Target', '12 trips (216 m³)'],
          ['Priority', '🔴 High'],
          ['Start', '14:00'],
          ['End', '22:00'],
          ['Distance', '12 km (18 mins)'],
          ['Route', 'Route 2'],
        ].map(([k, v]) => (
          <div key={k}><div className="text-gray-400">{k}</div><div className="font-semibold text-gray-700">{v}</div></div>
        ))}
      </div>
      {/* Route elevation placeholder */}
      <div className="mt-3 border border-gray-100 rounded-lg bg-gray-50 p-2">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>Route Elevation</span><span>12 km</span></div>
        <svg viewBox="0 0 200 40" className="w-full h-10">
          <polyline points="0,35 20,30 40,28 60,20 80,22 100,18 120,25 140,22 160,28 180,30 200,35"
            fill="none" stroke="#2E6FDB" strokeWidth="2" strokeLinecap="round" />
          <polygon points="0,35 20,30 40,28 60,20 80,22 100,18 120,25 140,22 160,28 180,30 200,35 200,40 0,40"
            fill="#2E6FDB" opacity="0.1" />
        </svg>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const TaskAssignment: React.FC = () => {
  const navigate = useNavigate();
  const [createdTask, setCreatedTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'Task List' | 'Operators' | 'Machines'>('Task List');
  
  const [machines, setMachines] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const { alerts } = useAlerts();
  
  useEffect(() => {
    Promise.all([api.getMachines(), api.getOperators(), api.getTasks()])
      .then(([m, o, t]) => {
        setMachines(m || []);
        setOperators(o || []);
        setTasks(t || []);
      })
      .catch(e => console.error("Error fetching", e));
  }, []);

  // Compute Task list
  const liveTasks = tasks.map(t => {
    const op = operators.find(o => o.id === t.operator_id);
    const mac = machines.find(m => m.id === t.machine_id);
    return {
      id: t.task_code,
      type: t.task_type,
      operator: op ? `${op.name} (${op.operator_code})` : 'Unassigned',
      vehicle: mac ? `${mac.machine_code}` : 'Unassigned',
      fromTo: `${t.from_location || ''} → ${t.to_location || ''}`,
      target: `${t.target_quantity} ${t.unit}`,
      progress: t.target_quantity > 0 ? Math.min(100, Math.round(((t.completed_quantity || 0) / t.target_quantity) * 100)) : 0,
      status: t.status,
      start: new Date(t.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      end: new Date(t.expected_end_time || t.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
  });

  const taskCompletionByType = ['Transport', 'Excavation', 'Loading', 'Grading', 'Compaction'].map((type, idx) => {
    const typeTasks = tasks.filter(t => t.task_type.includes(type));
    const done = typeTasks.reduce((sum, t) => sum + (t.completed_quantity || 0), 0);
    const total = typeTasks.reduce((sum, t) => sum + (t.target_quantity || 1), 0);
    const colors = ['#F7941E', '#2E6FDB', '#2FA84F', '#9B59B6', '#E23D3D'];
    return { type, done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0, color: colors[idx] };
  }).filter(t => t.total > 0);

  const materialMovement = Array.from(new Set(tasks.map(t => t.material_type).filter(Boolean))).map((mat: any, idx) => {
    const matTasks = tasks.filter(t => t.material_type === mat);
    const done = matTasks.reduce((sum, t) => sum + (t.completed_quantity || 0), 0);
    const colors = ['#F7941E', '#8B5E3C', '#8A8A8A', '#2E6FDB'];
    return { name: mat, value: `${done} m³`, color: colors[idx % 4], pct: Math.min(100, Math.round((done / 5000) * 100)) }; // mock percentage scaling
  });

  const recentActivities = alerts.slice(0, 5).map(a => ({
    time: new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    text: a.message
  }));

  return (
    <div className="space-y-4 text-sm">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-800">Task Assignment</h1>
          <p className="text-xs text-gray-500 mt-0.5">Assign tasks to operators/drivers, set targets, and track progress in real-time.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
            <Eye className="w-3.5 h-3.5" /> View on Map
          </button>
          <button onClick={() => {}} className="flex items-center gap-1.5 px-4 py-2 bg-[#2E6FDB] text-white rounded-lg text-xs font-bold hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Assign New Task
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { icon: <Users className="w-5 h-5 text-blue-600" />, value: 24, label: 'Operators Active', bg: 'bg-blue-50 border-blue-200' },
          { icon: <Truck className="w-5 h-5 text-green-600" />, value: 18, label: 'Machines Active', bg: 'bg-green-50 border-green-200' },
          { icon: <Package className="w-5 h-5 text-orange-500" />, value: 12, label: 'Tasks Assigned Today', bg: 'bg-orange-50 border-orange-200' },
          { icon: <MapPin className="w-5 h-5 text-purple-600" />, value: '2,480 m³', label: 'Total Material Moved', bg: 'bg-purple-50 border-purple-200' },
          { icon: <TrendingUp className="w-5 h-5 text-green-600" />, value: '76%', label: 'Overall Progress', bg: 'bg-green-50 border-green-200' },
          { icon: <AlertTriangle className="w-5 h-5 text-red-500" />, value: 0, label: 'Safety Incidents', bg: 'bg-red-50 border-red-200' },
        ].map((k, i) => (
          <div key={i} className={`border rounded-xl p-3 flex items-center gap-3 ${k.bg}`}>
            {k.icon}
            <div>
              <div className="font-black text-gray-800 text-base leading-none">{k.value}</div>
              <div className="text-[10px] font-semibold text-gray-600 mt-0.5">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Split: Form | Map | Task Details ──────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Form */}
        <div className="col-span-3 overflow-y-auto max-h-[700px] pr-0.5">
          <TaskAssignForm onCreated={setCreatedTask} machines={machines} operators={operators} />
        </div>

        {/* Center: Map */}
        <div className="col-span-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">Site Map &amp; Task Locations</h3>
              <div className="flex gap-1">
                {['Satellite', 'Map', 'Zones', 'Traffic'].map((v, i) => (
                  <button key={v} className={`text-[10px] px-2 py-1 rounded font-semibold border ${i === 0 ? 'bg-[#2E6FDB] text-white border-[#2E6FDB]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{v}</button>
                ))}
              </div>
              <select className="text-[10px] border border-gray-200 rounded-lg px-2 py-1 text-gray-600 ml-2">
                <option>All Tasks</option><option>T-003 (Kumar R.)</option>
              </select>
            </div>
            <LiveMap
              mode="admin"
              activeTaskId={createdTask?.id || 3}
              height="480px"
            />
            {/* Map Legend */}
            <div className="p-3 border-t border-gray-100 flex flex-wrap gap-4 text-[10px] text-gray-600">
              {[
                { color: 'bg-red-500', label: 'Assigned Task' },
                { color: 'bg-blue-500', label: 'In Progress' },
                { color: 'bg-green-500', label: 'Completed' },
                { color: 'bg-yellow-400', label: 'Machine Location' },
                { color: 'border-2 border-dashed border-gray-500 bg-transparent', label: 'Route' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full inline-block ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Task Details */}
        <div className="col-span-3 overflow-y-auto max-h-[700px]">
          <TaskDetailsPanel />
        </div>
      </div>

      {/* ── Task List Table ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {(['Task List', 'Operators', 'Machines'] as const).map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === tab ? 'bg-[#2E6FDB] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >{tab}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-gray-50">
              <option>Today</option><option>Yesterday</option>
            </select>
            <div className="relative">
              <input placeholder="Search tasks..." className="text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-1 focus:outline-none focus:border-[#FFCD11]" />
            </div>
          </div>
        </div>

        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-gray-100">
              {['Task ID', 'Task Type', 'Operator', 'Machine / Vehicle', 'From → To', 'Target', 'Progress', 'Status', 'Start', 'End', 'Actions'].map(h => (
                <th key={h} className="text-left py-2 px-2 text-gray-500 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liveTasks.map((t, i) => (
              <tr key={t.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                <td className="py-2 px-2 font-bold text-blue-600">{t.id}</td>
                <td className="py-2 px-2 text-gray-700">{t.type}</td>
                <td className="py-2 px-2 text-gray-700">{t.operator}</td>
                <td className="py-2 px-2 text-gray-600">{t.vehicle}</td>
                <td className="py-2 px-2 text-gray-600">{t.fromTo}</td>
                <td className="py-2 px-2 font-semibold text-gray-800">{t.target}</td>
                <td className="py-2 px-2 min-w-[100px]">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${t.progress}%`, backgroundColor: PROGRESS_COLOR[t.status] }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 w-7 text-right">{t.progress}%</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status] || 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
                </td>
                <td className="py-2 px-2 text-gray-500">{t.start}</td>
                <td className="py-2 px-2 text-gray-500">{t.end}</td>
                <td className="py-2 px-2">
                  <button className="text-blue-600 text-[10px] font-bold hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bottom Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Task Completion by Type */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Task Completion by Type</h3>
          <div className="space-y-2.5">
            {taskCompletionByType.map(t => (
              <div key={t.type}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-gray-600">{t.type}</span>
                  <span className="font-bold text-gray-800">{t.pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${t.pct}%`, backgroundColor: t.color }} />
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{t.done.toLocaleString()} / {t.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Material Movement */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Material Movement (Today)</h3>
          <div className="space-y-3">
            {materialMovement.map(m => (
              <div key={m.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="font-semibold text-gray-700">{m.name}</span>
                    <span className="text-gray-500">{m.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Recent Activities (Alerts)</h3>
          <div className="space-y-2.5">
            {recentActivities.map((a, i) => (
              <div key={i} className="flex gap-3 text-[11px]">
                <span className="text-gray-400 shrink-0 font-mono">{a.time}</span>
                <span className="text-gray-700">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

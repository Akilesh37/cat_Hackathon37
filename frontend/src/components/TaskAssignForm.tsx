import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { CloudRain, CheckCircle, AlertTriangle, Send, MapPin, Truck } from 'lucide-react';

interface TaskAssignFormProps {
  onTaskCreated?: (task: any) => void;
}

export const TaskAssignForm: React.FC<TaskAssignFormProps> = ({ onTaskCreated }) => {
  const [operators, setOperators] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  const [taskCode, setTaskCode] = useState('T-005');
  const [taskType, setTaskType] = useState('Transport');
  const [operatorId, setOperatorId] = useState<number | ''>('');
  const [machineId, setMachineId] = useState<number | ''>('');
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [materialType, setMaterialType] = useState('Crushed Limestone Base');
  const [fromLocation, setFromLocation] = useState('Quarry Site A');
  const [toLocation, setToLocation] = useState('Zone B - Backfill');
  const [targetQuantity, setTargetQuantity] = useState(15);
  const [unit, setUnit] = useState('trips');
  const [priority, setPriority] = useState('High');

  const [weatherCheck, setWeatherCheck] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.getOperators(),
      api.getMachines(),
      api.getZones(),
      api.checkWeather('Site A')
    ]).then(([ops, macs, zns, wthr]) => {
      setOperators(ops);
      setMachines(macs);
      setZones(zns);
      setWeatherCheck(wthr);

      // Pre-select defaults matching demo Task T-003
      if (ops.length >= 3) setOperatorId(ops[2].id); // Kumar R.
      if (macs.length >= 5) setMachineId(macs[4].id); // Tipper
      if (zns.length >= 2) setZoneId(zns[1].id);     // Zone B
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const payload = {
        task_code: taskCode,
        task_type: taskType,
        operator_id: Number(operatorId) || null,
        machine_id: Number(machineId) || null,
        zone_id: Number(zoneId) || null,
        material_type: materialType,
        from_location: fromLocation,
        to_location: toLocation,
        target_quantity: Number(targetQuantity),
        unit: unit,
        priority: priority,
        route_geojson: [
          [28.6210, 77.2050],
          [28.6190, 77.2070],
          [28.6170, 77.2085],
          [28.6150, 77.2105],
          [28.6130, 77.2125],
          [28.6110, 77.2138]
        ]
      };

      const created = await api.createTask(payload);
      setSuccessMsg(`Task ${created.task_code} assigned and synced to operator device!`);
      if (onTaskCreated) onTaskCreated(created);
    } catch (err: any) {
      alert(`Failed to assign task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cat-gray-200 mb-5">
        <div>
          <h2 className="text-base font-black text-cat-black">Assign Heavy Equipment Task</h2>
          <p className="text-xs text-cat-gray-500 font-medium">Synchronized dispatch to in-cabin and mobile telemetry HUD</p>
        </div>
        <span className="px-2.5 py-1 bg-cat-yellow/20 text-cat-black font-extrabold text-xs rounded-lg border border-cat-yellow/40">
          Single-Source Sync
        </span>
      </div>

      {/* Weather Feasibility Advisory Banner */}
      {weatherCheck && (
        <div className={`p-4 rounded-xl mb-5 flex items-start gap-3 border ${
          weatherCheck.risk_level === 'High'
            ? 'bg-cat-orange/10 border-cat-orange/30 text-cat-black'
            : 'bg-cat-green/10 border-cat-green/30 text-cat-black'
        }`}>
          <div className="p-2 rounded-lg bg-white border border-cat-gray-200 shrink-0">
            <CloudRain className="w-5 h-5 text-cat-orange" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wider text-cat-orange">
                Weather Feasibility: {weatherCheck.risk_level} Risk
              </span>
              <span className="text-[10px] text-cat-gray-500 font-bold">• {weatherCheck.condition} ({weatherCheck.temperature_c}°C)</span>
            </div>
            <p className="mt-1 font-medium text-cat-gray-700">
              {weatherCheck.risk_reason} (Rain Probability: {weatherCheck.precipitation_prob_pct}%).
            </p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-cat-green/15 border border-cat-green/30 text-cat-green rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Task Code */}
        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Task Code</label>
          <input
            type="text"
            value={taskCode}
            onChange={(e) => setTaskCode(e.target.value)}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
            required
          />
        </div>

        {/* Task Type */}
        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Task Type</label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          >
            <option>Transport</option>
            <option>Excavation</option>
            <option>Loading</option>
            <option>Grading</option>
          </select>
        </div>

        {/* Operator Selection */}
        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Assigned Operator</label>
          <select
            value={operatorId}
            onChange={(e) => setOperatorId(Number(e.target.value))}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          >
            <option value="">Select Operator...</option>
            {operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.operator_code} - {op.name} ({op.role})
              </option>
            ))}
          </select>
        </div>

        {/* Machine Selection */}
        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Equipment / Machine</label>
          <select
            value={machineId}
            onChange={(e) => setMachineId(Number(e.target.value))}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          >
            <option value="">Select Machine...</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.machine_code} ({m.model} - {m.type})
              </option>
            ))}
          </select>
        </div>

        {/* Geofence Zone Selection */}
        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Target Geofence Zone</label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(Number(e.target.value))}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          >
            <option value="">Select Zone...</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.zone_code}: {z.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

        {/* From & To Corridor */}
        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Pickup / Origin Point</label>
          <input
            type="text"
            value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          />
        </div>

        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Destination / Drop Point</label>
          <input
            type="text"
            value={toLocation}
            onChange={(e) => setToLocation(e.target.value)}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          />
        </div>

        {/* Target Quantity & Unit */}
        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Target Quantity</label>
          <input
            type="number"
            value={targetQuantity}
            onChange={(e) => setTargetQuantity(Number(e.target.value))}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          />
        </div>

        <div>
          <label className="font-bold text-cat-gray-700 block mb-1">Unit of Measurement</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-cat-yellow"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-cat-yellow hover:bg-yellow-400 text-cat-black font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Dispatching...' : 'Assign Task & Sync Map Route'}
        </button>
      </div>
    </form>
  );
};

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Wrench, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { StatusChip } from '../../components/cat-ui/StatusChip';
import { useTelemetry } from '../../lib/socket';

export const MaintenanceDashboard: React.FC = () => {
  const [machines, setMachines] = useState<any[]>([]);
  const { telemetry } = useTelemetry();

  useEffect(() => {
    api.getMachines().then(setMachines);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Equipment Reliability
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">Predictive Maintenance & Service Cycles</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            Caterpillar Scheduled Oil Sampling (S•O•S) & Engine Hours Tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map((m) => {
          const liveEngineHours = telemetry[m.id]?.engine_hours || m.engine_hours || 0;
          const hoursLeft = Math.max(0, (m.next_maintenance_hours || 2000.0) - liveEngineHours);
          const isDueSoon = hoursLeft < 100;

          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm hover:border-cat-yellow transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-cat-gray-100">
                <div>
                  <h3 className="font-black text-sm text-cat-black">{m.machine_code}</h3>
                  <p className="text-xs text-cat-gray-500">{m.model} • {m.type}</p>
                </div>
                <StatusChip status={m.status} />
              </div>

              <div className="space-y-3 mt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-cat-gray-500 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cat-gray-400" /> Engine Hours
                  </span>
                  <span className="font-black text-cat-black">{liveEngineHours.toFixed(1)}h</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-cat-gray-500 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cat-gray-400" /> Last Serviced
                  </span>
                  <span className="font-bold text-cat-black">{m.last_maintenance_date || '2026-08-01'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-cat-gray-500 font-semibold flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-cat-yellow" /> Service Interval
                  </span>
                  <span className="font-bold text-cat-black">{m.next_maintenance_hours || 2000.0}h</span>
                </div>

                <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200 mt-2">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold text-cat-gray-700">Hours Until Next Service:</span>
                    <span className={`font-black ${isDueSoon ? 'text-cat-red' : 'text-cat-green'}`}>
                      {hoursLeft.toFixed(1)} hrs
                    </span>
                  </div>
                  <div className="w-full bg-cat-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isDueSoon ? 'bg-cat-red' : 'bg-cat-yellow'}`}
                      style={{ width: `${Math.min(100, ((liveEngineHours % 500) / 500) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

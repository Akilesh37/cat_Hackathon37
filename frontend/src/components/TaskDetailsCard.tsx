import React from 'react';
import { Truck, Navigation, CloudRain, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StatusChip } from './cat-ui/StatusChip';
import { ProgressRing } from './cat-ui/ProgressRing';

interface TaskDetailsCardProps {
  task: any;
  onStartTask?: () => void;
  onCompleteTask?: () => void;
  showActions?: boolean;
}

export const TaskDetailsCard: React.FC<TaskDetailsCardProps> = ({
  task,
  onStartTask,
  onCompleteTask,
  showActions = true,
}) => {
  if (!task) return null;

  const progressPct = task.target_quantity > 0
    ? Math.min(100, Math.round((task.completed_quantity / task.target_quantity) * 100))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cat-gray-200 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cat-black rounded-xl text-cat-yellow">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-cat-black">{task.task_code}: {task.task_type}</h3>
              <StatusChip status={task.status} size="sm" />
            </div>
            <p className="text-xs text-cat-gray-500 font-semibold">{task.material_type}</p>
          </div>
        </div>

        <ProgressRing progress={progressPct} size={65} strokeWidth={6} label="DONE" />
      </div>

      {/* Weather Risk Flag Banner */}
      {task.weather_risk_flag && (
        <div className="p-3 bg-cat-orange/10 border border-cat-orange/30 rounded-xl mb-4 text-xs flex items-center gap-2 text-cat-black">
          <CloudRain className="w-4 h-4 text-cat-orange shrink-0" />
          <span className="font-semibold">
            Weather Advisory: High risk of muddy haul conditions. Reduced speed advised on Quarry ➔ Zone B corridor.
          </span>
        </div>
      )}

      {/* Route & Quantity Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200">
          <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Haul Corridor</span>
          <p className="font-black text-cat-black mt-0.5">{task.from_location || 'Quarry'} ➔ {task.to_location || 'Zone B'}</p>
        </div>

        <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200">
          <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Target / Completed</span>
          <p className="font-black text-cat-black mt-0.5">
            {task.completed_quantity} / {task.target_quantity} {task.unit}
          </p>
        </div>

        <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200">
          <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Haul Distance</span>
          <p className="font-black text-cat-black mt-0.5">{task.route_distance_km || 1.85} km</p>
        </div>

        <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200">
          <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Estimated Duration</span>
          <p className="font-black text-cat-blue mt-0.5">{task.route_duration_min || 45} min</p>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          {task.status === 'Pending' && onStartTask && (
            <button
              onClick={onStartTask}
              className="flex-1 bg-cat-yellow hover:bg-yellow-400 text-cat-black font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-4 h-4" /> Start Shift Task
            </button>
          )}

          {task.status === 'In Progress' && onCompleteTask && (
            <button
              onClick={onCompleteTask}
              className="flex-1 bg-cat-green hover:bg-green-600 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete Task & Submit Summary
            </button>
          )}
        </div>
      )}
    </div>
  );
};

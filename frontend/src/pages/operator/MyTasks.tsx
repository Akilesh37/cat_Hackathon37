import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSessionStore } from '../../store/sessionStore';
import { TaskDetailsCard } from '../../components/TaskDetailsCard';
import { Truck } from 'lucide-react';

export const MyTasks: React.FC = () => {
  const { user } = useSessionStore();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await api.getTasks(user?.userId);
        setTasks(res);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [user]);

  const handleStart = async (task: any) => {
    try {
      await api.updateTaskStatus(task.id, 'In Progress');
      navigate('/operator/live');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Work Orders
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">My Assigned Equipment Tasks</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            Synchronized GPS corridor routes and target material volumes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map((task) => (
          <TaskDetailsCard
            key={task.id}
            task={task}
            onStartTask={() => handleStart(task)}
            onCompleteTask={() => navigate(`/operator/summary/${task.id}`)}
          />
        ))}

        {tasks.length === 0 && !loading && (
          <div className="col-span-2 p-12 bg-white rounded-2xl border border-cat-gray-200 text-center">
            <Truck className="w-10 h-10 text-cat-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-cat-gray-500">No active tasks assigned to your operator code.</p>
          </div>
        )}
      </div>
    </div>
  );
};

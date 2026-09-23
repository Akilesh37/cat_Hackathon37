import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAlerts } from '../../lib/socket';
import { AlertBadge } from '../../components/cat-ui/AlertBadge';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export const OperatorAlerts: React.FC = () => {
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const { alerts: liveAlerts } = useAlerts();

  useEffect(() => {
    api.getAlerts().then(setAlertsList);
  }, [liveAlerts]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      setAlertsList(prev => prev.map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Safety Monitoring
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">Active Safety & Operational Alerts</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            Priority Sorted Queue (P1 Proximity/Geofence ➔ P5 Idle)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {alertsList.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
              alert.priority_rank === 1
                ? 'border-cat-red/40 bg-cat-red/5'
                : 'border-cat-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                alert.priority_rank === 1 ? 'bg-cat-red text-white' : 'bg-cat-gray-100 text-cat-black'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertBadge priorityRank={alert.priority_rank} type={alert.alert_type} severity={alert.severity} />
                  <span className="text-[10px] text-cat-gray-500 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="font-extrabold text-xs text-cat-black">{alert.message}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg ${
                alert.status === 'Active' ? 'bg-cat-yellow text-cat-black' : 'bg-cat-gray-100 text-cat-gray-700'
              }`}>
                {alert.status}
              </span>

              {alert.status === 'Active' && (
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="bg-cat-black hover:bg-cat-gray-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

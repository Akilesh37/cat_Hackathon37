import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { AlertTriangle, Clock, History, MapPin, Eye, CheckCircle2 } from 'lucide-react';
import { StatusChip } from '../../components/cat-ui/StatusChip';

export const IncidentCenter: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getIncidents().then((res) => {
      setIncidents(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Compliance & Investigations
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">Incident Center & Forensic Replay</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            Audit-Trail of Safety Breaches, Telemetry Anomalies & GPS Black-Box Playback
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm hover:border-cat-yellow transition-all"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl shrink-0 ${
                  inc.severity === 'High' ? 'bg-cat-red/15 text-cat-red' : 'bg-cat-orange/15 text-cat-orange'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-cat-black">{inc.incident_type}</span>
                    <StatusChip status={inc.status} size="sm" />
                    <span className="text-[10px] text-cat-gray-500 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(inc.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-cat-gray-700 font-medium leading-relaxed max-w-2xl">
                    {inc.description}
                  </p>
                  {inc.resolution_notes && (
                    <p className="text-[11px] text-cat-green font-bold mt-1">
                      Resolution Note: {inc.resolution_notes}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate(`/admin/incidents/${inc.id}/replay`)}
                className="bg-cat-black hover:bg-cat-gray-700 text-cat-yellow font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
              >
                <History className="w-4 h-4" /> Replay GPS & Telemetry
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

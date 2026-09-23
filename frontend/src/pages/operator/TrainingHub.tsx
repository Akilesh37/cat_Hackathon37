import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CheckCircle2, PlayCircle, Clock, Award, ShieldAlert } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { api } from '../../lib/api';

export const TrainingHub: React.FC = () => {
  const { user } = useSessionStore();
  const navigate = useNavigate();

  const [modules, setModules] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTraining() {
      try {
        const [mods, recs] = await Promise.all([
          api.getTrainingModules(),
          user?.userId ? api.getTrainingRecommendations(user.userId) : Promise.resolve([])
        ]);
        setModules(mods);
        setRecommendations(recs);
      } catch (err) {
        console.error('Failed to load training data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTraining();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Safety Certification Portal
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">Operator Training & Knowledge Hub</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            Caterpillar University • Incident Refresher Modules & 5-Question Mastery Quizzes
          </p>
        </div>
      </div>

      {/* Auto-Triggered Safety Recommendations Strip */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-cat-red flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Incident-Triggered Required Refreshers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const mod = modules.find(m => m.id === rec.module_id);
              if (!mod) return null;
              return (
                <div key={rec.id} className="bg-white rounded-2xl border-2 border-cat-yellow p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cat-yellow/30 text-cat-black rounded">
                        Required Refresher
                      </span>
                      <span className="text-xs font-bold text-cat-gray-500">{mod.duration_min} min</span>
                    </div>
                    <h3 className="font-black text-sm text-cat-black">{mod.title}</h3>
                    <p className="text-xs text-cat-gray-500 font-medium mt-1">
                      Triggered automatically by site safety monitoring system.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cat-gray-100 flex items-center justify-between">
                    <span className={`text-xs font-black uppercase ${
                      rec.status === 'Completed' ? 'text-cat-green' : 'text-cat-orange'
                    }`}>
                      Status: {rec.status} {rec.quiz_score ? `(${rec.quiz_score}%)` : ''}
                    </span>

                    <button
                      onClick={() => navigate(`/operator/quiz/${rec.id}`)}
                      className="bg-cat-black hover:bg-cat-gray-700 text-cat-yellow font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      {rec.status === 'Completed' ? 'Review Quiz' : 'Take 5-Question Quiz'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Module Catalog */}
      <div>
        <h2 className="text-xs font-black uppercase text-cat-black mb-3">All Safety & Operational Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cat-gray-50 border border-cat-gray-200 flex items-center justify-center text-cat-yellow mb-3">
                  <GraduationCap className="w-6 h-6 text-cat-black" />
                </div>
                <span className="text-[10px] font-extrabold uppercase text-cat-gray-500">{m.category}</span>
                <h3 className="font-black text-sm text-cat-black mt-0.5">{m.title}</h3>
                <p className="text-xs text-cat-gray-500 mt-1">Includes video lesson & 5-question mastery quiz.</p>
              </div>

              <div className="mt-4 pt-3 border-t border-cat-gray-100 flex items-center justify-between">
                <span className="text-xs text-cat-gray-500 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {m.duration_min} min
                </span>
                <button
                  onClick={() => alert(`Starting video walkthrough for "${m.title}"...`)}
                  className="p-2 text-cat-black hover:text-cat-yellow transition-colors"
                  title="Watch Video"
                >
                  <PlayCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

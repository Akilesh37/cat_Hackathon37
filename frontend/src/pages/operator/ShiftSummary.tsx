import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScoreBreakdown } from '../../components/ScoreBreakdown';
import { api } from '../../lib/api';
import { useSessionStore } from '../../store/sessionStore';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ShiftSummary: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useSessionStore();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const opId = user?.userId || 1;
        const tId = Number(taskId) || 3;
        const res = await api.getShiftSummary(opId, tId);
        setSummary(res);
      } catch (err) {
        console.error('Failed to load shift summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [taskId, user]);

  if (loading) {
    return <div className="p-8 text-center text-xs font-bold text-cat-gray-500">Generating Shift Audit & Scorecard...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-4">
      <button
        onClick={() => navigate('/operator/dashboard')}
        className="flex items-center gap-1.5 text-xs font-bold text-cat-gray-700 hover:text-cat-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shift Dashboard
      </button>

      {summary && (
        <ScoreBreakdown
          score={summary.score_out_of_100}
          reasoning={summary.score_reasoning || []}
          operatorName={summary.operator_name}
          taskCode={summary.task_code}
          expectedMin={summary.expected_time_min}
          actualMin={summary.actual_time_min}
        />
      )}
    </div>
  );
};

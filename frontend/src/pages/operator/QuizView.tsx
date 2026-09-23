import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizRunner } from '../../components/QuizRunner';
import { api } from '../../lib/api';
import { ArrowLeft } from 'lucide-react';

export const QuizView: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const idNum = Number(assignmentId);
        // Find assignment from modules
        const mods = await api.getTrainingModules();
        // Default to module 1 (Seatbelt) or 2 (Proximity)
        const targetMod = mods.find(m => m.id === idNum) || mods[0];
        setModule(targetMod);
      } catch (err) {
        console.error('Error loading quiz:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [assignmentId]);

  if (loading) {
    return <div className="p-8 text-center text-xs font-bold text-cat-gray-500">Loading safety quiz...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-4">
      <button
        onClick={() => navigate('/operator/training')}
        className="flex items-center gap-1.5 text-xs font-bold text-cat-gray-700 hover:text-cat-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Training Catalog
      </button>

      {module && (
        <QuizRunner
          assignmentId={Number(assignmentId) || 1}
          moduleTitle={module.title}
          questions={module.quiz_data || []}
          onCompleted={() => {
            // Completed
          }}
        />
      )}
    </div>
  );
};

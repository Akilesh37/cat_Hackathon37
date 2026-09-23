import React, { useState } from 'react';
import { api } from '../lib/api';
import { CheckCircle2, XCircle, Award, HelpCircle } from 'lucide-react';

interface QuizRunnerProps {
  assignmentId: number;
  moduleTitle: string;
  questions: Array<{
    q: string;
    options: string[];
    correct_answer_index?: number;
  }>;
  onCompleted?: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  assignmentId,
  moduleTitle,
  questions,
  onCompleted
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (questionIdx: number, optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const answersArray = questions.map((_, i) => selectedAnswers[i] ?? -1);
      const res = await api.submitQuiz(assignmentId, answersArray);
      setResult(res);
      if (onCompleted) onCompleted();
    } catch (err: any) {
      alert(`Quiz submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = questions.length > 0 && Object.keys(selectedAnswers).length === questions.length;

  return (
    <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cat-gray-200 mb-5">
        <div>
          <h3 className="font-black text-sm text-cat-black">Safety Compliance Knowledge Check</h3>
          <p className="text-xs text-cat-gray-500 font-semibold">{moduleTitle} • 5 Questions (80% Required to Pass)</p>
        </div>
        <span className="px-2.5 py-1 bg-cat-yellow/20 text-cat-black font-extrabold text-[10px] rounded-lg">
          OSHA CERTIFICATION
        </span>
      </div>

      {result ? (
        <div className="p-6 text-center bg-cat-gray-50 rounded-2xl border border-cat-gray-200">
          <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${
            result.passed ? 'bg-cat-green text-white' : 'bg-cat-red text-white'
          }`}>
            {result.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <h4 className="text-base font-black text-cat-black">
            {result.passed ? 'Certification Assessment Passed!' : 'Assessment Incomplete'}
          </h4>
          <p className="text-xs text-cat-gray-500 font-semibold mt-1">
            Score: <span className="text-cat-black font-black">{result.score_pct}%</span>
          </p>

          <p className="text-xs text-cat-gray-700 mt-3 max-w-md mx-auto">
            {result.passed
              ? 'Your operator safety certification record has been renewed in Caterpillar Safety Systems.'
              : 'Please review the training manual material and retake the quiz to clear the safety flag.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((qObj, qIdx) => (
            <div key={qIdx} className="p-4 bg-cat-gray-50 rounded-xl border border-cat-gray-200">
              <p className="font-black text-xs text-cat-black mb-3 flex items-start gap-2">
                <span className="w-5 h-5 bg-cat-black text-cat-yellow rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">
                  {qIdx + 1}
                </span>
                {qObj.q}
              </p>

              <div className="space-y-2">
                {qObj.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[qIdx] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-cat-yellow/30 border-cat-yellow text-cat-black shadow-sm'
                          : 'bg-white border-cat-gray-200 text-cat-gray-700 hover:bg-cat-gray-100'
                      }`}
                    >
                      <span>{option}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-cat-black bg-cat-black' : 'border-cat-gray-300'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cat-yellow" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="w-full bg-cat-yellow hover:bg-yellow-400 disabled:opacity-50 text-cat-black font-black text-xs py-3.5 rounded-xl transition-all shadow-sm uppercase tracking-wider cursor-pointer"
          >
            {isSubmitting ? 'Evaluating Quiz...' : 'Submit Answers & Finalize Certification'}
          </button>
        </div>
      )}
    </div>
  );
};

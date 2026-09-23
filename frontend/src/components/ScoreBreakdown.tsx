import React from 'react';
import { Award, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface ScoreBreakdownProps {
  score: number;
  reasoning: string[];
  operatorName: string;
  taskCode: string;
  expectedMin: number;
  actualMin: number;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  score,
  reasoning,
  operatorName,
  taskCode,
  expectedMin,
  actualMin
}) => {
  let scoreBadgeColor = 'bg-cat-green text-white';
  let ratingLabel = 'Excellent Performance';

  if (score < 75) {
    scoreBadgeColor = 'bg-cat-red text-white';
    ratingLabel = 'Safety Review Required';
  } else if (score < 88) {
    scoreBadgeColor = 'bg-cat-yellow text-cat-black';
    ratingLabel = 'Acceptable Performance';
  }

  return (
    <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cat-gray-200 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cat-black rounded-xl text-cat-yellow">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-cat-black">End-of-Shift Performance Scorecard</h3>
            <p className="text-xs text-cat-gray-500 font-semibold">{operatorName} • Task {taskCode}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${scoreBadgeColor}`}>
            {score} / 100
          </span>
          <p className="text-[10px] text-cat-gray-500 font-bold mt-1">{ratingLabel}</p>
        </div>
      </div>

      {/* Primary Metrics Strip */}
      <div className="grid grid-cols-3 gap-3 mb-5 text-xs">
        <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200">
          <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Target Time</span>
          <p className="text-base font-black text-cat-black mt-0.5">{expectedMin} min</p>
        </div>
        <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200">
          <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Actual Duration</span>
          <p className="text-base font-black text-cat-black mt-0.5">{actualMin} min</p>
        </div>
        <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200">
          <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Audit Result</span>
          <p className="text-base font-black text-cat-green mt-0.5">{score >= 80 ? 'APPROVED' : 'FLAGGED'}</p>
        </div>
      </div>

      {/* Itemized Reasoning Deductions */}
      <div>
        <h4 className="text-xs font-black uppercase text-cat-black mb-3">Itemized Scoring Reasoning</h4>
        <div className="space-y-2">
          {reasoning.map((item, idx) => {
            const isDeduction = item.includes('Deduction') || item.includes('Violations') || item.includes('Excess') || item.includes('-');
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isDeduction
                    ? 'bg-cat-red/5 border-cat-red/20 text-cat-black'
                    : 'bg-cat-green/5 border-cat-green/20 text-cat-black'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isDeduction ? (
                    <AlertTriangle className="w-4 h-4 text-cat-red shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-cat-green shrink-0" />
                  )}
                  <span className="font-semibold">{item}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

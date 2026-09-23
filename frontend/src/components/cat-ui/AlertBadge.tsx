import React from 'react';

interface AlertBadgeProps {
  priorityRank: number; // 1 to 5
  type: string;
  severity?: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ priorityRank, type, severity }) => {
  const isP1 = priorityRank === 1;
  const isP2 = priorityRank === 2;

  let bgClass = 'bg-cat-gray-200 text-cat-gray-700';
  if (isP1 || severity === 'Critical') {
    bgClass = 'bg-cat-red text-white animate-pulse';
  } else if (isP2 || severity === 'Warning') {
    bgClass = 'bg-cat-orange text-white';
  } else if (priorityRank === 3) {
    bgClass = 'bg-cat-yellow text-cat-black';
  } else {
    bgClass = 'bg-cat-blue text-white';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${bgClass}`}>
      <span>P{priorityRank}</span>
      <span>•</span>
      <span>{type}</span>
    </span>
  );
};

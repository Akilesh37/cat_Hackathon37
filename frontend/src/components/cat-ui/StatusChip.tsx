import React from 'react';

interface StatusChipProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md' }) => {
  const s = status.toLowerCase();

  let colorClasses = 'bg-cat-gray-200 text-cat-gray-700 border-cat-gray-200';
  let dotColor = 'bg-cat-gray-500';

  if (s === 'running' || s === 'in progress' || s === 'active' || s === 'completed' || s === 'normal') {
    colorClasses = 'bg-cat-green/10 text-cat-green border-cat-green/20';
    dotColor = 'bg-cat-green';
  } else if (s === 'idle' || s === 'pending') {
    colorClasses = 'bg-cat-yellow/20 text-cat-black border-cat-yellow/40';
    dotColor = 'bg-cat-yellow';
  } else if (s === 'maintenance' || s === 'warning' || s === 'under review') {
    colorClasses = 'bg-cat-orange/15 text-cat-orange border-cat-orange/30';
    dotColor = 'bg-cat-orange';
  } else if (s === 'breakdown' || s === 'critical' || s === 'blocked' || s === 'breached') {
    colorClasses = 'bg-cat-red/15 text-cat-red border-cat-red/30';
    dotColor = 'bg-cat-red';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-lg border ${colorClasses} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};

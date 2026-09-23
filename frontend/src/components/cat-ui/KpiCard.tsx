import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  accentColor?: 'yellow' | 'green' | 'orange' | 'red' | 'blue';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'yellow',
  onClick,
}) => {
  const accentClasses = {
    yellow: 'bg-cat-yellow/15 text-cat-black border-cat-yellow/40',
    green: 'bg-cat-green/15 text-cat-green border-cat-green/30',
    orange: 'bg-cat-orange/15 text-cat-orange border-cat-orange/30',
    red: 'bg-cat-red/15 text-cat-red border-cat-red/30',
    blue: 'bg-cat-blue/15 text-cat-blue border-cat-blue/30',
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-cat-yellow' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-cat-gray-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl border ${accentClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-black text-cat-black tracking-tight">{value}</span>
          {subtitle && <p className="text-xs text-cat-gray-500 font-medium mt-0.5">{subtitle}</p>}
        </div>

        {trend && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              trend.positive
                ? 'bg-cat-green/10 text-cat-green'
                : 'bg-cat-red/10 text-cat-red'
            }`}
          >
            {trend.positive ? '+' : ''}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};

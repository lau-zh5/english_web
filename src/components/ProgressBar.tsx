import { ReactNode } from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  icon: ReactNode;
  color?: 'blue' | 'amber' | 'green';
}

export function ProgressBar({ value, max, label, icon, color = 'blue' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    blue: 'from-blue-400 to-blue-600',
    amber: 'from-amber-400 to-amber-600',
    green: 'from-green-400 to-green-600',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-medium text-gray-900">
            {value}/{max}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

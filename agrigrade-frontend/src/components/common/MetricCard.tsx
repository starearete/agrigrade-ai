import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
}) => {
  return (
    <div className="bg-white border border-[#C5E6CC] rounded-2xl p-5 shadow-xs hover:border-[#2E7D32] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#526158]">{title}</span>
        <div className="w-10 h-10 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-[#17201A] mb-1">{value}</div>
      {(change || subtitle) && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {change && (
            <span className={isPositive ? 'text-[#2E7D32]' : 'text-[#B3261E]'}>
              {isPositive ? '↑' : '↓'} {change}
            </span>
          )}
          {subtitle && <span className="text-[#526158]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

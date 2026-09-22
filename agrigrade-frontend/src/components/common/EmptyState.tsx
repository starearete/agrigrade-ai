import React from 'react';
import { PackageX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="w-full py-12 px-6 flex flex-col items-center justify-center text-center bg-white border border-[#C5E6CC] rounded-2xl shadow-xs">
      <div className="w-14 h-14 bg-[#EEF8F0] text-[#2E7D32] rounded-full flex items-center justify-center mb-4">
        {icon || <PackageX className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-[#1B5E20] mb-1">{title}</h3>
      <p className="text-sm text-[#526158] max-w-md mb-6">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-[#2E7D32] text-white text-sm font-semibold rounded-xl hover:bg-[#1B5E20] transition-colors shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

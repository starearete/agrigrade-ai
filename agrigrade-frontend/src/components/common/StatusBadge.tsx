import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (st: string) => {
    const formatted = st.toUpperCase();
    if (['ACTIVE', 'GRADE_A_PREMIUM', 'COMPLETED', 'ACCEPTED', 'ISSUED', 'VERIFIED', 'AI_VERIFIED'].includes(formatted)) {
      return 'bg-[#EEF8F0] text-[#1B5E20] border-[#C5E6CC] font-extrabold';
    }
    if (['AI_GRADED', 'GRADE_B_STANDARD', 'LISTED', 'IN_TRANSIT', 'PROCESSING', 'NEGOTIATING', 'READY_FOR_AI'].includes(formatted)) {
      return 'bg-[#F4FAF4] text-[#2E7D32] border-[#C5E6CC] font-bold';
    }
    if (['PENDING', 'PENDING_AI', 'GRADE_C_COMMERCIAL', 'EXPIRING_SOON', 'UNVERIFIED', 'COUNTERED', 'LOW_CONFIDENCE'].includes(formatted)) {
      return 'bg-amber-50 text-[#A66A00] border-amber-200 font-bold';
    }
    if (['REJECTED', 'EXPIRED', 'CANCELLED', 'CROP_MISMATCH', 'SUSPENDED', 'DEACTIVATED', 'FAILED', 'AI_FAILED'].includes(formatted)) {
      return 'bg-red-50 text-[#B3261E] border-red-200 font-bold';
    }
    return 'bg-gray-50 text-[#526158] border-gray-200 font-medium';
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full border uppercase tracking-wider ${sizeClass} ${getBadgeStyle(status)}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

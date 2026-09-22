import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  height?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading agricultural data...',
  height = 'h-64',
}) => {
  return (
    <div className={`w-full ${height} flex flex-col items-center justify-center text-center p-6 bg-white border border-[#C5E6CC] rounded-2xl shadow-xs`}>
      <Loader2 className="w-8 h-8 text-[#2E7D32] animate-spin mb-3" />
      <p className="text-sm font-medium text-[#526158]">{message}</p>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, RefreshCw, Upload } from 'lucide-react';

interface LowConfidenceCardProps {
  confidence: number;
  reason?: string;
  onRetry: () => void;
  onUploadBetter: () => void;
}

export const LowConfidenceCard: React.FC<LowConfidenceCardProps> = ({
  confidence,
  reason,
  onRetry,
  onUploadBetter,
}) => {
  return (
    <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm text-center max-w-lg mx-auto animate-fade-in">
      <div className="w-16 h-16 bg-amber-50 text-[#A66A00] rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 bg-amber-100 text-[#A66A00] text-xs font-bold rounded-full inline-block mb-3">
        Insufficient AI Confidence ({confidence}%)
      </span>

      <h3 className="text-xl font-extrabold text-[#17201A] mb-2">
        AI Confidence Below Threshold
      </h3>

      <p className="text-sm text-[#526158] mb-6 leading-relaxed">
        {reason ||
          'AI vision confidence is insufficient for a reliable quality grade. Please ensure proper lighting and sharp focus.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          className="flex-1 px-4 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
        >
          <RefreshCw className="w-4 h-4" /> Retry Analysis
        </button>
        <button
          onClick={onUploadBetter}
          className="flex-1 px-4 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl hover:bg-[#F4FAF4] transition-colors flex items-center justify-center gap-2 text-xs"
        >
          <Upload className="w-4 h-4" /> Upload Sharper Photo
        </button>
      </div>
    </div>
  );
};

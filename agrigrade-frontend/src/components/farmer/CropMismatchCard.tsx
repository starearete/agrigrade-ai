import React from 'react';
import { AlertOctagon, RefreshCw, Layers, Upload } from 'lucide-react';

interface CropMismatchCardProps {
  selectedCrop: string;
  detectedCrop?: string;
  rejectionReason?: string;
  onRetry: () => void;
  onChangeCrop: () => void;
  onReupload: () => void;
}

export const CropMismatchCard: React.FC<CropMismatchCardProps> = ({
  selectedCrop,
  detectedCrop = 'Tomato',
  rejectionReason,
  onRetry,
  onChangeCrop,
  onReupload,
}) => {
  return (
    <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm text-center max-w-lg mx-auto animate-fade-in">
      <div className="w-16 h-16 bg-red-50 text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
        <AlertOctagon className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 bg-red-100 text-[#B3261E] text-xs font-bold rounded-full inline-block mb-3">
        Crop Evidence Mismatch Detected
      </span>

      <h3 className="text-xl font-extrabold text-[#17201A] mb-2">
        Grading Halted – Evidence Mismatch
      </h3>

      <p className="text-sm text-[#526158] mb-4 leading-relaxed">
        {rejectionReason ||
          `The uploaded sample evidence appears to be a ${detectedCrop} sample, but your selected batch crop is ${selectedCrop}.`}
      </p>

      <div className="bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl p-3 mb-6 text-xs text-left grid grid-cols-2 gap-2">
        <div>
          <span className="text-[#526158] block">Selected Crop:</span>
          <span className="font-bold text-[#17201A]">{selectedCrop}</span>
        </div>
        <div>
          <span className="text-[#526158] block">AI Detected Evidence:</span>
          <span className="font-bold text-[#B3261E]">{detectedCrop || 'Non-matching Crop'}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={onRetry}
          className="flex-1 px-4 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
        >
          <RefreshCw className="w-4 h-4" /> Retry Scan
        </button>
        <button
          onClick={onChangeCrop}
          className="flex-1 px-4 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl hover:bg-[#F4FAF4] transition-colors flex items-center justify-center gap-2 text-xs"
        >
          <Layers className="w-4 h-4" /> Change Crop
        </button>
        <button
          onClick={onReupload}
          className="flex-1 px-4 py-2.5 bg-white border border-[#C5E6CC] text-[#526158] font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-xs"
        >
          <Upload className="w-4 h-4" /> Re-upload
        </button>
      </div>
    </div>
  );
};

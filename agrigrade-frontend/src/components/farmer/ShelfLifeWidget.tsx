import React from 'react';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { formatRemainingShelfLife } from '../../utils/formatters';

interface ShelfLifeWidgetProps {
  harvestDate: string;
  inspectionDate: string;
  cropAgeDays: number;
  remainingDays: number;
  confidence: number;
}

export const ShelfLifeWidget: React.FC<ShelfLifeWidgetProps> = ({
  harvestDate,
  inspectionDate,
  cropAgeDays,
  remainingDays,
  confidence,
}) => {
  return (
    <div className="bg-white border border-[#C5E6CC] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#1B5E20]">Shelf-Life & Freshness Engine</h4>
            <p className="text-[11px] text-[#526158]">AI Dynamic Predictive Model</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] text-xs font-bold rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" /> {confidence}% Confidence
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
        <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
          <span className="text-[#526158] block text-[11px]">Harvest Date</span>
          <span className="font-bold text-[#17201A]">{harvestDate}</span>
        </div>
        <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
          <span className="text-[#526158] block text-[11px]">Inspection Date</span>
          <span className="font-bold text-[#17201A]">{inspectionDate}</span>
        </div>
        <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-xl">
          <span className="text-[#526158] block text-[11px]">Dynamic Crop Age</span>
          <span className="font-extrabold text-[#1B5E20]">{cropAgeDays} {cropAgeDays === 1 ? 'day' : 'days'}</span>
        </div>
        <div className={`p-3 rounded-xl border ${remainingDays <= 0 ? 'bg-red-50 border-red-200' : 'bg-[#F4FAF4] border-[#C5E6CC]'}`}>
          <span className="text-[#526158] block text-[11px]">Estimated Remaining</span>
          <span className={`font-extrabold ${remainingDays <= 0 ? 'text-red-700' : 'text-[#2E7D32]'}`}>{formatRemainingShelfLife(remainingDays)}</span>
        </div>
      </div>

      {/* Freshness Bar */}
      <div>
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-[#526158]">Freshness Index</span>
          <span className={remainingDays <= 0 ? 'text-red-700 font-extrabold' : 'text-[#1B5E20]'}>
            {remainingDays <= 0 ? '0% (Expired / Non-Marketable)' : `${Math.max(10, Math.round(100 - cropAgeDays * 10))}% Optimal`}
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-[#C5E6CC]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${remainingDays <= 0 ? 'bg-red-500' : 'bg-gradient-to-r from-[#2E7D32] via-emerald-500 to-amber-500'}`}
            style={{ width: `${remainingDays <= 0 ? 100 : Math.max(10, Math.min(100, 100 - cropAgeDays * 10))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

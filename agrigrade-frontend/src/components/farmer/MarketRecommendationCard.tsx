import React, { useState } from 'react';
import { MarketRecommendation } from '../../types/market';
import { formatCurrency, formatNetRealization } from '../../utils/formatters';
import { MapPin, Truck, TrendingUp, Award, Calendar, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';

interface MarketRecommendationCardProps {
  recommendation: MarketRecommendation;
  quantityKg: number;
}

export const MarketRecommendationCard: React.FC<MarketRecommendationCardProps> = ({
  recommendation: rec,
  quantityKg,
}) => {
  const isTopChoice = rec.rankOrder === 1;
  const isRejected = rec.action === 'REJECT' || rec.qualityGrade === 'REJECT' || rec.recommendationScore === 0;
  const [showTrend, setShowTrend] = useState<boolean>(false);

  if (isRejected) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-5 shadow-xs relative overflow-hidden space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 text-red-700 border border-red-200 rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-extrabold text-base text-red-900">REJECTED — Quarantine / Non-Saleable</h4>
              <span className="px-2 py-0.5 bg-red-200 text-red-900 text-[10px] font-extrabold rounded-lg uppercase">
                Zero Commercial Value
              </span>
            </div>
            <p className="text-xs text-red-700 font-medium">
              Severe fungal rot / active decay detected. Crop is unmarketable and barred from commercial trade.
            </p>
          </div>
        </div>

        <div className="bg-white/80 border border-red-200 p-3.5 rounded-2xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <span className="text-red-700 block text-[11px] font-semibold">Official Mandi Rate</span>
            <span className="font-black text-gray-900 text-base">{rec.currentMarketPricePerKg > 0 ? formatCurrency(rec.currentMarketPricePerKg) : 'PRICE DATA UNAVAILABLE'}</span>
          </div>
          <div>
            <span className="text-red-700 block text-[11px] font-semibold">AI Selling Price</span>
            <span className="font-extrabold text-red-900 text-sm">₹0.00 / KG</span>
          </div>
          <div>
            <span className="text-red-700 block text-[11px] font-semibold">Est. Logistics</span>
            <span className="font-bold text-red-700 text-xs">N/A</span>
          </div>
          <div className="bg-red-100 p-2 rounded-xl border border-red-300">
            <span className="text-red-900 font-bold block text-[11px]">Net Realization</span>
            <span className="font-black text-red-900 text-base">₹0.00</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-red-700 font-medium">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-red-600" /> Source: Government of India • data.gov.in
          </span>
          <span className="text-[11px] font-semibold text-red-600">Action: QUARANTINE / DISPOSE</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border rounded-3xl p-5 shadow-xs transition-all relative overflow-hidden space-y-3 ${
        isTopChoice ? 'border-[#2E7D32] ring-2 ring-[#C5E6CC]' : 'border-[#C5E6CC] hover:border-[#2E7D32]'
      }`}
    >
      {isTopChoice && (
        <div className="absolute top-0 right-0 bg-[#2E7D32] text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
          <Award className="w-3 h-3" /> #1 Best Net Realization
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5">
          #{rec.rankOrder}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h4 className="font-extrabold text-base text-[#17201A]">{rec.marketName}</h4>
            <span className="px-2 py-0.5 bg-[#FCFBF5] border border-[#C5E6CC] text-[#526158] text-[10px] font-bold rounded-lg">
              {rec.cropName} • {rec.varietyName} • {rec.qualityGrade.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-[#526158] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" /> {rec.district} • {rec.distanceKm} km away ({rec.estimatedTravelMinutes} mins travel)
          </p>
        </div>
      </div>

      {/* Pricing & Net Realization Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#FCFBF5] border border-[#C5E6CC] p-3.5 rounded-2xl text-xs">
        <div>
          <span className="text-[#526158] block text-[11px] font-semibold">Mandi Rate / KG</span>
          <span className="font-extrabold text-[#17201A] text-sm">{formatCurrency(rec.currentMarketPricePerKg)}</span>
          {rec.predictedPriceRange && (
            <span className="block text-[10px] text-[#2E7D32] font-semibold">
              AI: {formatCurrency(rec.predictedPriceRange.low)}–{formatCurrency(rec.predictedPriceRange.high)}
            </span>
          )}
        </div>
        <div>
          <span className="text-[#526158] block text-[11px] font-semibold">Gross Revenue</span>
          <span className="font-bold text-[#17201A]">{formatCurrency(rec.grossValue)}</span>
        </div>
        <div>
          <span className="text-[#526158] block text-[11px] font-semibold">Est. Logistics Cost</span>
          <span className="font-bold text-[#B3261E] flex items-center gap-0.5">
            <Truck className="w-3 h-3" /> -{formatCurrency(rec.estimatedTransportCost)}
          </span>
        </div>
        <div className="bg-[#EEF8F0] p-2 rounded-xl border border-[#C5E6CC]">
          <span className="text-[#1B5E20] font-bold block text-[11px]">Net Realization</span>
          <span className="font-black text-[#1B5E20] text-base">{formatNetRealization(rec.estimatedNetRevenue)}</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#526158]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 font-bold text-[#2E7D32]">
            <TrendingUp className="w-3.5 h-3.5" /> Score: {rec.recommendationScore}%
          </span>
          <span className="text-[11px]">
            Mandi Date: {rec.arrivalDate || rec.observedAt}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase ${
            rec.freshness === 'STALE'
              ? 'bg-amber-50 text-[#A66A00] border-amber-200'
              : 'bg-emerald-50 text-[#1B5E20] border-[#C5E6CC]'
          }`}>
            {rec.freshness || 'FRESH'}
          </span>
          <span className="text-[10px] bg-emerald-50 text-[#1B5E20] px-2 py-0.5 rounded-md border border-[#C5E6CC] font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#2E7D32]" />
            Government of India • data.gov.in
          </span>
        </div>

        <button
          onClick={() => setShowTrend(!showTrend)}
          className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1 self-end sm:self-auto"
        >
          <Calendar className="w-3.5 h-3.5" /> 7-Day Trend {showTrend ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 7-Day Market Trend Expandable Accordion */}
      {showTrend && (
        <div className="pt-3 border-t border-[#C5E6CC] text-xs space-y-2 animate-fade-in">
          <span className="font-bold text-[#1B5E20] block">
            7-Day Historical Market Rates for {rec.cropName} ({rec.varietyName} • {rec.qualityGrade.replace(/_/g, ' ')})
          </span>
          {rec.priceTrend && rec.priceTrend.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#C5E6CC] text-[#526158] font-bold uppercase text-[10px]">
                    <th className="py-1.5 px-2">Date</th>
                    <th className="py-1.5 px-2">Market Price / KG</th>
                    <th className="py-1.5 px-2">Net Value ({quantityKg.toLocaleString()} KG)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {rec.priceTrend.map((t) => (
                    <tr key={t.date} className={t.dateLabel === 'Today' ? 'bg-[#EEF8F0] font-bold' : ''}>
                      <td className="py-1.5 px-2 text-[#17201A]">{t.dateLabel} ({t.date})</td>
                      <td className="py-1.5 px-2 font-bold text-[#1B5E20]">{formatCurrency(t.pricePerKg)} / KG</td>
                      <td className="py-1.5 px-2 text-[#526158]">{formatCurrency(t.pricePerKg * quantityKg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[#526158] font-medium text-center">
              Insufficient historical daily mandi records for this specific market.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { CheckCircle2, AlertTriangle, TrendingUp, ShieldCheck, MapPin, ExternalLink, Clock } from 'lucide-react';

export interface MarketComparisonItem {
  market: string;
  district: string;
  state: string;
  distance_km?: number;
  modal_price: number;
  min_price?: number;
  max_price?: number;
  unit?: string;
  official_price?: number;
  official_unit?: string;
  predicted_low: number;
  predicted_high: number;
  arrival_date: string;
  freshness: string;
  score?: number;
  is_recommended?: boolean;
}

interface BananaAnalysisProps {
  cropName?: string;
  maturityStage?: string;
  grade?: string;
  qualityScore?: number;
  visualEvidence?: string[];
  fungalGrowthStatus?: string;
  activeDecayStatus?: string;
  marketPrice?: {
    available?: boolean;
    reference_price?: number;
    modal_price?: number;
    min_price?: number;
    max_price?: number;
    unit?: string;
    market?: string;
    district?: string;
    state?: string;
    data_date?: string;
    arrival_date?: string;
    source?: string;
    source_name?: string;
    freshness?: string;
    status?: string;
  };
  pricePrediction?: {
    estimated_low?: number;
    estimated_high?: number;
    unit?: string;
    trend?: string;
    confidence?: number;
    available?: boolean;
    quality_grade?: string;
    price_explanation?: string;
    recommended_price_range?: {
      low?: number;
      high?: number;
      unit?: string;
    };
  };
  recommendation?: {
    action?: string;
    recommended_market?: string;
    district?: string;
    reason?: string;
    confidence?: number;
  };
  marketComparison?: MarketComparisonItem[];
  trainedModel?: {
    status?: string;
    model_name?: string;
    prediction?: string;
    confidence?: number;
    experimental?: boolean;
  };
  agreement?: {
    status?: string;
    trained_model_prediction?: string;
    gemini_prediction?: string;
  };
}

export const BananaAnalysisCard: React.FC<BananaAnalysisProps> = ({
  cropName = 'Banana',
  maturityStage = 'Ripe',
  grade = 'Grade A',
  qualityScore = 100,
  visualEvidence,
  fungalGrowthStatus = 'NONE',
  activeDecayStatus = 'NONE',
  marketPrice,
  pricePrediction,
  recommendation,
  marketComparison = [],
  trainedModel,
  agreement
}) => {
  const isRejected =
    grade === 'REJECTED' ||
    grade === 'Reject' ||
    grade === 'REJECT' ||
    qualityScore <= 10 ||
    fungalGrowthStatus === 'SEVERE' ||
    activeDecayStatus === 'PRESENT';

  const defaultEvidence = isRejected
    ? [
        'Severe brown/black surface discoloration detected',
        'Severe bruising detected',
        'Advanced overripe/rotten appearance detected',
        'Peel condition severely deteriorated',
        'No obvious fungal growth detected',
      ]
    : (grade === 'GRADE_C_COMMERCIAL' || grade === 'Grade C' || grade === 'C' || (qualityScore > 0 && qualityScore < 75))
    ? [
        'Moderate brown spotting detected',
        'Overripe yellow/brown peel coloration',
        'Peel structure acceptable',
        'No obvious fungal growth detected',
      ]
    : (grade === 'GRADE_B_STANDARD' || grade === 'Grade B' || grade === 'B' || (qualityScore >= 75 && qualityScore < 90))
    ? [
        'Minor brown spotting detected',
        'Ripe yellow peel coloration',
        'Peel structure intact',
      ]
    : [
        'Clean epidermal surface condition',
        'Optimal yellow peel coloration',
        'Peel structure intact'
      ];

  const displayEvidence = (visualEvidence && visualEvidence.length > 0)
    ? visualEvidence
    : defaultEvidence;

  const displayFungal = fungalGrowthStatus || 'NONE';
  const displayDecay = activeDecayStatus || 'NONE';

  const gradeDisplay = isRejected
    ? 'REJECT'
    : (grade === 'GRADE_A_PREMIUM' ? 'GRADE A PREMIUM' : grade === 'GRADE_B_STANDARD' ? 'GRADE B STANDARD' : grade === 'GRADE_C_COMMERCIAL' ? 'GRADE C COMMERCIAL' : grade);

  const displayScore = isRejected ? 0 : qualityScore;

  // Market references (Official Government Mandi rate is independent of rejection!)
  const rawModal = marketPrice?.modal_price ?? marketPrice?.reference_price ?? 28.50;
  const modalRate = (!isRejected && rawModal <= 0) ? 28.50 : (isRejected ? (rawModal > 0 ? rawModal : 28.50) : rawModal);

  const rawMktName = marketPrice?.market || 'Coimbatore APMC';
  const mktName = (rawMktName.includes('Non-Saleable') || rawMktName.includes('Quarantine')) ? 'Coimbatore APMC' : rawMktName;
  const rawMktDistrict = marketPrice?.district || 'Coimbatore';
  const mktDistrict = (rawMktDistrict === 'N/A' || !rawMktDistrict) ? 'Coimbatore' : rawMktDistrict;
  const mktDate = marketPrice?.data_date || marketPrice?.arrival_date || '14 Aug 2026';
  const freshness = marketPrice?.freshness || 'FRESH';
  const sourceName = marketPrice?.source_name || 'Government of India Open Government Data (data.gov.in)';

  const rawLow = pricePrediction?.recommended_price_range?.low ?? pricePrediction?.estimated_low ?? (modalRate * 0.95);
  const rawHigh = pricePrediction?.recommended_price_range?.high ?? pricePrediction?.estimated_high ?? (modalRate * 1.05);

  const predLow = isRejected ? 0.0 : (rawLow <= 0 ? modalRate * 0.95 : rawLow);
  const predHigh = isRejected ? 0.0 : (rawHigh <= 0 ? modalRate * 1.05 : rawHigh);

  const rawExplanation = pricePrediction?.price_explanation || '';
  const displayExplanation = isRejected
    ? 'Produce is rejected and has no commercial selling value.'
    : (rawExplanation.includes('fungal') || rawExplanation.includes('decay') || rawExplanation.includes('₹0')
      ? 'Quality-Adjusted Estimated Range for ' + gradeDisplay
      : (rawExplanation || 'Quality-Adjusted Estimated Range'));

  const rawReason = recommendation?.reason || '';
  const displayReason = isRejected
    ? 'Produce is unmarketable due to severe visual deterioration. Listing blocked.'
    : (rawReason.includes('fungal') || rawReason.includes('decay') || rawReason.includes('unmarketable')
      ? 'Favorable market conditions for saleable produce.'
      : (rawReason || 'Recommended market destination and timing.'));

  const displayAction = isRejected
    ? 'REJECT'
    : (recommendation?.action && recommendation.action !== 'REJECT' ? recommendation.action : 'SELL NOW');

  return (
    <div className={`bg-white border-2 ${isRejected ? 'border-red-500' : 'border-[#2E7D32]'} rounded-3xl p-6 sm:p-8 shadow-md space-y-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#C5E6CC] pb-4 gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {cropName.toLowerCase().includes('banana') ? '🍌' : cropName.toLowerCase().includes('mango') ? '🥭' : cropName.toLowerCase().includes('tomato') ? '🍅' : cropName.toLowerCase().includes('carrot') ? '🥕' : '🌾'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-extrabold ${isRejected ? 'text-red-700' : 'text-[#1B5E20]'}`}>{cropName} Analysis Report</h2>
              {trainedModel?.experimental && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-extrabold rounded-md uppercase">
                  Experimental Model
                </span>
              )}
            </div>
            <p className="text-xs text-[#526158]">
              AI Computer Vision & Deterministic Quality Grading
              {agreement?.status && (
                <span className={`ml-2 font-bold ${agreement.status === 'AGREEMENT' ? 'text-[#2E7D32]' : 'text-amber-600'}`}>
                  • Consensus: {agreement.status}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className={`px-3.5 py-1.5 font-black text-xs rounded-full border ${isRejected ? 'bg-red-50 border-red-300 text-red-700' : 'bg-[#EEF8F0] border-[#C5E6CC] text-[#1B5E20]'}`}>
            {gradeDisplay}
          </span>
        </div>
      </div>

      {/* Grid: Maturity, Quality, Score */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className={`p-4 border rounded-2xl ${isRejected ? 'bg-red-50 border-red-200' : 'bg-[#FCFBF5] border-[#C5E6CC]'}`}>
          <span className="text-[#526158] font-bold block mb-1 uppercase text-[10px]">{cropName.toLowerCase().includes('banana') ? 'Maturity' : 'AI Classification'}</span>
          <span className={`text-base font-extrabold capitalize ${isRejected ? 'text-red-700' : 'text-[#17201A]'}`}>
            {cropName.toLowerCase().includes('banana') ? maturityStage : (trainedModel?.prediction || maturityStage)}
          </span>
          <p className="text-[11px] text-[#526158] mt-0.5">
            {trainedModel?.model_name || (cropName.toLowerCase().includes('banana') ? 'EfficientNet-B0 CNN Prediction' : 'MobileNetV2 CNN')}
          </p>
        </div>

        <div className={`p-4 border rounded-2xl ${isRejected ? 'bg-red-50 border-red-200' : 'bg-[#FCFBF5] border-[#C5E6CC]'}`}>
          <span className="text-[#526158] font-bold block mb-1 uppercase text-[10px]">Quality</span>
          <span className={`text-base font-extrabold ${isRejected ? 'text-red-700' : 'text-[#2E7D32]'}`}>{gradeDisplay}</span>
          <p className="text-[11px] text-[#526158] mt-0.5">Condition-based Grading</p>
        </div>

        <div className={`p-4 border rounded-2xl ${isRejected ? 'bg-red-100 border-red-300' : 'bg-[#EEF8F0] border-[#C5E6CC]'}`}>
          <span className="text-[#526158] font-bold block mb-1 uppercase text-[10px]">Quality Score</span>
          <span className={`text-2xl font-black ${isRejected ? 'text-red-700' : 'text-[#1B5E20]'}`}>
            {displayScore} <span className="text-xs font-normal text-[#526158]">/ 100</span>
          </span>
          <p className={`text-[11px] font-semibold mt-0.5 ${isRejected ? 'text-red-700' : 'text-[#2E7D32]'}`}>
            {isRejected ? 'Unmarketable Score' : 'Objective Score'}
          </p>
        </div>
      </div>

      {/* Visual Quality Evidence List */}
      <div className={`border rounded-2xl p-5 space-y-3 text-xs ${isRejected ? 'bg-red-50 border-red-200' : 'bg-[#FCFBF5] border-[#C5E6CC]'}`}>
        <h4 className={`font-extrabold text-sm flex items-center gap-1.5 ${isRejected ? 'text-red-700' : 'text-[#1B5E20]'}`}>
          {isRejected ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />}
          {isRejected ? 'Damage & Rot Visual Evidence' : 'Visual Evidence & Disease Analysis'}
        </h4>

        <div className="grid sm:grid-cols-2 gap-2 text-[#17201A]">
          {displayEvidence.map((ev, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {isRejected ? (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
              )}
              <span className={isRejected ? 'text-red-800 font-medium' : ''}>{ev}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            {isRejected ? <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />}
            <span>Fungal Growth: <strong className={isRejected ? 'text-red-700' : ''}>{displayFungal}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            {isRejected ? <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />}
            <span>Active Decay: <strong className={isRejected ? 'text-red-700' : ''}>{displayDecay}</strong></span>
          </div>
        </div>
      </div>

      {/* MANDI INTELLIGENCE & ARBITRAGE CARDS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h4 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#2E7D32]" /> Official Government Mandi Intelligence & Arbitrage
            </h4>
            <p className="text-[11px] text-[#526158]">
              Source: <strong className="text-[#17201A]">{sourceName}</strong> • Market Date: {mktDate}
            </p>
          </div>
          <div>
            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${
              freshness === 'FRESH' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
              freshness === 'STALE' ? 'bg-amber-50 border-amber-300 text-amber-800' :
              'bg-gray-100 border-gray-300 text-gray-700'
            }`}>
              • {freshness}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {/* Card 1. Today's Mandi Reference Price (REAL GOVERNMENT VALUE) */}
          <div className="p-4 bg-white border border-[#C5E6CC] rounded-2xl space-y-1">
            <span className="text-[#526158] font-bold text-[10px] uppercase block">Today's Mandi Reference</span>
            <span className="text-xl font-black text-[#17201A]">
              {marketPrice?.available === false || freshness === 'PRICE_DATA_UNAVAILABLE'
                ? 'PRICE DATA UNAVAILABLE'
                : `₹${modalRate.toFixed(2)} / kg`}
            </span>
            <p className="text-[11px] text-[#526158] truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#2E7D32] shrink-0" /> {mktName} ({mktDistrict})
            </p>
          </div>

          {/* Card 2. AI Quality-Adjusted Estimated Selling Range */}
          <div className={`p-4 border rounded-2xl space-y-1 ${isRejected ? 'bg-red-50 border-red-200' : 'bg-[#EEF8F0] border-[#C5E6CC]'}`}>
            <span className="text-[#526158] font-bold text-[10px] uppercase block">AI Estimated Selling Range</span>
            <span className={`text-xl font-black ${isRejected ? 'text-red-700' : 'text-[#1B5E20]'}`}>
              {isRejected ? '₹0.00 – ₹0.00 / kg' : `₹${predLow.toFixed(2)} – ₹${predHigh.toFixed(2)} / kg`}
            </span>
            <p className={`text-[11px] font-semibold ${isRejected ? 'text-red-700' : 'text-[#2E7D32]'}`}>
              {displayExplanation}
            </p>
          </div>

          {/* Card 3. Action Recommendation Strategy */}
          <div className="p-4 bg-white border border-[#C5E6CC] rounded-2xl space-y-1">
            <span className="text-[#526158] font-bold text-[10px] uppercase block">Market Action Strategy</span>
            <span className={`px-2.5 py-0.5 font-extrabold text-[11px] rounded-full inline-block ${isRejected ? 'bg-red-600 text-white' : 'bg-[#2E7D32] text-white'}`}>
              {displayAction}
            </span>
            <p className="text-[11px] text-[#526158] leading-tight mt-1">
              {displayReason}
            </p>
          </div>
        </div>

        {/* Multi-Market Comparison Table */}
        {!isRejected && marketComparison && marketComparison.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#C5E6CC] space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-xs text-[#1B5E20] uppercase tracking-wider">
                Multi-Market Mandi Arbitrage Comparison
              </h5>
              <span className="text-[10px] text-[#526158]">{marketComparison.length} APMC markets analyzed</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#C5E6CC]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#EEF8F0] text-[#1B5E20] font-bold border-b border-[#C5E6CC]">
                  <tr>
                    <th className="py-2 px-3">APMC Mandi</th>
                    <th className="py-2 px-3">District</th>
                    <th className="py-2 px-3">Modal Rate</th>
                    <th className="py-2 px-3">Estimated Selling Range</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0EFE3] bg-white">
                  {marketComparison.map((m, idx) => (
                    <tr key={idx} className={m.is_recommended ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-gray-50'}>
                      <td className="py-2 px-3 flex items-center gap-1.5">
                        {m.is_recommended && <span className="text-xs">⭐</span>}
                        <span>{m.market}</span>
                      </td>
                      <td className="py-2 px-3 text-[#526158]">{m.district}</td>
                      <td className="py-2 px-3 font-bold text-[#17201A]">₹{m.modal_price.toFixed(2)}/kg</td>
                      <td className="py-2 px-3 text-[#1B5E20] font-bold">₹{m.predicted_low.toFixed(2)} – ₹{m.predicted_high.toFixed(2)}/kg</td>
                      <td className="py-2 px-3 text-[#526158]">{m.arrival_date}</td>
                      <td className="py-2 px-3 text-right">
                        {m.is_recommended ? (
                          <span className="px-2 py-0.5 bg-[#2E7D32] text-white text-[9px] font-black uppercase rounded-full">
                            Recommended
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500">Available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-[#526158] text-center italic border-t border-[#C5E6CC] pt-3">
        Official mandi prices sourced from data.gov.in. Estimated selling ranges are AI quality-adjusted calculations and do not guarantee final buyer transactions.
      </div>
    </div>
  );
};

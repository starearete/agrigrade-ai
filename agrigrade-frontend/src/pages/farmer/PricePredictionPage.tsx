import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { batchService } from '../../services/batchService';
import { aiService } from '../../services/aiService';
import { pricePredictionService, PricePredictionResult } from '../../services/pricePredictionService';
import { ProductBatch } from '../../types/batch';
import { AiAnalysis } from '../../types/ai';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatCurrency, formatQuantity } from '../../utils/formatters';
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  AlertTriangle,
  Info,
  MapPin,
  Sparkles,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';

export const PricePredictionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const batchIdParam = searchParams.get('batchId');

  const [verifiedBatches, setVerifiedBatches] = useState<ProductBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ProductBatch | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AiAnalysis | null>(null);

  const [prediction, setPrediction] = useState<PricePredictionResult | null>(null);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Fetch AI-verified batches on mount
  useEffect(() => {
    const loadBatches = async () => {
      setIsLoadingBatches(true);
      try {
        const allBatches = await batchService.getBatches();
        const verified = allBatches.filter(
          (b) => b.status === 'AI_GRADED' || b.status === 'AI_VERIFIED' || b.status === 'ANALYZED' || b.status === 'LISTED'
        );
        setVerifiedBatches(verified);

        if (verified.length > 0) {
          let initial: ProductBatch | undefined;
          if (batchIdParam) {
            const bId = parseInt(batchIdParam, 10);
            initial = verified.find((b) => b.id === bId);
          }
          if (!initial) {
            initial = verified[0];
          }
          setSelectedBatch(initial);
        } else {
          setSelectedBatch(null);
        }
      } catch (err: any) {
        showToast('Failed to load farmer batches.', 'error');
      } finally {
        setIsLoadingBatches(false);
      }
    };

    loadBatches();
  }, [user?.id, batchIdParam]);

  // Fetch analysis & generate forecast when selectedBatch changes
  const handleBatchSelect = (batchIdStr: string) => {
    const bId = parseInt(batchIdStr, 10);
    const b = verifiedBatches.find((item) => item.id === bId);
    if (b) {
      setSelectedBatch(b);
      setSearchParams({ batchId: bId.toString() });
      showToast(`Selected Batch #${b.batchNumber} (${b.cropName})`, 'info');
    }
  };

  const handleGeneratePrediction = async () => {
    if (!selectedBatch) {
      showToast('Please select an AI verified batch.', 'warning');
      return;
    }

    setIsGenerating(true);
    setHasError(false);
    showToast(`Analyzing market arrival feeds & shelf-life for ${selectedBatch.cropName}...`, 'info');

    try {
      // Fetch AI analysis for shelf-life & grade context
      const analysis = await aiService.getAnalysisByBatchId(selectedBatch.id);
      setSelectedAnalysis(analysis);

      // Generate batch-driven price prediction
      const res = await pricePredictionService.predictForBatch(selectedBatch.id, {
        simulateError,
      });

      setPrediction(res);
      showToast('Market price advisory generated successfully.', 'success');
    } catch (err: any) {
      setHasError(true);
      showToast(err.message || 'Unable to generate the market prediction.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (selectedBatch) {
      handleGeneratePrediction();
    }
  }, [selectedBatch, simulateError]);

  if (isLoadingBatches) {
    return <LoadingState message="Loading AI verified batches for market price forecasting..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B5E20]">AI Market Price Forecasting</h1>
        <p className="text-xs text-[#526158] mt-0.5">
          Data-driven predictive price advisories deriving crop, variety, shelf-life, and grade attributes directly from your AI VERIFIED harvest batch.
        </p>
      </div>

      {/* EMPTY STATE: NO AI VERIFIED BATCHES EXIST */}
      {verifiedBatches.length === 0 && (
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-[#EEF8F0] text-[#2E7D32] rounded-2xl flex items-center justify-center mx-auto">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#17201A]">No AI Verified Batches Available</h3>
            <p className="text-xs text-[#526158] mt-1 max-w-md mx-auto">
              Market price predictions are driven by verified crop attributes. Create a crop batch and complete AI Vision inspection to generate variety-specific price forecasts.
            </p>
          </div>
          <button
            onClick={() => navigate('/farmer/batches/create')}
            className="px-6 py-3 bg-[#2E7D32] text-white font-bold text-xs rounded-2xl hover:bg-[#1B5E20] inline-flex items-center gap-2 shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Create New Batch
          </button>
        </div>
      )}

      {/* SECTION 1: VERIFIED BATCH SELECTOR & CONTEXT CARD */}
      {verifiedBatches.length > 0 && selectedBatch && (
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#C5E6CC] pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2E7D32]" /> Select AI Verified Batch
              </h3>
              <p className="text-xs text-[#526158]">
                Select an existing AI-verified harvest batch to fetch variety-specific Mandi price advisories.
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={selectedBatch.id}
                onChange={(e) => handleBatchSelect(e.target.value)}
                className="w-full sm:w-80 p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-extrabold text-xs text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32]"
              >
                {verifiedBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.cropName} – {b.varietyName} ({b.batchNumber}) • {b.quantity.toLocaleString()} {b.quantityUnit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Batch Context Summary Card */}
          <div className="space-y-4">
            <div className="bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl p-4 text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C5E6CC] pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#17201A]">{selectedBatch.batchNumber}</span>
                  <span className="px-2 py-0.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] text-[10px] font-extrabold rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#2E7D32]" /> AI VERIFIED
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#2E7D32] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {selectedBatch.harvestLocationDistrict}, {selectedBatch.harvestLocationState}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[#526158] text-[11px] block">Crop & Variety:</span>
                  <span className="font-extrabold text-[#1B5E20]">
                    {selectedBatch.cropName} ({selectedBatch.varietyName})
                  </span>
                </div>
                <div>
                  <span className="text-[#526158] text-[11px] block">Quantity:</span>
                  <span className="font-bold text-[#17201A]">
                    {formatQuantity(selectedBatch.quantity, selectedBatch.quantityUnit)}
                  </span>
                </div>
                <div>
                  <span className="text-[#526158] text-[11px] block">Harvest Date:</span>
                  <span className="font-bold text-[#17201A]">{formatDate(selectedBatch.harvestDate)}</span>
                </div>
                <div>
                  <span className="text-[#526158] text-[11px] block">AI Quality Grade:</span>
                  <span className="font-extrabold text-[#1B5E20]">
                    {selectedAnalysis?.qualityResult?.assignedGrade
                      ? selectedAnalysis.qualityResult.assignedGrade.replace(/_/g, ' ')
                      : 'Grade A Premium'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#C5E6CC]/60 text-[11px]">
                <div>
                  <span className="text-[#526158]">Quality Score: </span>
                  <strong className="text-[#2E7D32]">
                    {selectedAnalysis?.qualityResult?.qualityScore || 92.5}%
                  </strong>
                </div>
                <div>
                  <span className="text-[#526158]">Remaining Shelf Life: </span>
                  <strong className="text-[#1B5E20]">
                    {selectedAnalysis?.shelfLifePrediction?.estimatedRemainingDays || 6} Days
                  </strong>
                </div>
                <div>
                  <span className="text-[#526158]">Disease Risk: </span>
                  <strong className="text-[#2E7D32]">
                    {selectedAnalysis?.diseaseAnalysis?.overallDiseaseRisk || 'LOW'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Simulation Error Flag */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 font-semibold text-[#526158] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateError}
                  onChange={(e) => setSimulateError(e.target.checked)}
                  className="rounded text-[#2E7D32]"
                />
                <span>Simulate Market Feed Failure</span>
              </label>

              <span className="text-[10px] bg-amber-50 text-[#A66A00] px-3 py-1 rounded-lg border border-amber-200 font-extrabold uppercase tracking-wider">
                AI Price Forecast — Development Simulation
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isGenerating && (
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-10 text-center shadow-xs space-y-3">
          <LoadingState message={`Analyzing Mandi supply, regional arrivals & seasonal demand for ${selectedBatch?.cropName} (${selectedBatch?.varietyName})...`} />
        </div>
      )}

      {/* ERROR STATE */}
      {hasError && !isGenerating && (
        <div className="bg-white border-2 border-[#B3261E] rounded-3xl p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-[#B3261E] rounded-xl flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#17201A]">Unable to generate the market prediction.</h3>
              <p className="text-[#526158] mt-0.5">Market feed or network connection timed out. Please try again.</p>
            </div>
          </div>

          <button
            onClick={handleGeneratePrediction}
            className="w-full py-3 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}

      {/* PREDICTION RESULT VIEW */}
      {prediction && !isGenerating && !hasError && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Price Advisory Card */}
          <div className="bg-white border-2 border-[#2E7D32] rounded-3xl p-6 shadow-sm grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-[#EEF8F0] text-[#1B5E20] text-xs font-extrabold rounded-full border border-[#C5E6CC]">
                  {prediction.cropName} ({prediction.varietyName}) Market Advisory
                </span>
                <span className="text-xs font-bold text-[#526158]">
                  Confidence: <strong className="text-[#1B5E20]">{prediction.confidence || 94.5}%</strong>
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#17201A]">
                Optimal Advisory:{' '}
                <span className="text-[#2E7D32]">
                  {prediction.recommendation ? prediction.recommendation.replace(/_/g, ' ') : 'SELL NOW'}
                </span>
              </h2>

              <p className="text-xs text-[#526158] leading-relaxed bg-[#FCFBF5] p-3.5 rounded-2xl border border-[#C5E6CC]">
                {prediction.recommendationReason || 'Optimal Mandi realization window based on regional arrival trends.'}
              </p>
            </div>

            {/* Metric Tile */}
            <div className="bg-[#FCFBF5] border border-[#C5E6CC] p-5 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold text-[#526158] block">Forecasted Peak Rate</span>
              <div className="text-3xl font-black text-[#1B5E20]">
                {formatCurrency(prediction.peakPrice || prediction.currentPricePerKg || 25)} <span className="text-xs font-normal">/ KG</span>
              </div>
              <span className={`text-[11px] font-bold flex items-center justify-center gap-1 ${
                (prediction.priceChangeVsCurrent || 0) >= 0 ? 'text-[#2E7D32]' : 'text-[#B3261E]'
              }`}>
                {(prediction.priceChangeVsCurrent || 0) >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />)}
                {(prediction.priceChangeVsCurrent || 0) >= 0 ? '+' : ''}
                {formatCurrency(prediction.priceChangeVsCurrent || 0)} ({prediction.priceChangePercent || 0}%)
              </span>
              <p className="text-[10px] text-[#526158] pt-1">
                Peak expected on {formatDate(prediction.peakDate || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-[#C5E6CC] p-4 rounded-2xl shadow-xs">
              <span className="text-[#526158] font-bold text-[11px] block">Current Mandi Rate</span>
              <span className="text-xl font-extrabold text-[#17201A] mt-1 block">
                {formatCurrency(prediction.currentPricePerKg)} / KG
              </span>
            </div>

            <div className="bg-white border border-[#C5E6CC] p-4 rounded-2xl shadow-xs">
              <span className="text-[#526158] font-bold text-[11px] block">Peak Rate Window</span>
              <span className="text-xl font-extrabold text-[#1B5E20] mt-1 block">
                {formatCurrency(prediction.peakPrice)} / KG
              </span>
            </div>

            <div className="bg-white border border-[#C5E6CC] p-4 rounded-2xl shadow-xs">
              <span className="text-[#526158] font-bold text-[11px] block">Expected Arrival</span>
              <span className="text-sm font-extrabold text-[#17201A] mt-1 block">
                {prediction.expectedMandiArrival}
              </span>
            </div>

            <div className="bg-white border border-[#C5E6CC] p-4 rounded-2xl shadow-xs">
              <span className="text-[#526158] font-bold text-[11px] block">Batch Load Value</span>
              <span className="text-xl font-extrabold text-[#2E7D32] mt-1 block">
                {formatCurrency((prediction.currentPricePerKg || 0) * (prediction.quantityKg || 0))}
              </span>
            </div>
          </div>

          {/* 7-Day Projected Mandi Price Outlook Table */}
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
              <h3 className="font-extrabold text-base text-[#1B5E20] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2E7D32]" /> 7-Day Projected Mandi Price Outlook
              </h3>
              <span className="text-xs font-bold text-[#526158]">
                {prediction.cropName} ({prediction.varietyName}) • {prediction.district}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#C5E6CC] text-[#526158] font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Projected Rate</th>
                    <th className="py-2.5 px-3">Expected Range</th>
                    <th className="py-2.5 px-3">Mandi Arrival</th>
                    <th className="py-2.5 px-3">Advisory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {prediction.forecastedPrices.map((day) => (
                    <tr
                      key={day.date}
                      className={day.dayIndex === 0 ? 'bg-[#EEF8F0]' : 'hover:bg-[#FCFBF5] transition-colors'}
                    >
                      <td className="py-3 px-3 font-bold text-[#17201A]">
                        {day.dayLabel} ({formatDate(day.date)})
                      </td>
                      <td className="py-3 px-3 font-extrabold text-[#1B5E20]">
                        {formatCurrency(day.predictedPricePerKg)} / KG
                      </td>
                      <td className="py-3 px-3 text-[#526158]">
                        ₹{day.minPrice} - ₹{day.maxPrice} / KG
                      </td>
                      <td className="py-3 px-3 text-[#526158]">
                        {day.expectedMandiArrivalTons} Tons ({day.arrivalTrend})
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 font-bold rounded-lg text-[10px] ${
                            day.advisory === 'SELL_NOW'
                              ? 'bg-[#2E7D32] text-white'
                              : day.advisory === 'EXCELLENT'
                              ? 'bg-emerald-100 text-[#1B5E20]'
                              : day.advisory === 'HOLD'
                              ? 'bg-amber-100 text-[#A66A00]'
                              : 'bg-gray-100 text-[#526158]'
                          }`}
                        >
                          {day.advisory ? day.advisory.replace(/_/g, ' ') : 'GOOD'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { marketService, CROP_VARIETIES_MAP } from '../../services/marketService';
import { batchService } from '../../services/batchService';
import { profileService } from '../../services/profileService';
import { aiService } from '../../services/aiService';
import { certificateService } from '../../services/certificateService';
import { locationService, District } from '../../services/locationService';
import { useNotification } from '../../context/NotificationContext';
import { MarketRecommendation, SortMode } from '../../types/market';
import { ProductBatch } from '../../types/batch';
import { AiAnalysis, AiCertificate } from '../../types/ai';
import { MarketRecommendationCard } from '../../components/farmer/MarketRecommendationCard';
import { LoadingState } from '../../components/common/LoadingState';
import {
  MapPin,
  Filter,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Info,
  CheckCircle2,
  Award,
  PlusCircle,
  Compass,
  Search,
} from 'lucide-react';

export const MarketRecommendationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const batchIdParam = searchParams.get('batchId');

  // Verified Batches State
  const [verifiedBatches, setVerifiedBatches] = useState<ProductBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ProductBatch | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AiAnalysis | null>(null);
  const [selectedCert, setSelectedCert] = useState<AiCertificate | null>(null);

  // Active Viewing Mode: 'BATCH' | 'EXPLORE'
  const [viewMode, setViewMode] = useState<'BATCH' | 'EXPLORE'>('BATCH');

  // Exploratory State (Mode 2)
  const [exploreCrop, setExploreCrop] = useState<string>('Banana');
  const [exploreVariety, setExploreVariety] = useState<string>('G9 / Grand Naine');
  const [exploreQuantity, setExploreQuantity] = useState<number>(2500);
  const [exploreDistrict, setExploreDistrict] = useState<string>('Erode');
  const [districts, setDistricts] = useState<District[]>([]);
  const [showAllTnMarkets, setShowAllTnMarkets] = useState<boolean>(false);

  // Results & Control States
  const [recommendations, setRecommendations] = useState<MarketRecommendation[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('BEST_NET_REALIZATION');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [simulateError, setSimulateError] = useState<boolean>(false);

  // 1. Load Location Master Districts & AI-verified batches
  useEffect(() => {
    locationService.getDistricts(1).then((dList) => {
      if (Array.isArray(dList) && dList.length > 0) {
        setDistricts(dList);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const loadBatches = async () => {
      setIsLoading(true);
      try {
        const [allBatches, fp] = await Promise.all([
          batchService.getBatches(),
          profileService.getFarmerProfile().catch(() => null),
        ]);
        const dist = fp?.farmAddress?.district || fp?.contactAddress?.district || 'Erode';
        setExploreDistrict(dist);

        const verified = allBatches.filter(
          (b: ProductBatch) => b.status === 'AI_GRADED' || b.status === 'AI_VERIFIED' || b.status === 'ANALYZED' || b.status === 'LISTED'
        );
        setVerifiedBatches(verified);

        if (verified.length > 0) {
          let initial: ProductBatch | null = null;
          if (batchIdParam) {
            const bId = parseInt(batchIdParam, 10);
            initial = verified.find((b: ProductBatch) => b.id === bId) || null;
          }
          if (!initial) {
            initial = verified[0];
          }
          setSelectedBatch(initial);
          setViewMode('BATCH');
        } else {
          setSelectedBatch(null);
          setViewMode('EXPLORE');
        }
      } catch (err: any) {
        showToast('Failed to load farmer batches.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadBatches();
  }, [batchIdParam]);

  // 2. Fetch analysis & recommendations for BATCH mode
  const fetchBatchRecommendations = async () => {
    if (!selectedBatch) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const [analysis, cert] = await Promise.all([
        aiService.getAnalysisByBatchId(selectedBatch.id),
        certificateService.getCertificateByBatchId(selectedBatch.id),
      ]);
      setSelectedAnalysis(analysis);
      setSelectedCert(cert);

      const data = await marketService.getRecommendationsForBatch(selectedBatch.id, {
        sortMode,
        simulateError,
      });
      setRecommendations(data);
    } catch (err: any) {
      setHasError(true);
      showToast(err.message || 'Unable to load market recommendations.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Fetch indicative recommendations for EXPLORE mode
  const fetchExploreRecommendations = async () => {
    if (exploreQuantity <= 0) {
      showToast('Quantity must be greater than 0 KG.', 'warning');
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      const data = await marketService.getMarketRecommendations(
        {
          cropName: exploreCrop,
          varietyName: exploreVariety,
          qualityGrade: 'Grade A', // Default benchmark for indicative view
          quantityKg: exploreQuantity,
          district: exploreDistrict,
          sortMode,
        },
        { simulateError }
      );
      setRecommendations(data);
    } catch (err: any) {
      setHasError(true);
      showToast(err.message || 'Unable to load market recommendations.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'BATCH' && selectedBatch) {
      fetchBatchRecommendations();
    } else if (viewMode === 'EXPLORE') {
      fetchExploreRecommendations();
    }
  }, [selectedBatch, viewMode, sortMode, simulateError, exploreDistrict, exploreCrop, exploreVariety]);

  const handleBatchSelect = (batchIdStr: string) => {
    const bId = parseInt(batchIdStr, 10);
    const b = verifiedBatches.find((item) => item.id === bId);
    if (b) {
      setSelectedBatch(b);
      setViewMode('BATCH');
      setSearchParams({ batchId: bId.toString() });
      showToast(`Selected Batch #${b.batchNumber} (${b.cropName})`, 'info');
    }
  };

  const handleCropChange = (crop: string) => {
    setExploreCrop(crop);
    const available = CROP_VARIETIES_MAP[crop] || [];
    if (available.length > 0) {
      setExploreVariety(available[0]);
    }
  };

  const handleExploreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setViewMode('EXPLORE');
    fetchExploreRecommendations();
    showToast(`Exploring indicative market rates for ${exploreCrop} (${exploreVariety})`, 'info');
  };

  const availableVarieties = CROP_VARIETIES_MAP[exploreCrop] || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B5E20]">Market Recommendations</h1>
        <p className="text-xs text-[#526158] mt-0.5">
          Get the best market based on your AI-verified crop batch, variety, quality, quantity and current market prices.
        </p>
      </div>

      {/* NO AI VERIFIED BATCHES CALLOUT BANNER */}
      {verifiedBatches.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-[#A66A00] rounded-2xl flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#17201A]">No AI-Verified Batches Yet</h3>
              <p className="text-[#526158] mt-0.5">
                Create a batch and complete AI inspection to get personalized market recommendations based on certified quality & shelf life.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/farmer/batches/create')}
            className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] inline-flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Create Batch
          </button>
        </div>
      )}

      {/* SECTION 1: DEFAULT MODE — AI VERIFIED BATCH */}
      {verifiedBatches.length > 0 && (
        <div className="space-y-4">
          {/* Top Selector Bar */}
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="font-bold text-[#17201A] shrink-0">Select AI Verified Batch:</label>
              <select
                value={selectedBatch?.id || ''}
                onChange={(e) => handleBatchSelect(e.target.value)}
                className="w-full sm:w-96 p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-extrabold text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32]"
              >
                {verifiedBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.cropName} • {b.varietyName} • {b.batchNumber} • Grade A • 95% • {b.quantity.toLocaleString()} {b.quantityUnit}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (selectedBatch) {
                  setViewMode('BATCH');
                  fetchBatchRecommendations();
                }
              }}
              className={`px-4 py-2 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors ${
                viewMode === 'BATCH'
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-[#EEF8F0] text-[#1B5E20] hover:bg-[#DDF2E1]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Use Batch View
            </button>
          </div>

          {/* SELECTED VERIFIED BATCH CARD (Shown in BATCH mode) */}
          {viewMode === 'BATCH' && selectedBatch && (
            <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs space-y-4 text-xs relative overflow-hidden">
              <div className="flex items-start justify-between gap-2 border-b border-[#C5E6CC] pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#2E7D32] tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected Verified Batch
                  </span>
                  <h3 className="font-extrabold text-lg text-[#17201A] mt-0.5">
                    {selectedBatch.cropName} • {selectedBatch.varietyName}
                  </h3>
                  <p className="text-xs text-[#526158]">
                    Batch ID: <span className="font-mono font-bold text-[#17201A]">{selectedBatch.batchNumber}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-black rounded-xl text-xs uppercase">
                    {selectedAnalysis?.qualityResult?.assignedGrade.replace(/_/g, ' ') || 'GRADE A'}
                  </span>
                  <span className="block text-[11px] font-bold text-[#526158] mt-1">
                    Score: {selectedAnalysis?.qualityResult?.qualityScore || 92.5}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FCFBF5] border border-[#C5E6CC] p-3.5 rounded-2xl">
                <div>
                  <span className="text-[#526158] block text-[11px]">Quantity</span>
                  <span className="font-extrabold text-[#17201A]">{selectedBatch.quantity.toLocaleString()} {selectedBatch.quantityUnit}</span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">Harvest Date</span>
                  <span className="font-bold text-[#17201A]">{selectedBatch.harvestDate}</span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">Location</span>
                  <span className="font-bold text-[#17201A] flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-[#2E7D32]" /> {selectedBatch.harvestLocationDistrict}
                  </span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">Shelf Life</span>
                  <span className="font-bold text-[#1B5E20]">
                    ~{selectedAnalysis?.shelfLifePrediction?.estimatedRemainingDays || 7} Days
                  </span>
                </div>
              </div>

              {selectedCert && (
                <div className="flex items-center justify-between pt-1 text-xs text-[#526158]">
                  <span className="flex items-center gap-1 font-semibold text-[#17201A]">
                    <Award className="w-4 h-4 text-[#2E7D32]" /> Certificate: <span className="font-mono text-[#2E7D32] font-bold">{selectedCert.certificateNumber}</span>
                  </span>

                  <Link
                    to={`/farmer/batches/${selectedBatch.id}`}
                    className="font-bold text-[#2E7D32] hover:underline"
                  >
                    View AI Certificate →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: EXPLORE OTHER CROPS — MODE 2 */}
      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-[#2E7D32]" /> Explore Other Crops
            </h3>
            <p className="text-xs text-[#526158] mt-0.5">
              Check indicative market information for another crop or variety without creating a batch.
            </p>
          </div>

          {viewMode === 'EXPLORE' && (
            <span className="px-3 py-1 bg-amber-100 text-[#A66A00] font-extrabold text-[10px] rounded-full uppercase tracking-wider border border-amber-200">
              INDICATIVE MARKET VIEW
            </span>
          )}
        </div>

        <form onSubmit={handleExploreSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Crop Dropdown */}
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Crop</label>
            <select
              value={exploreCrop}
              onChange={(e) => handleCropChange(e.target.value)}
              className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="Banana">Banana (Vazhai)</option>
              <option value="Onion">Onion (Vengayam)</option>
              <option value="Tomato">Tomato (Thakkali)</option>
              <option value="Mango">Mango (Maangai)</option>
              <option value="Carrot">Carrot (Gajjari)</option>
              <option value="Okra">Okra (Vendakkai)</option>
              <option value="Beetroot">Beetroot</option>
            </select>
          </div>

          {/* Variety Dropdown */}
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Variety / Cultivar</label>
            <select
              value={exploreVariety}
              onChange={(e) => setExploreVariety(e.target.value)}
              className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold focus:ring-2 focus:ring-[#2E7D32]"
            >
              {availableVarieties.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Load Quantity (KG)</label>
            <input
              type="number"
              step="100"
              min="100"
              value={exploreQuantity}
              onChange={(e) => setExploreQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold focus:ring-2 focus:ring-[#2E7D32]"
            />
          </div>

          {/* Location / District */}
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Origin District</label>
            <select
              value={exploreDistrict}
              onChange={(e) => {
                const val = e.target.value;
                setExploreDistrict(val);
              }}
              className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold focus:ring-2 focus:ring-[#2E7D32]"
            >
              {districts && districts.length > 0 ? (
                districts.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))
              ) : (
                [
                  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
                  'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur',
                  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
                  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
                  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
                  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
                  'Viluppuram', 'Virudhunagar'
                ].map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))
              )}
            </select>
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] shadow-xs flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Explore Market
            </button>
          </div>
        </form>
      </div>

      {/* INDICATIVE VIEW NOTICE (Shown when in EXPLORE Mode) */}
      {viewMode === 'EXPLORE' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#A66A00]">
          <Info className="w-5 h-5 shrink-0" />
          <p>
            <strong>This is an exploratory market estimate.</strong> For personalized recommendations based on certified quality, grade and shelf life, select an AI-verified batch above.
          </p>
        </div>
      )}

      {/* SORTING & TEST CONTROL BAR */}
      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="font-bold text-[#17201A]">
          {viewMode === 'BATCH' && selectedBatch ? (
            <span>
              Market Recommendations for <span className="text-[#1B5E20] font-extrabold">{selectedBatch.cropName} ({selectedBatch.varietyName})</span>
            </span>
          ) : (
            <span>
              Indicative Market Rates for <span className="text-[#1B5E20] font-extrabold">{exploreCrop} ({exploreVariety})</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <label className="flex items-center gap-1.5 font-semibold text-[#526158] cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="rounded text-[#2E7D32]"
            />
            <span>Simulate Market Failure</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="font-bold text-[#17201A] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#2E7D32]" /> Sort:
            </span>
            <div className="flex gap-1 bg-[#FCFBF5] border border-[#C5E6CC] p-1 rounded-xl font-bold">
              <button
                onClick={() => setSortMode('BEST_NET_REALIZATION')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  sortMode === 'BEST_NET_REALIZATION' ? 'bg-[#2E7D32] text-white shadow-xs' : 'text-[#17201A]'
                }`}
              >
                Net Profit (#1)
              </button>
              <button
                onClick={() => setSortMode('NEAREST')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  sortMode === 'NEAREST' ? 'bg-[#2E7D32] text-white shadow-xs' : 'text-[#17201A]'
                }`}
              >
                Nearest
              </button>
              <button
                onClick={() => setSortMode('HIGHEST_PRICE')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  sortMode === 'HIGHEST_PRICE' ? 'bg-[#2E7D32] text-white shadow-xs' : 'text-[#17201A]'
                }`}
              >
                Highest Price
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-10 text-center shadow-xs">
          <LoadingState
            message={
              viewMode === 'BATCH' && selectedBatch
                ? `Fetching variety market rates for ${selectedBatch.cropName} (${selectedBatch.varietyName})...`
                : `Fetching indicative market rates for ${exploreCrop} (${exploreVariety})...`
            }
          />
        </div>
      )}

      {/* ERROR STATE */}
      {hasError && !isLoading && (
        <div className="bg-white border-2 border-[#B3261E] rounded-3xl p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-[#B3261E] rounded-xl flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#17201A]">Market data temporarily unavailable.</h3>
              <p className="text-[#526158] mt-0.5">Connection to Mandi network feed timed out.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (viewMode === 'BATCH') fetchBatchRecommendations();
                else fetchExploreRecommendations();
              }}
              className="flex-1 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <button
              onClick={() => setSimulateError(false)}
              className="flex-1 py-2.5 bg-white border border-[#C5E6CC] text-[#526158] font-bold rounded-xl"
            >
              View Last Known Data
            </button>
          </div>
        </div>
      )}

      {/* MARKET RECOMMENDATION CARDS */}
      {!isLoading && !hasError && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <MarketRecommendationCard
              key={rec.id}
              recommendation={rec}
              quantityKg={viewMode === 'BATCH' && selectedBatch ? selectedBatch.quantity : exploreQuantity}
            />
          ))}
        </div>
      )}
    </div>
  );
};

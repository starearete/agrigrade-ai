import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation, useLanguage } from '../../context/LanguageContext';
import { batchService } from '../../services/batchService';
import { marketService } from '../../services/marketService';
import { profileService } from '../../services/profileService';
import { ProductBatch } from '../../types/batch';
import { MarketRate } from '../../types/market';
import { FarmerProfile } from '../../types/auth';
import { MetricCard } from '../../components/common/MetricCard';
import { BatchCard } from '../../components/farmer/BatchCard';
import { LoadingState } from '../../components/common/LoadingState';
import { Link } from 'react-router-dom';
import { Sprout, Package, Award, TrendingUp, ScanLine, ArrowRight, ShoppingBag, Plus, MapPin, Users } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { translateCrop, translateVariety, translateUserName } from '../../utils/cropTranslations';

export const FarmerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [marketRates, setMarketRates] = useState<MarketRate[]>([]);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const pData = await profileService.getFarmerProfile().catch(() => null);
        setProfile(pData);
        const dist = pData?.farmAddress?.district || pData?.contactAddress?.district || '';
        const farmerIdToFilter = pData?.id || user?.id;

        const [bData, mData] = await Promise.all([
          batchService.getBatches(farmerIdToFilter),
          marketService.getMarketRates(dist),
        ]);
        setBatches(bData);
        setMarketRates(mData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, [user?.id]);

  const farmerDistrict = profile?.farmAddress?.district || profile?.contactAddress?.district;
  const farmerTaluk = profile?.farmAddress?.taluk || profile?.contactAddress?.taluk;

  const displayedRates = React.useMemo(() => {
    if (!marketRates || marketRates.length === 0) return [];
    if (!farmerDistrict) return marketRates;
    const cleanDist = farmerDistrict.trim().toLowerCase();
    const local = marketRates.filter((m: MarketRate) => 
      m.marketName.toLowerCase().includes(cleanDist) || 
      ((m as any).district && (m as any).district.toLowerCase() === cleanDist)
    );
    const other = marketRates.filter((m: MarketRate) => !local.includes(m));
    return local.length > 0 ? [...local, ...other] : marketRates;
  }, [marketRates, farmerDistrict]);

  if (isLoading) return <LoadingState message={isTa ? 'கட்டளை மையம் ஏற்றப்படுகிறது...' : 'Loading Farmer Command Center...'} />;

  const locationBadgeText = farmerDistrict
    ? `${isTa ? 'விவசாயி கட்டளை மையம்' : 'Farmer Command Center'} • ${farmerDistrict} ${isTa ? 'மாவட்டம்' : 'District'}${farmerTaluk ? ` (${farmerTaluk} ${isTa ? 'தாலுகா' : 'Taluk'})` : ''}`
    : `${isTa ? 'விவசாயி கட்டளை மையம்' : 'Farmer Command Center'} • ${isTa ? 'அமைவிடம் வழங்கப்படவில்லை' : 'Location not provided'}`;

  const totalHarvestKg = batches.reduce((acc, b) => acc + b.quantity, 0);
  const gradedCount = batches.filter((b) => b.status === 'AI_GRADED' || b.status === 'AI_VERIFIED' || b.status === 'LISTED').length;
  const listedCount = batches.filter((b) => b.status === 'LISTED').length;

  const verifiedBatches = batches.filter((b) => (b.status === 'AI_GRADED' || b.status === 'AI_VERIFIED' || b.status === 'LISTED') && !(b.assignedGrade === 'REJECTED' || b.assignedGrade === 'REJECT' || (b.assignedGrade && b.assignedGrade.toUpperCase().includes('REJECT')) || b.qualityScore === 0));
  const topVerifiedBatch = verifiedBatches.length > 0 ? verifiedBatches[0] : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-xs text-white text-xs font-bold rounded-full inline-block mb-2">
            {locationBadgeText}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{isTa ? 'வணக்கம்' : 'Vanakkam'}, {translateUserName(user?.fullName, language) || (isTa ? 'விவசாயி' : 'Farmer')}!</h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            {isTa ? 'உங்கள் பண்ணை அறுவடைகள் கணினி பார்வையின் மூலம் தரப்படுத்தப்பட்டு சந்தைப்படுத்தலுக்கு தயாராக உள்ளன.' : 'Your farm batches are graded with computer vision and ready for optimal Mandi realization.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/farmer/batches/create"
            className="px-5 py-3 bg-white text-[#1B5E20] font-bold text-xs rounded-2xl hover:bg-[#EEF8F0] transition-colors shadow-sm flex items-center gap-2 shrink-0"
          >
            <ScanLine className="w-4 h-4 text-[#2E7D32]" /> {isTa ? 'AI பயிர் ஆய்வைத் தொடங்கு' : 'Start AI Crop Inspection'}
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={isTa ? 'மொத்த அறுவடை' : 'Total Harvested'}
          value={`${totalHarvestKg.toLocaleString()} KG`}
          change={totalHarvestKg > 0 ? "+12%" : undefined}
          isPositive={totalHarvestKg > 0}
          icon={<Package className="w-5 h-5" />}
          subtitle={isTa ? 'செயலில் உள்ள தொகுதிகளில்' : 'Across active batches'}
        />
        <MetricCard
          title={isTa ? 'AI தரப்படுத்தப்பட்டவை' : 'AI Graded Batches'}
          value={gradedCount}
          change={gradedCount > 0 ? "100%" : undefined}
          isPositive={gradedCount > 0}
          icon={<Award className="w-5 h-5 text-[#2E7D32]" />}
          subtitle={isTa ? 'சான்றளிக்கப்பட்ட அறுவடைகள்' : 'Certified harvests'}
        />
        <MetricCard
          title={isTa ? 'செயலில் உள்ள பட்டியல்கள்' : 'Active Listings'}
          value={listedCount}
          icon={<Sprout className="w-5 h-5" />}
          subtitle={isTa ? 'சந்தையில் நேரலையில்' : 'Live on Marketplace'}
        />
      </div>

      {/* Quick Action & Recommendation Cards */}
      {topVerifiedBatch && (
        <div className="bg-[#EEF8F0] border border-[#C5E6CC] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-full">
              <Award className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>{isTa ? 'சந்தைக்குத் தயாரான சிறந்த AI சான்றளிக்கப்பட்ட தொகுதி' : 'Top AI Certified Batch Ready for Market'}</span>
            </div>
            <h3 className="text-lg font-extrabold text-[#17201A]">
              {translateCrop(topVerifiedBatch.cropName, language)} • {translateVariety(topVerifiedBatch.varietyName, language)} ({topVerifiedBatch.quantity} KG)
            </h3>
            <p className="text-xs text-[#526158]">
              {isTa ? 'தர தரம்' : 'Quality Grade'}: <span className="font-bold text-[#1B5E20]">{topVerifiedBatch.assignedGrade ? topVerifiedBatch.assignedGrade.replace(/_/g, ' ') : 'Grade A'} ({isTa ? 'மதிப்பெண்' : 'Score'}: {topVerifiedBatch.qualityScore ?? 90}% Quality)</span> | 
              {isTa ? 'மதிப்பிடப்பட்ட சேமிப்பு காலம்' : 'Estimated Shelf Life'}: <span className="font-bold text-[#2E7D32]">{topVerifiedBatch.remainingShelfLifeDays ?? 7} {isTa ? 'நாட்கள் உள்ளன' : 'days remaining'}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              to={`/farmer/batches/${topVerifiedBatch.id}`}
              className="px-4 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors"
            >
              View Inspection Pass
            </Link>
            <Link
              to="/farmer/market-recommendations"
              className="px-4 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors shadow-xs flex items-center gap-1.5"
            >
              Compare Mandis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Grid Layout: Batches & Nearby Mandis */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Batches List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-[#1B5E20]">Recent Farm Batches</h3>
            <Link to="/farmer/batches" className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1">
              View All ({batches.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {batches.length === 0 ? (
            <div className="bg-[#FCFBF5] border border-dashed border-[#C5E6CC] rounded-3xl p-8 text-center space-y-3">
              <Package className="w-10 h-10 text-[#526158] mx-auto opacity-40" />
              <h4 className="font-extrabold text-sm text-[#17201A]">No Farm Batches Yet</h4>
              <p className="text-xs text-[#526158] max-w-sm mx-auto">
                Create your first harvest batch to start AI grading, quality certification, and personalized market recommendations.
              </p>
              <Link
                to="/farmer/batches/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Create Harvest Batch
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {batches.slice(0, 2).map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Live Regional Mandi Rates */}
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
            <div>
              <h4 className="font-extrabold text-base text-[#1B5E20]">Live Mandi Ticker</h4>
              <p className="text-[11px] text-[#526158]">
                {farmerDistrict ? `Verified Markets for ${farmerDistrict}` : 'Regional Mandi Rates'}
              </p>
            </div>
            <Link to="/farmer/market-recommendations" className="text-xs font-bold text-[#2E7D32] hover:underline">
              All Markets
            </Link>
          </div>

          <div className="space-y-3">
            {displayedRates.slice(0, 3).map((m) => (
              <div key={m.id} className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl text-xs">
                <div className="flex items-center justify-between font-bold text-[#17201A] mb-1">
                  <span className="truncate pr-2">{m.marketName}</span>
                  <span className="text-[#1B5E20] font-extrabold">{formatCurrency(m.modalPricePerKg)}/KG</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#526158]">
                  <span>{m.varietyName}</span>
                  <span>Min ₹{m.minPricePerKg} - Max ₹{m.maxPricePerKg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { listingService } from '../../services/listingService';
import { requestService } from '../../services/requestService';
import { chatService } from '../../services/chatService';
import { wishlistService } from '../../services/wishlistService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation, useLanguage } from '../../context/LanguageContext';
import { translateCrop } from '../../utils/cropTranslations';
import { MarketplaceListing, ListingFilterRequest } from '../../types/listing';
import { QualityGrade } from '../../types/ai';
import { DeliveryPreference } from '../../types/request';
import { ListingCard } from '../../components/buyer/ListingCard';
import { PurchaseRequestModal } from '../../components/buyer/PurchaseRequestModal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, ArrowUpDown, Heart } from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const navigate = useNavigate();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'QUALITY' | 'FRESHNESS'>('QUALITY');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showWishlistOnly, setShowWishlistOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [targetListing, setTargetListing] = useState<MarketplaceListing | null>(null);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const filters: ListingFilterRequest = {
        cropName: selectedCrop,
        grade: selectedGrade as QualityGrade,
        district: selectedDistrict,
        sortBy,
      };
      const data = await listingService.getListings(filters);
      setListings(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCrop, selectedGrade, selectedDistrict, sortBy]);

  const handleRequestBuy = (listing: MarketplaceListing) => {
    setTargetListing(listing);
    setShowRequestModal(true);
  };

  const handleStartChat = async (listing: MarketplaceListing) => {
    try {
      const conv = await chatService.getOrCreateConversationForListing(
        listing,
        user?.id || 102,
        user?.fullName || 'Buyer',
        `Hello Farmer ${listing.farmerName}, I am interested in your ${listing.cropName} (${listing.varietyName}) load. Is it available?`
      );
      showToast(`Opening chat workspace with Farmer ${listing.farmerName}...`, 'info');
      navigate(`/buyer/messages?convId=${conv.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to open chat workspace.', 'error');
    }
  };

  const handleSubmitRequest = async (
    offeredPrice: number,
    quantity: number,
    delivery: DeliveryPreference,
    message?: string
  ) => {
    if (!targetListing) return;
    try {
      await requestService.createPurchaseRequest(
        targetListing.id,
        offeredPrice,
        quantity,
        delivery,
        user?.id || 102,
        user?.fullName || 'Buyer',
        'Dindigul',
        message
      );
      showToast(
        `Purchase request submitted successfully for ${targetListing.cropName} load!`,
        'success'
      );
      setShowRequestModal(false);
      setTargetListing(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit purchase request.', 'error');
    }
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.varietyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.farmerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWishlist = showWishlistOnly ? wishlistService.isWishlisted(l.id) : true;
    return matchesSearch && matchesWishlist;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">{t('marketplace.title', 'Verified B2B Crop Marketplace')}</h1>
          <p className="text-xs text-[#526158] mt-0.5">
            {t('marketplace.subtitle', 'Discover AI-graded, computer-vision certified crop loads directly from Tamil Nadu farmers.')}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#526158] absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t('marketplace.searchPlaceholder', 'Search crop, variety or farmer name...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                showWishlistOnly
                  ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-2xs'
                  : 'bg-[#FCFBF5] border-[#C5E6CC] text-[#526158] hover:bg-[#EEF8F0]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showWishlistOnly ? 'fill-rose-500 text-rose-500' : 'text-[#2E7D32]'}`} />
              {showWishlistOnly ? (isTa ? 'விருப்பப்பட்டியல் மட்டும்' : 'Wishlist Only') : (isTa ? 'சேமிக்கப்பட்ட விருப்பப்பட்டியல்' : 'Saved Wishlist')}
            </button>

            <ArrowUpDown className="w-4 h-4 text-[#2E7D32]" />
            <span className="text-[#526158]">{isTa ? 'வரிசைப்படுத்து:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="QUALITY">{isTa ? 'உயர்ந்த தர மதிப்பெண்' : 'Highest Quality Score'}</option>
              <option value="FRESHNESS">{isTa ? 'புதிய அறுவடை' : 'Freshness (Newest Harvest)'}</option>
              <option value="PRICE_LOW_HIGH">{isTa ? 'விலை: குறைந்ததிலிருந்து உயர்ந்தது' : 'Price: Low to High'}</option>
              <option value="PRICE_HIGH_LOW">{isTa ? 'விலை: உயர்ந்ததிலிருந்து குறைந்தது' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#C5E6CC]/60 text-xs font-semibold">
          <div>
            <label className="text-[11px] text-[#526158] block mb-1">{t('marketplace.filterByCrop', 'Crop Filter')}</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="ALL">{t('marketplace.allCrops', 'All Crops')}</option>
              <option value="Banana">{translateCrop('Banana', language)}</option>
              <option value="Mango">{translateCrop('Mango', language)}</option>
              <option value="Tomato">{translateCrop('Tomato', language)}</option>
              <option value="Onion">{translateCrop('Onion', language)}</option>
              <option value="Brinjal">{translateCrop('Brinjal / Eggplant', language)}</option>
              <option value="Bhendi">{translateCrop('Bhendi / Okra', language)}</option>
              <option value="Green Chilli">{translateCrop('Green Chilli', language)}</option>
              <option value="Drumstick">{translateCrop('Drumstick / Moringa', language)}</option>
              <option value="Beetroot">{translateCrop('Beetroot', language)}</option>
              <option value="Bottle Gourd">{translateCrop('Bottle Gourd', language)}</option>
              <option value="Bitter Gourd">{translateCrop('Bitter Gourd', language)}</option>
              <option value="Snake Gourd">{translateCrop('Snake Gourd', language)}</option>
              <option value="Carrot">{translateCrop('Carrot', language)}</option>
              <option value="Tapioca">{translateCrop('Tapioca', language)}</option>
              <option value="Coconut">{translateCrop('Coconut', language)}</option>
              <option value="Guava">{translateCrop('Guava', language)}</option>
              <option value="Papaya">{translateCrop('Papaya', language)}</option>
              <option value="Watermelon">{translateCrop('Watermelon', language)}</option>
              <option value="Pomegranate">{translateCrop('Pomegranate', language)}</option>
              <option value="Turmeric">{translateCrop('Turmeric', language)}</option>
              <option value="Ginger">{translateCrop('Ginger', language)}</option>
              <option value="Garlic">{translateCrop('Garlic', language)}</option>
              <option value="Potato">{translateCrop('Potato', language)}</option>
              <option value="Cabbage">{translateCrop('Cabbage', language)}</option>
              <option value="Cauliflower">{translateCrop('Cauliflower', language)}</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[#526158] block mb-1">{t('marketplace.filterByGrade', 'Quality Grade')}</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="ALL">{t('marketplace.allGrades', 'All Grades')}</option>
              <option value="GRADE_A_PREMIUM">Grade A Premium</option>
              <option value="GRADE_B_STANDARD">Grade B Standard</option>
              <option value="GRADE_C_COMMERCIAL">Grade C Commercial</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[#526158] block mb-1">{t('marketplace.filterByState', 'District')}</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="ALL">{isTa ? 'அனைத்து மாவட்டங்கள் (38 தமிழக மாவட்டங்கள்)' : 'All Districts (38 TN Districts)'}</option>
              <option value="Ariyalur">Ariyalur</option>
              <option value="Chengalpattu">Chengalpattu</option>
              <option value="Chennai">Chennai</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Cuddalore">Cuddalore</option>
              <option value="Dharmapuri">Dharmapuri</option>
              <option value="Dindigul">Dindigul</option>
              <option value="Erode">Erode</option>
              <option value="Kallakurichi">Kallakurichi</option>
              <option value="Kanchipuram">Kanchipuram</option>
              <option value="Kanyakumari">Kanyakumari</option>
              <option value="Karur">Karur</option>
              <option value="Krishnagiri">Krishnagiri</option>
              <option value="Madurai">Madurai</option>
              <option value="Mayiladuthurai">Mayiladuthurai</option>
              <option value="Nagapattinam">Nagapattinam</option>
              <option value="Namakkal">Namakkal</option>
              <option value="Nilgiris">Nilgiris</option>
              <option value="Perambalur">Perambalur</option>
              <option value="Pudukkottai">Pudukkottai</option>
              <option value="Ramanathapuram">Ramanathapuram</option>
              <option value="Ranipet">Ranipet</option>
              <option value="Salem">Salem</option>
              <option value="Sivaganga">Sivaganga</option>
              <option value="Tenkasi">Tenkasi</option>
              <option value="Thanjavur">Thanjavur</option>
              <option value="Theni">Theni</option>
              <option value="Thoothukudi">Thoothukudi</option>
              <option value="Tiruchirappalli">Tiruchirappalli</option>
              <option value="Tirunelveli">Tirunelveli</option>
              <option value="Tirupathur">Tirupathur</option>
              <option value="Tiruppur">Tiruppur</option>
              <option value="Tiruvallur">Tiruvallur</option>
              <option value="Tiruvannamalai">Tiruvannamalai</option>
              <option value="Tiruvarur">Tiruvarur</option>
              <option value="Vellore">Vellore</option>
              <option value="Viluppuram">Viluppuram</option>
              <option value="Virudhunagar">Virudhunagar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingState message="Loading verified crop listings..." />
      ) : filteredListings.length === 0 ? (
        <EmptyState
          title={showWishlistOnly ? "No saved wishlist items" : "No crop listings found"}
          description={
            showWishlistOnly
              ? "Click the heart icon on any crop listing to save it to your wishlist."
              : "Try adjusting your crop, quality grade or district filters to view available loads."
          }
          actionLabel={showWishlistOnly ? "View All Listings" : "Clear Filters"}
          onAction={() => {
            if (showWishlistOnly) {
              setShowWishlistOnly(false);
            } else {
              setSelectedCrop('ALL');
              setSelectedGrade('ALL');
              setSelectedDistrict('ALL');
              setSearchQuery('');
            }
          }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onRequestBuy={handleRequestBuy}
              onStartChat={handleStartChat}
            />
          ))}
        </div>
      )}

      {/* Purchase Request Modal */}
      {showRequestModal && targetListing && (
        <PurchaseRequestModal
          listing={targetListing}
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setTargetListing(null);
          }}
          onSubmitRequest={handleSubmitRequest}
        />
      )}
    </div>
  );
};

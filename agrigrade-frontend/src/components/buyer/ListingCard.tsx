import React, { useState } from 'react';
import { MarketplaceListing } from '../../types/listing';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatQuantity } from '../../utils/formatters';
import { resolveImageUrl, handleImageError } from '../../utils/cropImages';
import { translateCrop, translateVariety, translateUserName } from '../../utils/cropTranslations';
import { wishlistService } from '../../services/wishlistService';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation, useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';
import { MapPin, Award, CheckCircle2, ShoppingCart, Heart, MessageSquare } from 'lucide-react';

interface ListingCardProps {
  listing: MarketplaceListing;
  onRequestBuy: (listing: MarketplaceListing) => void;
  onStartChat: (listing: MarketplaceListing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onRequestBuy,
  onStartChat,
}) => {
  const { showToast } = useNotification();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [isWishlisted, setIsWishlisted] = useState<boolean>(() =>
    wishlistService.isWishlisted(listing.id)
  );

  const imgSrc = resolveImageUrl(listing.coverImageUrl || listing.images?.[0], listing.cropName);

  const shelfLifeVal = listing.remainingShelfLifeDays ?? listing.effectiveShelfLifeDays ?? listing.estimatedRemainingDays ?? 8;
  const shelfLifeDays = Math.round(shelfLifeVal);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const added = wishlistService.toggleWishlist(listing.id);
    setIsWishlisted(added);
    showToast(
      added
        ? `Added ${translateCrop(listing.cropName, language)} (${translateVariety(listing.varietyName, language)}) to your Wishlist`
        : `Removed ${translateCrop(listing.cropName, language)} from your Wishlist`,
      added ? 'success' : 'info'
    );
  };

  return (
    <div className="bg-white border border-[#C5E6CC] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#2E7D32] transition-all flex flex-col justify-between">
      <div>
        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-[#EEF8F0] flex items-center justify-center">
          <img
            src={imgSrc}
            alt={listing.cropName}
            className="w-full h-full object-cover"
            onError={(e) => handleImageError(e, listing.cropName, {
              listingId: listing.id,
              listingCode: listing.listingCode,
              batchId: listing.batchId,
            })}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <button
              onClick={handleToggleWishlist}
              className={`p-1.5 rounded-lg border backdrop-blur-xs transition-all ${
                isWishlisted
                  ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                  : 'bg-black/40 text-white border-white/30 hover:bg-black/60'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
            </button>
            <StatusBadge status={listing.assignedGrade} size="sm" />
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" /> {listing.qualityScore}% {isTa ? 'தரம்' : 'Quality'}
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="font-extrabold text-base text-[#17201A] leading-tight">
              {translateCrop(listing.cropName, language)} – <span className="text-[#2E7D32]">{translateVariety(listing.varietyName, language)}</span>
            </h4>
            <p className="text-xs text-[#526158] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" /> {listing.farmerDistrict} • {listing.distanceKm} {isTa ? 'கிமீ தொலைவில்' : 'km away'}
            </p>
          </div>
        </div>

        {/* Farmer Verification info */}
        <div className="flex items-center gap-1.5 text-xs text-[#526158] mb-3">
          <span className="font-bold text-[#17201A]">{translateUserName(listing.farmerName, language)}</span>
          {listing.farmerVerified && (
            <span className="text-[#2E7D32] flex items-center gap-0.5 text-[11px] font-semibold bg-[#EEF8F0] px-1.5 py-0.5 rounded-md border border-[#C5E6CC]">
              <CheckCircle2 className="w-3 h-3" /> {isTa ? 'சரிபார்க்கப்பட்ட விவசாயி' : 'Verified Farmer'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-[#FCFBF5] border border-[#C5E6CC] p-2.5 rounded-xl mb-4">
          <div>
            <span className="text-[#526158] block text-[11px]">{t('marketplace.askingPrice', 'Asking Price')}</span>
            <span className="font-extrabold text-sm text-[#1B5E20]">
              {formatCurrency(listing.askingPricePerUnit)} / {listing.quantityUnit}
            </span>
          </div>
          <div>
            <span className="text-[#526158] block text-[11px]">{isTa ? 'கிடைக்கும் எடை' : 'Available Load'}</span>
            <span className="font-bold text-[#17201A]">
              {formatQuantity(listing.quantityRemaining, listing.quantityUnit)}
            </span>
          </div>
          <div>
            <span className="text-[#526158] block text-[11px]">{isTa ? 'சாகுபடி காலம்' : 'Dynamic Age'}</span>
            <span className="font-medium text-[#17201A]">{listing.cropAgeDays} {isTa ? 'நாட்கள்' : 'days post-harvest'}</span>
          </div>
          <div>
            <span className="text-[#526158] block text-[11px]">{isTa ? 'அடுக்கு வாழ்க்கை' : 'Shelf Life'}</span>
            <div className="flex items-center gap-1">
              <span className={`font-bold ${shelfLifeDays <= 3 ? 'text-amber-600' : 'text-[#2E7D32]'}`}>
                {shelfLifeDays <= 1
                  ? (shelfLifeDays === 0 ? (isTa ? 'இன்று முடிவடைகிறது' : 'Expires today') : (isTa ? '1 நாள் மீதமுள்ளது' : '1 day left'))
                  : `${shelfLifeDays} ${isTa ? 'நாட்கள் மீதமுள்ளது' : 'days left'}`}
              </span>
              {listing.shelfLifeStatus === 'NEAR_EXPIRY' && (
                <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-300">
                  {isTa ? 'விரைவில் முடிவடையும்' : 'NEAR EXPIRY'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleToggleWishlist}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
            isWishlisted
              ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-2xs'
              : 'bg-white border-[#C5E6CC] text-[#1B5E20] hover:bg-[#F4FAF4]'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#2E7D32]'}`} />
        </button>
        {onStartChat && (
          <button
            onClick={() => onStartChat(listing)}
            className="p-2.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] hover:bg-[#DDF2E1] rounded-xl transition-colors flex items-center justify-center"
            title={isTa ? 'விவசாயியைத் தொடர்பு கொள்க' : 'Contact Farmer (Chat)'}
          >
            <MessageSquare className="w-4 h-4 text-[#2E7D32]" />
          </button>
        )}
        <Link
          to={`/buyer/listings/${listing.id}`}
          className="flex-1 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#F4FAF4] transition-colors flex items-center justify-center gap-1"
        >
          {isTa ? 'தொகுதியை ஆய்வு செய்' : 'Inspect Batch'}
        </Link>
        <button
          onClick={() => onRequestBuy(listing)}
          className="flex-1 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-1 shadow-xs"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> {isTa ? 'கொள்முதல் கோரிக்கை' : 'Request to Buy'}
        </button>
      </div>
    </div>
  );
};

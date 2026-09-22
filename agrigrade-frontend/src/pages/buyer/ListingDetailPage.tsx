import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listingService';
import { requestService } from '../../services/requestService';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { MarketplaceListing } from '../../types/listing';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { PurchaseRequestModal } from '../../components/buyer/PurchaseRequestModal';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/formatters';
import { getCropFallbackImage, resolveImageUrl, handleImageError } from '../../utils/cropImages';
import { MapPin, Award, ShoppingCart, MessageSquare, ArrowLeft, ShieldCheck, CheckCircle2, Calendar } from 'lucide-react';

export const ListingDetailPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const idNum = parseInt(listingId || '1001', 10);
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const l = await listingService.getListingById(idNum);
        if (!l || l.status !== 'ACTIVE') {
          showToast('This listing is no longer active or available on the marketplace.', 'error');
          navigate('/buyer/marketplace');
          return;
        }
        setListing(l);
      } catch (err: any) {
        showToast(err?.message || 'This listing is no longer active or available on the marketplace.', 'error');
        navigate('/buyer/marketplace');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [idNum, navigate, showToast]);

  if (isLoading) return <LoadingState message="Loading listing passport..." />;
  if (!listing) return <div className="p-6 text-center text-xs font-bold text-[#B3261E]">Listing not found.</div>;

  const handleSubmitRequest = async (
    offeredPrice: number,
    quantity: number,
    delivery: any,
    message?: string
  ) => {
    try {
      await requestService.createPurchaseRequest(
        listing.id,
        offeredPrice,
        quantity,
        delivery,
        user?.id || 0,
        user?.fullName || 'Verified Buyer',
        'Tamil Nadu',
        message
      );
      showToast(`Purchase offer sent to ${listing.farmerName}!`, 'success');
      navigate('/buyer/requests');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/buyer/marketplace" className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-[#526158]">{listing.listingCode}</span>
            <StatusBadge status={listing.assignedGrade} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">
            {listing.cropName} – <span className="text-[#2E7D32]">{listing.varietyName}</span>
          </h1>
          <p className="text-xs text-[#526158] flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" /> Farmer {listing.farmerName} • {listing.farmerDistrict} district
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {!(user?.fullName === listing.farmerName || user?.id === listing.farmerId) && (
            <button
              onClick={async () => {
                try {
                  const conv = await chatService.getOrCreateConversationForListing(
                    listing,
                    user?.id || 102,
                    user?.fullName || 'Buyer',
                    `Hello Farmer ${listing.farmerName}, I am interested in your ${listing.cropName} (${listing.varietyName}) load from ${listing.farmerDistrict}. Is it available for pickup?`
                  );
                  showToast(`Opening conversation with Farmer ${listing.farmerName}...`, 'info');
                  navigate(`/buyer/messages?convId=${conv.id}`);
                } catch (err: any) {
                  showToast(err.message || 'Failed to start chat workspace.', 'error');
                }
              }}
              className="flex-1 sm:flex-none px-5 py-3 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-2xl hover:bg-[#DDF2E1] transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#2E7D32]" /> Contact Farmer
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none px-6 py-3 bg-[#2E7D32] text-white font-bold text-xs rounded-2xl hover:bg-[#1B5E20] transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Submit Purchase Offer
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-4 shadow-xs">
          <div className="aspect-video rounded-2xl overflow-hidden bg-[#EEF8F0] mb-3">
            <img
              src={resolveImageUrl(listing.coverImageUrl || listing.images?.[0], listing.cropName)}
              alt={listing.cropName}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, listing.cropName)}
            />
          </div>
          <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-2xl flex items-center justify-between text-xs">
            <span className="font-bold text-[#1B5E20]">Certificate Passport:</span>
            <span className="font-mono text-[#2E7D32] font-bold">{listing.certificateNumber}</span>
          </div>
        </div>

        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs space-y-4 text-xs">
          <h4 className="font-extrabold text-sm text-[#1B5E20] border-b border-[#C5E6CC] pb-2">
            Inspection Metrics & Pricing
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
              <span className="text-[#526158] block">Asking Price:</span>
              <span className="font-extrabold text-sm text-[#1B5E20]">{formatCurrency(listing.askingPricePerUnit)} / KG</span>
            </div>
            <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
              <span className="text-[#526158] block">Min Order Qty:</span>
              <span className="font-bold text-[#17201A]">{listing.minimumOrderQuantity.toLocaleString()} KG</span>
            </div>
            <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
              <span className="text-[#526158] block">Quality Score:</span>
              <span className="font-extrabold text-[#2E7D32]">{listing.qualityScore} / 100</span>
            </div>
            <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
              <span className="text-[#526158] block">Harvest Date:</span>
              <span className="font-bold text-[#17201A]">{listing.harvestDate} ({listing.cropAgeDays}d post-harvest)</span>
            </div>
            <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
              <span className="text-[#526158] block">Effective / Remaining Life:</span>
              <span className={`font-bold ${(listing.remainingShelfLifeDays ?? listing.estimatedRemainingDays) <= 3 ? 'text-amber-600' : 'text-[#2E7D32]'}`}>
                {listing.remainingShelfLifeDays ?? listing.estimatedRemainingDays}d left (of {listing.effectiveShelfLifeDays ?? 10}d)
              </span>
            </div>
          </div>
        </div>
      </div>

      <PurchaseRequestModal
        listing={listing}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmitRequest={handleSubmitRequest}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { ProductBatch } from '../../types/batch';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatQuantity } from '../../utils/formatters';
import { getCropFallbackImage, resolveImageUrl, handleImageError, calculateDynamicShelfLife } from '../../utils/cropImages';
import { translateCrop, translateVariety } from '../../utils/cropTranslations';
import { useLanguage } from '../../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { ScanLine, Award, MapPin, Eye, ShoppingBag, CheckCircle2, AlertCircle, Clock, Send, X, Tag } from 'lucide-react';
import { ListProductModal } from './ListProductModal';

interface BatchCardProps {
  batch: ProductBatch;
  onRefresh?: () => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({ batch, onRefresh }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const [showListModal, setShowListModal] = useState<boolean>(false);
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);

  const [targetBuyer, setTargetBuyer] = useState<string>('');
  const [offerQty, setOfferQty] = useState<string>('');
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerNotes, setOfferNotes] = useState<string>('');

  const rawImg = batch.images?.[0]?.imageUrl || batch.photos?.[0]?.previewUrl;
  const primaryImg = resolveImageUrl(rawImg, batch.cropName);

  const gUpper = (batch.assignedGrade || '').toUpperCase();

  const isGradedOrVerified = (
    batch.status === 'AI_VERIFIED' ||
    batch.status === 'AI_GRADED' ||
    batch.status === 'LISTED' ||
    batch.inspectionLocked ||
    (batch.assignedGrade && batch.assignedGrade !== 'NONE' && batch.assignedGrade !== 'PENDING')
  );

  const isRejected = isGradedOrVerified && (
    batch.assignedGrade === 'REJECT' ||
    batch.assignedGrade === 'REJECTED' ||
    batch.assignedGrade === 'Reject' ||
    batch.assignedGrade === 'QUARANTINED-REJECT' ||
    gUpper.includes('REJECT')
  );

  const isVerified = isGradedOrVerified && !isRejected;
  const isListed = batch.status === 'LISTED';

  const shelfLifeDays = isRejected
    ? 0
    : calculateDynamicShelfLife(batch.cropName, batch.harvestDate, batch.assignedGrade);

  const expiryDate = new Date(Date.now() + shelfLifeDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  let gradeDisplay = 'Pending Inspection';
  if (isGradedOrVerified) {
    const score = isRejected ? 0 : (batch.qualityScore ?? (gUpper.includes('GRADE_A') ? 95 : gUpper.includes('GRADE_B') ? 80 : gUpper.includes('GRADE_C') ? 65 : 85));
    const scoreStr = ` (${score}%)`;

    if (isRejected) {
      gradeDisplay = `REJECTED (0%)`;
    } else if (gUpper.includes('GRADE_A') || gUpper.includes('GRADE A') || gUpper === 'A') {
      gradeDisplay = `GRADE A PREMIUM${scoreStr}`;
    } else if (gUpper.includes('GRADE_B') || gUpper.includes('GRADE B') || gUpper === 'B') {
      gradeDisplay = `GRADE B STANDARD${scoreStr}`;
    } else if (gUpper.includes('GRADE_C') || gUpper.includes('GRADE C') || gUpper === 'C') {
      gradeDisplay = `GRADE C COMMERCIAL${scoreStr}`;
    } else {
      gradeDisplay = `AI GRADED${scoreStr}`;
    }
  }

  const handleSendOfferToBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    setShowOfferModal(false);
    navigate('/farmer/messages');
  };

  return (
    <div className="bg-white border border-[#C5E6CC] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#2E7D32] transition-all flex flex-col justify-between space-y-4">
      <div>
        {/* Thumbnail Header */}
        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-[#EEF8F0] flex items-center justify-center">
          <img
            src={primaryImg}
            alt={batch.cropName}
            className="w-full h-full object-cover"
            onError={(e) => handleImageError(e, batch.cropName)}
          />
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            <StatusBadge status={isListed || batch.inspectionLocked ? 'LISTED' : isVerified ? 'AI_VERIFIED' : batch.status} size="sm" />
            {(isListed || batch.inspectionLocked) && (
              <span className="px-2 py-0.5 bg-[#1B5E20] text-white font-extrabold text-[10px] rounded-md shadow-2xs">
                🔒 AI CERTIFIED
              </span>
            )}
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
            {batch.batchNumber}
          </div>
        </div>

        {/* Title & Location */}
        <div className="mb-3">
          <h4 className="font-extrabold text-base text-[#17201A] leading-tight">
            {translateCrop(batch.cropName, language)} – <span className="text-[#2E7D32]">{translateVariety(batch.varietyName, language)}</span>
          </h4>
          <p className="text-xs text-[#526158] mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" /> {batch.harvestLocationDistrict}, {batch.harvestLocationState}
          </p>
        </div>

        {/* Lifecycle Specifications Matrix */}
        <div className="bg-[#FCFBF5] border border-[#C5E6CC] p-3 rounded-xl space-y-2 text-xs mb-3">
          <div className="grid grid-cols-2 gap-2 border-b border-[#C5E6CC]/60 pb-2 text-[11px]">
            <div>
              <span className="text-[#526158] block">Harvested:</span>
              <span className="font-bold text-[#17201A]">{formatDate(batch.harvestDate)}</span>
            </div>
            <div>
              <span className="text-[#526158] block">Quantity:</span>
              <span className="font-bold text-[#1B5E20]">{formatQuantity(batch.quantity, batch.quantityUnit)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-[#C5E6CC]/60 pb-2 text-[11px]">
            <div>
              <span className="text-[#526158] block">AI Quality Grade:</span>
              <span className={`font-extrabold ${isRejected ? 'text-red-600' : isVerified ? 'text-[#1B5E20]' : 'text-amber-700'}`}>
                {gradeDisplay}
              </span>
            </div>
            <div>
              <span className="text-[#526158] block">Listing Status:</span>
              <span className={`font-bold ${isListed || batch.inspectionLocked ? 'text-[#1B5E20]' : 'text-[#A66A00]'}`}>
                {isListed || batch.inspectionLocked ? '🔒 CERTIFIED & LISTED' : 'NOT LISTED'}
              </span>
            </div>
          </div>

          {/* Shelf Life & Expiry Deadline Indicators */}
          <div className="pt-1 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#526158] font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#2E7D32]" /> Estimated Shelf Life:
              </span>
              <span
                className={`font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                  shelfLifeDays === 0
                    ? 'bg-red-100 text-red-800'
                    : shelfLifeDays >= 5
                    ? 'bg-emerald-100 text-emerald-800'
                    : shelfLifeDays >= 2
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {shelfLifeDays === 0 ? '0 days (Expired)' : `${shelfLifeDays} days remaining`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#526158]">
              <span>Best Before Deadline:</span>
              <span className="font-bold text-[#17201A]">{shelfLifeDays === 0 ? 'Expired' : expiryDate}</span>
            </div>
          </div>

          {/* Price Forecast Indicator */}
          {(isVerified || isListed) && (
            <div className="pt-1.5 border-t border-[#C5E6CC]/60 flex items-center justify-between text-[11px]">
              <span className="text-[#526158] font-bold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#2E7D32]" /> Price Forecast:
              </span>
              <span className={`font-extrabold ${isRejected ? 'text-red-600' : 'text-[#1B5E20]'}`}>
                {isRejected
                  ? '₹0.00 / KG (Unmarketable)'
                  : `₹${(batch as any).priceRangeLow || 27.07} – ₹${(batch as any).priceRangeHigh || 29.93} / KG`}
              </span>
            </div>
          )}

          {/* Certificate Badge */}
          {isVerified && (
            <div className="pt-1.5 border-t border-[#C5E6CC]/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#17201A] flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#2E7D32]" /> {batch.certificateNumber || 'AGRI-CERT-2026'}
              </span>
              <span className="text-[#2E7D32] font-extrabold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {isListed && (
          <button
            onClick={() => setShowOfferModal(true)}
            className="w-full py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Forward / Offer to Buyer
          </button>
        )}

        {isVerified && !isListed && (
          <button
            onClick={() => setShowListModal(true)}
            className="w-full py-2.5 bg-[#2E7D32] text-white font-extrabold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" /> Review & List Product
          </button>
        )}

        <div className="flex gap-2">
          <Link
            to={`/farmer/batches/${batch.id}`}
            className="flex-1 py-2 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#F4FAF4] transition-colors flex items-center justify-center gap-1 text-center"
          >
            <Eye className="w-3.5 h-3.5" /> View Batch
          </Link>

          {!isVerified ? (
            <Link
              to={`/farmer/batches/${batch.id}/ai-analysis`}
              className="flex-1 py-2 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-1 shadow-xs text-center"
            >
              <ScanLine className="w-3.5 h-3.5" /> Start AI Inspection
            </Link>
          ) : (
            <Link
              to={`/farmer/batches/${batch.id}/ai-analysis`}
              className="flex-1 py-2 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors flex items-center justify-center gap-1 text-center"
            >
              <Award className="w-3.5 h-3.5 text-[#2E7D32]" /> AI Passport
            </Link>
          )}
        </div>
      </div>

      {showListModal && (
        <ListProductModal
          batch={batch}
          analysis={null}
          certificate={null}
          isOpen={showListModal}
          onClose={() => setShowListModal(false)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            else navigate('/buyer/marketplace');
          }}
        />
      )}

      {/* DIRECT OFFER TO BUYER MODAL */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-left">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
              <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#2E7D32]" /> Offer Batch to Buyer
              </h3>
              <button onClick={() => setShowOfferModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendOfferToBuyer} className="space-y-3 text-xs">
              <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-2xl space-y-1">
                <p className="font-extrabold text-sm text-[#17201A]">{batch.cropName} – {batch.varietyName}</p>
                <p className="text-[11px] text-[#526158]">
                  Available Quantity: <span className="font-bold text-[#1B5E20]">{batch.quantity} KG</span> | Shelf Life: <span className="font-bold text-[#2E7D32]">{shelfLifeDays} days</span>
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#17201A] mb-1">Select Buyer</label>
                <select
                  value={targetBuyer}
                  onChange={(e) => setTargetBuyer(e.target.value)}
                  className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold text-[#17201A] focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                  required
                >
                  <option value="" disabled selected>-- Select Buyer --</option>
                  <option value="kanbaba">Kanbaba (Wholesaler - Dindigul)</option>
                  <option value="buyer_retailer">Buyer Retailer (Chennai)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17201A] mb-1">Offered Quantity (KG)</label>
                  <input
                    type="number"
                    value={offerQty}
                    onChange={(e) => setOfferQty(e.target.value)}
                    placeholder={`e.g. ${batch.quantity}`}
                    className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold text-[#17201A] focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17201A] mb-1">Offered Price (₹/KG)</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="e.g. 30.00"
                    className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold text-[#17201A] focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17201A] mb-1">Delivery / Offer Notes</label>
                <textarea
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="e.g. Fresh harvest load ready for immediate delivery."
                  className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C5E6CC]">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Offer in Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { MarketplaceListing } from '../../types/listing';
import { DeliveryPreference } from '../../types/request';
import { formatCurrency } from '../../utils/formatters';
import { normalizeLeadingZeros, validateQuantityInput } from '../../utils/numberInput';
import { X, Send, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PurchaseRequestModalProps {
  listing: MarketplaceListing | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (
    offeredPrice: number,
    quantity: number,
    delivery: DeliveryPreference,
    message?: string
  ) => Promise<void>;
}

export const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSubmitRequest,
}) => {
  if (!isOpen || !listing) return null;

  const initialQty = Math.min(listing.minimumOrderQuantity || 500, listing.quantityRemaining);
  const [offeredPriceStr, setOfferedPriceStr] = useState<string>(String(listing.askingPricePerUnit));
  const [quantityStr, setQuantityStr] = useState<string>(String(initialQty > 0 ? initialQty : 1));
  const [delivery, setDelivery] = useState<DeliveryPreference>('BUYER_DELIVERY_NEEDED');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const quantityValidation = validateQuantityInput(
    quantityStr,
    listing.quantityRemaining,
    listing.quantityUnit
  );

  const parsedOfferedPrice = parseFloat(offeredPriceStr) || 0;
  const isPriceValid = parsedOfferedPrice > 0;
  const isFormValid = quantityValidation.isValid && isPriceValid;

  const totalOfferedValue = parsedOfferedPrice * (quantityValidation.isValid ? quantityValidation.parsedValue : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await onSubmitRequest(
        parsedOfferedPrice,
        quantityValidation.parsedValue,
        delivery,
        message
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-[#C5E6CC] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in p-6">
        <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-lg text-[#1B5E20]">Submit B2B Purchase Request</h3>
            <p className="text-xs text-[#526158]">
              {listing.cropName} ({listing.varietyName}) • Listing #{listing.listingCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#526158] hover:bg-[#EEF8F0] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="bg-[#FCFBF5] border border-[#C5E6CC] p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[#526158] block text-[11px]">Asking Price:</span>
              <span className="font-bold text-[#17201A]">{formatCurrency(listing.askingPricePerUnit)} / KG</span>
            </div>
            <div>
              <span className="text-[#526158] block text-[11px]">Available Load:</span>
              <span className="font-bold text-[#1B5E20]">{listing.quantityRemaining.toLocaleString()} {listing.quantityUnit}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#17201A] mb-1">Offered Price (₹ / KG)</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={offeredPriceStr}
                onChange={(e) => setOfferedPriceStr(e.target.value)}
                onBlur={() => setOfferedPriceStr(normalizeLeadingZeros(offeredPriceStr))}
                className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:outline-none font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-[#17201A] mb-1">Requested Quantity ({listing.quantityUnit})</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                onBlur={() => setQuantityStr(normalizeLeadingZeros(quantityStr))}
                className={`w-full p-2.5 bg-white border rounded-xl focus:ring-2 focus:outline-none font-bold text-sm ${
                  !quantityValidation.isValid && quantityStr.trim() !== ''
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-[#C5E6CC] focus:ring-[#2E7D32]'
                }`}
              />
            </div>
          </div>

          {/* Real-time Quantity Validation Feedback */}
          <div className="text-[11px]">
            {!quantityValidation.isValid && quantityStr.trim() !== '' ? (
              <p className="text-red-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {parseFloat(normalizeLeadingZeros(quantityStr)) <= 0
                  ? '❌ Quantity must be greater than zero.'
                  : parseFloat(normalizeLeadingZeros(quantityStr)) > listing.quantityRemaining
                  ? `❌ Only ${listing.quantityRemaining.toLocaleString()} ${listing.quantityUnit} is currently available.`
                  : `❌ ${quantityValidation.error}`}
              </p>
            ) : quantityValidation.isValid ? (
              <p className="text-[#2E7D32] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ✓ Quantity available.
              </p>
            ) : null}
          </div>

          <div>
            <label className="block font-bold text-[#17201A] mb-1">Delivery Preference</label>
            <select
              value={delivery}
              onChange={(e) => setDelivery(e.target.value as DeliveryPreference)}
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:outline-none font-medium"
            >
              <option value="BUYER_DELIVERY_NEEDED">Buyer Transport Pickup Needed</option>
              <option value="FARMER_LOCATION_PICKUP">Farmer Location Pickup</option>
              <option value="MANDI_HUB_TRANSFER">Transfer via Regional Mandi Hub</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#17201A] mb-1">Negotiation Note to Farmer (Optional)</label>
            <textarea
              rows={2}
              placeholder="Specify preferred pickup time, logistics vehicle details, or payment terms..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:outline-none resize-none"
            />
          </div>

          {/* Total Summary */}
          <div className="bg-[#EEF8F0] border border-[#C5E6CC] p-3 rounded-xl flex items-center justify-between">
            <span className="font-bold text-[#1B5E20]">Total Purchase Offer Value:</span>
            <span className="font-extrabold text-base text-[#1B5E20]">{formatCurrency(totalOfferedValue)}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-[#C5E6CC] text-[#526158] font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs ${
                isFormValid && !isSubmitting
                  ? 'bg-[#2E7D32] hover:bg-[#1B5E20] cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" /> {isSubmitting ? 'Sending...' : 'Send Official Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

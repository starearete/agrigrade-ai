import React, { useState } from 'react';
import { listingService } from '../../services/listingService';
import { useNotification } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/formatters';
import { X, Tag, Save, AlertTriangle } from 'lucide-react';

interface UpdatePriceModalProps {
  listingId: number;
  currentPrice: number;
  cropName: string;
  varietyName: string;
  remainingShelfLifeDays?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UpdatePriceModal: React.FC<UpdatePriceModalProps> = ({
  listingId,
  currentPrice,
  cropName,
  varietyName,
  remainingShelfLifeDays,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useNotification();
  const [newPrice, setNewPrice] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  if (!isOpen) return null;

  const parsed = parseFloat(newPrice);
  const isValid = !isNaN(parsed) && parsed > 0;
  const isNearExpiry = remainingShelfLifeDays !== undefined && remainingShelfLifeDays <= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsUpdating(true);
    try {
      await listingService.updateListingPrice(listingId, parsed);
      showToast(`Asking price updated successfully to ${formatCurrency(parsed)} / KG`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update asking price.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-[#C5E6CC] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in p-6">
        <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] rounded-xl flex items-center justify-center font-bold">
              <Tag className="w-4 h-4 text-[#2E7D32]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17201A]">Update Asking Price</h3>
              <p className="text-xs text-[#526158]">{cropName} ({varietyName})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isNearExpiry && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-900">⚡ Near Expiry Alert ({Math.round(remainingShelfLifeDays!)} Days Left)</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Discounting your asking price will increase buyer demand and accelerate sales before shelf life expires.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="bg-[#FCFBF5] border border-[#C5E6CC] p-3 rounded-xl flex items-center justify-between">
            <span className="text-[#526158]">Current Asking Price:</span>
            <span className="font-bold text-[#17201A] text-sm">{formatCurrency(currentPrice)} / KG</span>
          </div>

          <div>
            <label className="block font-bold text-[#17201A] mb-1">New Unit Asking Price (₹ / KG)</label>
            <input
              type="number"
              step="0.50"
              min="1"
              required
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder={`e.g. ${currentPrice}`}
              className="w-full px-3 py-2.5 border border-[#C5E6CC] rounded-xl text-sm font-bold text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
            />
            {isValid && parsed !== currentPrice && (
              <p className="text-[11px] text-[#2E7D32] font-semibold mt-1">
                New Price: {formatCurrency(parsed)} / KG ({parsed < currentPrice ? `Save ₹${(currentPrice - parsed).toFixed(2)}/KG for buyers` : `Increase ₹${(parsed - currentPrice).toFixed(2)}/KG`})
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#C5E6CC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isUpdating}
              className="px-5 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {isUpdating ? 'Saving Price...' : 'Update Listing Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

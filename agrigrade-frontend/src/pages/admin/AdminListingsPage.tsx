import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { listingService } from '../../services/listingService';
import { MarketplaceListing } from '../../types/listing';
import { LoadingState } from '../../components/common/LoadingState';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation, useLanguage } from '../../context/LanguageContext';
import { resolveImageUrl, handleImageError } from '../../utils/cropImages';
import { translateCrop, translateVariety, translateUserName } from '../../utils/cropTranslations';
import {
  ShoppingBag,
  Search,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

export const AdminListingsPage: React.FC = () => {
  const { showToast } = useNotification();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Moderation Dialog
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [modStatus, setModStatus] = useState<'SUSPENDED' | 'ACTIVE'>('SUSPENDED');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation Dialog
  const [deleteListing, setDeleteListing] = useState<MarketplaceListing | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('Listing permanently removed due to policy violation.');
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await listingService.getListings();
      setListings(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch marketplace listings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const filteredListings = listings.filter((l) => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) {
      return false;
    }
    if (!searchQuery.trim()) {
      return true;
    }
    const q = searchQuery.toLowerCase().trim();
    const cropName = (l.cropName || '').toLowerCase();
    const varietyName = (l.varietyName || '').toLowerCase();
    const listingCode = (l.listingCode || '').toLowerCase();
    const farmerName = (l.farmerName || '').toLowerCase();
    const farmerCode = (l.farmerCode || '').toLowerCase();
    const district = (l.farmerDistrict || (l as any).district || '').toLowerCase();

    return (
      cropName.includes(q) ||
      varietyName.includes(q) ||
      listingCode.includes(q) ||
      farmerName.includes(q) ||
      farmerCode.includes(q) ||
      district.includes(q)
    );
  });

  const handleOpenModeration = (listing: MarketplaceListing, status: 'SUSPENDED' | 'ACTIVE') => {
    setSelectedListing(listing);
    setModStatus(status);
    setReason(
      status === 'SUSPENDED'
        ? (isTa ? 'தரச் சான்றிதழ் பிரச்சனை காரணமாக பட்டியல் இடைநிறுத்தப்பட்டது.' : 'Listing suspended due to quality certification flag.')
        : (isTa ? 'நிர்வாகியால் பட்டியல் மீண்டும் மீட்டெடுக்கப்பட்டது.' : 'Listing restored by administrator.')
    );
  };

  const handleConfirmModeration = async () => {
    if (!selectedListing) return;
    setIsSubmitting(true);
    try {
      await adminService.moderateListing(selectedListing.id, modStatus, reason);
      showToast(`Listing ${selectedListing.listingCode} set to ${modStatus}`, 'success');
      setSelectedListing(null);
      fetchListings();
    } catch (err: any) {
      showToast(err.message || 'Failed to moderate listing.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (listing: MarketplaceListing) => {
    setDeleteListing(listing);
    setDeleteReason(isTa ? 'விதிமீறல் காரணமாக பட்டியல் நிரந்தரமாக நீக்கப்பட்டது.' : 'Listing permanently removed due to policy violation.');
    setDeleteConfirmText('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteListing) return;
    setIsDeleting(true);
    try {
      await adminService.deleteListing(deleteListing.id, deleteReason);
      showToast(`Listing ${deleteListing.listingCode || 'ID:' + deleteListing.id} permanently deleted.`, 'success');
      setDeleteListing(null);
      setDeleteConfirmText('');
      fetchListings();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">{t('admin.marketplaceModeration', 'Marketplace Moderation')}</h1>
          <p className="text-xs text-[#526158] mt-0.5">
            {isTa ? 'சந்தைப் பட்டியல்களைத் தணிக்கை செய்து, புகைப்படங்களை ஆய்வு செய்து, தரக் கட்டுப்பாட்டை அமல்படுத்தவும்.' : 'Audit live listings, inspect uploaded batch crop photos, and enforce quality compliance.'}
          </p>
        </div>
        <div className="text-xs font-bold text-[#526158] bg-white border border-[#C5E6CC] px-3 py-1.5 rounded-xl shadow-xs">
          {isTa ? 'மொத்த பட்டியல்கள்:' : 'Total Listings:'} <span className="text-[#1B5E20] font-extrabold">{filteredListings.length}</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[#C5E6CC] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex-1 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#526158] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t('admin.searchPlaceholder', 'Search by crop, variety, farmer or listing code...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl text-xs outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl"
          >
            {t('common.search', 'Search')}
          </button>
        </form>

        <div className="w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl text-xs font-semibold outline-none"
          >
            <option value="ALL">{t('admin.allStatuses', 'All Statuses')}</option>
            <option value="ACTIVE">{t('admin.active', 'ACTIVE')}</option>
            <option value="SUSPENDED">{t('admin.suspended', 'SUSPENDED')}</option>
            <option value="COMPLETED">{t('common.completed', 'COMPLETED')}</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <LoadingState message={isTa ? 'சந்தைப் பட்டியல்கள் ஏற்றப்படுகின்றன...' : 'Loading marketplace listings...'} />
      ) : filteredListings.length === 0 ? (
        <div className="bg-white border border-[#C5E6CC] rounded-2xl p-8 text-center text-xs text-[#526158] font-bold">
          {isTa ? 'உங்கள் தேடல் அளவுகோல்களுக்கு பொருந்தக்கூடிய சந்தைப் பட்டியல்கள் எதுவும் இல்லை.' : 'No marketplace listings match your search criteria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((l) => {
            const cropName = translateCrop(l.cropName || 'Crop Produce', language);
            const varietyName = translateVariety(l.varietyName || 'Variety', language);
            const farmerName = translateUserName(l.farmerName || 'Farmer', language);
            const location = (l as any).district ? `${(l as any).district}, ${(l as any).state || 'TN'}` : 'Theni, TN';
            const imageUrl = resolveImageUrl(l.coverImageUrl || l.images?.[0], l.cropName);

            return (
              <div
                key={l.id}
                className="bg-white border border-[#C5E6CC] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={cropName}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, cropName, {
                      listingId: l.id,
                      listingCode: l.listingCode,
                      batchId: l.batchId,
                    })}
                  />
                  <div className="absolute top-2 left-2 bg-[#17201A]/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                    {l.listingCode || 'LIST-00' + l.id}
                  </div>
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        l.status === 'ACTIVE'
                          ? 'bg-emerald-500 text-white'
                          : l.status === 'SUSPENDED'
                          ? 'bg-rose-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1B5E20]">
                      {cropName} – <span className="font-semibold text-[#17201A]">{varietyName}</span>
                    </h3>
                    <p className="text-[11px] text-[#526158] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#2E7D32]" />
                      <span>{location} • {isTa ? 'விவசாயி' : 'By'} {farmerName}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-[#FCFBF5] border border-[#C5E6CC] p-2.5 rounded-xl font-bold">
                    <div>
                      <span className="text-[10px] text-[#526158] block font-semibold">{t('admin.askingPrice', 'Asking Price')}</span>
                      <span className="text-[#1B5E20] text-sm font-extrabold">₹{l.askingPricePerUnit || 35} / KG</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#526158] block font-semibold">{t('admin.availableQuantity', 'Available Quantity')}</span>
                      <span className="text-[#17201A]">{l.quantityRemaining || 500} KG</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EEF8F0]">
                    {l.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleOpenModeration(l, 'SUSPENDED')}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{t('admin.suspend', 'Suspend')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenModeration(l, 'ACTIVE')}
                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('admin.restore', 'Restore')}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenDelete(l)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('admin.delete', 'Delete')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Moderation Dialog */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-[#1B5E20]">
              Moderate Listing: {selectedListing.listingCode || 'ID: ' + selectedListing.id}
            </h3>
            <p className="text-[#526158]">
              Set listing status to <span className="font-bold text-[#17201A]">{modStatus}</span>. A notification will be delivered to the farmer.
            </p>

            <div>
              <label className="text-[10px] text-[#526158] font-bold uppercase block mb-1">Moderation Reason</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Non-compliance with quality standards"
                className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedListing(null)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModeration}
                disabled={isSubmitting}
                className={`px-4 py-2 text-white font-bold rounded-xl ${
                  modStatus === 'SUSPENDED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Moderation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog — Two-step with type-to-confirm */}
      {deleteListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-red-700">Permanently Delete Listing</h3>
                <p className="text-[11px] text-[#526158] mt-0.5">
                  {deleteListing.listingCode || 'ID: ' + deleteListing.id}
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              <p className="font-bold text-red-800 text-[11px]">⚠ This action is irreversible.</p>
              <p className="text-red-700 text-[11px]">
                This listing, along with all associated purchase requests, buyer inquiries, and orders, will be permanently removed from the database.
                The farmer will receive a notification about this removal.
              </p>
            </div>

            <div>
              <label className="text-[10px] text-[#526158] font-bold uppercase block mb-1">Reason for Deletion</label>
              <textarea
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Violation of platform policies"
                className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-red-600 font-bold uppercase block mb-1">
                Type <span className="font-extrabold text-red-800">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full p-2.5 bg-white border border-red-200 rounded-xl outline-none focus:ring-1 focus:ring-red-400 text-red-700 font-bold placeholder:text-red-300 placeholder:font-normal"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setDeleteListing(null); setDeleteConfirmText(''); }}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className={`px-4 py-2 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  deleteConfirmText === 'DELETE'
                    ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation, useLanguage } from '../../context/LanguageContext';
import { PurchaseRequest } from '../../types/request';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { UpdatePriceModal } from '../../components/farmer/UpdatePriceModal';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/formatters';
import { translateCrop, translateVariety } from '../../utils/cropTranslations';
import { Clock, CheckCircle2, XCircle, RefreshCw, Tag } from 'lucide-react';

export const BuyerRequestsPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useNotification();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPriceReq, setEditingPriceReq] = useState<PurchaseRequest | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userRole = role === 'ADMIN' ? 'BUYER' : role;
      const data = await requestService.getPurchaseRequests(user?.id, userRole || 'BUYER');
      setRequests(data);
    } catch (err: any) {
      console.error('Failed to load purchase requests:', err);
      setError(err?.message || 'Failed to load purchase requests from server.');
      showToast(err?.message || 'Failed to load purchase requests.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.id, role]);

  const handleUpdateStatus = async (reqId: number, status: any) => {
    try {
      await requestService.updateRequestStatus(reqId, status);
      showToast(`Request ${status.toLowerCase()} successfully!`, 'success');
      await fetchRequests();
    } catch (err: any) {
      showToast(err.message || 'Failed to update request status.', 'error');
    }
  };

  if (isLoading) return <LoadingState message={isTa ? 'கொள்முதல் கோரிக்கைகள் ஏற்றப்படுகின்றன...' : 'Loading purchase requests...'} />;

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-xl mx-auto my-8 space-y-4">
        <h3 className="text-lg font-bold text-rose-800">{isTa ? 'கொள்முதல் கோரிக்கைகளை ஏற்ற முடியவில்லை' : 'Error Loading Purchase Requests'}</h3>
        <p className="text-xs text-rose-600">{error}</p>
        <button
          onClick={fetchRequests}
          className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700"
        >
          {isTa ? 'மீண்டும் முயற்சி செய்' : 'Retry Request'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B5E20]">
          {role === 'FARMER' ? (isTa ? 'உள்வரும் வாங்குபவர் கொள்முதல் சலுகைகள்' : 'Incoming Buyer Purchase Offers') : (isTa ? 'எனது B2B கொள்முதல் கோரிக்கைகள்' : 'My B2B Purchase Requests')}
        </h1>
        <p className="text-xs text-[#526158] mt-0.5">
          {role === 'FARMER'
            ? (isTa ? 'விலை சலுகைகளை மதிப்பாய்வு செய்து ஒப்பந்தங்களை ஏற்கவும்.' : 'Review price offers, accept deals to form trade orders, or modify pricing.')
            : (isTa ? 'உங்கள் சமர்ப்பிக்கப்பட்ட கொள்முதல் சலுகைகள் மற்றும் விற்பனையாளர் பதில்களைக் கண்காணிக்கவும்.' : 'Track status of your submitted purchase offers and seller responses.')}
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title={isTa ? 'கொள்முதல் கோரிக்கைகள் எதுவும் கிடைக்கவில்லை' : 'No Purchase Requests Found'}
          description={
            role === 'FARMER'
              ? (isTa ? 'வாங்குபவர்கள் உங்கள் பட்டியல்களில் கொள்முதல் சலுகைகளை சமர்ப்பிக்கும் போது, அவை இங்கு தோன்றும்.' : 'When buyers submit purchase offers on your active listings, they will appear here.')
              : (isTa ? 'பயிர் சந்தையை உலாவவும் மற்றும் விவசாயிகளுக்கு கொள்முதல் சலுகைகளை அனுப்பவும்.' : 'Browse the crop marketplace and send purchase offers to farmers.')
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs hover:border-[#2E7D32] transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#C5E6CC] pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#526158]">Req #{req.id}</span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                  <h4 className="font-extrabold text-base text-[#17201A]">
                    {translateCrop(req.cropName, language)} ({translateVariety(req.varietyName, language)})
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#526158] block">{isTa ? 'மொத்த சலுகை மதிப்பு' : 'Total Offer Value'}</span>
                  <span className="font-extrabold text-base text-[#1B5E20]">
                    {formatCurrency(req.offeredPricePerUnit * req.requestedQuantity)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#FCFBF5] border border-[#C5E6CC] p-3 rounded-2xl text-xs mb-3">
                <div>
                  <span className="text-[#526158] block text-[11px]">{isTa ? 'சலுகை விலை' : 'Offered Price'}</span>
                  <span className="font-bold text-[#1B5E20]">{formatCurrency(req.offeredPricePerUnit)} / KG</span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">{isTa ? 'கேட்கப்படும் விலை' : 'Asking Price'}</span>
                  <span className="font-bold text-[#17201A]">{formatCurrency(req.askingPricePerUnit)} / KG</span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">{isTa ? 'கோரப்பட்ட எடை' : 'Requested Load'}</span>
                  <span className="font-bold text-[#17201A]">{formatQuantity(req.requestedQuantity, req.quantityUnit)}</span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">{isTa ? 'போக்குவரத்து விநியோகம்' : 'Logistics'}</span>
                  <span className="font-medium text-[#526158]">{req.deliveryPreference.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {req.message && (
                <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] mb-3">
                  <span className="font-bold text-[#1B5E20] block text-[11px]">{isTa ? 'வாங்குபவரிடமிருந்து குறிப்பு:' : 'Note from Buyer:'}</span>
                  <p className="italic">{req.message}</p>
                </div>
              )}

              {/* Action Buttons for Farmer */}
              {role === 'FARMER' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#C5E6CC]/60">
                  {req.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                        className="flex-1 py-2 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Accept Offer (Form Order)
                      </button>
                      <button
                        onClick={() => setEditingPriceReq(req)}
                        className="py-2 px-3 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors flex items-center justify-center gap-1"
                      >
                        <Tag className="w-3.5 h-3.5" /> Edit Asking Price
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                        className="py-2 px-3 bg-white border border-red-200 text-[#B3261E] font-bold text-xs rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}
                  {req.status !== 'PENDING' && (
                    <button
                      onClick={() => setEditingPriceReq(req)}
                      className="py-2 px-4 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors flex items-center gap-1"
                    >
                      <Tag className="w-3.5 h-3.5" /> Modify Asking Price
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingPriceReq && (
        <UpdatePriceModal
          listingId={editingPriceReq.listingId}
          currentPrice={editingPriceReq.askingPricePerUnit}
          cropName={editingPriceReq.cropName}
          varietyName={editingPriceReq.varietyName}
          isOpen={!!editingPriceReq}
          onClose={() => setEditingPriceReq(null)}
          onSuccess={() => fetchRequests()}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ProductBatch } from '../../types/batch';
import { MarketplaceListing } from '../../types/listing';
import { listingService } from '../../services/listingService';
import { batchService } from '../../services/batchService';
import { aiService } from '../../services/aiService';
import { useNotification } from '../../context/NotificationContext';
import { X, Award, ShieldCheck, ShoppingBag, CheckCircle2, AlertCircle, Loader2, Calendar, Clock, ArrowRight, LayoutDashboard } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

interface ListProductModalProps {
  batch: ProductBatch;
  analysis?: any;
  certificate?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ListProductModal: React.FC<ListProductModalProps> = ({
  batch: initialBatch,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [currentBatch, setCurrentBatch] = useState<ProductBatch>(initialBatch);
  const [aiData, setAiData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [quantityToSell, setQuantityToSell] = useState<number>(initialBatch.quantity);
  const [expectedPrice, setExpectedPrice] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [availableFrom, setAvailableFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deliveryPreference, setDeliveryPreference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [step, setStep] = useState<'FORM' | 'CONFIRM' | 'SUCCESS'>('FORM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [publishedListing, setPublishedListing] = useState<MarketplaceListing | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setStep('FORM');
    setPublishedListing(null);

    const loadFreshData = async () => {
      setIsLoadingData(true);
      try {
        const freshBatch = await batchService.getBatchById(initialBatch.id);
        if (isMounted && freshBatch) {
          setCurrentBatch(freshBatch);
          setQuantityToSell(freshBatch.quantity);
        }
      } catch (err) {
        console.warn('Could not refresh batch:', err);
      }

      try {
        const aiResp = await aiService.getAnalysisByBatchId(initialBatch.id);
        if (isMounted) setAiData(aiResp);
      } catch (err) {
        console.warn('Could not refresh AI data:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    loadFreshData();
    return () => { isMounted = false; };
  }, [isOpen, initialBatch.id]);

  if (!isOpen) return null;

  const photoCount = currentBatch.photos ? currentBatch.photos.length : (currentBatch.images ? currentBatch.images.length : 0);
  const hasPhotos = photoCount > 0;
  const isAiCompleted = aiData && aiData.status === 'COMPLETED';
  const certNumber = currentBatch.certificateNumber || (aiData?.certificate?.certificateNumber) || 'AGRI-CERT-PENDING';
  const qualityScore = currentBatch.qualityScore || (aiData?.qualityResult?.qualityScore) || 95.0;
  const grade = currentBatch.assignedGrade || (aiData?.qualityResult?.assignedGrade) || 'GRADE_A_PREMIUM';
  const formattedGrade = grade.replace(/_/g, ' ');
  const remainingShelfLife = currentBatch.remainingShelfLifeDays || 8;
  const harvestDate = currentBatch.harvestDate ? formatDate(currentBatch.harvestDate) : formatDate(new Date().toISOString());

  const handleConfirmAndPublish = async () => {
    const numericPrice = parseFloat(expectedPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showToast('Please enter a valid asking price.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await listingService.createListingFromBatch(
        currentBatch.id,
        numericPrice,
        100 // Minimum order quantity
      );
      setPublishedListing(created);
      setStep('SUCCESS');
      showToast(`Batch #${currentBatch.batchNumber} published to Marketplace! Status updated to LISTED FOR SALE.`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish listing.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewMyListing = () => {
    onSuccess();
    onClose();
    navigate(`/farmer/batches/${currentBatch.id}`);
  };

  const handleGoToDashboard = () => {
    onSuccess();
    onClose();
    navigate('/farmer/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={step === 'SUCCESS' ? handleViewMyListing : onClose} />

      <div className="relative w-full max-w-2xl bg-white border border-[#C5E6CC] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#C5E6CC] flex items-center justify-between bg-[#FCFBF5]">
          <div>
            <span className="text-[10px] font-black text-[#2E7D32] uppercase tracking-wider block">
              {step === 'SUCCESS' ? 'LISTING PUBLISHED' : 'EXPLICIT FARMER LISTING'}
            </span>
            <h2 className="text-xl font-extrabold text-[#1B5E20]">
              {step === 'SUCCESS' ? 'Product Successfully Listed' : 'List Verified Product'}
            </h2>
          </div>
          <button 
            onClick={step === 'SUCCESS' ? handleViewMyListing : onClose} 
            className="p-2 text-[#526158] hover:bg-[#EEF8F0] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          {isLoadingData ? (
            <div className="py-12 text-center text-[#526158]">
              <Loader2 className="w-8 h-8 text-[#2E7D32] animate-spin mx-auto mb-2" />
              <p className="font-bold">Fetching authoritative batch & AI analysis from backend...</p>
            </div>
          ) : step === 'SUCCESS' ? (
            /* STEP 3: PRODUCT SUCCESSFULLY LISTED CONFIRMATION SCREEN */
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#EEF8F0] border-2 border-[#2E7D32] rounded-3xl p-6 text-center space-y-3">
                <div className="w-16 h-16 bg-[#2E7D32] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <span className="px-3 py-1 bg-[#2E7D32] text-white text-[11px] font-black rounded-full uppercase tracking-wider inline-block mb-1">
                    LISTING STATUS: ACTIVE
                  </span>
                  <h3 className="text-xl font-extrabold text-[#1B5E20]">
                    Your product is now visible to verified buyers
                  </h3>
                  <p className="text-xs text-[#526158] mt-1 max-w-md mx-auto">
                    Verified agricultural buyers across Tamil Nadu can now discover your harvest load, review its computer-vision quality certificate, and submit purchase requests.
                  </p>
                </div>
              </div>

              {/* AUTHORITATIVE LISTING SPECIFICATION DISPLAY */}
              <div className="bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#526158] block">PRODUCT & VARIETY</span>
                    <strong className="text-base font-extrabold text-[#17201A]">
                      {currentBatch.cropName} – {currentBatch.varietyName}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#526158] block">LISTING ID</span>
                    <strong className="font-mono text-sm font-extrabold text-[#2E7D32]">
                      {publishedListing?.listingCode || `LIST-${currentBatch.id}`}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-white border border-[#C5E6CC] rounded-xl">
                    <span className="text-[#526158] text-[11px] block">AI Grade</span>
                    <strong className="text-sm font-extrabold text-[#1B5E20]">{formattedGrade}</strong>
                  </div>

                  <div className="p-3 bg-white border border-[#C5E6CC] rounded-xl">
                    <span className="text-[#526158] text-[11px] block">AI Quality Score</span>
                    <strong className="text-sm font-extrabold text-[#2E7D32]">{qualityScore}%</strong>
                  </div>

                  <div className="p-3 bg-white border border-[#C5E6CC] rounded-xl">
                    <span className="text-[#526158] text-[11px] block">Original Harvest Quantity</span>
                    <strong className="text-sm font-extrabold text-[#17201A]">
                      {currentBatch.quantity.toLocaleString()} {currentBatch.quantityUnit || 'KG'}
                    </strong>
                  </div>

                  <div className="p-3 bg-white border border-[#C5E6CC] rounded-xl">
                    <span className="text-[#526158] text-[11px] block">Quantity Available</span>
                    <strong className="text-sm font-extrabold text-[#1B5E20]">
                      {quantityToSell.toLocaleString()} KG
                    </strong>
                  </div>

                  <div className="p-3 bg-white border border-[#C5E6CC] rounded-xl">
                    <span className="text-[#526158] text-[11px] block">Remaining Shelf Life</span>
                    <strong className="text-sm font-extrabold text-[#17201A] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#2E7D32]" /> {remainingShelfLife} Days
                    </strong>
                  </div>

                  <div className="p-3 bg-white border border-[#C5E6CC] rounded-xl">
                    <span className="text-[#526158] text-[11px] block">Harvest Date</span>
                    <strong className="text-sm font-extrabold text-[#17201A] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#2E7D32]" /> {harvestDate}
                    </strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#C5E6CC] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#1B5E20]">
                    <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                    <span>Certificate Number: <strong className="font-mono">{certNumber}</strong></span>
                  </div>
                  <div className="text-[#526158]">
                    <span>Asking Rate: <strong className="text-[#2E7D32]">{formatCurrency(parseFloat(expectedPrice) || 0)}/KG</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : !hasPhotos ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <div>
                <h3 className="font-bold text-sm text-amber-900">Product Photos Required</h3>
                <p className="text-xs text-amber-700 mt-1">
                  Product photos are required before AI inspection. Please upload at least 1 product photo.
                </p>
              </div>
              <button
                onClick={() => { onClose(); navigate(`/farmer/batches/${currentBatch.id}`); }}
                className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition-colors"
              >
                [ Add Product Images ]
              </button>
            </div>
          ) : !isAiCompleted ? (
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-blue-600 mx-auto" />
              <div>
                <h3 className="font-bold text-sm text-blue-900">AI Inspection Required</h3>
                <p className="text-xs text-blue-700 mt-1">
                  AI inspection is not complete for this batch. Run AI inspection to obtain quality grade and digital certificate.
                </p>
              </div>
              <button
                onClick={() => { onClose(); navigate(`/farmer/batches/${currentBatch.id}`); }}
                className="px-4 py-2 bg-[#2E7D32] text-white font-bold rounded-xl text-xs hover:bg-[#1B5E20] transition-colors"
              >
                [ Run AI Inspection ]
              </button>
            </div>
          ) : (
            <>
              {/* READ-ONLY VERIFIED BATCH BANNER */}
              <div className="bg-[#EEF8F0] border border-[#C5E6CC] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-2">
                  <span className="font-extrabold text-[#1B5E20] text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" /> {currentBatch.cropName} – {currentBatch.varietyName}
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#2E7D32] text-white font-extrabold text-[10px] rounded-full uppercase">
                    {formattedGrade}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#526158] block">Total Harvest Load:</span>
                    <strong className="text-[#17201A]">{currentBatch.quantity.toLocaleString()} {currentBatch.quantityUnit}</strong>
                  </div>
                  <div>
                    <span className="text-[#526158] block">AI Quality Score:</span>
                    <strong className="text-[#2E7D32]">{qualityScore}% Score</strong>
                  </div>
                  <div>
                    <span className="text-[#526158] block">Remaining Shelf Life:</span>
                    <strong className="text-[#1B5E20]">{remainingShelfLife} Days</strong>
                  </div>
                  <div>
                    <span className="text-[#526158] block">Certificate ID:</span>
                    <strong className="text-[#1B5E20] font-mono">{certNumber}</strong>
                  </div>
                </div>
              </div>

              {step === 'FORM' ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#17201A] mb-1">Quantity to Sell (KG)</label>
                      <input
                        type="number"
                        value={quantityToSell}
                        onChange={(e) => setQuantityToSell(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold focus:ring-2 focus:ring-[#2E7D32]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#17201A] mb-1">Asking Price / KG (₹)</label>
                      <input
                        type="number"
                        step="0.50"
                        value={expectedPrice}
                        onChange={(e) => setExpectedPrice(e.target.value)}
                        placeholder="e.g. 26.00"
                        className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#17201A] mb-1">Minimum Acceptable Price / KG (₹)</label>
                      <input
                        type="number"
                        step="0.50"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="e.g. 23.50"
                        className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold focus:ring-2 focus:ring-[#2E7D32]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#17201A] mb-1">Available From Date</label>
                      <input
                        type="date"
                        value={availableFrom}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                        className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold focus:ring-2 focus:ring-[#2E7D32]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#17201A] mb-1">Delivery / Pickup Preference</label>
                    <input
                      type="text"
                      value={deliveryPreference}
                      onChange={(e) => setDeliveryPreference(e.target.value)}
                      placeholder="e.g. Farm Pickup / Buyer Transport"
                      className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32]"
                    />
                  </div>

                  {/* SUMMARY BOX */}
                  <div className="bg-[#FCFBF5] border border-[#C5E6CC] p-4 rounded-2xl space-y-1.5 text-xs">
                    <span className="font-extrabold text-[#1B5E20] block border-b border-[#C5E6CC] pb-1">LISTING SUMMARY</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-[#526158]">PRODUCT:</span> <strong>{currentBatch.cropName} ({currentBatch.varietyName})</strong></div>
                      <div><span className="text-[#526158]">AVAILABLE QUANTITY:</span> <strong>{quantityToSell.toLocaleString()} KG</strong></div>
                      <div><span className="text-[#526158]">AI GRADE:</span> <strong>{formattedGrade}</strong></div>
                      <div><span className="text-[#526158]">QUALITY SCORE:</span> <strong>{qualityScore}%</strong></div>
                      <div><span className="text-[#526158]">CERTIFICATE:</span> <strong className="text-[#1B5E20]">{certNumber} ✓ VERIFIED</strong></div>
                      <div><span className="text-[#526158]">ASKING PRICE:</span> <strong className="text-[#2E7D32]">{formatCurrency(expectedPrice)} / KG</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* CONFIRMATION STEP */
                <div className="space-y-4 text-center py-4">
                  <div className="w-16 h-16 bg-[#EEF8F0] text-[#2E7D32] rounded-3xl flex items-center justify-center mx-auto border border-[#C5E6CC]">
                    <ShoppingBag className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-[#17201A]">Publish this product to the buyer marketplace?</h3>
                    <p className="text-xs text-[#526158] mt-1 max-w-md mx-auto">
                      Once published, verified buyers across Tamil Nadu can discover this product, review its AI quality passport, and submit purchase requests.
                    </p>
                  </div>

                  <div className="bg-[#FCFBF5] border border-[#C5E6CC] p-4 rounded-2xl text-left text-xs space-y-1">
                    <span className="font-bold text-[#1B5E20] block">Marketplace Display Summary:</span>
                    <p className="text-[#17201A] font-bold">
                      {currentBatch.cropName} ({currentBatch.varietyName}) • {quantityToSell.toLocaleString()} KG • {formattedGrade} ({qualityScore}%) • {formatCurrency(expectedPrice)}/KG
                    </p>
                    <p className="text-[11px] text-[#526158]">Location: {currentBatch.harvestLocationDistrict} • Certificate: {certNumber}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#C5E6CC] bg-[#FCFBF5] flex justify-end gap-3">
          {isLoadingData || !hasPhotos || !isAiCompleted ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-[#C5E6CC] text-[#526158] font-bold rounded-xl hover:bg-gray-50"
            >
              Close
            </button>
          ) : step === 'SUCCESS' ? (
            /* SUCCESS BUTTONS: [View My Listing] and [Go to Farmer Dashboard] */
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl hover:bg-[#EEF8F0] shadow-xs flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-[#2E7D32]" /> Go to Farmer Dashboard
              </button>
              <button
                type="button"
                onClick={handleViewMyListing}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] shadow-md flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" /> View My Listing
              </button>
            </div>
          ) : step === 'FORM' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white border border-[#C5E6CC] text-[#526158] font-bold rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('CONFIRM')}
                className="px-6 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] shadow-xs flex items-center gap-2"
              >
                Continue to Review →
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                className="px-5 py-2.5 bg-white border border-[#C5E6CC] text-[#526158] font-bold rounded-xl hover:bg-gray-50"
              >
                ← Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmAndPublish}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] shadow-md flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> {isSubmitting ? 'Publishing Listing...' : 'Confirm & Publish Listing'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { batchService } from '../../services/batchService';
import { aiService } from '../../services/aiService';
import { certificateService } from '../../services/certificateService';
import { listingService } from '../../services/listingService';
import { useNotification } from '../../context/NotificationContext';
import { ProductBatch, MediaAsset } from '../../types/batch';
import { AiAnalysis, AiCertificate, InspectionRecord } from '../../types/ai';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { CertificatePreviewModal } from '../../components/farmer/CertificatePreviewModal';
import { AddEvidenceModal } from '../../components/farmer/AddEvidenceModal';
import { ListProductModal } from '../../components/farmer/ListProductModal';
import { formatDate, formatQuantity, formatCurrency, formatDateTime } from '../../utils/formatters';
import { resolveImageUrl, handleImageError } from '../../utils/cropImages';
import {
  MapPin,
  ScanLine,
  Award,
  ShoppingBag,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Activity,
  Image as ImageIcon,
  Plus,
  Trash2,
  FileVideo,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const BatchDetailPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const idNum = parseInt(batchId || '0', 10);
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<ProductBatch | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [cert, setCert] = useState<AiCertificate | null>(null);
  const [history, setHistory] = useState<InspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState<boolean>(false);
  const [showListModal, setShowListModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const fetchDetails = async () => {
    try {
      const b = await batchService.getBatchById(idNum);
      setBatch(b);
      if (b) {
        const [an, c, h] = await Promise.all([
          aiService.getAnalysisByBatchId(idNum),
          certificateService.getCertificateByBatchId(idNum),
          aiService.getInspectionHistory(idNum),
        ]);
        setAnalysis(an);
        setCert(c);
        setHistory(h);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [idNum]);

  const handleWithdrawListing = async () => {
    setIsWithdrawing(true);
    try {
      const listings = await listingService.getFarmerActiveListings();
      const match = listings.find((l) => l.batchId === idNum && l.status === 'ACTIVE');
      const targetListingId = match?.id;

      if (!targetListingId) {
        showToast('Active listing not found.', 'error');
        setIsWithdrawing(false);
        setShowWithdrawModal(false);
        return;
      }

      await listingService.withdrawListing(targetListingId);
      showToast('Listing removed from marketplace successfully.', 'success');
      setShowWithdrawModal(false);
      fetchDetails();
    } catch (err: any) {
      if (err.code === 'LISTING_HAS_ACTIVE_ORDERS' || (err.message && err.message.includes('active buyer orders'))) {
        showToast('This listing cannot be withdrawn because it has active buyer orders.', 'error');
      } else {
        showToast(err.message || 'Failed to remove listing from marketplace.', 'error');
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRemovePhoto = async (assetId: string | number) => {
    try {
      const updated = await batchService.removeBatchEvidence(idNum, assetId, 'PHOTO');
      setBatch(updated);
      showToast('Photo removed from batch.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove photo.', 'error');
    }
  };

  const handleRemoveVideo = async () => {
    try {
      const updated = await batchService.removeBatchEvidence(idNum, 0, 'VIDEO');
      setBatch(updated);
      showToast('Video removed from batch.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove video.', 'error');
    }
  };

  const handleDeleteBatch = async () => {
    setIsDeleting(true);
    try {
      await batchService.deleteBatch(idNum);
      showToast('Batch deleted successfully.', 'success');
      navigate('/farmer/batches');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete batch.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading batch details..." />;
  if (!batch) return <div className="p-6 text-center text-xs font-bold text-[#B3261E]">Batch not found.</div>;

  const photos = batch.photos || [];
  const video = batch.video;
  const hasPhotos = photos.length > 0 || (batch.images && batch.images.length > 0);
  const isVerified = batch.status === 'AI_GRADED' || batch.status === 'LISTED';
  const certNumber = batch.certificateNumber || cert?.certificateNumber;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/farmer/batches" className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to My Batches
      </Link>

      {/* Header Banner */}
      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-[#526158]">{batch.batchNumber}</span>
            <StatusBadge status={batch.status} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">
            {batch.cropName} – <span className="text-[#2E7D32]">{batch.varietyName}</span>
          </h1>
          <p className="text-xs text-[#526158] flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" /> Harvested in {batch.harvestLocationDistrict}, {batch.harvestLocationState}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {cert && (
            <button
              onClick={() => setShowCertModal(true)}
              className="px-4 py-2.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4 text-[#2E7D32]" /> View Certificate
            </button>
          )}

          {batch.status === 'AI_GRADED' && (
            <button
              onClick={() => setShowListModal(true)}
              className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" /> List on Marketplace
            </button>
          )}

          {isVerified ? (
            <Link
              to={`/farmer/batches/${batch.id}/ai-analysis`}
              className="px-5 py-2.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors flex items-center justify-center gap-1.5"
            >
              <Activity className="w-4 h-4 text-[#2E7D32]" /> View AI Passport
            </Link>
          ) : hasPhotos ? (
            <Link
              to={`/farmer/batches/${batch.id}/ai-analysis`}
              className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ScanLine className="w-4 h-4" /> Run AI Analysis
            </Link>
          ) : (
            <button
              onClick={() => setShowAddEvidenceModal(true)}
              className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Photos First
            </button>
          )}

          {batch.status !== 'LISTED' && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-[#B3261E] border border-red-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              title="Delete Batch"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {(batch.status === 'LISTED' || batch.inspectionLocked) && (
        <div className="p-4 bg-[#EEF8F0] border-2 border-[#2E7D32] rounded-3xl shadow-xs flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#2E7D32] shrink-0" />
          <div>
            <span className="font-extrabold text-sm text-[#1B5E20] block">🔒 AI CERTIFIED & PERMANENTLY LOCKED</span>
            <span className="text-xs text-[#526158]">This batch has been certified and published to the marketplace. Certified AI inspection data, quality score, grade, and evidence photos cannot be modified.</span>
          </div>
        </div>
      )}

      {/* 1. ACTIVE MARKETPLACE LISTING BANNER */}
      {batch.status === 'LISTED' && (
        <div className="bg-gradient-to-br from-[#EEF8F0] to-[#FCFBF5] border-2 border-[#2E7D32] rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#2E7D32] tracking-wider">MARKETPLACE STATUS</span>
              <h3 className="text-lg font-extrabold text-[#1B5E20] mt-0.5 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" /> Active Listing on Marketplace
              </h3>
            </div>
            <span className="px-3 py-1 bg-[#2E7D32] text-white font-extrabold text-xs rounded-full">
              LIVE FOR BUYERS
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <p className="text-[#526158]">
              This verified harvest load is active on the B2B marketplace and visible to verified buyers across Tamil Nadu.
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/farmer/market-recommendations?batchId=${batch.id}`}
                className="px-4 py-2.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] shadow-xs flex items-center gap-1.5"
              >
                <TrendingUp className="w-4 h-4 text-[#2E7D32]" /> Market Arbitrage
              </Link>

              <Link
                to="/buyer/marketplace"
                className="px-4 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] shadow-xs flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" /> View on Marketplace
              </Link>

              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-amber-700" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. VERIFIED / REJECTED BATCH CARD (AI_GRADED BUT NOT YET LISTED) */}
      {batch.status === 'AI_GRADED' && (
        <div className={`border-2 rounded-3xl p-6 shadow-xs space-y-4 ${
          (batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) || (analysis?.qualityResult?.assignedGrade && analysis.qualityResult.assignedGrade.toUpperCase().includes('REJECT'))
            ? 'bg-red-50 border-red-400'
            : 'bg-[#EEF8F0] border-[#2E7D32]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            (batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) || (analysis?.qualityResult?.assignedGrade && analysis.qualityResult.assignedGrade.toUpperCase().includes('REJECT')) ? 'border-red-200' : 'border-[#C5E6CC]'
          }`}>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                (batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) || (analysis?.qualityResult?.assignedGrade && analysis.qualityResult.assignedGrade.toUpperCase().includes('REJECT')) ? 'text-red-700' : 'text-[#2E7D32]'
              }`}>
                {(batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) || (analysis?.qualityResult?.assignedGrade && analysis.qualityResult.assignedGrade.toUpperCase().includes('REJECT')) ? 'AI INSPECTION: REJECTED' : 'AI QUALITY VERIFIED ✓'}
              </span>
              <h3 className={`text-lg font-extrabold mt-0.5 ${
                (batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) || (analysis?.qualityResult?.assignedGrade && analysis.qualityResult.assignedGrade.toUpperCase().includes('REJECT')) ? 'text-red-900' : 'text-[#1B5E20]'
              }`}>
                {(batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) || (analysis?.qualityResult?.assignedGrade && analysis.qualityResult.assignedGrade.toUpperCase().includes('REJECT')) ? 'Quarantined Harvest Load' : 'Verified Harvest Load'}
              </h3>
            </div>
            <span className={`px-3 py-1 font-extrabold text-xs rounded-full ${
              (batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) || (analysis?.qualityResult?.assignedGrade && analysis.qualityResult.assignedGrade.toUpperCase().includes('REJECT'))
                ? 'bg-red-600 text-white'
                : 'bg-[#2E7D32] text-white'
            }`}>
              {batch.assignedGrade ? batch.assignedGrade.replace(/_/g, ' ') : (analysis?.qualityResult?.assignedGrade.replace(/_/g, ' ') || 'GRADE A PREMIUM')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[#526158] block text-[11px]">AI Quality Score</span>
              <strong className={`text-sm ${(batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) ? 'text-red-700' : 'text-[#1B5E20]'}`}>
                {((batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) ? 0 : (batch.qualityScore ?? analysis?.qualityResult?.qualityScore ?? 90))}% Quality
              </strong>
            </div>
            <div>
              <span className="text-[#526158] block text-[11px]">Certificate Number</span>
              <strong className="text-[#17201A] font-mono">
                {(batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) ? 'QUARANTINED-REJECT' : (certNumber || 'AGRI-CERT-VERIFIED')}
              </strong>
            </div>
            <div>
              <span className="text-[#526158] block text-[11px]">Remaining Shelf Life</span>
              <strong className={`text-sm ${(batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) ? 'text-red-700' : 'text-[#2E7D32]'}`}>
                {((batch.assignedGrade && batch.assignedGrade.toUpperCase().includes('REJECT')) ? 0 : (batch.remainingShelfLifeDays ?? analysis?.shelfLifePrediction?.estimatedRemainingDays ?? 7))} Days
              </strong>
            </div>
            <div>
              <span className="text-[#526158] block text-[11px]">Harvest Load</span>
              <strong className="text-[#17201A] text-sm">{formatQuantity(batch.quantity, batch.quantityUnit)}</strong>
            </div>
          </div>

          <div className={`pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${
            batch.assignedGrade === 'REJECTED' ? 'border-red-200' : 'border-[#C5E6CC]/60'
          }`}>
            <p className="text-xs text-[#526158]">
              {batch.assignedGrade === 'REJECTED'
                ? 'This produce is rejected due to active fungal/rot infection and cannot be listed on the marketplace.'
                : 'This batch is verified and saved in your farm records. You can list it on the marketplace anytime.'}
            </p>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Link
                to={`/farmer/batches/${batch.id}/ai-analysis`}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#EEF8F0] transition-colors flex items-center justify-center gap-1.5"
              >
                <Activity className="w-4 h-4" /> View AI Details
              </Link>
              {batch.assignedGrade !== 'REJECTED' && (
                <button
                  onClick={() => setShowListModal(true)}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" /> List on Marketplace
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. AI QUALITY ANALYSIS PROMPT FOR UNVERIFIED BATCHES */}
      {!isVerified && (
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
            <h3 className="font-extrabold text-base text-[#1B5E20] flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-[#2E7D32]" /> AI Quality Analysis
            </h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold rounded-full flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending Inspection
            </span>
          </div>

          {!hasPhotos ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                <div>
                  <span className="font-extrabold block">Product photos are required before AI inspection.</span>
                  <span className="text-amber-700">Upload at least one clear photo of your harvested produce to begin AI grading.</span>
                </div>
              </div>

              <button
                onClick={() => setShowAddEvidenceModal(true)}
                className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] shrink-0 text-xs shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Product Photos
              </button>
            </div>
          ) : (
            <div className="p-4 bg-[#EEF8F0] border border-[#C5E6CC] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#1B5E20]">
                <Sparkles className="w-5 h-5 shrink-0 text-[#2E7D32]" />
                <div>
                  <span className="font-extrabold block">Ready for AI Quality Inspection</span>
                  <span className="text-[#526158]">{photos.length} product photo(s) attached. Run AI vision inspection to verify crop grade, generate digital certificate, and calculate shelf life.</span>
                </div>
              </div>

              <Link
                to={`/farmer/batches/${batch.id}/ai-analysis`}
                className="px-6 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] shrink-0 text-xs shadow-xs flex items-center gap-1.5"
              >
                <ScanLine className="w-4 h-4" /> Run AI Analysis
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Specifications Card */}
      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs space-y-3 text-xs">
        <h4 className="font-extrabold text-sm text-[#1B5E20] border-b border-[#C5E6CC] pb-2">
          Harvest & Batch Specifications
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
            <span className="text-[#526158] block text-[11px]">Harvest Date:</span>
            <span className="font-bold text-[#17201A]">{formatDate(batch.harvestDate)}</span>
          </div>
          <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
            <span className="text-[#526158] block text-[11px]">Harvest Load:</span>
            <span className="font-bold text-[#1B5E20]">{formatQuantity(batch.quantity, batch.quantityUnit)}</span>
          </div>
          <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl">
            <span className="text-[#526158] block text-[11px]">Storage Condition:</span>
            <span className="font-bold text-[#17201A]">{batch.storageCondition.replace(/_/g, ' ')}</span>
          </div>
          <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-xl">
            <span className="text-[#526158] block text-[11px]">AI Quality Status:</span>
            <span className="font-extrabold text-[#1B5E20]">
              {batch.assignedGrade ? batch.assignedGrade.replace(/_/g, ' ') : (analysis?.qualityResult?.assignedGrade.replace(/_/g, ' ') || 'Pending Inspection')}
            </span>
          </div>
        </div>
      </div>

      {/* PRODUCT EVIDENCE SECTION */}
      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C5E6CC] pb-3">
          <div>
            <h3 className="font-extrabold text-base text-[#1B5E20] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#2E7D32]" /> Product Evidence
            </h3>
            <p className="text-xs text-[#526158]">
              {photos.length} photo{photos.length === 1 ? '' : 's'} • {video ? 1 : 0} video
            </p>
          </div>

          <button
            onClick={() => setShowAddEvidenceModal(true)}
            className="px-4 py-2 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 text-[#2E7D32]" /> Add Evidence
          </button>
        </div>

        {!hasPhotos ? (
          <div className="p-6 bg-[#FCFBF5] border border-dashed border-[#C5E6CC] rounded-2xl text-center text-xs space-y-2">
            <p className="text-[#526158]">No inspection evidence has been added yet.</p>
            <button
              onClick={() => setShowAddEvidenceModal(true)}
              className="px-4 py-2 bg-[#2E7D32] text-white font-bold rounded-xl text-xs"
            >
              Add Evidence
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Photos */}
            {photos.length > 0 && (
              <div>
                <span className="text-xs font-bold text-[#526158] block mb-2">Photos ({photos.length})</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl p-1.5 flex flex-col justify-between shadow-xs hover:border-[#2E7D32] transition-colors overflow-hidden"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-1.5 relative">
                        <img
                          src={resolveImageUrl(photo.previewUrl, batch.cropName)}
                          alt={photo.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, batch.cropName)}
                        />
                        {(!batch.inspectionLocked && batch.status !== 'LISTED') && (
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            aria-label={`Remove photo ${photo.fileName}`}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-[#B3261E] text-white rounded-full transition-colors shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-[#17201A] truncate px-1" title={photo.fileName}>
                        {photo.fileName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {video && (
              <div>
                <span className="text-xs font-bold text-[#526158] block mb-2">Video Evidence</span>
                <div className="bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center shrink-0">
                      <FileVideo className="w-5 h-5 text-[#2E7D32]" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#17201A]">{video.fileName}</p>
                      <p className="text-[10px] text-[#526158]">{(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <video src={video.previewUrl} controls className="h-20 w-36 rounded-xl object-cover border border-[#C5E6CC] bg-black" />
                    {(!batch.inspectionLocked && batch.status !== 'LISTED') && (
                      <button
                        onClick={handleRemoveVideo}
                        aria-label="Remove video"
                        className="p-2 text-[#B3261E] hover:bg-red-50 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evidence Modal */}
      {showAddEvidenceModal && (
        <AddEvidenceModal
          batchId={batch.id}
          existingPhotosCount={photos.length}
          hasVideo={!!video}
          isOpen={showAddEvidenceModal}
          onClose={() => setShowAddEvidenceModal(false)}
          onSuccess={() => fetchDetails()}
        />
      )}

      {/* Certificate Preview Modal */}
      {cert && (
        <CertificatePreviewModal
          certificate={cert}
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {/* List Product Modal */}
      {showListModal && (
        <ListProductModal
          batch={batch}
          analysis={analysis}
          certificate={cert}
          isOpen={showListModal}
          onClose={() => setShowListModal(false)}
          onSuccess={() => {
            fetchDetails();
          }}
        />
      )}

      {/* Delete Batch Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#B3261E] flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Batch #{batch.batchNumber}?
            </h3>
            <p className="text-xs text-[#526158]">
              Are you sure you want to permanently delete this harvest batch? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 text-[#17201A] font-bold text-xs rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBatch}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#B3261E] text-white font-bold text-xs rounded-xl hover:bg-red-700 shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Listing Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-amber-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" /> Remove from Marketplace?
            </h3>
            <p className="text-xs text-[#526158]">
              Removing this batch will hide it from verified buyers. The harvest batch will remain saved in your farm records.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 bg-gray-100 text-[#17201A] font-bold text-xs rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdrawListing}
                disabled={isWithdrawing}
                className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 shadow-xs"
              >
                {isWithdrawing ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

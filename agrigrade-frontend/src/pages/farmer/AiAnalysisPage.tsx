import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { batchService } from '../../services/batchService';
import { aiService } from '../../services/aiService';
import { certificateService } from '../../services/certificateService';
import { listingService } from '../../services/listingService';
import { ProductBatch, MediaAsset } from '../../types/batch';
import { AiAnalysis, AiCertificate, InspectionRecord, DefectResult } from '../../types/ai';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CropMismatchCard } from '../../components/farmer/CropMismatchCard';
import { LowConfidenceCard } from '../../components/farmer/LowConfidenceCard';
import { ShelfLifeWidget } from '../../components/farmer/ShelfLifeWidget';
import { InspectionHistoryTable } from '../../components/farmer/InspectionHistoryTable';
import { CertificatePreviewModal } from '../../components/farmer/CertificatePreviewModal';
import { ListProductModal } from '../../components/farmer/ListProductModal';
import { useNotification } from '../../context/NotificationContext';
import { BananaAnalysisCard } from '../../components/farmer/BananaAnalysisCard';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/formatters';
import { handleImageError } from '../../utils/cropImages';
import {
  Award,
  ScanLine,
  ArrowLeft,
  ShieldCheck,
  Activity,
  TrendingUp,
  CheckCircle2,
  Image as ImageIcon,
  ShoppingBag,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

type AnalysisPageState = 'LOADING' | 'READY' | 'ANALYZING' | 'NO_IMAGES' | 'CROP_MISMATCH' | 'LOW_CONFIDENCE' | 'COMPLETED';

export const AiAnalysisPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const idNum = parseInt(batchId || '0', 10);
  const autoRun = searchParams.get('autoRun') === 'true';
  const simulateMismatch = searchParams.get('mismatch') === 'true';
  const simulateLowConf = searchParams.get('lowConf') === 'true';

  const [pageState, setPageState] = useState<AnalysisPageState>('LOADING');
  const [batch, setBatch] = useState<ProductBatch | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [cert, setCert] = useState<AiCertificate | null>(null);
  const [history, setHistory] = useState<InspectionRecord[]>([]);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing inspection engine...');
  const [detectedCropName, setDetectedCropName] = useState<string>('Tomato');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [showListModal, setShowListModal] = useState<boolean>(false);

  // Load authoritative batch and analysis state on mount / id change
  const loadAuthoritativeData = async () => {
    setPageState('LOADING');
    try {
      const b = await batchService.getBatchById(idNum);
      if (!b) {
        setPageState('READY');
        setBatch(null);
        return;
      }
      setBatch(b);

      const [an, c, h] = await Promise.all([
        aiService.getAnalysisByBatchId(idNum),
        certificateService.getCertificateByBatchId(idNum),
        aiService.getInspectionHistory(idNum),
      ]);

      const latestHistoryAnalysis = (h && h.length > 0 && h[0].analysis) ? h[0].analysis : an;
      setAnalysis(latestHistoryAnalysis);
      setCert(c);
      setHistory(h);

      const photoCount = (b.photos?.length || 0) + (b.images?.length || 0);

      // Prioritize explicit autoRun parameter or pending AI status for fresh image evaluation
      if (autoRun || b.status === 'PENDING_AI') {
        executeAnalysis();
      } else if (an && an.status === 'COMPLETED' && (b.status === 'AI_GRADED' || b.status === 'LISTED')) {
        setPageState('COMPLETED');
      } else if (photoCount === 0) {
        setPageState('NO_IMAGES');
      } else {
        setPageState('READY');
      }
    } catch (err: any) {
      console.warn('Error loading batch/analysis data:', err);
      setPageState('READY');
    }
  };

  useEffect(() => {
    loadAuthoritativeData();
  }, [idNum]);

  // Execute AI Inspection
  const executeAnalysis = async () => {
    setPageState('ANALYZING');
    setLoadingStep('Analyzing your product photos...');

    const steps = [
      'Validating crop & cultivar features...',
      'Checking crop classification & lighting threshold...',
      'Evaluating quality & defect segmentation...',
      'Calculating dynamic remaining shelf life...',
      'Generating cryptographic AI certificate...',
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 300);

    try {
      const res = await aiService.runBatchAnalysis(idNum, {
        simulateMismatch,
        simulateLowConfidence: simulateLowConf,
      });

      clearInterval(interval);
      setAnalysis(res);

      if (res.status === 'COMPLETED') {
        // Re-fetch authoritative batch & certificate directly from backend
        const [freshBatch, freshCert, freshHistory] = await Promise.all([
          batchService.getBatchById(idNum),
          certificateService.getCertificateByBatchId(idNum),
          aiService.getInspectionHistory(idNum),
        ]);

        if (freshBatch) setBatch(freshBatch);
        if (freshCert) setCert(freshCert);
        setHistory(freshHistory);
        setAnalysis(res);
        setPageState('COMPLETED');
        showToast('AI Quality Inspection completed successfully! Batch verified.', 'success');
      } else if (res.status === 'CROP_MISMATCH') {
        setDetectedCropName(res.detectedCropName || 'Tomato');
        setPageState('CROP_MISMATCH');
      } else if (res.status === 'LOW_CONFIDENCE') {
        setPageState('LOW_CONFIDENCE');
      }
    } catch (err: any) {
      clearInterval(interval);
      const code = err.data?.code || err.code;
      const message = err.data?.message || err.message || '';

      if (code === 'NO_PRODUCT_IMAGES' || message.includes('photos are required')) {
        setPageState('NO_IMAGES');
      } else if (code === 'CROP_MISMATCH' || message.includes('mismatch') || simulateMismatch) {
        setDetectedCropName('Tomato');
        setPageState('CROP_MISMATCH');
      } else if (code === 'LOW_CONFIDENCE' || message.includes('confidence') || simulateLowConf) {
        setPageState('LOW_CONFIDENCE');
      } else {
        setErrorMessage(message || 'Failed to complete AI inspection. Please try again.');
        showToast(message || 'AI inspection error.', 'error');
        setPageState('READY');
      }
    }
  };

  const handleNotNow = () => {
    showToast('AI verification completed. Your batch is ready to list whenever you are ready.', 'info');
    navigate(`/farmer/batches/${idNum}`);
  };

  if (pageState === 'LOADING') {
    return <LoadingState message="Loading inspection record from backend..." />;
  }

  if (!batch) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#B3261E] mx-auto" />
        <h2 className="text-lg font-bold text-[#17201A]">Batch Not Found</h2>
        <p className="text-xs text-[#526158]">The requested harvest batch could not be located in your records.</p>
        <Link to="/farmer/batches" className="inline-block px-5 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl">
          Back to Batches
        </Link>
      </div>
    );
  }

  // 1. ANALYZING / SCANNING STATE
  if (pageState === 'ANALYZING') {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-[#EEF8F0] border-2 border-[#2E7D32] flex items-center justify-center mx-auto text-[#2E7D32] shadow-md animate-pulse">
          <ScanLine className="w-10 h-10 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-[#1B5E20]">AgriGrade Vision AI at Work</h2>
          <p className="text-sm font-bold text-[#2E7D32]">{loadingStep}</p>
          <p className="text-xs text-[#526158]">
            Evaluating {batch.cropName} ({batch.varietyName}) • Batch #{batch.batchNumber}
          </p>
        </div>
        <div className="w-64 h-2 bg-[#EEF8F0] rounded-full mx-auto overflow-hidden border border-[#C5E6CC]">
          <div className="h-full bg-[#2E7D32] rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // 2. ERROR STATE: NO PRODUCT IMAGES
  if (pageState === 'NO_IMAGES') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <Link to={`/farmer/batches/${batch.id}`} className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Batch Details
        </Link>

        <div className="bg-white border-2 border-amber-300 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[#17201A]">Product Photos Required</h2>
            <p className="text-xs text-[#526158] max-w-md mx-auto">
              Product photos are required before AI analysis. Please upload clear photos of your {batch.cropName} harvest load to enable AI vision inspection.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to={`/farmer/batches/${batch.id}`}
              className="px-6 py-3 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] shadow-xs flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" /> Add Product Images
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. ERROR STATE: CROP MISMATCH
  if (pageState === 'CROP_MISMATCH') {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Link to={`/farmer/batches/${batch.id}`} className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Batch Details
        </Link>

        <CropMismatchCard
          selectedCrop={batch.cropName}
          detectedCrop={detectedCropName}
          rejectionReason={`The uploaded image appears to contain ${detectedCropName}, but the selected crop is ${batch.cropName}.`}
          onRetry={executeAnalysis}
          onChangeCrop={() => navigate(`/farmer/batches/${batch.id}`)}
          onReupload={() => navigate(`/farmer/batches/${batch.id}`)}
        />
      </div>
    );
  }

  // 4. ERROR STATE: LOW CONFIDENCE
  if (pageState === 'LOW_CONFIDENCE') {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Link to={`/farmer/batches/${batch.id}`} className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Batch Details
        </Link>

        <LowConfidenceCard
          confidence={analysis?.overallConfidence || 45}
          reason="The AI could not confidently verify this product. Image lighting or resolution is below certification threshold."
          onRetry={executeAnalysis}
          onUploadBetter={() => navigate(`/farmer/batches/${batch.id}`)}
        />
      </div>
    );
  }

  // 5. READY FOR AI ANALYSIS STATE (Unanalyzed batch with photos)
  if (pageState === 'READY' || !analysis || analysis.status !== 'COMPLETED') {
    const photos = batch.photos || [];
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link to={`/farmer/batches/${batch.id}`} className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Batch Details
        </Link>

        {/* Ready Header Banner */}
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pending AI Verification
              </span>
              <span className="font-mono text-xs text-[#526158]">#{batch.batchNumber}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1B5E20]">
              Ready for AI Quality Inspection
            </h1>
            <p className="text-xs text-[#526158] mt-1">
              {batch.cropName} – <span className="font-bold text-[#17201A]">{batch.varietyName}</span> • Total Harvest: <strong className="text-[#1B5E20]">{formatQuantity(batch.quantity, batch.quantityUnit)}</strong>
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-[#B3261E] font-bold">
            {errorMessage}
          </div>
        )}

        {/* Evidence Photos to be Inspected */}
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
            <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#2E7D32]" /> Attached Harvest Evidence ({photos.length} photos)
            </h3>
            <Link to={`/farmer/batches/${batch.id}`} className="text-xs font-bold text-[#2E7D32] hover:underline">
              Manage Evidence →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {photos.map((p) => (
              <div key={p.id} className="aspect-square rounded-2xl overflow-hidden border border-[#C5E6CC] bg-gray-50 relative group">
                <img src={p.previewUrl} alt={p.fileName} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1 rounded truncate text-center">
                  {p.fileName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inspection Criteria Grid */}
        <div className="bg-[#FCFBF5] border border-[#C5E6CC] rounded-3xl p-6 space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-[#1B5E20]">What AgriGrade AI Evaluates:</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-[#C5E6CC] rounded-2xl space-y-1.5">
              <span className="font-extrabold text-[#1B5E20] block">1. Crop & Cultivar Identification</span>
              <p className="text-[#526158]">Botanical feature extraction, color profiles, and shape matching against master taxonomy.</p>
            </div>
            <div className="p-4 bg-white border border-[#C5E6CC] rounded-2xl space-y-1.5">
              <span className="font-extrabold text-[#1B5E20] block">2. Surface Defect Segmentation</span>
              <p className="text-[#526158]">Deep neural network detection of blemishes, pathogen rot, lesions, and epidermal damage.</p>
            </div>
            <div className="p-4 bg-white border border-[#C5E6CC] rounded-2xl space-y-1.5">
              <span className="font-extrabold text-[#1B5E20] block">3. Digital Certification & Shelf Life</span>
              <p className="text-[#526158]">Quality Index score calculation, grade-adjusted remaining shelf life, and SHA-256 digital certificate.</p>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={executeAnalysis}
              className="px-8 py-3.5 bg-[#2E7D32] text-white font-extrabold text-sm rounded-2xl hover:bg-[#1B5E20] transition-all shadow-md flex items-center gap-2"
            >
              <ScanLine className="w-5 h-5" /> Start AI Inspection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. SUCCESSFUL / REJECTED AI ANALYSIS RESULT PAGE
  const quality = analysis.qualityResult;
  const photosUsed = analysis.evidenceUsedPhotos || batch.photos || [];
  const certNumber = cert?.certificateNumber || batch.certificateNumber || 'AGRI-CERT-VERIFIED';
  const isRejected = (
    (quality?.assignedGrade as string) === 'REJECTED' ||
    (quality?.assignedGrade as string) === 'REJECT' ||
    (quality?.qualityScore !== undefined && quality.qualityScore <= 10) ||
    ((analysis?.qualityResult?.assignedGrade as string) === 'REJECTED' || (analysis?.qualityResult?.assignedGrade as string) === 'REJECT')
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to={`/farmer/batches/${batch.id}`} className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Batch Details
      </Link>

      {/* INSPECTION REPORT HEADER */}
      <div className={`bg-white border-2 ${isRejected ? 'border-red-500' : 'border-[#2E7D32]'} rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isRejected ? (
              <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-300 text-xs font-black rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" /> AI INSPECTION: REJECTED ✗
              </span>
            ) : (
              <>
                <span className="px-3 py-1 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] text-xs font-extrabold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" /> AI Quality Verified ✓
                </span>
                <span className="px-3 py-1 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] text-xs font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" /> AI Certificate Verified ✓
                </span>
              </>
            )}
            <span className="text-xs font-mono text-[#526158]">{analysis.modelCode}</span>
          </div>
          <h1 className={`text-2xl font-extrabold ${isRejected ? 'text-red-800' : 'text-[#1B5E20]'}`}>
            {batch.cropName} – <span className={isRejected ? 'text-red-700' : 'text-[#2E7D32]'}>{batch.varietyName}</span>
          </h1>
          <p className="text-xs text-[#526158] mt-1">
            {isRejected ? (
              <span className="text-red-700 font-bold">Quarantined • Severe fungal infection / active rot detected • Non-Saleable</span>
            ) : (
              <>Certificate: <strong className="font-mono text-[#17201A]">{certNumber}</strong> • Inspection #{analysis.inspectionNumber || 1} • {new Date(analysis.completedAt || '').toLocaleString()}</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {!isRejected && cert && (
            <button
              onClick={() => setShowCertModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4 text-[#2E7D32]" /> View Certificate
            </button>
          )}

          {batch.status !== 'LISTED' && !batch.inspectionLocked ? (
            <button
              onClick={executeAnalysis}
              className={`flex-1 sm:flex-none px-4 py-2.5 border font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs ${isRejected ? 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100' : 'bg-[#FCFBF5] border-[#C5E6CC] text-[#17201A] hover:bg-[#EEF8F0]'}`}
            >
              <ScanLine className="w-4 h-4 text-[#2E7D32]" /> Re-inspect Crop
            </button>
          ) : (
            <div className="px-3 py-2 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-extrabold text-xs rounded-xl flex items-center gap-1">
              <span>🔒 AI CERTIFIED & LOCKED</span>
            </div>
          )}
        </div>
      </div>

      {/* REJECTION QUARANTINE WARNING BANNER */}
      {isRejected && (
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-md space-y-4 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-red-200 pb-3">
            <div className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <span className="text-[11px] font-black uppercase text-red-600 tracking-wider block">
                  COMMERCIAL REJECTION PROTOCOL ACTIVE
                </span>
                <h3 className="text-lg font-black text-red-800 mt-0.5">
                  Batch #{batch.batchNumber} is unfit for commercial sale
                </h3>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-red-600 text-white font-black text-xs rounded-full shadow-xs">
              REJECTED (0% Quality)
            </span>
          </div>

          <p className="text-red-900 font-medium leading-relaxed">
            AI Computer Vision inspection detected severe fungal infection (mold hyphae / spores) and active rot decomposition. This harvest batch is blocked from being listed on the marketplace to protect consumer safety and prevent pathogen spread.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/90 p-4 rounded-2xl border border-red-200 shadow-xs">
            <div>
              <span className="text-red-700 block text-[11px]">Condition:</span>
              <strong className="text-red-950 font-extrabold text-sm">Active Soft Rot</strong>
            </div>
            <div>
              <span className="text-red-700 block text-[11px]">Disease / Mold:</span>
              <strong className="text-red-950 font-extrabold text-sm">Severe Fungal Growth</strong>
            </div>
            <div>
              <span className="text-red-700 block text-[11px]">Commercial Value:</span>
              <strong className="text-red-950 font-black text-sm">₹0.00 / kg</strong>
            </div>
            <div>
              <span className="text-red-700 block text-[11px]">Remaining Shelf Life:</span>
              <strong className="text-red-950 font-black text-sm">0 Days</strong>
            </div>
          </div>
        </div>
      )}

      {/* AUTHORITATIVE LISTING CONSENT CARD (ONLY ON NON-REJECTED AI RESULT PAGE WHEN UNLISTED) */}
      {!isRejected && batch.status !== 'LISTED' && (
        <div className="bg-gradient-to-br from-[#EEF8F0] to-[#FCFBF5] border-2 border-[#2E7D32] rounded-3xl p-6 sm:p-8 shadow-md space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
            <div>
              <span className="text-[11px] font-black uppercase text-[#2E7D32] tracking-wider block">
                AI QUALITY VERIFIED ✓ • CERTIFICATE ISSUED
              </span>
              <h3 className="text-xl font-extrabold text-[#1B5E20] mt-0.5">
                Would you like to list this verified batch for buyers?
              </h3>
            </div>
            <span className="px-3.5 py-1.5 bg-[#2E7D32] text-white font-extrabold text-xs rounded-full shadow-xs">
              {quality ? quality.assignedGrade.replace(/_/g, ' ') : (batch.assignedGrade?.replace(/_/g, ' ') || 'GRADE A PREMIUM')}
            </span>
          </div>

          <p className="text-xs text-[#526158] leading-relaxed">
            Listing this batch will make it visible to verified buyers on the AgriGrade marketplace. You can also keep it in your records and list it later.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-white/90 p-4 rounded-2xl border border-[#C5E6CC] shadow-xs">
            <div>
              <span className="text-[#526158] block text-[11px]">Crop & Variety:</span>
              <strong className="text-[#17201A] font-extrabold text-sm">{batch.cropName} – {batch.varietyName}</strong>
            </div>
            <div>
              <span className="text-[#526158] block text-[11px]">Total Harvest:</span>
              <strong className="text-[#1B5E20] font-extrabold text-sm">{formatQuantity(batch.quantity, batch.quantityUnit)}</strong>
            </div>
            <div>
              <span className="text-[#526158] block text-[11px]">Quality Result:</span>
              <strong className="text-[#2E7D32] font-extrabold text-sm">
                {(quality ? quality.assignedGrade.replace(/_/g, ' ') : (batch.assignedGrade?.replace(/_/g, ' ') || 'GRADE A PREMIUM'))} ({(quality?.qualityScore ?? batch.qualityScore ?? 95)}%)
              </strong>
            </div>
            <div>
              <span className="text-[#526158] block text-[11px]">Certificate Issued:</span>
              <strong className="text-[#17201A] font-mono font-bold text-xs">{certNumber}</strong>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#526158]">
              Status: <strong className="text-[#1B5E20]">AI Graded</strong> • Saved in Farm Records (Not Public)
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleNotNow}
                className="flex-1 sm:flex-none px-6 py-3 bg-white border border-[#C5E6CC] text-[#526158] hover:text-[#17201A] font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={() => setShowListModal(true)}
                className="flex-1 sm:flex-none px-7 py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> List Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IF ALREADY LISTED BANNER */}
      {batch.status === 'LISTED' && !isRejected && (
        <div className="bg-[#EEF8F0] border-2 border-[#2E7D32] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="px-2.5 py-0.5 bg-[#2E7D32] text-white font-extrabold text-[10px] rounded-full uppercase">
              ACTIVE ON MARKETPLACE
            </span>
            <h3 className="text-base font-extrabold text-[#1B5E20] mt-1">
              This harvest batch is live and visible to buyers across Tamil Nadu.
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/farmer/market-recommendations?batchId=${batch.id}`}
              className="px-4 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl hover:bg-[#DDF2E1] shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <TrendingUp className="w-4 h-4 text-[#2E7D32]" /> Market Arbitrage
            </Link>
            <Link
              to="/buyer/marketplace"
              className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <ShoppingBag className="w-4 h-4" /> View Marketplace
            </Link>
          </div>
        </div>
      )}

      <BananaAnalysisCard
        cropName={batch.cropName || 'Banana'}
        maturityStage={analysis?.maturityStage || (isRejected ? 'Rotten' : 'Ripe')}
        grade={isRejected ? 'REJECT' : (quality ? quality.assignedGrade.replace(/_/g, ' ') : 'Grade A')}
        qualityScore={isRejected ? 0 : (quality?.qualityScore ?? 100)}
        fungalGrowthStatus={analysis?.fungalGrowthStatus || 'NONE'}
        activeDecayStatus={analysis?.activeDecayStatus || 'NONE'}
        marketPrice={analysis?.officialMarketPrice || analysis?.marketPrice || { available: true, modal_price: 28.50, unit: 'INR/kg', market: 'Coimbatore APMC' }}
        pricePrediction={isRejected ? { estimated_low: 0, estimated_high: 0, unit: 'INR/kg' } : (analysis?.aiPricePrediction || analysis?.pricePredictionData || analysis?.pricePrediction || { estimated_low: 25.65, estimated_high: 28.50, unit: 'INR/kg' })}
        recommendation={isRejected ? { action: 'REJECT', reason: 'Produce is unmarketable due to severe visible deterioration. Listing blocked.' } : (analysis?.marketAction || analysis?.recommendation || { action: 'SELL_NOW', reason: 'Favorable market conditions for saleable produce.' })}
        marketComparison={analysis?.marketComparison || []}
        trainedModel={analysis?.trainedModel}
        agreement={analysis?.agreement}
      />

      {/* Quality Score & Grade Card */}
      {quality && (
        <div className={`bg-white border-2 ${isRejected ? 'border-red-400' : 'border-[#C5E6CC]'} rounded-3xl p-6 shadow-xs grid sm:grid-cols-3 gap-6`}>
          <div className="text-center sm:text-left sm:border-r border-[#C5E6CC] pr-4">
            <span className="text-xs font-bold uppercase text-[#526158]">Assigned Quality Grade</span>
            <div className={`text-2xl font-extrabold mt-1 mb-2 ${isRejected ? 'text-red-700' : 'text-[#1B5E20]'}`}>
              {isRejected ? 'REJECTED' : quality.assignedGrade.replace(/_/g, ' ')}
            </div>
            <StatusBadge status={isRejected ? 'REJECTED' : quality.assignedGrade} />
          </div>

          <div className="text-center sm:text-left sm:border-r border-[#C5E6CC] pr-4">
            <span className="text-xs font-bold uppercase text-[#526158]">AI Quality Index</span>
            <div className={`text-4xl font-black mt-1 ${isRejected ? 'text-red-700' : 'text-[#2E7D32]'}`}>
              {isRejected ? 0 : (quality.qualityScore ?? 0)} <span className="text-sm font-normal text-[#526158]">/ 100</span>
            </div>
            <p className={`text-[11px] mt-1 ${isRejected ? 'text-red-700 font-bold' : 'text-[#526158]'}`}>
              {isRejected ? 'Tissue Decomposition • Structural Breakdown' : `Moisture ${quality.moisturePercent}% • Uniformity ${quality.uniformityScore}%`}
            </p>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-xs font-bold uppercase text-[#526158]">Defect Analysis</span>
            <div className="space-y-1.5 mt-2">
              {quality.defects && quality.defects.length > 0 ? (
                quality.defects.map((d: DefectResult) => (
                  <div key={d.id} className="flex justify-between items-center text-xs">
                    <span className={`font-semibold ${isRejected ? 'text-red-800' : 'text-[#17201A]'}`}>{d.defectType}</span>
                    <span className={`font-bold ${isRejected ? 'text-red-700' : 'text-[#A66A00]'}`}>{d.affectedPercent}% area</span>
                  </div>
                ))
              ) : (
                <p className={`text-xs font-semibold ${isRejected ? 'text-red-700' : 'text-[#2E7D32]'}`}>
                  {isRejected ? 'Severe pathogenetic rot lesions' : 'Clean epidermal scan • No critical defects'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shelf Life & Freshness Engine */}
      <ShelfLifeWidget
        harvestDate={batch.harvestDate}
        inspectionDate={new Date().toISOString().split('T')[0]}
        cropAgeDays={batch.cropAgeDays || 0}
        remainingDays={isRejected ? 0 : (batch.remainingShelfLifeDays ?? 8)}
        confidence={95.0}
      />

      {/* Evidence Used Card */}
      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs text-xs space-y-3">
        <h4 className="font-extrabold text-sm text-[#1B5E20] border-b border-[#C5E6CC] pb-2">
          Evaluated Harvest Evidence ({photosUsed.length} photos)
        </h4>
        <div className="flex flex-wrap gap-3 items-center">
          {photosUsed.map((p: MediaAsset) => (
            <img
              key={p.id}
              src={p.previewUrl}
              alt={p.fileName}
              className="w-14 h-14 rounded-xl object-cover border border-[#C5E6CC] shadow-xs"
              onError={(e) => handleImageError(e, batch.cropName)}
            />
          ))}
        </div>
      </div>

      {/* Inspection History Table */}
      {history.length > 0 && (
        <InspectionHistoryTable
          records={history.map((h) => ({
            id: h.id,
            inspectionName: h.inspectionName,
            timestamp: h.timestamp,
            status: h.status,
            grade: h.assignedGrade,
            score: h.qualityScore,
            confidence: h.confidence,
          }))}
        />
      )}

      {cert && (
        <CertificatePreviewModal
          certificate={cert}
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {showListModal && (
        <ListProductModal
          batch={batch}
          analysis={analysis}
          certificate={cert}
          isOpen={showListModal}
          onClose={() => setShowListModal(false)}
          onSuccess={() => {
            batchService.getBatchById(idNum).then((b) => {
              if (b) setBatch(b);
            });
          }}
        />
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { aiService } from '../../services/aiService';
import { useNotification } from '../../context/NotificationContext';
import { MediaAsset } from '../../types/batch';
import { DiseaseDetectionResult } from '../../types/ai';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Activity,
  ShieldAlert,
  CheckCircle2,
  Upload,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  Leaf,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const SAMPLE_FOLIAGE_IMAGES: Record<string, MediaAsset[]> = {
  Banana: [
    {
      id: 'sample-leaf-ban-1',
      fileName: 'sigatoka_leaf_sample.svg',
      mediaType: 'PHOTO',
      mimeType: 'image/svg+xml',
      previewUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Cpath d='M80,240 C120,80 280,60 320,150 C300,220 180,260 80,240 Z' fill='%2381C784' stroke='%232E7D32' stroke-width='4'/%3E%3Cpath d='M80,240 Q200,160 320,150' stroke='%231B5E20' stroke-width='3' fill='none'/%3E%3Ccircle cx='180' cy='140' r='12' fill='%238D6E63' opacity='0.8'/%3E%3Ccircle cx='230' cy='160' r='18' fill='%23795548' opacity='0.8'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3EBanana Leaf Sigatoka Sample%3C/text%3E%3C/svg%3E",
      uploadedAt: new Date().toISOString(),
      size: 1420000,
    },
    {
      id: 'sample-leaf-ban-2',
      fileName: 'sigatoka_close_up.svg',
      mediaType: 'PHOTO',
      mimeType: 'image/svg+xml',
      previewUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Cpath d='M90,220 C130,90 270,70 310,140 C290,210 170,250 90,220 Z' fill='%23A5D6A7' stroke='%232E7D32' stroke-width='4'/%3E%3Ccircle cx='200' cy='150' r='24' fill='%235D4037' opacity='0.85'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3EBanana Leaf Close-up%3C/text%3E%3C/svg%3E",
      uploadedAt: new Date().toISOString(),
      size: 1680000,
    },
  ],
  Tomato: [
    {
      id: 'sample-leaf-tom-1',
      fileName: 'tomato_early_blight.svg',
      mediaType: 'PHOTO',
      mimeType: 'image/svg+xml',
      previewUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Cpath d='M120,220 C100,120 200,60 280,120 C320,180 240,240 120,220 Z' fill='%2381C784' stroke='%232E7D32' stroke-width='4'/%3E%3Ccircle cx='210' cy='140' r='16' fill='%23BF360C' opacity='0.8'/%3E%3Ccircle cx='170' cy='170' r='10' fill='%23D84315' opacity='0.8'/%3E%3Ctext x='200' y='270' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3ETomato Early Blight Sample%3C/text%3E%3C/svg%3E",
      uploadedAt: new Date().toISOString(),
      size: 1540000,
    },
  ],
};

export const DiseaseDetectionPage: React.FC = () => {
  const { showToast } = useNotification();

  const [selectedCrop, setSelectedCrop] = useState<string>('Banana');
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing pathology models...');
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);

  // Simulation controls for demonstration
  const [simLowConf, setSimLowConf] = useState<boolean>(false);
  const [simHealthy, setSimHealthy] = useState<boolean>(false);
  const [simUnable, setSimUnable] = useState<boolean>(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxPhotos = 10;
    const currentCount = photos.length;

    if (currentCount >= maxPhotos) {
      showToast('Maximum 10 images allowed per disease scan.', 'warning');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    const availableSlots = maxPhotos - currentCount;
    const selectedFiles = Array.from(files).slice(0, availableSlots);
    const newAssets: MediaAsset[] = [];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        showToast(`Invalid file format for "${file.name}". Allowed: JPG, JPEG, PNG, WEBP.`, 'error');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast(`"${file.name}" exceeds 15MB size limit.`, 'warning');
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newAssets.push({
        id: `photo-dis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fileName: file.name,
        mediaType: 'PHOTO',
        mimeType: file.type,
        previewUrl,
        uploadedAt: new Date().toISOString(),
        size: file.size,
      });
    }

    if (newAssets.length > 0) {
      setPhotos((prev) => [...prev, ...newAssets]);
      showToast(`Added ${newAssets.length} foliage image${newAssets.length === 1 ? '' : 's'}. (${photos.length + newAssets.length}/10)`, 'success');
    }

    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string | number) => {
    const p = photos.find((x) => x.id === id);
    setPhotos((prev) => prev.filter((x) => x.id !== id));
    if (p) showToast(`Removed "${p.fileName}".`, 'info');
  };

  const handleLoadSampleImages = () => {
    const samples = SAMPLE_FOLIAGE_IMAGES[selectedCrop] || SAMPLE_FOLIAGE_IMAGES['Banana'];
    setPhotos(samples);
    showToast(`Loaded ${samples.length} sample foliage image${samples.length === 1 ? '' : 's'} for ${selectedCrop}.`, 'info');
  };

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      showToast('Please upload or select at least 1 foliage image for AI disease inspection.', 'warning');
      return;
    }

    setIsScanning(true);
    setLoadingStep('Uploading foliage evidence...');

    const steps = [
      'Segmenting leaf chlorotic halos & necrotic lesions...',
      'Cross-referencing fungal & bacterial pathogen databases...',
      'Calculating disease severity index...',
      'Generating organic & chemical treatment advisory...',
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 250);

    try {
      const res = await aiService.detectDisease(selectedCrop, photos, {
        simulateLowConfidence: simLowConf,
        simulateHealthy: simHealthy,
        simulateUnableToIdentify: simUnable,
      });
      setResult(res);
      showToast('Foliage pathology inspection complete.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to complete disease scan.', 'error');
    } finally {
      clearInterval(interval);
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setPhotos([]);
    setSimLowConf(false);
    setSimHealthy(false);
    setSimUnable(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B5E20]">Plant Pathology & Disease Detection</h1>
        <p className="text-xs text-[#526158] mt-0.5">
          Upload crop leaf or foliage images for computer vision identification of Sigatoka, Blight, Leaf Spot, Anthracnose, or Wilt pathogens.
        </p>
      </div>

      {/* Visually Hidden Native File Input */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoSelect}
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="sr-only"
        id="disease-foliage-upload"
      />

      {/* Loading State */}
      {isScanning && (
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-12 text-center shadow-xs space-y-4">
          <LoadingState message={loadingStep} />
          <p className="text-xs font-semibold text-[#526158] animate-pulse">
            AI Computer Vision scanning {photos.length} leaf sample{photos.length === 1 ? '' : 's'}...
          </p>
        </div>
      )}

      {/* UPLOAD / INPUT STATE */}
      {!isScanning && !result && (
        <form onSubmit={handleRunScan} className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-6 text-xs">
          {/* Crop Selector & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#C5E6CC] pb-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="font-bold text-[#17201A] shrink-0">Target Crop:</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full sm:w-auto p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold focus:ring-2 focus:ring-[#2E7D32]"
              >
                <option value="Banana">Banana (Vazhai)</option>
                <option value="Tomato">Tomato (Thakkali)</option>
                <option value="Mango">Mango (Maangai)</option>
                <option value="Onion">Onion (Vengayam)</option>
                <option value="Brinjal">Brinjal (Kathirikai)</option>
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleLoadSampleImages}
                className="px-3.5 py-2 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl hover:bg-[#DDF2E1] flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-[#2E7D32]" /> Load Sample Foliage
              </button>
            </div>
          </div>

          {/* Evidence Upload Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#2E7D32]" /> Foliage Evidence Images
                </h3>
                <p className="text-[11px] text-[#526158]">
                  Upload 1 to 10 leaf photos showing lesions, spot spots, or leaf tip yellowing.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl">
                Photos: {photos.length} / 10
              </span>
            </div>

            {/* Upload Button Box */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photos.length >= 10}
                className={`flex-1 py-4 border-2 border-dashed rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors ${
                  photos.length >= 10
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-[#C5E6CC] bg-[#FCFBF5] text-[#1B5E20] hover:bg-[#EEF8F0] hover:border-[#2E7D32]'
                }`}
              >
                <Plus className="w-5 h-5 text-[#2E7D32]" />
                <Upload className="w-5 h-5 text-[#2E7D32]" />
                {photos.length === 0 ? 'Click to Upload Leaf Photos (1 - 10)' : 'Add More Photos'}
              </button>
            </div>

            {/* Thumbnail Preview Grid */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-[#526158] block">Attached Images ({photos.length})</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="group relative bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl p-1.5 flex flex-col justify-between shadow-xs hover:border-[#2E7D32] transition-colors overflow-hidden"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-1.5 relative">
                        <img src={p.previewUrl} alt={p.fileName} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(p.id)}
                          aria-label={`Remove photo ${p.fileName}`}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-[#B3261E] text-white rounded-full transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] font-bold text-[#17201A] truncate px-1" title={p.fileName}>
                        {p.fileName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Simulation Mode Selector */}
          <div className="bg-[#FCFBF5] border border-amber-200 p-3 rounded-2xl space-y-1.5">
            <span className="font-bold text-[#A66A00] text-[11px] block">AI Simulation Options (Demo Controls):</span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-1.5 font-semibold text-[#17201A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simLowConf}
                  onChange={(e) => {
                    setSimLowConf(e.target.checked);
                    if (e.target.checked) {
                      setSimHealthy(false);
                      setSimUnable(false);
                    }
                  }}
                  className="rounded text-[#2E7D32]"
                />
                <span>Low Confidence (&lt;80%)</span>
              </label>

              <label className="flex items-center gap-1.5 font-semibold text-[#17201A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simHealthy}
                  onChange={(e) => {
                    setSimHealthy(e.target.checked);
                    if (e.target.checked) {
                      setSimLowConf(false);
                      setSimUnable(false);
                    }
                  }}
                  className="rounded text-[#2E7D32]"
                />
                <span>Simulate Healthy Leaf</span>
              </label>

              <label className="flex items-center gap-1.5 font-semibold text-[#17201A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simUnable}
                  onChange={(e) => {
                    setSimUnable(e.target.checked);
                    if (e.target.checked) {
                      setSimLowConf(false);
                      setSimHealthy(false);
                    }
                  }}
                  className="rounded text-[#2E7D32]"
                />
                <span>Unable to Identify</span>
              </label>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="border-t border-[#C5E6CC] pt-4">
            <button
              type="submit"
              disabled={photos.length === 0}
              className={`w-full py-3.5 font-bold rounded-2xl transition-colors shadow-xs flex items-center justify-center gap-2 text-sm ${
                photos.length === 0
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-[#2E7D32] text-white hover:bg-[#1B5E20]'
              }`}
            >
              <Activity className="w-4 h-4" /> Analyze Foliage Evidence
            </button>
          </div>
        </form>
      )}

      {/* RESULT STATE */}
      {!isScanning && result && (
        <div className="space-y-6 animate-fade-in">
          {/* Low Confidence Result State */}
          {result.status === 'LOW_CONFIDENCE' && (
            <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 text-[#A66A00] rounded-2xl flex items-center justify-center border border-amber-200 shrink-0">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-[#A66A00] text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                    Low Confidence Identification
                  </span>
                  <h3 className="font-extrabold text-base text-[#17201A] mt-0.5">Image Quality Below Confidence Threshold</h3>
                </div>
              </div>

              <p className="text-xs text-[#526158] leading-relaxed bg-[#FCFBF5] p-3.5 rounded-2xl border border-amber-200">
                {result.rejectionReason}
              </p>

              <div className="p-4 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl text-xs space-y-1.5">
                <span className="font-bold text-[#17201A] block">Tips for Better Foliage Diagnosis:</span>
                <ul className="list-disc list-inside text-[#526158] space-y-1">
                  <li>Ensure bright, natural daylight without heavy shadows.</li>
                  <li>Focus closely on distinct leaf spots or lesion boundaries.</li>
                  <li>Avoid blurry photos taken while moving.</li>
                </ul>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Upload Better Photos / Retry Scan
              </button>
            </div>
          )}

          {/* Unable to Identify Result State */}
          {result.status === 'UNABLE_TO_IDENTIFY' && (
            <div className="bg-white border-2 border-gray-300 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center border border-gray-300 shrink-0">
                  <Info className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                    Unrecognized Pattern
                  </span>
                  <h3 className="font-extrabold text-base text-[#17201A] mt-0.5">No Pathogens Recognized</h3>
                </div>
              </div>

              <p className="text-xs text-[#526158] bg-[#FCFBF5] p-3.5 rounded-2xl border border-gray-200">
                {result.rejectionReason}
              </p>

              <button
                onClick={handleReset}
                className="w-full py-3 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Scan Another Sample
              </button>
            </div>
          )}

          {/* Healthy Foliage State */}
          {result.status === 'HEALTHY' && (
            <div className="bg-white border-2 border-[#2E7D32] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-2xl flex items-center justify-center border border-[#C5E6CC] shrink-0">
                    <ShieldCheck className="w-7 h-7 text-[#2E7D32]" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 bg-[#EEF8F0] text-[#1B5E20] text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-[#C5E6CC]">
                      Healthy Foliage • {result.confidenceScore}% Confidence
                    </span>
                    <h3 className="font-extrabold text-lg text-[#1B5E20] mt-0.5">No Disease Pathogens Detected</h3>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] font-bold text-xs rounded-xl hover:bg-[#DDF2E1]"
                >
                  New Scan
                </button>
              </div>

              <div className="p-4 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl text-xs space-y-2">
                <h4 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" /> Prevention Advisory
                </h4>
                <p className="text-[#526158] leading-relaxed">{result.preventionAdvisory}</p>
              </div>
            </div>
          )}

          {/* COMPLETED Pathological Findings State */}
          {result.status === 'COMPLETED' && (
            <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#C5E6CC] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 text-[#A66A00] rounded-2xl flex items-center justify-center border border-amber-200 shrink-0">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-[#A66A00] text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                        {result.overallRisk} Disease Risk • {result.confidenceScore}% Confidence
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                        AgriGrade AI Vision Model
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xl text-[#17201A] mt-1">
                      {result.primaryDiseaseName}
                    </h3>
                    <p className="text-xs italic text-[#526158]">Taxonomy: {result.scientificName}</p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] shrink-0 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Scan Another Crop
                </button>
              </div>

              {/* Pathology Metrics */}
              <div className="grid sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl">
                  <span className="text-[#526158] block text-[11px] font-semibold">Severity Index:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#A66A00] h-full rounded-full"
                        style={{ width: `${result.severityPercent}%` }}
                      />
                    </div>
                    <span className="font-extrabold text-[#17201A]">{result.severityPercent}%</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl">
                  <span className="text-[#526158] block text-[11px] font-semibold">Affected Plant Part:</span>
                  <span className="font-bold text-[#1B5E20] mt-1 block">{result.affectedPlantPart}</span>
                </div>

                <div className="p-3.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl">
                  <span className="text-[#526158] block text-[11px] font-semibold">Evaluated Crop:</span>
                  <span className="font-bold text-[#17201A] mt-1 block">{result.cropName} Foliage</span>
                </div>
              </div>

              {/* Detected Symptoms */}
              {result.detectedSymptoms && (
                <div className="p-4 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl text-xs space-y-2">
                  <span className="font-extrabold text-[#1B5E20] block">Detected Computer Vision Symptoms:</span>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {result.detectedSymptoms.map((symptom, idx) => (
                      <li key={idx} className="flex items-center gap-2 font-semibold text-[#17201A]">
                        <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agronomic Recommendations Grid */}
              <div className="grid md:grid-cols-2 gap-6 text-xs">
                <div className="p-5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-[#2E7D32]" /> Organic Agronomic Remedy
                  </h4>
                  <p className="text-[#526158] leading-relaxed">{result.organicRemedy}</p>
                </div>

                <div className="p-5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[#A66A00]" /> Recommended Fungicide / Treatment
                  </h4>
                  <p className="text-[#526158] leading-relaxed">{result.chemicalTreatment}</p>
                </div>
              </div>

              {/* Prevention Advisory */}
              {result.preventionAdvisory && (
                <div className="p-4 bg-[#EEF8F0] border border-[#C5E6CC] rounded-2xl text-xs space-y-1.5">
                  <h4 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2E7D32]" /> Long-Term Cultural Prevention
                  </h4>
                  <p className="text-[#526158] leading-relaxed">{result.preventionAdvisory}</p>
                </div>
              )}

              {/* Evidence Images Evaluated */}
              <div>
                <span className="font-bold text-xs text-[#526158] block mb-2">Evaluated Evidence Images ({result.evidencePhotos.length})</span>
                <div className="flex gap-3 overflow-x-auto py-1">
                  {result.evidencePhotos.map((p) => (
                    <div key={p.id} className="w-24 h-24 rounded-2xl overflow-hidden border border-[#C5E6CC] shrink-0">
                      <img src={p.previewUrl} alt={p.fileName} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { ProductBatch, MediaAsset } from '../../types/batch';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { X, ScanLine, CheckCircle2, AlertCircle, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface RunInspectionModalProps {
  batch: ProductBatch;
  isOpen: boolean;
  onClose: () => void;
}

export const RunInspectionModal: React.FC<RunInspectionModalProps> = ({
  batch,
  isOpen,
  onClose,
}) => {
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const photos = batch.photos || [];
  const video = batch.video;
  const hasPhotos = photos.length > 0 || (batch.images && batch.images.length > 0);

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string | number>>(
    new Set(photos.map((p) => p.id))
  );
  const [useVideo, setUseVideo] = useState<boolean>(!!video);
  const [simulateMismatch, setSimulateMismatch] = useState<boolean>(false);
  const [simulateLowConf, setSimulateLowConf] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  if (!isOpen) return null;

  const togglePhoto = (id: string | number) => {
    const next = new Set(selectedPhotoIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPhotoIds(next);
  };

  const handleStartInspection = async () => {
    if (!hasPhotos) {
      showToast('Product photos are required before AI analysis.', 'warning');
      return;
    }

    if (photos.length > 0 && selectedPhotoIds.size === 0 && !useVideo) {
      showToast('Please select at least one photo or video evidence to run inspection.', 'warning');
      return;
    }

    setIsStarting(true);
    showToast('Initializing AI vision models...', 'info');

    setTimeout(() => {
      onClose();
      navigate(
        `/farmer/batches/${batch.id}/ai-analysis?autoRun=true&mismatch=${simulateMismatch}&lowConf=${simulateLowConf}`
      );
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-[#C5E6CC] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in p-6">
        <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-base text-[#1B5E20]">Run AI Quality Inspection</h3>
            <p className="text-xs text-[#526158]">{batch.cropName} ({batch.varietyName}) • #{batch.batchNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 text-[#526158] hover:bg-[#EEF8F0] rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Select Photos Evidence */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-[#17201A]">Select Photos to Inspect ({selectedPhotoIds.size}/{photos.length})</span>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIds(
                      selectedPhotoIds.size === photos.length
                        ? new Set()
                        : new Set(photos.map((p) => p.id))
                    )
                  }
                  className="text-[#2E7D32] font-bold text-[11px] hover:underline"
                >
                  {selectedPhotoIds.size === photos.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {!hasPhotos ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Product photos are required before AI inspection. Please upload photos first.</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-[#C5E6CC] rounded-2xl bg-[#FCFBF5]">
                {photos.map((p) => {
                  const isSelected = selectedPhotoIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePhoto(p.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected ? 'border-[#2E7D32] ring-2 ring-[#C5E6CC]' : 'border-transparent opacity-60'
                      }`}
                    >
                      <img src={p.previewUrl} alt={p.fileName} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#2E7D32] text-white rounded-full flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Select Video Evidence */}
          {video && (
            <div className="p-3 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl flex items-center justify-between">
              <label className="flex items-center gap-2 font-bold text-[#17201A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={useVideo}
                  onChange={(e) => setUseVideo(e.target.checked)}
                  className="rounded text-[#2E7D32] focus:ring-[#2E7D32]"
                />
                <span>Include Video Evidence ({video.fileName})</span>
              </label>
            </div>
          )}

          {/* Simulation Flags */}
          <div className="bg-[#FCFBF5] border border-amber-200 p-3 rounded-xl space-y-1.5">
            <span className="font-bold text-[#A66A00] text-[11px] block">AI Vision Simulation Mode (Optional):</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 font-semibold text-[#17201A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateMismatch}
                  onChange={(e) => {
                    setSimulateMismatch(e.target.checked);
                    if (e.target.checked) setSimulateLowConf(false);
                  }}
                  className="rounded text-[#2E7D32]"
                />
                <span>Crop Mismatch</span>
              </label>
              <label className="flex items-center gap-1.5 font-semibold text-[#17201A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateLowConf}
                  onChange={(e) => {
                    setSimulateLowConf(e.target.checked);
                    if (e.target.checked) setSimulateMismatch(false);
                  }}
                  className="rounded text-[#2E7D32]"
                />
                <span>Low Confidence (&lt;80%)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-[#C5E6CC]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-[#C5E6CC] text-[#526158] font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleStartInspection}
              disabled={isStarting || !hasPhotos}
              className="flex-1 py-2.5 bg-[#2E7D32] disabled:opacity-50 text-white font-bold rounded-xl hover:bg-[#1B5E20] shadow-xs flex items-center justify-center gap-1.5"
            >
              <ScanLine className="w-4 h-4" /> {isStarting ? 'Initializing...' : 'Start AI Inspection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

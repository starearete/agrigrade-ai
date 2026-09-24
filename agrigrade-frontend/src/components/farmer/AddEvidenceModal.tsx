import React, { useState, useRef } from 'react';
import { MediaAsset } from '../../types/batch';
import { batchService } from '../../services/batchService';
import { useNotification } from '../../context/NotificationContext';
import { readFileAsDataUrl } from '../../utils/fileUtils';
import { X, Image as ImageIcon, Video as VideoIcon, Plus, Upload } from 'lucide-react';

interface AddEvidenceModalProps {
  batchId: number;
  existingPhotosCount: number;
  hasVideo: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  batchId,
  existingPhotosCount,
  hasVideo,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useNotification();
  const [newPhotos, setNewPhotos] = useState<MediaAsset[]>([]);
  const [newVideo, setNewVideo] = useState<MediaAsset | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const maxPhotos = 10;
  const availablePhotoSlots = Math.max(0, maxPhotos - existingPhotosCount - newPhotos.length);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (availablePhotoSlots <= 0) {
      showToast('Maximum 10 photos limit reached.', 'warning');
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availablePhotoSlots);
    const added: MediaAsset[] = [];

    for (const file of selectedFiles) {
      const previewUrl = await readFileAsDataUrl(file);
      added.push({
        id: `photo-new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fileName: file.name,
        mediaType: 'PHOTO',
        mimeType: file.type || 'image/jpeg',
        previewUrl,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        file,
      });
    }

    setNewPhotos((prev) => [...prev, ...added]);
    showToast(`Attached ${added.length} new photo${added.length === 1 ? '' : 's'}.`, 'success');
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (hasVideo || newVideo) {
      showToast('Maximum 1 video allowed. Please remove existing video first.', 'warning');
      return;
    }

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);
    setNewVideo({
      id: `video-new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: file.name,
      mediaType: 'VIDEO',
      mimeType: file.type || 'video/mp4',
      previewUrl,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      file,
    });
    showToast(`Video "${file.name}" attached.`, 'success');
  };

  const handleSubmit = async () => {
    if (newPhotos.length === 0 && !newVideo) {
      showToast('Please select at least one photo or video to add.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await batchService.addBatchEvidence(batchId, newPhotos, newVideo);
      showToast('Product evidence updated successfully.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update evidence.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-[#C5E6CC] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in p-6">
        <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-4">
          <h3 className="font-extrabold text-base text-[#1B5E20]">Add Batch Evidence</h3>
          <button onClick={onClose} className="p-1 text-[#526158] hover:bg-[#EEF8F0] rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="file"
          ref={photoInputRef}
          onChange={handlePhotoSelect}
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="sr-only"
        />
        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoSelect}
          accept="video/mp4,video/webm"
          className="sr-only"
        />

        <div className="space-y-4 text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={availablePhotoSlots <= 0}
              className="flex-1 py-2.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl hover:bg-[#DDF2E1] flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#2E7D32]" /> Add Photos ({existingPhotosCount + newPhotos.length}/10)
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={hasVideo || !!newVideo}
              className="flex-1 py-2.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl hover:bg-[#DDF2E1] flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#2E7D32]" /> {hasVideo || newVideo ? 'Video Attached' : 'Add Video (0/1)'}
            </button>
          </div>

          {newPhotos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {newPhotos.map((p) => (
                <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-[#C5E6CC]">
                  <img src={p.previewUrl} alt={p.fileName} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setNewPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                    className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {newVideo && (
            <div className="p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl flex items-center justify-between">
              <span className="font-bold text-[#17201A] truncate">{newVideo.fileName}</span>
              <button onClick={() => setNewVideo(undefined)} className="text-[#B3261E] font-bold text-[11px]">
                Remove
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-[#C5E6CC]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-[#C5E6CC] text-[#526158] font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Evidence'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

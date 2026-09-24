import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { batchService } from '../../services/batchService';
import { cropService, Crop, CropVariety } from '../../services/cropService';
import { locationService } from '../../services/locationService';
import { profileService } from '../../services/profileService';
import { StorageCondition, MediaAsset } from '../../types/batch';
import { normalizeNumericInput } from '../../utils/formatters';
import { validateQuantityInput } from '../../utils/numberInput';
import { readFileAsDataUrl } from '../../utils/fileUtils';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sprout,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Plus,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  FileVideo,
  ArrowLeft,
} from 'lucide-react';

export const BatchCreatePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);
  const [cropId, setCropId] = useState<number | ''>('');
  const [varietyId, setVarietyId] = useState<number | ''>('');
  const [isLoadingCrops, setIsLoadingCrops] = useState<boolean>(true);

  const [harvestDate, setHarvestDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [quantityStr, setQuantityStr] = useState<string>('');
  const [quantityUnit, setQuantityUnit] = useState<string>('KG');
  const [district, setDistrict] = useState<string>('');
  const [districtsList, setDistrictsList] = useState<{ id: number; name: string }[]>([]);
  const [storageCondition, setStorageCondition] = useState<StorageCondition | ''>('');

  // Media Evidence State
  const [photos, setPhotos] = useState<MediaAsset[]>([]);
  const [video, setVideo] = useState<MediaAsset | undefined>(undefined);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const STORAGE_OPTIONS = [
    { value: 'Cool, ventilated storage', label: 'Cool, ventilated storage (Recommended for Banana)' },
    { value: 'Cool storage', label: 'Cool storage (Recommended for Mango, Chilli, Gourds)' },
    { value: 'Ambient / cool storage', label: 'Ambient / cool storage (Recommended for Tomato)' },
    { value: 'Dry, well-ventilated storage', label: 'Dry, well-ventilated storage (Recommended for Onion)' },
    { value: 'Cool, humid storage', label: 'Cool, humid storage (Recommended for Brinjal, Okra, Drumstick)' },
    { value: 'Cool, dry storage', label: 'Cool, dry storage (Recommended for Bottle Gourd, Tapioca)' },
    { value: 'Refrigerated storage', label: 'Refrigerated storage (Recommended for Carrot)' },
    { value: 'Refrigerated / cool storage', label: 'Refrigerated / cool storage (Recommended for Beetroot)' },
    { value: 'AMBIENT', label: 'Ambient Field Storage' },
    { value: 'COLD_STORAGE', label: 'Cold Storage Unit' },
    { value: 'REFRIGERATED', label: 'Refrigerated Transport' },
    { value: 'CONTROLLED_ATMOSPHERE', label: 'Controlled Atmosphere (CA)' },
  ];

  // Load initial crops and varieties
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        setIsLoadingCrops(true);
        const [fetchedCrops, dList] = await Promise.all([
          cropService.getCrops(),
          locationService.getDistricts(1),
        ]);

        if (isMounted) {
          setDistrictsList(dList);
        }

        if (isMounted && fetchedCrops.length > 0) {
          setCrops(fetchedCrops);
          // Do not auto-select crop or variety so inputs start clean with placeholders
        }
      } catch (err) {
        console.error('Failed to load crops/varieties:', err);
      } finally {
        if (isMounted) setIsLoadingCrops(false);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle crop change: auto-set recommended storage condition & load fresh varieties
  const handleCropChange = async (newCropId: number) => {
    setCropId(newCropId);
    const selectedCrop = crops.find((c) => c.id === newCropId);
    if (selectedCrop?.defaultStorageCondition) {
      setStorageCondition(selectedCrop.defaultStorageCondition);
    }
    setVarietyId(''); // clear currently selected variety
    setVarieties([]);
    try {
      const vars = await cropService.getVarietiesByCropId(newCropId);
      setVarieties(vars);
      setVarietyId(''); // require explicit variety selection
    } catch (err) {
      console.error('Failed to load varieties for crop', newCropId, err);
      showToast('Failed to load varieties for selected crop.', 'error');
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxPhotos = 10;
    const currentCount = photos.length;

    if (currentCount >= maxPhotos) {
      showToast('Maximum 10 photos allowed per batch.', 'warning');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    const availableSlots = maxPhotos - currentCount;
    const selectedFiles = Array.from(files);

    if (selectedFiles.length > availableSlots) {
      showToast(
        `Only ${availableSlots} more photo${availableSlots === 1 ? '' : 's'} can be added. (Max 10)`,
        'warning'
      );
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots);
    const newAssets: MediaAsset[] = [];

    for (const file of filesToProcess) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        showToast(
          `Invalid file format for "${file.name}". Allowed formats: JPG, JPEG, PNG, WEBP.`,
          'error'
        );
        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        showToast(`"${file.name}" exceeds 15MB size limit.`, 'warning');
        continue;
      }

      // Check duplicate filename
      if (photos.some((p) => p.fileName === file.name)) {
        showToast(`Photo "${file.name}" has already been selected.`, 'warning');
        continue;
      }

      const previewUrl = await readFileAsDataUrl(file);
      newAssets.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fileName: file.name,
        mediaType: 'PHOTO',
        mimeType: file.type,
        previewUrl,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        file,
      });
    }

    if (newAssets.length > 0) {
      setPhotos((prev) => [...prev, ...newAssets]);
      showToast(
        `Added ${newAssets.length} photo${newAssets.length === 1 ? '' : 's'}. (${photos.length + newAssets.length}/10)`,
        'success'
      );
    }

    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (video) {
      showToast('Maximum 1 video allowed per batch. Please remove existing video first.', 'warning');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    const file = files[0];
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.endsWith('.mp4')) {
      showToast(`Invalid video format for "${file.name}". Allowed format: MP4.`, 'error');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showToast(`"${file.name}" exceeds 100MB video size limit.`, 'warning');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const videoAsset: MediaAsset = {
      id: `video-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      mediaType: 'VIDEO',
      mimeType: file.type || 'video/mp4',
      previewUrl,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      file,
    };

    setVideo(videoAsset);
    showToast(`Video "${file.name}" attached successfully. (1/1)`, 'success');
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string | number) => {
    const photoToRemove = photos.find((p) => p.id === id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (photoToRemove) {
      showToast(`Removed "${photoToRemove.fileName}".`, 'info');
    }
  };

  const handleRemoveVideo = () => {
    if (video) {
      showToast(`Removed video "${video.fileName}".`, 'info');
      setVideo(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropId || cropId <= 0) {
      showToast('Please select a target crop.', 'warning');
      return;
    }

    if (!varietyId || varietyId <= 0) {
      showToast('Please select a valid variety for the crop.', 'warning');
      return;
    }

    const validation = validateQuantityInput(quantityStr, undefined, quantityUnit);
    if (!validation.isValid) {
      showToast(validation.error || 'Please enter a valid harvest quantity.', 'warning');
      return;
    }

    if (!district || district.trim() === '') {
      showToast('Please select a harvest district.', 'warning');
      return;
    }

    if (!storageCondition || storageCondition.trim() === '') {
      showToast('Please select a storage condition.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBatch = await batchService.createBatch(
        {
          cropId: Number(cropId),
          varietyId: Number(varietyId),
          harvestDate,
          quantity: validation.parsedValue,
          quantityUnit,
          district,
          state: 'Tamil Nadu',
          storageCondition,
          photos,
          video,
        },
        user?.id || 101,
        user?.fullName || 'Farmer'
      );

      showToast('Batch created successfully.', 'success');
      navigate(`/farmer/batches/${newBatch.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create batch.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">Create New Harvest Batch</h1>
          <p className="text-xs text-[#526158] mt-0.5">
            Enter harvest information and optionally attach product evidence photos and video for AI inspection.
          </p>
        </div>
        <Link
          to="/farmer/batches"
          className="px-3.5 py-2 text-xs font-bold text-[#526158] hover:text-[#1B5E20] bg-white border border-[#C5E6CC] rounded-xl hover:bg-[#EEF8F0] transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-6 text-xs">
        {/* Crop & Variety Selection */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Target Crop</label>
            <select
              value={cropId}
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleCropChange(parseInt(val, 10));
              }}
              disabled={isLoadingCrops}
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] font-semibold"
            >
              <option value="" disabled>-- Select Target Crop --</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#17201A] mb-1">Variety / Cultivar</label>
            <select
              value={varietyId}
              onChange={(e) => {
                const val = e.target.value;
                if (val) setVarietyId(parseInt(val, 10));
              }}
              disabled={!cropId || varieties.length === 0}
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] font-semibold"
            >
              <option value="" disabled>
                {!cropId ? '-- Select Target Crop First --' : varieties.length === 0 ? 'No varieties available' : '-- Select Variety / Cultivar --'}
              </option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Harvest Date & Quantity */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Harvest Date</label>
            <input
              type="date"
              required
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] font-semibold"
            />
          </div>
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Harvest Quantity</label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={quantityStr}
              onChange={(e) => setQuantityStr(e.target.value)}
              onBlur={() => setQuantityStr(normalizeNumericInput(quantityStr))}
              placeholder="e.g. 500"
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Unit</label>
            <select
              value={quantityUnit}
              onChange={(e) => setQuantityUnit(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] font-semibold"
            >
              <option value="KG">Kilograms (KG)</option>
              <option value="TONS">Metric Tons</option>
            </select>
          </div>
        </div>

        {/* Location & Storage */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-[#17201A] mb-1">Harvest District (Tamil Nadu)</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] font-semibold"
            >
              <option value="" disabled>-- Select Harvest District --</option>
              {districtsList.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[#17201A]">Storage Condition</label>
              {crops.find((c) => c.id === cropId)?.defaultStorageCondition && (
                <span className="text-[10px] bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] px-2 py-0.5 rounded-md font-medium">
                  💡 Recommended: {crops.find((c) => c.id === cropId)?.defaultStorageCondition}
                </span>
              )}
            </div>
            <select
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
              className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] font-semibold"
            >
              <option value="" disabled>-- Select Storage Condition --</option>
              {STORAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PRODUCT EVIDENCE SECTION */}
        <div className="border-t border-[#C5E6CC] pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#2E7D32]" /> Product Evidence
              </h3>
              <p className="text-[11px] text-[#526158]">
                Product photos are required before AI inspection. Upload up to 10 photos and 1 video for computer vision quality analysis.
              </p>
            </div>

            {/* Counters */}
            <div className="flex gap-2 text-xs font-bold shrink-0">
              <span className="px-2.5 py-1 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] rounded-xl">
                Photos: {photos.length} / 10
              </span>
              <span className="px-2.5 py-1 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] rounded-xl">
                Video: {video ? 1 : 0} / 1
              </span>
            </div>
          </div>

          {/* Visually Hidden File Inputs */}
          <input
            type="file"
            ref={photoInputRef}
            onChange={handlePhotoSelect}
            multiple
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="sr-only"
            id="photo-upload-input"
          />
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoSelect}
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            id="video-upload-input"
          />

          {/* Styled Action Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photos.length >= 10}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-xs text-xs ${
                photos.length >= 10
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] hover:bg-[#DDF2E1]'
              }`}
            >
              <Plus className="w-4 h-4 text-[#2E7D32]" />
              <ImageIcon className="w-4 h-4 text-[#2E7D32]" />
              Add Photos {photos.length > 0 && `(${photos.length}/10)`}
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={!!video}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-xs text-xs ${
                video
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] hover:bg-[#DDF2E1]'
              }`}
            >
              <Plus className="w-4 h-4 text-[#2E7D32]" />
              <VideoIcon className="w-4 h-4 text-[#2E7D32]" />
              {video ? 'Video Attached (1/1)' : 'Add Video'}
            </button>
          </div>

          {/* Photo Thumbnail Grid */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#526158]">Attached Photos ({photos.length})</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl p-1.5 flex flex-col justify-between shadow-xs hover:border-[#2E7D32] transition-colors overflow-hidden"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-1.5 relative">
                      <img
                        src={photo.previewUrl}
                        alt={photo.fileName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        aria-label={`Remove photo ${photo.fileName}`}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-[#B3261E] text-white rounded-full transition-colors shadow-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="px-1">
                      <p className="text-[10px] font-bold text-[#17201A] truncate" title={photo.fileName}>
                        {photo.fileName}
                      </p>
                      <p className="text-[9px] text-[#526158]">
                        {(photo.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Preview */}
          {video && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#526158]">Attached Video Evidence</span>
              <div className="bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center shrink-0">
                    <FileVideo className="w-5 h-5 text-[#2E7D32]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[#17201A] truncate max-w-xs">{video.fileName}</p>
                    <p className="text-[10px] text-[#526158]">
                      {(video.size / (1024 * 1024)).toFixed(2)} MB • {video.mimeType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <video
                    src={video.previewUrl}
                    controls
                    className="h-16 w-28 rounded-xl object-cover border border-[#C5E6CC] bg-black"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    aria-label={`Remove video ${video.fileName}`}
                    className="p-2 text-[#B3261E] hover:bg-red-50 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {photos.length === 0 && !video && (
            <div className="p-4 bg-[#FCFBF5] border border-dashed border-[#C5E6CC] rounded-2xl text-center text-xs text-[#526158]">
              No evidence attached yet. You can create the batch now and add evidence or run AI inspection later.
            </div>
          )}
        </div>

        {/* Submit & Cancel Actions */}
        <div className="border-t border-[#C5E6CC] pt-5 flex flex-col sm:flex-row gap-3">
          <Link
            to="/farmer/batches"
            className="w-full sm:w-1/3 py-3.5 bg-[#FCFBF5] text-[#526158] hover:text-[#17201A] font-bold rounded-2xl border border-[#C5E6CC] hover:bg-[#EEF8F0] transition-colors shadow-xs flex items-center justify-center gap-2 text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-2/3 py-3.5 bg-[#2E7D32] text-white font-bold rounded-2xl hover:bg-[#1B5E20] transition-colors shadow-xs flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? 'Creating Batch...' : 'Create Batch'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

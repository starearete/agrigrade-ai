import { mockRepository } from './mockRepository';
import { ProductBatch, CreateBatchRequest, BatchStatus, MediaAsset } from '../types/batch';
import { apiClient } from './apiClient';

import { getCropFallbackImage, calculateDynamicShelfLife } from '../utils/cropImages';

const BASE_API_URL = (import.meta.env.VITE_API_URL as string) || 'https://agrigrade-backend-0g8z.onrender.com/api/v1';
const BACKEND_BASE = BASE_API_URL.replace(/\/api\/v1\/?$/, '');

export function resolveImageUrl(url?: string | null, cropName?: string): string {
  if (!url || url === 'null' || url.trim() === '') {
    return getCropFallbackImage(cropName);
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${BACKEND_BASE}${url}`;
  }
  return `${BACKEND_BASE}/${url}`;
}

function mapBackendBatchToFrontend(backendBatch: any): ProductBatch {
  const rawImages = backendBatch.images || [];

  const photos: MediaAsset[] = rawImages
    .filter((img: any) => img.mediaType !== 'VIDEO')
    .map((img: any, idx: number) => ({
      id: img.id || idx + 1,
      fileName: `photo_${img.sequenceNo || idx + 1}.jpeg`,
      mediaType: 'PHOTO' as const,
      mimeType: 'image/jpeg',
      previewUrl: resolveImageUrl(img.imageUrl, backendBatch.cropName),
      uploadedAt: img.capturedAt || new Date().toISOString(),
      size: 102450,
    }));

  const videoImg = rawImages.find((img: any) => img.mediaType === 'VIDEO');
  const video: MediaAsset | undefined = videoImg
    ? {
        id: videoImg.id,
        fileName: `video_${videoImg.sequenceNo || 1}.mp4`,
        mediaType: 'VIDEO' as const,
        mimeType: 'video/mp4',
        previewUrl: resolveImageUrl(videoImg.imageUrl),
        uploadedAt: videoImg.capturedAt || new Date().toISOString(),
        size: 1048576,
      }
    : undefined;

  return {
    id: backendBatch.id,
    batchNumber: backendBatch.batchNumber,
    farmerId: backendBatch.farmerId,
    farmerName: backendBatch.farmerName || 'Farmer',
    cropId: backendBatch.cropId,
    cropName: backendBatch.cropName || 'Crop',
    varietyId: backendBatch.varietyId,
    varietyName: backendBatch.varietyName || 'Variety',
    harvestDate: backendBatch.harvestDate,
    quantity: backendBatch.quantity,
    quantityUnit: backendBatch.quantityUnit || 'KG',
    harvestLocationDistrict: backendBatch.harvestLocationDistrict || backendBatch.district || '',
    harvestLocationState: backendBatch.harvestLocationState || backendBatch.state || 'Tamil Nadu',
    storageCondition: backendBatch.storageCondition,
    status: backendBatch.status as BatchStatus,
    images: rawImages.map((img: any) => ({
      id: img.id,
      batchId: backendBatch.id,
      imageUrl: resolveImageUrl(img.imageUrl),
      sequenceNo: img.sequenceNo,
      sha256Hash: img.sha256Hash || '',
      mediaType: img.mediaType || 'PHOTO',
    })),
    photos,
    video,
    qualityScore: backendBatch.qualityScore,
    assignedGrade: backendBatch.assignedGrade,
    certificateNumber: backendBatch.certificateNumber,
    certificateStatus: backendBatch.certificateStatus,
    cropAgeDays: backendBatch.cropAgeDays,
    remainingShelfLifeDays: backendBatch.remainingShelfLifeDays,
    createdAt: backendBatch.createdAt || new Date().toISOString(),
    updatedAt: backendBatch.updatedAt || new Date().toISOString(),
  };
}

export const batchService = {
  resolveImageUrl,

  async uploadBatchImage(
    batchId: number,
    file: File,
    mediaType: 'PHOTO' | 'VIDEO' = 'PHOTO'
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', mediaType);
    return apiClient.postFormData<any>(`/batches/${batchId}/images`, formData);
  },

  async getBatches(_farmerId?: number): Promise<ProductBatch[]> {
    const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');
    let backendBatches: ProductBatch[] = [];
    let backendSuccess = false;
    try {
      const data = await apiClient.get<any[]>('/batches');
      if (Array.isArray(data)) {
        backendBatches = data.map(mapBackendBatchToFrontend);
        backendSuccess = true;
      }
    } catch (err) {
      console.warn('Backend /batches API error:', err);
    }

    const activeUserId = mockRepository.getActiveUserId();
    const state = mockRepository.getState(activeUserId || undefined);
    const mockBatches = state.batches;
    const analyses = state.analyses || [];

    const map = new Map<number, ProductBatch>();
    const candidateBatches = (backendSuccess && token && backendBatches.length > 0) ? backendBatches : mockBatches;

    for (const b of candidateBatches) {
      if (_farmerId && b.farmerId !== _farmerId) continue;

      const mb = mockBatches.find((x) => x.id === b.id);
      const liveAnalysis = analyses.find((a) => a.batchId === b.id);
      const isGraded = (mb && (mb.status === 'AI_GRADED' || mb.status === 'AI_VERIFIED')) || (liveAnalysis && liveAnalysis.status === 'COMPLETED') || b.status === 'AI_GRADED' || b.status === 'AI_VERIFIED';

      if (isGraded || b.assignedGrade || mb?.assignedGrade || liveAnalysis) {
        const grade = b.assignedGrade || mb?.assignedGrade || liveAnalysis?.qualityResult?.assignedGrade;
        const score = b.qualityScore ?? mb?.qualityScore ?? liveAnalysis?.qualityResult?.qualityScore;
        const isRej = grade === 'REJECTED' || grade === 'Reject' || grade === 'REJECT' || score === 0 || (score !== undefined && score <= 10);
        const shelfDays = isRej ? 0 : (b.remainingShelfLifeDays ?? mb?.remainingShelfLifeDays ?? liveAnalysis?.shelfLifePrediction?.estimatedRemainingDays ?? calculateDynamicShelfLife(b.cropName, b.harvestDate, grade));
        const pLow = isRej ? 0 : ((b as any).priceRangeLow ?? mb?.priceRangeLow ?? liveAnalysis?.pricePrediction?.priceRangeLow ?? liveAnalysis?.aiPricePrediction?.estimated_low);
        const pHigh = isRej ? 0 : ((b as any).priceRangeHigh ?? mb?.priceRangeHigh ?? liveAnalysis?.pricePrediction?.priceRangeHigh ?? liveAnalysis?.aiPricePrediction?.estimated_high);

        map.set(b.id, {
          ...b,
          status: isRej ? 'AI_GRADED' : (b.status || mb?.status || 'AI_GRADED'),
          qualityScore: score,
          assignedGrade: grade,
          remainingShelfLifeDays: shelfDays,
          priceRangeLow: pLow,
          priceRangeHigh: pHigh,
        });
      } else {
        map.set(b.id, b);
      }
    }

    const resultList = Array.from(map.values());
    if (_farmerId) {
      return resultList.filter((b) => b.farmerId === _farmerId);
    }
    return resultList;
  },

  async getBatchById(id: number): Promise<ProductBatch | null> {
    const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');
    let backendBatch: ProductBatch | null = null;
    let backendAttempted = false;
    try {
      const data = await apiClient.get<any>(`/batches/${id}`);
      backendAttempted = true;
      if (data && data.id) {
        backendBatch = mapBackendBatchToFrontend(data);
      }
    } catch (err: any) {
      console.warn(`Backend /batches/${id} API error:`, err);
      // If backend returned HTTP 403 or 404, strictly reject access!
      if (err && (err.status === 403 || err.status === 404 || err.statusCode === 403 || err.statusCode === 404)) {
        return null;
      }
    }

    if (backendAttempted && backendBatch) {
      const activeUserId = mockRepository.getActiveUserId();
      const state = mockRepository.getState(activeUserId || undefined);
      const mb = state.batches.find((b) => b.id === id) || null;
      const liveAnalysis = state.analyses.find((a) => a.batchId === id);

      if (mb || liveAnalysis) {
        const grade = mb?.assignedGrade || liveAnalysis?.qualityResult?.assignedGrade || backendBatch.assignedGrade;
        const score = mb?.qualityScore ?? liveAnalysis?.qualityResult?.qualityScore ?? backendBatch.qualityScore;
        const isRej = grade === 'REJECTED' || grade === 'Reject' || grade === 'REJECT' || score === 0 || (score !== undefined && score <= 10);
        const shelfDays = isRej ? 0 : (mb?.remainingShelfLifeDays ?? liveAnalysis?.shelfLifePrediction?.estimatedRemainingDays ?? backendBatch.remainingShelfLifeDays ?? calculateDynamicShelfLife(backendBatch.cropName, backendBatch.harvestDate, grade));
        const pLow = isRej ? 0 : (mb?.priceRangeLow ?? liveAnalysis?.pricePrediction?.priceRangeLow ?? (backendBatch as any).priceRangeLow);
        const pHigh = isRej ? 0 : (mb?.priceRangeHigh ?? liveAnalysis?.pricePrediction?.priceRangeHigh ?? (backendBatch as any).priceRangeHigh);

        return {
          ...backendBatch,
          status: mb?.status || (liveAnalysis ? 'AI_GRADED' : backendBatch.status),
          qualityScore: score,
          assignedGrade: grade,
          remainingShelfLifeDays: shelfDays,
          priceRangeLow: pLow,
          priceRangeHigh: pHigh,
        };
      }
      return backendBatch;
    }

    // Fallback to user-scoped mock storage
    const activeUserId = mockRepository.getActiveUserId();
    const state = mockRepository.getState(activeUserId || undefined);
    const mb = state.batches.find((b) => b.id === id) || null;
    return mb;
  },

  async createBatch(request: CreateBatchRequest, _farmerId: number, farmerName: string): Promise<ProductBatch> {
    const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');

    try {
      const payload = {
        cropId: request.cropId,
        varietyId: request.varietyId,
        harvestDate: request.harvestDate,
        quantity: request.quantity,
        quantityUnit: request.quantityUnit || 'KG',
        district: request.district,
        state: request.state || 'Tamil Nadu',
        storageCondition: request.storageCondition,
      };

      const backendBatch = await apiClient.post<any>('/batches', payload);
      if (backendBatch && backendBatch.id) {
        const batchId = backendBatch.id;

        // Upload attached photos
        if (request.photos && request.photos.length > 0) {
          for (const p of request.photos) {
            if (p.file) {
              try {
                await this.uploadBatchImage(batchId, p.file, 'PHOTO');
              } catch (uploadErr) {
                console.warn(`Failed to upload photo ${p.fileName}:`, uploadErr);
              }
            }
          }
        }

        // Upload attached video
        if (request.video && request.video.file) {
          try {
            await this.uploadBatchImage(batchId, request.video.file, 'VIDEO');
          } catch (uploadErr) {
            console.warn(`Failed to upload video ${request.video.fileName}:`, uploadErr);
          }
        }

        // Refetch complete batch with uploaded images
        const fullBatch = await apiClient.get<any>(`/batches/${batchId}`);
        const createdBatch = mapBackendBatchToFrontend(fullBatch || backendBatch);
        mockRepository.updateState((draft) => {
          draft.batches.unshift(createdBatch);
        });
        return createdBatch;
      }
      throw new Error('Failed to create batch on backend');
    } catch (err) {
      console.warn('Backend POST /batches API failed:', err);
      if (token) {
        throw err;
      }
    }

    const state = mockRepository.getState();
    const newId = 500 + state.batches.length + 1;
    const photos = request.photos || [];

    const legacyImages = photos.map((p, idx) => ({
      id: newId * 10 + idx,
      batchId: newId,
      imageUrl: p.previewUrl,
      sequenceNo: idx + 1,
      sha256Hash: `hash-${newId}-${idx}`,
    }));

    const newBatch: ProductBatch = {
      id: newId,
      batchNumber: `BATCH-${newId}`,
      farmerId: _farmerId,
      farmerName,
      cropId: request.cropId,
      cropName: 'Crop',
      varietyId: request.varietyId,
      varietyName: 'Variety',
      harvestDate: request.harvestDate,
      quantity: request.quantity,
      quantityUnit: request.quantityUnit || 'KG',
      harvestLocationDistrict: request.district,
      harvestLocationState: request.state || 'Tamil Nadu',
      storageCondition: request.storageCondition,
      status: 'PENDING_AI',
      images: legacyImages,
      photos,
      video: request.video,
      videoUrl: request.video?.previewUrl || request.videoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockRepository.updateState((draft) => {
      draft.batches.unshift(newBatch);
    });

    return newBatch;
  },

  async deleteBatch(id: number | string): Promise<void> {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');

    try {
      await apiClient.delete(`/batches/${numId}`);
    } catch (err) {
      console.warn(`Backend DELETE /batches/${numId} API failed:`, err);
      if (token) {
        throw err;
      }
    }

    mockRepository.updateState((draft) => {
      draft.batches = draft.batches.filter((b) => b.id !== numId);
      if (draft.analyses) {
        draft.analyses = draft.analyses.filter((a) => a.batchId !== numId);
      }
      if (draft.certificates) {
        draft.certificates = draft.certificates.filter((c) => c.batchId !== numId);
      }
      if (draft.inspectionHistory) {
        draft.inspectionHistory = draft.inspectionHistory.filter((h) => h.batchId !== numId);
      }
      if (draft.listings) {
        draft.listings = draft.listings.filter((l) => l.batchId !== numId);
      }
    });
  },

  async updateBatchStatus(batchId: number, status: BatchStatus): Promise<ProductBatch> {
    try {
      const backendBatch = await apiClient.put<any>(`/batches/${batchId}/status`, { status });
      if (backendBatch && backendBatch.id) {
        const updated = mapBackendBatchToFrontend(backendBatch);
        mockRepository.updateState((draft) => {
          const b = draft.batches.find((x) => x.id === batchId);
          if (b) {
            b.status = status;
            b.updatedAt = updated.updatedAt;
          }
        });
        return updated;
      }
    } catch (err) {
      console.warn(`Backend PUT /batches/${batchId}/status API failed:`, err);
    }

    let updated: ProductBatch | undefined;
    mockRepository.updateState((draft) => {
      const b = draft.batches.find((x) => x.id === batchId);
      if (b) {
        b.status = status;
        b.updatedAt = new Date().toISOString();
        updated = b;
      }
    });
    if (!updated) throw new Error('Batch not found');
    return updated;
  },

  async addBatchEvidence(
    batchId: number,
    newPhotos: MediaAsset[],
    newVideo?: MediaAsset
  ): Promise<ProductBatch> {
    const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');

    if (token) {
      for (const p of newPhotos) {
        if (p.file) {
          try {
            await this.uploadBatchImage(batchId, p.file, 'PHOTO');
          } catch (err) {
            console.warn('Failed to upload photo:', err);
          }
        }
      }
      if (newVideo && newVideo.file) {
        try {
          await this.uploadBatchImage(batchId, newVideo.file, 'VIDEO');
        } catch (err) {
          console.warn('Failed to upload video:', err);
        }
      }
      const reloaded = await this.getBatchById(batchId);
      if (reloaded) return reloaded;
    }

    let updated: ProductBatch | undefined;
    mockRepository.updateState((draft) => {
      const b = draft.batches.find((x) => x.id === batchId);
      if (b) {
        if (!b.photos) b.photos = [];
        const currentCount = b.photos.length;
        const availableSlots = Math.max(0, 10 - currentCount);
        const photosToAdd = newPhotos.slice(0, availableSlots);

        b.photos = [...b.photos, ...photosToAdd];

        if (newVideo) {
          b.video = newVideo;
          b.videoUrl = newVideo.previewUrl;
        }

        b.images = b.photos.map((p, idx) => ({
          id: b.id * 10 + idx,
          batchId: b.id,
          imageUrl: p.previewUrl,
          sequenceNo: idx + 1,
          sha256Hash: `hash-${b.id}-${idx}`,
        }));

        b.updatedAt = new Date().toISOString();
        updated = b;
      }
    });

    if (!updated) throw new Error('Batch not found');
    return updated;
  },

  async removeBatchEvidence(
    batchId: number,
    assetId: string | number,
    assetType: 'PHOTO' | 'VIDEO'
  ): Promise<ProductBatch> {
    const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');

    if (token && typeof assetId === 'number' && assetId > 0) {
      try {
        await apiClient.delete(`/batches/${batchId}/images/${assetId}`);
      } catch (err) {
        console.warn('Failed to delete image on backend:', err);
      }
      const reloaded = await this.getBatchById(batchId);
      if (reloaded) return reloaded;
    }

    let updated: ProductBatch | undefined;
    mockRepository.updateState((draft) => {
      const b = draft.batches.find((x) => x.id === batchId);
      if (b) {
        if (assetType === 'PHOTO' && b.photos) {
          b.photos = b.photos.filter((p) => p.id !== assetId);
          b.images = b.photos.map((p, idx) => ({
            id: b.id * 10 + idx,
            batchId: b.id,
            imageUrl: p.previewUrl,
            sequenceNo: idx + 1,
            sha256Hash: `hash-${b.id}-${idx}`,
          }));
        } else if (assetType === 'VIDEO') {
          b.video = undefined;
          b.videoUrl = undefined;
        }
        b.updatedAt = new Date().toISOString();
        updated = b;
      }
    });

    if (!updated) throw new Error('Batch not found');
    return updated;
  },

  async getBatchEvidence(batchId: number): Promise<{ photos: MediaAsset[]; video?: MediaAsset }> {
    const b = await this.getBatchById(batchId);
    return {
      photos: b?.photos || [],
      video: b?.video,
    };
  },
};

export type StorageCondition =
  | 'AMBIENT'
  | 'COLD_STORAGE'
  | 'REFRIGERATED'
  | 'CONTROLLED_ATMOSPHERE'
  | 'Cool, ventilated storage'
  | 'Cool storage'
  | 'Ambient / cool storage'
  | 'Dry, well-ventilated storage'
  | 'Cool, humid storage'
  | 'Cool, dry storage'
  | 'Refrigerated storage'
  | 'Refrigerated / cool storage'
  | string;

export type BatchStatus =
  | 'DRAFT'
  | 'READY_FOR_AI'
  | 'AI_ANALYZING'
  | 'AI_VERIFIED'
  | 'AI_GRADED' // legacy alias for AI_VERIFIED
  | 'ANALYZED'
  | 'LISTED'
  | 'SOLD'
  | 'AI_FAILED'
  | 'CROP_MISMATCH'
  | 'LOW_CONFIDENCE'
  | 'HARVESTED'
  | 'PENDING_AI'
  | 'PARTIALLY_SOLD'
  | 'DELISTED';

export interface MediaAsset {
  id: string | number;
  fileName: string;
  mediaType: 'PHOTO' | 'VIDEO';
  mimeType: string;
  previewUrl: string;
  uploadedAt: string;
  size: number;
  file?: File;
}

export interface BatchImage {
  id: number;
  batchId: number;
  imageUrl: string;
  sequenceNo: number;
  sha256Hash: string;
  capturedAt?: string;
}

export interface ProductBatch {
  id: number;
  batchNumber: string;
  farmerId: number;
  farmerName: string;
  farmerMobile?: string;
  cropId: number;
  cropName: string;
  varietyId: number;
  varietyName: string;
  harvestDate: string; // YYYY-MM-DD
  quantity: number;
  quantityUnit: string; // e.g. "KG" or "TONS"
  harvestLocationDistrict: string;
  harvestLocationState: string;
  latitude?: number;
  longitude?: number;
  storageCondition: StorageCondition;
  status: BatchStatus;
  images: BatchImage[];
  photos?: MediaAsset[];
  video?: MediaAsset;
  videoUrl?: string;
  qualityScore?: number;
  assignedGrade?: string;
  certificateNumber?: string;
  certificateStatus?: string;
  cropAgeDays?: number;
  remainingShelfLifeDays?: number;
  priceRangeLow?: number;
  priceRangeHigh?: number;
  marketRecommendation?: string;
  inspectionLocked?: boolean;
  inspectionLockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchRequest {
  cropId: number;
  varietyId: number;
  harvestDate: string;
  quantity: number;
  quantityUnit: string;
  district: string;
  state: string;
  storageCondition: StorageCondition;
  photos?: MediaAsset[];
  video?: MediaAsset;
  imageUrls?: string[];
  videoUrl?: string;
}

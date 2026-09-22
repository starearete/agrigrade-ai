import { QualityGrade } from './ai';

export type ListingStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SOLD_OUT' | 'SUSPENDED' | 'WITHDRAWN' | 'DELETED';

export type ShelfLifeStatus = 'FRESH' | 'NEAR_EXPIRY' | 'EXPIRED';

export interface MarketplaceListing {
  id: number;
  batchId: number;
  listingCode: string;
  farmerId: number;
  farmerName: string;
  farmerCode: string;
  farmerDistrict: string;
  farmerVerified: boolean;
  cropName: string;
  varietyName: string;
  askingPricePerUnit: number;
  minimumOrderQuantity: number;
  quantityRemaining: number;
  quantityUnit: string;
  assignedGrade: QualityGrade;
  qualityScore: number;
  harvestDate: string;
  cropAgeDays: number;
  inspectionDate: string;
  estimatedRemainingDays: number;
  effectiveShelfLifeDays?: number;
  remainingShelfLifeDays?: number;
  shelfLifeStatus?: ShelfLifeStatus;
  certificateNumber?: string;
  coverImageUrl: string;
  images: string[];
  listedAt: string;
  expiresAt: string;
  status: ListingStatus;
  distanceKm?: number;
}

export interface ListingFilterRequest {
  cropName?: string;
  varietyName?: string;
  grade?: QualityGrade;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  maxDistanceKm?: number;
  sortBy?: 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'QUALITY' | 'FRESHNESS' | 'DISTANCE';
}

export type MarketType = 'MANDI' | 'WHOLESALE_HUB' | 'FARMER_MARKET' | 'DIRECT_BUYER_HUB';

export type SortMode = 'BEST_NET_REALIZATION' | 'NEAREST' | 'HIGHEST_PRICE';

export interface Market {
  id: number;
  code: string;
  name: string;
  marketType: MarketType;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface MarketRate {
  id: number;
  marketId: number;
  marketName: string;
  cropName: string;
  varietyId: number;
  varietyName: string;
  qualityGrade: string;
  minPricePerKg: number;
  maxPricePerKg: number;
  modalPricePerKg: number;
  quantityArrivedTons?: number;
  observedAt: string;
}

export interface TransportEstimate {
  id: number;
  originDistrict: string;
  destinationMarketName: string;
  distanceKm: number;
  estimatedTravelMinutes: number;
  estimatedCost: number;
  vehicleType: string;
  calculatedAt: string;
}

export interface MarketRecommendationRequest {
  cropName: string;
  varietyName: string;
  qualityGrade: string; // 'GRADE_A' | 'GRADE_B' | 'GRADE_C'
  quantityKg: number;
  district: string;
  harvestDate?: string;
  sortMode?: SortMode;
}

export interface MarketTrendDay {
  date: string;
  dateLabel: string;
  pricePerKg: number;
}

export interface MarketRecommendation {
  id: number;
  batchId?: number;
  marketId: number;
  marketName: string;
  district: string;
  state?: string;
  cropName: string;
  varietyName: string;
  qualityGrade: string;
  currentMarketPricePerKg: number;
  predictedPriceRange?: {
    low: number;
    high: number;
  };
  distanceKm: number;
  estimatedTravelMinutes: number;
  estimatedTransportCost: number;
  grossValue: number;
  estimatedNetRevenue: number;
  recommendationScore: number;
  rankOrder: number;
  observedAt: string;
  arrivalDate?: string;
  generatedAt: string;
  freshness?: 'FRESH' | 'STALE' | 'PRICE_DATA_UNAVAILABLE' | string;
  source?: string;
  trend?: 'RISING' | 'FALLING' | 'STABLE' | 'INSUFFICIENT_DATA' | string;
  action?: 'SELL_NOW' | 'HOLD / MONITOR' | 'REJECT' | string;
  priceTrend?: MarketTrendDay[];
}

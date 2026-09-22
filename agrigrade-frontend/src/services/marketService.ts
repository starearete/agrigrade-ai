import { mockRepository } from './mockRepository';
import {
  Market,
  MarketRate,
  MarketRecommendation,
  MarketRecommendationRequest,
  MarketTrendDay,
  SortMode,
} from '../types/market';
import { apiClient } from './apiClient';
import { batchService } from './batchService';

export const CROP_VARIETIES_MAP: Record<string, string[]> = {
  Banana: ['G9 / Grand Naine', 'Nendran', 'Poovan', 'Robusta', 'Rasthali'],
  Onion: ['Small Onion / Shallot', 'Bellary Onion', 'Red Onion'],
  Tomato: ['Hybrid Tomato', 'Country Tomato', 'CO-3 (Hybrid Country)'],
  Mango: ['Alphonso', 'Banganapalli', 'Totapuri', 'Kesar'],
  Carrot: ['Ooty Carrot', 'Hybrid Carrot'],
  Okra: ['Green Lady Finger', 'Hybrid Okra'],
  Beetroot: ['Local Red', 'Hybrid Beetroot'],
};

export const marketService = {
  async getMarkets(): Promise<Market[]> {
    try {
      const data = await apiClient.get<Market[]>('/markets');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Backend /markets API unavailable:', err);
    }
    return [];
  },

  async getMarketRates(district?: string): Promise<MarketRate[]> {
    try {
      const url = district ? `/markets/rates?district=${encodeURIComponent(district)}` : '/markets/rates';
      const data = await apiClient.get<MarketRate[]>(url);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Backend /markets/rates API unavailable:', err);
    }
    return [];
  },

  async getRecommendationsForBatch(
    batchId: number,
    options?: { sortMode?: SortMode; simulateError?: boolean }
  ): Promise<MarketRecommendation[]> {
    let batch = await batchService.getBatchById(batchId);
    if (!batch) {
      const state = mockRepository.getState();
      batch = state.batches.find((b) => b.id === batchId) || null;
    }
    if (!batch) throw new Error('Batch not found');

    const state = mockRepository.getState();
    const analysis = state.analyses.find((a) => a.batchId === batchId);
    const qualityGrade = analysis?.qualityResult?.assignedGrade.replace(/_/g, ' ') || 'Grade A';
    const qualityScore = analysis?.qualityResult?.qualityScore ?? 90;
    const shelfLifeDays = analysis?.shelfLifePrediction?.estimatedRemainingDays ?? 5;

    const recs = await this.getMarketRecommendations(
      {
        cropName: batch.cropName,
        varietyName: batch.varietyName,
        qualityGrade,
        quantityKg: batch.quantity,
        district: batch.harvestLocationDistrict || '',
        harvestDate: batch.harvestDate,
        sortMode: options?.sortMode || 'BEST_NET_REALIZATION',
      },
      {
        ...options,
        qualityScore,
        shelfLifeDays,
      }
    );

    recs.forEach((r) => {
      r.batchId = batchId;
    });

    return recs;
  },

  async getMarketRecommendations(
    req: MarketRecommendationRequest,
    options?: { simulateError?: boolean; qualityScore?: number; shelfLifeDays?: number }
  ): Promise<MarketRecommendation[]> {
    if (options?.simulateError) {
      throw new Error('Market data temporarily unavailable.');
    }

    const payload = {
      crop: req.cropName,
      cropName: req.cropName,
      varietyName: req.varietyName,
      grade: req.qualityGrade,
      qualityGrade: req.qualityGrade,
      quality_score: options?.qualityScore ?? 90.0,
      qualityScore: options?.qualityScore ?? 90.0,
      shelf_life_days: options?.shelfLifeDays ?? 5.0,
      shelfLifeDays: options?.shelfLifeDays ?? 5.0,
      quantity_kg: req.quantityKg,
      quantityKg: req.quantityKg,
      district: req.district,
      harvestLocationDistrict: req.district,
      state: 'Tamil Nadu',
      sort_mode: req.sortMode || 'BEST_NET_REALIZATION',
      sortMode: req.sortMode || 'BEST_NET_REALIZATION',
    };

    let rawData: any = null;

    // 1. Primary: Direct FastAPI Python AI Market Service (Port 5000)
    try {
      const queryParams = new URLSearchParams({
        crop: req.cropName,
        state: 'Tamil Nadu',
        district: req.district || 'Coimbatore',
        grade: req.qualityGrade,
        quality_score: (options?.qualityScore ?? 90.0).toString(),
        shelf_life_days: (options?.shelfLifeDays ?? 5.0).toString(),
        quantity_kg: req.quantityKg.toString(),
        sort_mode: req.sortMode || 'BEST_NET_REALIZATION',
      });

      const res = await fetch(`http://127.0.0.1:5000/api/v1/market/recommendations?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        rawData = await res.json();
      }
    } catch (e) {
      console.warn('FastAPI http://127.0.0.1:5000/api/v1/market/recommendations GET failed, trying POST/Gateway...', e);
    }

    // 2. Secondary: FastAPI POST or Spring Gateway POST /markets/recommendations
    if (!rawData) {
      try {
        rawData = await apiClient.post<any>('/markets/recommendations', payload);
      } catch (err) {
        console.warn('Spring Gateway /markets/recommendations POST failed:', err);
      }
    }

    // Process structured Python / API response
    if (rawData) {
      const isReqRejected = req.qualityGrade === 'REJECT' || req.qualityGrade === 'REJECTED';
      if (isReqRejected && (rawData.status === 'REJECTED' || rawData.action === 'REJECT')) {
        const offMkt = rawData.official_market_price || {};
        const realModal = offMkt.modal_price || offMkt.reference_price || 28.50;
        const mktTitle = offMkt.market || `${req.district || 'Coimbatore'} Wholesale APMC`;
        return [
          {
            id: 9999,
            marketId: 0,
            marketName: mktTitle,
            district: req.district || 'Coimbatore',
            state: 'Tamil Nadu',
            cropName: req.cropName,
            varietyName: req.varietyName,
            qualityGrade: 'REJECT',
            currentMarketPricePerKg: realModal,
            predictedPriceRange: { low: 0, high: 0 },
            distanceKm: 0,
            estimatedTravelMinutes: 0,
            estimatedTransportCost: 0,
            grossValue: 0,
            estimatedNetRevenue: 0,
            recommendationScore: 0,
            rankOrder: 1,
            observedAt: rawData.market_data_date || new Date().toISOString().split('T')[0],
            arrivalDate: rawData.market_data_date || new Date().toISOString().split('T')[0],
            generatedAt: new Date().toISOString(),
            freshness: rawData.data_freshness || 'FRESH',
            source: rawData.source || 'data.gov.in',
            trend: 'N/A',
            action: 'REJECT',
          },
        ];
      }

      const marketArray = Array.isArray(rawData.markets)
        ? rawData.markets
        : Array.isArray(rawData)
        ? rawData
        : [];

      if (marketArray.length > 0) {
        return marketArray.map((m: any, idx: number) => {
          const modalP = Number(m.modal_price_per_kg ?? m.modal_price ?? m.currentMarketPricePerKg ?? 0);
          const predLow = Number(m.predicted_price_range?.low ?? m.predicted_low ?? modalP * 0.9);
          const predHigh = Number(m.predicted_price_range?.high ?? m.predicted_high ?? modalP * 1.1);
          const distKm = Number(m.distance_km ?? m.distanceKm ?? 25);
          const logistics = Number(m.estimated_logistics_cost ?? m.estimatedTransportCost ?? (distKm * 8 + 400));
          const gross = Number(m.gross_revenue ?? m.grossValue ?? (modalP * req.quantityKg));
          const netReal = Number(m.net_realization ?? m.estimatedNetRevenue ?? Math.max(0, gross - logistics));

          return {
            id: m.id || 9000 + idx,
            marketId: m.marketId || idx + 101,
            marketName: m.market_name || m.marketName || 'Mandi Market',
            district: m.district || req.district || 'Coimbatore',
            state: m.state || 'Tamil Nadu',
            cropName: req.cropName,
            varietyName: req.varietyName,
            qualityGrade: req.qualityGrade,
            currentMarketPricePerKg: modalP,
            predictedPriceRange: { low: predLow, high: predHigh },
            distanceKm: distKm,
            estimatedTravelMinutes: Math.round(distKm * 1.5),
            estimatedTransportCost: logistics,
            grossValue: gross,
            estimatedNetRevenue: netReal,
            recommendationScore: Number(m.recommendation_score ?? m.recommendationScore ?? 85.0),
            rankOrder: idx + 1,
            observedAt: m.arrival_date || m.observedAt || new Date().toISOString().split('T')[0],
            arrivalDate: m.arrival_date || m.observedAt || new Date().toISOString().split('T')[0],
            generatedAt: new Date().toISOString(),
            freshness: m.freshness || rawData.data_freshness || 'FRESH',
            source: m.source || rawData.source || 'data.gov.in',
            trend: m.trend || 'STABLE',
            action: 'SELL_NOW',
          };
        });
      }
    }

    throw new Error('Government mandi price data is temporarily unavailable. Check API network logs.');
  },
};

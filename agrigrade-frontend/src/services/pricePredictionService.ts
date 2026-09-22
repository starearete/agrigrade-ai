import { mockRepository } from './mockRepository';
import { apiClient } from './apiClient';
import { batchService } from './batchService';

export interface PricePredictionRequest {
  batchId: number;
  cropId: number;
  cropName: string;
  varietyId: number;
  varietyName: string;
  quantityKg: number;
  harvestDate: string;
  district: string;
  qualityGrade: string;
  qualityScore: number;
  remainingShelfLifeDays: number;
  defectSeverity?: number;
  diseaseRisk?: string;
}

export interface ForecastDay {
  dayIndex: number;
  date: string;
  dayLabel: string;
  predictedPricePerKg: number;
  minPrice: number;
  maxPrice: number;
  expectedMandiArrivalTons: number;
  arrivalTrend: 'LIGHT' | 'MODERATE' | 'HEAVY';
  advisory: 'SELL_NOW' | 'EXCELLENT' | 'GOOD' | 'HOLD' | 'DIVERT';
}

export interface PricePredictionResult {
  id: number;
  batchId: number;
  cropName: string;
  varietyName: string;
  district: string;
  quantityKg: number;
  qualityGrade: string;
  qualityScore: number;
  remainingShelfLifeDays: number;

  currentPricePerKg: number;
  forecastedPrices: ForecastDay[];
  peakPrice: number;
  peakDate: string;
  expectedMandiArrival: string;
  priceChangeVsCurrent: number;
  priceChangePercent: number;

  recommendation: 'SELL_NOW' | 'HOLD_3_DAYS' | 'WAIT_7_DAYS' | 'DIVERT_TO_MANDI';
  recommendationReason: string;
  confidence: number;
  generatedAt: string;
}

const CROP_BASE_PRICES: Record<string, number> = {
  'Banana-G9 / Grand Naine': 25.5,
  'Banana-Nendran': 38.0,
  'Banana-Poovan': 32.0,
  'Banana-Rasthali': 35.0,
  'Tomato-CO-3 (Hybrid Country)': 22.0,
  'Mango-Banganapalli': 54.0,
  'Onion-Small Onion / Shallot': 42.0,
  Banana: 26.0,
  Tomato: 20.0,
  Mango: 50.0,
  Onion: 40.0,
};

export const pricePredictionService = {
  async getPredictionByBatchId(batchId: number): Promise<PricePredictionResult | null> {
    try {
      const data = await apiClient.get<any>(`/predictions/price/${batchId}`);
      if (data && (data.batchId || data.id)) {
        const currPrice = Number(data.currentPricePerKg || data.predictedPricePerKg || 25.0);
        const peakPrice = Number(data.peakPrice || currPrice * 1.08);
        const changeVsCurr = Number(data.priceChangeVsCurrent !== undefined ? data.priceChangeVsCurrent : (peakPrice - currPrice));
        const changePct = Number(data.priceChangePercent !== undefined ? data.priceChangePercent : (currPrice > 0 ? Math.round((changeVsCurr / currPrice) * 1000) / 10 : 0));
        const rec = (data.recommendation || data.recommendationAdvisory || 'SELL_NOW') as PricePredictionResult['recommendation'];

        return {
          id: data.id || Date.now(),
          batchId: Number(data.batchId || batchId),
          cropName: data.cropName || 'Produce',
          varietyName: data.varietyName || 'Standard',
          district: data.district || '',
          quantityKg: Number(data.quantityKg || 1000),
          qualityGrade: data.qualityGrade || 'GRADE_A_PREMIUM',
          qualityScore: Number(data.qualityScore || 92.5),
          remainingShelfLifeDays: Number(data.remainingShelfLifeDays || 7),
          currentPricePerKg: Math.round(currPrice * 100) / 100,
          forecastedPrices: (data.forecastedPrices && data.forecastedPrices.length > 0)
            ? data.forecastedPrices.map((f: any) => ({
                dayIndex: Number(f.dayIndex || 0),
                date: f.date || new Date().toISOString().split('T')[0],
                dayLabel: f.dayLabel || 'Today',
                predictedPricePerKg: Number(f.predictedPricePerKg || currPrice),
                minPrice: Number(f.minPrice || currPrice * 0.95),
                maxPrice: Number(f.maxPrice || currPrice * 1.08),
                expectedMandiArrivalTons: Number(f.expectedMandiArrivalTons || 60),
                arrivalTrend: f.arrivalTrend || 'MODERATE',
                advisory: f.advisory || 'SELL_NOW',
              }))
            : this.generateDefaultForecast(currPrice),
          peakPrice: Math.round(peakPrice * 100) / 100,
          peakDate: data.peakDate || new Date().toISOString().split('T')[0],
          expectedMandiArrival: data.expectedMandiArrival || '55 - 65 Tons (Moderate)',
          priceChangeVsCurrent: Math.round(changeVsCurr * 100) / 100,
          priceChangePercent: changePct,
          recommendation: rec,
          recommendationReason: data.recommendationReason || 'Optimal Mandi realization window based on regional arrival trends.',
          confidence: Number(data.confidence || 94.5),
          generatedAt: data.generatedAt || data.calculatedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn(`Backend GET /predictions/price/${batchId} unavailable:`, err);
    }

    const state = mockRepository.getState();
    const stateRecord = (state as any).pricePredictionResults?.find(
      (p: PricePredictionResult) => p.batchId === batchId
    );
    return stateRecord || null;
  },

  generateDefaultForecast(currentPricePerKg: number): ForecastDay[] {
    const today = new Date();
    const priceFluctuations = [0, +0.8, +1.5, +2.2, +1.1, -0.5, -1.2];
    const arrivalTonsBase = [55, 62, 48, 42, 68, 85, 92];
    const forecastedPrices: ForecastDay[] = [];

    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];
      const dayPrice = Math.round((currentPricePerKg + priceFluctuations[i]) * 100) / 100;
      const minP = Math.round((dayPrice - 1.5) * 100) / 100;
      const maxP = Math.round((dayPrice + 1.8) * 100) / 100;
      const tons = arrivalTonsBase[i];

      let dayLabel = `Day ${i + 1}`;
      if (i === 0) dayLabel = 'Today';
      else if (i === 1) dayLabel = 'Tomorrow';

      let advisory: ForecastDay['advisory'] = 'GOOD';
      if (i === 0) advisory = 'SELL_NOW';
      else if (dayPrice >= currentPricePerKg + 1.5) advisory = 'EXCELLENT';
      else if (tons > 80) advisory = 'HOLD';

      forecastedPrices.push({
        dayIndex: i,
        date: dateStr,
        dayLabel,
        predictedPricePerKg: dayPrice,
        minPrice: minP,
        maxPrice: maxP,
        expectedMandiArrivalTons: tons,
        arrivalTrend: tons > 75 ? 'HEAVY' : tons > 50 ? 'MODERATE' : 'LIGHT',
        advisory,
      });
    }

    return forecastedPrices;
  },

  async predictForBatch(
    batchId: number,
    options?: { simulateError?: boolean }
  ): Promise<PricePredictionResult> {
    if (options?.simulateError) {
      throw new Error('Unable to generate the market prediction. Market feed timeout.');
    }

    // Try fetching prediction from backend first
    const backendResult = await this.getPredictionByBatchId(batchId);
    if (backendResult && backendResult.forecastedPrices && backendResult.forecastedPrices.length > 0) {
      return backendResult;
    }

    // Fetch batch from real batchService if possible
    let batch: any = null;
    try {
      const allBatches = await batchService.getBatches();
      batch = allBatches.find((b: any) => b.id === batchId);
    } catch (e) {
      console.warn('Could not fetch batch list for price prediction fallback:', e);
    }

    if (!batch) {
      const state = mockRepository.getState();
      batch = state.batches.find((b: any) => b.id === batchId);
    }

    if (!batch) {
      // Create minimal fallback batch
      batch = {
        id: batchId,
        cropId: 3,
        cropName: 'Tomato',
        varietyId: 24,
        varietyName: 'CO-3 (Hybrid Country)',
        quantity: 1000,
        harvestDate: new Date().toISOString().split('T')[0],
        harvestLocationDistrict: '',
      };
    }

    const state = mockRepository.getState();
    const analysis = state.analyses.find((a) => a.batchId === batchId);
    const qualityGrade = analysis?.qualityResult?.assignedGrade || 'GRADE_A_PREMIUM';
    const qualityScore = analysis?.qualityResult?.qualityScore || 92.5;
    const remainingShelfLifeDays = analysis?.shelfLifePrediction?.estimatedRemainingDays || 7.0;

    const request: PricePredictionRequest = {
      batchId: batch.id,
      cropId: batch.cropId || 1,
      cropName: batch.cropName || 'Produce',
      varietyId: batch.varietyId || 1,
      varietyName: batch.varietyName || 'Standard',
      quantityKg: batch.quantity || 1000,
      harvestDate: batch.harvestDate || new Date().toISOString().split('T')[0],
      district: batch.harvestLocationDistrict || batch.district || '',
      qualityGrade,
      qualityScore,
      remainingShelfLifeDays,
    };

    return this.generatePrediction(request, options);
  },

  async generatePrediction(
    request: PricePredictionRequest,
    options?: { simulateError?: boolean }
  ): Promise<PricePredictionResult> {
    if (options?.simulateError) {
      throw new Error('Unable to generate the market prediction. Market feed timeout.');
    }

    const key = `${request.cropName}-${request.varietyName}`;
    const basePrice =
      CROP_BASE_PRICES[key] || CROP_BASE_PRICES[request.cropName] || 28.0;

    let qualityMultiplier = 1.0;
    if (request.qualityGrade.includes('GRADE_A')) qualityMultiplier = 1.12;
    else if (request.qualityGrade.includes('GRADE_B')) qualityMultiplier = 1.02;
    else if (request.qualityGrade.includes('GRADE_C')) qualityMultiplier = 0.88;

    const scoreAdjustment = ((request.qualityScore || 85) - 80) * 0.15;
    const currentPricePerKg =
      Math.round((basePrice * qualityMultiplier + scoreAdjustment) * 100) / 100;

    const today = new Date();
    const forecastedPrices: ForecastDay[] = [];
    let peakPrice = currentPricePerKg;
    let peakDate = today.toISOString().split('T')[0];

    const priceFluctuations = [0, +0.8, +1.5, +2.2, +1.1, -0.5, -1.2];
    const arrivalTonsBase = [55, 62, 48, 42, 68, 85, 92];

    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];

      const dayPrice =
        Math.round((currentPricePerKg + priceFluctuations[i]) * 100) / 100;
      const minP = Math.round((dayPrice - 1.5) * 100) / 100;
      const maxP = Math.round((dayPrice + 1.8) * 100) / 100;
      const tons = arrivalTonsBase[i];

      if (dayPrice > peakPrice) {
        peakPrice = dayPrice;
        peakDate = dateStr;
      }

      let dayLabel = `Day ${i + 1}`;
      if (i === 0) dayLabel = 'Today';
      else if (i === 1) dayLabel = 'Tomorrow';

      let advisory: ForecastDay['advisory'] = 'GOOD';
      if (i === 0) advisory = 'SELL_NOW';
      else if (dayPrice >= currentPricePerKg + 1.5) advisory = 'EXCELLENT';
      else if (tons > 80) advisory = 'HOLD';

      forecastedPrices.push({
        dayIndex: i,
        date: dateStr,
        dayLabel,
        predictedPricePerKg: dayPrice,
        minPrice: minP,
        maxPrice: maxP,
        expectedMandiArrivalTons: tons,
        arrivalTrend: tons > 75 ? 'HEAVY' : tons > 50 ? 'MODERATE' : 'LIGHT',
        advisory,
      });
    }

    const priceChangeVsCurrent = Math.round((peakPrice - currentPricePerKg) * 100) / 100;
    const priceChangePercent =
      Math.round((priceChangeVsCurrent / currentPricePerKg) * 1000) / 10;

    let recommendation: PricePredictionResult['recommendation'] = 'SELL_NOW';
    let recommendationReason = '';

    if (request.remainingShelfLifeDays <= 3) {
      recommendation = 'SELL_NOW';
      recommendationReason = `Remaining crop shelf life is short (${request.remainingShelfLifeDays} days). Immediate sale is recommended to prevent quality degradation.`;
    } else if (priceChangeVsCurrent >= 1.5 && request.remainingShelfLifeDays >= 5) {
      recommendation = 'HOLD_3_DAYS';
      recommendationReason = `Prices projected to gain +₹${priceChangeVsCurrent}/KG (${priceChangePercent}%) over the next 3 days due to lower Mandi arrivals in ${request.district}.`;
    } else if (currentPricePerKg >= basePrice * 1.08) {
      recommendation = 'SELL_NOW';
      recommendationReason = `Current Mandi rate (₹${currentPricePerKg}/KG) is at a 7-day high for ${request.cropName} (${request.varietyName}). Capitalize on current peak demand.`;
    } else {
      recommendation = 'DIVERT_TO_MANDI';
      recommendationReason = `Divert shipment to regional wholesale hub for maximum gross realization.`;
    }

    const result: PricePredictionResult = {
      id: Date.now(),
      batchId: request.batchId,
      cropName: request.cropName,
      varietyName: request.varietyName,
      district: request.district,
      quantityKg: request.quantityKg,
      qualityGrade: request.qualityGrade,
      qualityScore: request.qualityScore,
      remainingShelfLifeDays: request.remainingShelfLifeDays,
      currentPricePerKg,
      forecastedPrices,
      peakPrice,
      peakDate,
      expectedMandiArrival: '55 - 65 Tons (Moderate)',
      priceChangeVsCurrent,
      priceChangePercent,
      recommendation,
      recommendationReason,
      confidence: 93.4,
      generatedAt: today.toISOString(),
    };

    mockRepository.updateState((draft) => {
      if (!(draft as any).pricePredictionResults) {
        (draft as any).pricePredictionResults = [];
      }
      const existingIdx = (draft as any).pricePredictionResults.findIndex(
        (p: PricePredictionResult) => p.batchId === request.batchId
      );
      if (existingIdx >= 0) {
        (draft as any).pricePredictionResults[existingIdx] = result;
      } else {
        (draft as any).pricePredictionResults.unshift(result);
      }
    });

    return result;
  },
};

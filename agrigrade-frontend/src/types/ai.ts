import { MediaAsset } from './batch';

export type QualityGrade = 'GRADE_A_PREMIUM' | 'GRADE_B_STANDARD' | 'GRADE_C_COMMERCIAL' | 'REJECT' | 'REJECTED';

export type DiseaseRisk = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DefectResult {
  id: number;
  defectType: string;
  severityScore: number; // 0 - 100
  affectedPercent: number;
  countDetected?: number;
}

export interface QualityResult {
  id: number;
  analysisId: number;
  assignedGrade: QualityGrade;
  qualityScore: number; // 0 - 100
  moisturePercent?: number;
  uniformityScore?: number;
  colorPurityScore?: number;
  defects: DefectResult[];
  calculatedAt: string;
}

export interface DiseaseFinding {
  id: number;
  diseaseId: number;
  diseaseName: string;
  confidenceScore: number;
  severityPercent: number;
  affectedAreaSqCm?: number;
  preventionText?: string;
  treatmentText?: string;
  recommendedPesticides?: string;
  organicRemedy?: string;
}

export interface DiseaseAnalysis {
  id: number;
  batchId: number;
  overallDiseaseRisk: DiseaseRisk;
  findings: DiseaseFinding[];
  evaluatedAt: string;
}

export interface DiseaseDetectionResult {
  id: number;
  cropName: string;
  analysisCode: string;
  timestamp: string;
  status: 'COMPLETED' | 'HEALTHY' | 'LOW_CONFIDENCE' | 'UNABLE_TO_IDENTIFY';
  overallRisk: DiseaseRisk;
  primaryDiseaseName?: string;
  scientificName?: string;
  confidenceScore?: number;
  severityPercent?: number;
  affectedPlantPart?: string;
  detectedSymptoms?: string[];
  organicRemedy?: string;
  chemicalTreatment?: string;
  preventionAdvisory?: string;
  rejectionReason?: string;
  evidencePhotos: MediaAsset[];
}

export interface ShelfLifePrediction {
  id: number;
  batchId: number;
  analysisId: number;
  calculatedOn: string;
  harvestDate: string;
  inspectionDate: string;
  cropAgeDays: number;
  estimatedRemainingDays: number;
  estimatedExpiryDate: string;
  confidence: number;
}

export interface PricePrediction {
  id: number;
  batchId: number;
  predictedPricePerKg: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  recommendationAdvisory: 'SELL_NOW' | 'HOLD_FOR_3_DAYS' | 'BEST_OPPORTUNITY';
  calculatedAt: string;
}

export interface AiAnalysis {
  id: number;
  batchId: number;
  inspectionNumber?: number;
  modelCode: string;
  analysisType: 'QUALITY_GRADING' | 'DISEASE_DETECTION' | 'FULL_INSPECTION';
  startedAt: string;
  completedAt?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CROP_MISMATCH' | 'LOW_CONFIDENCE';
  overallConfidence: number;
  cropMatchValid: boolean;
  detectedCropName?: string;
  rejectionReason?: string;
  qualityResult?: QualityResult;
  diseaseAnalysis?: DiseaseAnalysis;
  shelfLifePrediction?: ShelfLifePrediction;
  pricePrediction?: PricePrediction;
  evidenceUsedPhotos?: MediaAsset[];
  evidenceUsedVideo?: MediaAsset;
  maturityStage?: string;
  fungalGrowthStatus?: string;
  activeDecayStatus?: string;
  marketPrice?: any;
  officialMarketPrice?: any;
  pricePredictionData?: any;
  aiPricePrediction?: any;
  recommendation?: any;
  marketAction?: any;
  marketComparison?: any[];
  trainedModel?: {
    status?: string;
    model_name?: string;
    prediction?: string;
    confidence?: number;
    experimental?: boolean;
  };
  agreement?: {
    status?: string;
    trained_model_prediction?: string;
    gemini_prediction?: string;
  };
  cnn?: any;
}

export interface InspectionRecord {
  id: number;
  inspectionNumber: number;
  batchId: number;
  inspectionName: string; // e.g. "Inspection #1"
  timestamp: string;
  status: 'COMPLETED' | 'CROP_MISMATCH' | 'LOW_CONFIDENCE';
  assignedGrade: QualityGrade;
  qualityScore: number;
  confidence: number;
  evidenceUsedPhotos?: MediaAsset[];
  evidenceUsedVideo?: MediaAsset;
  analysis: AiAnalysis;
  certificate?: AiCertificate;
}

export interface AiCertificate {
  id: number;
  certificateNumber: string;
  batchId: number;
  cropName: string;
  varietyName: string;
  harvestDate: string;
  inspectionDate: string;
  cropAgeDays: number;
  qualityGrade: QualityGrade;
  qualityScore: number;
  estimatedRemainingDays: number;
  digitalSignature: string; // SHA-256 hash string
  certificatePdfUrl?: string;
  status: 'ISSUED' | 'REVOKED' | 'EXPIRED';
  issuedAt: string;
}

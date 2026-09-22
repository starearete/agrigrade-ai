import { User, FarmerProfile, BuyerProfile } from '../types/auth';
import { ProductBatch, MediaAsset } from '../types/batch';
import { AiAnalysis, AiCertificate, InspectionRecord, DiseaseDetectionResult } from '../types/ai';
import { Market, MarketRate, MarketRecommendation } from '../types/market';
import { MarketplaceListing } from '../types/listing';
import { PurchaseRequest, Order } from '../types/request';
import { Conversation, ChatMessage } from '../types/chat';
import { NotificationItem, SystemHealth, AuditLog } from '../types/chat';

const STORAGE_KEY = 'AGRIGRADE_AI_MOCK_STORAGE_V7';

export interface MockState {
  users: User[];
  farmerProfiles: FarmerProfile[];
  buyerProfiles: BuyerProfile[];
  batches: ProductBatch[];
  analyses: AiAnalysis[];
  certificates: AiCertificate[];
  inspectionHistory: InspectionRecord[];
  diseaseDetections: DiseaseDetectionResult[];
  markets: Market[];
  marketRates: MarketRate[];
  listings: MarketplaceListing[];
  purchaseRequests: PurchaseRequest[];
  orders: Order[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: NotificationItem[];
  systemHealth: SystemHealth;
  auditLogs: AuditLog[];
}

const SAMPLE_PHOTO_1: MediaAsset = {
  id: 'asset-ban-1',
  fileName: 'banana_harvest_sample1.jpg',
  mediaType: 'PHOTO',
  mimeType: 'image/jpeg',
  previewUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Ctext x='200' y='150' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3EBanana Harvest Sample 1%3C/text%3E%3C/svg%3E",
  uploadedAt: '2026-08-06T09:00:00Z',
  size: 1420500,
};

const SAMPLE_PHOTO_2: MediaAsset = {
  id: 'asset-ban-2',
  fileName: 'banana_close_up.png',
  mediaType: 'PHOTO',
  mimeType: 'image/png',
  previewUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Ctext x='200' y='150' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3EBanana Close-up Sample 2%3C/text%3E%3C/svg%3E",
  uploadedAt: '2026-08-06T09:02:00Z',
  size: 1980200,
};

const INITIAL_SEED_STATE: MockState = {
  users: [
    {
      id: 101,
      publicId: 'usr-farmer-001',
      fullName: 'Ramasamy K. (Farmer)',
      email: 'farmer@agrigrade.ai',
      mobileNumber: '+91 98765 43210',
      status: 'ACTIVE',
      roles: ['FARMER'],
      profileCompleted: true,
      preferredLanguage: 'en',
      preferredTheme: 'LIGHT',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-08-08T10:00:00Z',
    },
    {
      id: 102,
      publicId: 'usr-buyer-001',
      fullName: 'Senthil Kumar (Madurai Agri Wholesale)',
      email: 'buyer@agrigrade.ai',
      mobileNumber: '+91 91234 56789',
      status: 'ACTIVE',
      roles: ['BUYER'],
      profileCompleted: true,
      preferredLanguage: 'en',
      preferredTheme: 'LIGHT',
      createdAt: '2026-02-01T09:30:00Z',
      updatedAt: '2026-08-08T11:15:00Z',
    },
    {
      id: 103,
      publicId: 'usr-admin-001',
      fullName: 'Dr. Anbarasu (System Admin)',
      email: 'admin@agrigrade.ai',
      mobileNumber: '+91 99999 11111',
      status: 'ACTIVE',
      roles: ['ADMIN'],
      profileCompleted: true,
      preferredLanguage: 'en',
      preferredTheme: 'LIGHT',
      createdAt: '2025-12-01T00:00:00Z',
      updatedAt: '2026-08-08T12:00:00Z',
    },
  ],
  farmerProfiles: [
    {
      id: 1,
      userId: 101,
      farmerCode: 'FARM-TN-8821',
      kisanCreditCardNo: 'KCC-9923-4412',
      totalLandAcres: 8.5,
      contactAddress: {
        addressType: 'CONTACT',
        addressLine1: 'Plot 14, Sathy Main Road',
        villageTownCity: 'Sathyamangalam',
        taluk: 'Sathyamangalam',
        district: 'Erode',
        state: 'Tamil Nadu',
        stateId: 1,
        districtId: 8,
        pincode: '638401',
      },
      profileCompleted: true,
      createdAt: '2026-01-15T08:00:00Z',
    },
  ],
  buyerProfiles: [
    {
      id: 1,
      userId: 102,
      buyerCode: 'BUY-TN-3310',
      businessName: 'Madurai Fresh Produce Pvt Ltd',
      gstNumber: '33AABCM8812F1Z4',
      buyerType: 'WHOLESALER',
      businessAddress: {
        addressType: 'BUSINESS',
        addressLine1: 'Wholesale Market Complex',
        villageTownCity: 'Mattuthavani',
        taluk: 'Madurai North',
        district: 'Madurai',
        state: 'Tamil Nadu',
        stateId: 1,
        districtId: 13,
        pincode: '625007',
      },
      profileCompleted: true,
      createdAt: '2026-02-01T09:30:00Z',
    },
  ],
  batches: [
    {
      id: 501,
      batchNumber: 'BATCH-BANANA-G9-001',
      farmerId: 1,
      farmerName: 'Ramasamy K.',
      cropId: 1,
      cropName: 'Banana',
      varietyId: 101,
      varietyName: 'G9 / Grand Naine',
      harvestDate: '2026-08-05',
      quantity: 2500,
      quantityUnit: 'KG',
      harvestLocationDistrict: 'Theni',
      harvestLocationState: 'Tamil Nadu',
      storageCondition: 'AMBIENT',
      status: 'LISTED',
      images: [
        {
          id: 1001,
          batchId: 501,
          imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Ctext x='200' y='150' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3EBatch 501 Image%3C/text%3E%3C/svg%3E",
          sequenceNo: 1,
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      ],
      photos: [SAMPLE_PHOTO_1, SAMPLE_PHOTO_2],
      video: undefined,
      createdAt: '2026-08-06T09:00:00Z',
      updatedAt: '2026-08-08T10:00:00Z',
    },
    {
      id: 502,
      batchNumber: 'BATCH-TOMATO-CO3-002',
      farmerId: 1,
      farmerName: 'Ramasamy K.',
      cropId: 3,
      cropName: 'Tomato',
      varietyId: 301,
      varietyName: 'CO-3 (Hybrid Country)',
      harvestDate: '2026-08-06',
      quantity: 1200,
      quantityUnit: 'KG',
      harvestLocationDistrict: 'Dindigul',
      harvestLocationState: 'Tamil Nadu',
      storageCondition: 'AMBIENT',
      status: 'AI_GRADED',
      images: [
        {
          id: 1002,
          batchId: 502,
          imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Ctext x='200' y='150' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3EBatch 502 Image%3C/text%3E%3C/svg%3E",
          sequenceNo: 1,
          sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        },
      ],
      photos: [
        {
          id: 'asset-tom-1',
          fileName: 'tomato_harvest_1.jpg',
          mediaType: 'PHOTO',
          mimeType: 'image/jpeg',
          previewUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Ctext x='200' y='150' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3ETomato Sample 1%3C/text%3E%3C/svg%3E",
          uploadedAt: '2026-08-07T11:00:00Z',
          size: 1205000,
        },
      ],
      video: undefined,
      createdAt: '2026-08-07T11:00:00Z',
      updatedAt: '2026-08-08T09:00:00Z',
    },
  ],
  analyses: [
    {
      id: 701,
      batchId: 501,
      inspectionNumber: 1,
      modelCode: 'AGRI_VISION_BANANA_V1',
      analysisType: 'FULL_INSPECTION',
      startedAt: '2026-08-06T09:15:00Z',
      completedAt: '2026-08-06T09:16:30Z',
      status: 'COMPLETED',
      overallConfidence: 94.5,
      cropMatchValid: true,
      detectedCropName: 'Banana',
      qualityResult: {
        id: 801,
        analysisId: 701,
        assignedGrade: 'GRADE_A_PREMIUM',
        qualityScore: 92.5,
        moisturePercent: 74.2,
        uniformityScore: 95.0,
        colorPurityScore: 91.0,
        defects: [
          { id: 901, defectType: 'Minor Skin Blemish', severityScore: 8.5, affectedPercent: 2.1 },
        ],
        calculatedAt: '2026-08-06T09:16:30Z',
      },
      diseaseAnalysis: {
        id: 601,
        batchId: 501,
        overallDiseaseRisk: 'LOW',
        findings: [],
        evaluatedAt: '2026-08-06T09:16:30Z',
      },
      shelfLifePrediction: {
        id: 401,
        batchId: 501,
        analysisId: 701,
        calculatedOn: '2026-08-06T09:16:30Z',
        harvestDate: '2026-08-05',
        inspectionDate: '2026-08-06',
        cropAgeDays: 1,
        estimatedRemainingDays: 6.5,
        estimatedExpiryDate: '2026-08-12',
        confidence: 93.0,
      },
      pricePrediction: {
        id: 301,
        batchId: 501,
        predictedPricePerKg: 26.50,
        priceRangeLow: 24.00,
        priceRangeHigh: 28.50,
        recommendationAdvisory: 'SELL_NOW',
        calculatedAt: '2026-08-06T09:16:30Z',
      },
      evidenceUsedPhotos: [SAMPLE_PHOTO_1, SAMPLE_PHOTO_2],
    },
  ],
  certificates: [
    {
      id: 901,
      certificateNumber: 'AGRI-CERT-2026-88192',
      batchId: 501,
      cropName: 'Banana',
      varietyName: 'G9 / Grand Naine',
      harvestDate: '2026-08-05',
      inspectionDate: '2026-08-06',
      cropAgeDays: 1,
      qualityGrade: 'GRADE_A_PREMIUM',
      qualityScore: 92.5,
      estimatedRemainingDays: 6.5,
      digitalSignature: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      status: 'ISSUED',
      issuedAt: '2026-08-06T09:20:00Z',
    },
  ],
  inspectionHistory: [
    {
      id: 10001,
      inspectionNumber: 1,
      batchId: 501,
      inspectionName: 'Inspection #1',
      timestamp: '2026-08-06T09:16:30Z',
      status: 'COMPLETED',
      assignedGrade: 'GRADE_A_PREMIUM',
      qualityScore: 92.5,
      confidence: 94.5,
      evidenceUsedPhotos: [SAMPLE_PHOTO_1, SAMPLE_PHOTO_2],
      analysis: {
        id: 701,
        batchId: 501,
        inspectionNumber: 1,
        modelCode: 'AGRI_VISION_BANANA_V1',
        analysisType: 'FULL_INSPECTION',
        startedAt: '2026-08-06T09:15:00Z',
        completedAt: '2026-08-06T09:16:30Z',
        status: 'COMPLETED',
        overallConfidence: 94.5,
        cropMatchValid: true,
        detectedCropName: 'Banana',
        qualityResult: {
          id: 801,
          analysisId: 701,
          assignedGrade: 'GRADE_A_PREMIUM',
          qualityScore: 92.5,
          moisturePercent: 74.2,
          uniformityScore: 95.0,
          colorPurityScore: 91.0,
          defects: [
            { id: 901, defectType: 'Minor Skin Blemish', severityScore: 8.5, affectedPercent: 2.1 },
          ],
          calculatedAt: '2026-08-06T09:16:30Z',
        },
        diseaseAnalysis: {
          id: 601,
          batchId: 501,
          overallDiseaseRisk: 'LOW',
          findings: [],
          evaluatedAt: '2026-08-06T09:16:30Z',
        },
        shelfLifePrediction: {
          id: 401,
          batchId: 501,
          analysisId: 701,
          calculatedOn: '2026-08-06T09:16:30Z',
          harvestDate: '2026-08-05',
          inspectionDate: '2026-08-06',
          cropAgeDays: 1,
          estimatedRemainingDays: 6.5,
          estimatedExpiryDate: '2026-08-12',
          confidence: 93.0,
        },
        pricePrediction: {
          id: 301,
          batchId: 501,
          predictedPricePerKg: 26.50,
          priceRangeLow: 24.00,
          priceRangeHigh: 28.50,
          recommendationAdvisory: 'SELL_NOW',
          calculatedAt: '2026-08-06T09:16:30Z',
        },
        evidenceUsedPhotos: [SAMPLE_PHOTO_1, SAMPLE_PHOTO_2],
      },
      certificate: {
        id: 901,
        certificateNumber: 'AGRI-CERT-2026-88192',
        batchId: 501,
        cropName: 'Banana',
        varietyName: 'G9 / Grand Naine',
        harvestDate: '2026-08-05',
        inspectionDate: '2026-08-06',
        cropAgeDays: 1,
        qualityGrade: 'GRADE_A_PREMIUM',
        qualityScore: 92.5,
        estimatedRemainingDays: 6.5,
        digitalSignature: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        status: 'ISSUED',
        issuedAt: '2026-08-06T09:20:00Z',
      },
    },
  ],
  diseaseDetections: [],
  markets: [
    { id: 1, code: 'MKT-ARIYALUR', name: 'Ariyalur Regulated Agricultural Market', marketType: 'MANDI', district: 'Ariyalur', state: 'Tamil Nadu', latitude: 11.1401, longitude: 79.0786 },
    { id: 2, code: 'MKT-CHENGALPATTU', name: 'Chengalpattu Uzhavar Sandhai Mandi', marketType: 'FARMER_MARKET', district: 'Chengalpattu', state: 'Tamil Nadu', latitude: 12.6841, longitude: 79.9836 },
    { id: 3, code: 'MKT_KOYAMBEDU', name: 'Koyambedu Wholesale Market Complex', marketType: 'WHOLESALE_HUB', district: 'Chennai', state: 'Tamil Nadu', latitude: 13.0694, longitude: 80.1948 },
    { id: 4, code: 'MKT-COIMBATORE-MGR', name: 'Coimbatore MGR Wholesale Market', marketType: 'WHOLESALE_HUB', district: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0018, longitude: 76.9629 },
    { id: 5, code: 'MKT-PANRUTI', name: 'Panruti Cashew & Jackfruit Wholesale Mandi', marketType: 'WHOLESALE_HUB', district: 'Cuddalore', state: 'Tamil Nadu', latitude: 11.7749, longitude: 79.5537 },
    { id: 6, code: 'MKT-DHARMAPURI-TOMATO', name: 'Dharmapuri Tomato & Vegetable Wholesale Hub', marketType: 'WHOLESALE_HUB', district: 'Dharmapuri', state: 'Tamil Nadu', latitude: 12.1211, longitude: 78.1582 },
    { id: 7, code: 'MKT-ODDANCHATRAM', name: 'Oddanchatram Daily Vegetable Market', marketType: 'WHOLESALE_HUB', district: 'Dindigul', state: 'Tamil Nadu', latitude: 10.4851, longitude: 77.7478 },
    { id: 8, code: 'MKT-ERODE-SAMPATH', name: 'Erode Sampath Nagar Wholesale Mandi', marketType: 'WHOLESALE_HUB', district: 'Erode', state: 'Tamil Nadu', latitude: 11.3410, longitude: 77.7172 },
    { id: 9, code: 'MKT-SATHY-FPO', name: 'Sathyamangalam Farmer Producer Mandi', marketType: 'DIRECT_BUYER_HUB', district: 'Erode', state: 'Tamil Nadu', latitude: 11.5034, longitude: 77.2444 },
    { id: 10, code: 'MKT-GOBI-AGRI', name: 'Gobichettipalayam Agricultural Regulated Market', marketType: 'MANDI', district: 'Erode', state: 'Tamil Nadu', latitude: 11.4546, longitude: 77.4373 },
    { id: 11, code: 'MKT-KALLAKURICHI', name: 'Kallakurichi Regulated Agricultural Market', marketType: 'MANDI', district: 'Kallakurichi', state: 'Tamil Nadu', latitude: 11.7384, longitude: 78.9639 },
    { id: 12, code: 'MKT-KANCHEEPURAM', name: 'Kancheepuram Vegetable & Fruit Wholesale Market', marketType: 'MANDI', district: 'Kancheepuram', state: 'Tamil Nadu', latitude: 12.8342, longitude: 79.7036 },
    { id: 13, code: 'MKT-NAGERCOIL-VADSERY', name: 'Nagercoil Vadasery Wholesale Agricultural Market', marketType: 'WHOLESALE_HUB', district: 'Kanniyakumari', state: 'Tamil Nadu', latitude: 8.1833, longitude: 77.4119 },
    { id: 14, code: 'MKT-KARUR-AGRI', name: 'Karur Uzhavar Sandhai & Agricultural Mandi', marketType: 'MANDI', district: 'Karur', state: 'Tamil Nadu', latitude: 10.9601, longitude: 78.0766 },
    { id: 15, code: 'MKT-KRISHNAGIRI-MANGO', name: 'Krishnagiri Mango & Horticulture Hub', marketType: 'WHOLESALE_HUB', district: 'Krishnagiri', state: 'Tamil Nadu', latitude: 12.5186, longitude: 78.2137 },
    { id: 16, code: 'MKT-MADURAI-MATTUTHAVANI', name: 'Madurai Mattuthavani Wholesale Market', marketType: 'WHOLESALE_HUB', district: 'Madurai', state: 'Tamil Nadu', latitude: 9.9467, longitude: 78.1569 },
    { id: 17, code: 'MKT-MAYILADUTHURAI', name: 'Mayiladuthurai Regulated Agricultural Market', marketType: 'MANDI', district: 'Mayiladuthurai', state: 'Tamil Nadu', latitude: 11.1075, longitude: 79.6523 },
    { id: 18, code: 'MKT-NAGAPATTINAM', name: 'Nagapattinam Grain & Vegetable Mandi', marketType: 'MANDI', district: 'Nagapattinam', state: 'Tamil Nadu', latitude: 10.7672, longitude: 79.8449 },
    { id: 19, code: 'MKT-NAMAKKAL-AGRI', name: 'Namakkal Agricultural Produce & Poultry Hub', marketType: 'MANDI', district: 'Namakkal', state: 'Tamil Nadu', latitude: 11.2189, longitude: 78.1674 },
    { id: 20, code: 'MKT-OOTY-VEGETABLE', name: 'Ooty Municipal Vegetable & Hill Produce Market', marketType: 'WHOLESALE_HUB', district: 'Nilgiris', state: 'Tamil Nadu', latitude: 11.4102, longitude: 76.6950 },
    { id: 21, code: 'MKT-PERAMBALUR', name: 'Perambalur Regulated Agricultural Market', marketType: 'MANDI', district: 'Perambalur', state: 'Tamil Nadu', latitude: 11.2342, longitude: 78.8819 },
    { id: 22, code: 'MKT-PUDUKKOTTAI', name: 'Pudukkottai Uzhavar Sandhai & Commodity Mandi', marketType: 'FARMER_MARKET', district: 'Pudukkottai', state: 'Tamil Nadu', latitude: 10.3797, longitude: 78.8208 },
    { id: 23, code: 'MKT-RAMANATHAPURAM', name: 'Ramanathapuram Regulated Agricultural Market', marketType: 'MANDI', district: 'Ramanathapuram', state: 'Tamil Nadu', latitude: 9.3639, longitude: 78.8395 },
    { id: 24, code: 'MKT-RANIPET', name: 'Ranipet Regulated Market & Vegetable Hub', marketType: 'MANDI', district: 'Ranipet', state: 'Tamil Nadu', latitude: 12.9272, longitude: 79.3331 },
    { id: 25, code: 'MKT-SALEM-LEIGH', name: 'Salem Leigh Bazaar Wholesale Mandi', marketType: 'WHOLESALE_HUB', district: 'Salem', state: 'Tamil Nadu', latitude: 11.6643, longitude: 78.1460 },
    { id: 26, code: 'MKT-KARAIKUDI', name: 'Karaikudi Agricultural Produce Market', marketType: 'MANDI', district: 'Sivaganga', state: 'Tamil Nadu', latitude: 10.0735, longitude: 78.7732 },
    { id: 27, code: 'MKT-ALANGULAM', name: 'Alangulam Vegetable Wholesale Market', marketType: 'WHOLESALE_HUB', district: 'Tenkasi', state: 'Tamil Nadu', latitude: 8.8711, longitude: 77.4958 },
    { id: 28, code: 'MKT-THANJAVUR-KAMARAJ', name: 'Thanjavur Kamaraj Vegetable Market', marketType: 'WHOLESALE_HUB', district: 'Thanjavur', state: 'Tamil Nadu', latitude: 10.7870, longitude: 79.1378 },
    { id: 29, code: 'MKT-THENI-CENTRAL', name: 'Theni Farmers Wholesale Mandi', marketType: 'MANDI', district: 'Theni', state: 'Tamil Nadu', latitude: 10.0104, longitude: 77.4768 },
    { id: 30, code: 'MKT-CUMBUM-VALLEY', name: 'Cumbum Valley Banana & Grape Terminal', marketType: 'DIRECT_BUYER_HUB', district: 'Theni', state: 'Tamil Nadu', latitude: 9.7346, longitude: 77.2811 },
    { id: 31, code: 'MKT-THOOTHUKUDI', name: 'Thoothukudi Kamaraj Market Yard', marketType: 'WHOLESALE_HUB', district: 'Thoothukudi', state: 'Tamil Nadu', latitude: 8.7642, longitude: 78.1348 },
    { id: 32, code: 'MKT-TRICHY-GANDHI', name: 'Tiruchirappalli Gandhi Market', marketType: 'WHOLESALE_HUB', district: 'Tiruchirappalli', state: 'Tamil Nadu', latitude: 10.8271, longitude: 78.6972 },
    { id: 33, code: 'MKT-TIRUNELVELI-NAINAR', name: 'Tirunelveli Nainarkulam Wholesale Market', marketType: 'WHOLESALE_HUB', district: 'Tirunelveli', state: 'Tamil Nadu', latitude: 8.7280, longitude: 77.7074 },
    { id: 34, code: 'MKT-TIRUPATHUR', name: 'Tirupathur Regulated Agricultural Market', marketType: 'MANDI', district: 'Tirupathur', state: 'Tamil Nadu', latitude: 12.4958, longitude: 78.5678 },
    { id: 35, code: 'MKT-TIRUPPUR-THENNAM', name: 'Tiruppur Thennampalayam Daily Wholesale Market', marketType: 'WHOLESALE_HUB', district: 'Tiruppur', state: 'Tamil Nadu', latitude: 11.1085, longitude: 77.3411 },
    { id: 36, code: 'MKT-TIRUVALLUR', name: 'Tiruvallur Regulated Market & Farmer Hub', marketType: 'MANDI', district: 'Tiruvallur', state: 'Tamil Nadu', latitude: 13.1438, longitude: 79.9083 },
    { id: 37, code: 'MKT-TIRUVANNAMALAI', name: 'Tiruvannamalai Regulated Agricultural Market', marketType: 'MANDI', district: 'Tiruvannamalai', state: 'Tamil Nadu', latitude: 12.2253, longitude: 79.0747 },
    { id: 38, code: 'MKT-MANNARGUDI', name: 'Mannargudi Agricultural Produce Market', marketType: 'MANDI', district: 'Tiruvarur', state: 'Tamil Nadu', latitude: 10.6637, longitude: 79.4442 },
    { id: 39, code: 'MKT-VELLORE-NETHAJI', name: 'Vellore Nethaji Daily Wholesale Market', marketType: 'WHOLESALE_HUB', district: 'Vellore', state: 'Tamil Nadu', latitude: 12.9165, longitude: 79.1325 },
    { id: 40, code: 'MKT-VILUPPURAM', name: 'Viluppuram Agricultural Regulated Market', marketType: 'MANDI', district: 'Viluppuram', state: 'Tamil Nadu', latitude: 11.9401, longitude: 79.4861 },
    { id: 41, code: 'MKT-VIRUDHUNAGAR', name: 'Virudhunagar Commodity & Agricultural Mandi', marketType: 'WHOLESALE_HUB', district: 'Virudhunagar', state: 'Tamil Nadu', latitude: 9.5872, longitude: 77.9579 },
  ],
  marketRates: [
    { id: 1, marketId: 1, marketName: 'Erode Sampath Nagar Wholesale Mandi', cropName: 'Banana', varietyId: 101, varietyName: 'G9 / Grand Naine', qualityGrade: 'Grade A', minPricePerKg: 24.00, maxPricePerKg: 31.00, modalPricePerKg: 28.50, quantityArrivedTons: 85, observedAt: '2026-08-08T06:00:00Z' },
    { id: 2, marketId: 2, marketName: 'Sathyamangalam Farmer Producer Mandi', cropName: 'Banana', varietyId: 101, varietyName: 'G9 / Grand Naine', qualityGrade: 'Grade A', minPricePerKg: 23.50, maxPricePerKg: 30.00, modalPricePerKg: 27.80, quantityArrivedTons: 50, observedAt: '2026-08-08T06:00:00Z' },
  ],
  listings: [
    {
      id: 1001,
      batchId: 501,
      listingCode: 'LIST-BANANA-G9-001',
      farmerId: 1,
      farmerName: 'Ramasamy K.',
      farmerCode: 'FARM-TN-8821',
      farmerDistrict: 'Erode',
      farmerVerified: true,
      cropName: 'Banana',
      varietyName: 'G9 / Grand Naine',
      askingPricePerUnit: 26.00,
      minimumOrderQuantity: 500,
      quantityRemaining: 2500,
      quantityUnit: 'KG',
      assignedGrade: 'GRADE_A_PREMIUM',
      qualityScore: 92.5,
      harvestDate: '2026-08-05',
      cropAgeDays: 3,
      inspectionDate: '2026-08-06',
      estimatedRemainingDays: 4.5,
      certificateNumber: 'AGRI-CERT-2026-88192',
      coverImageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Ctext x='200' y='150' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3EListing Cover Image%3C/text%3E%3C/svg%3E",
      images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23EEF8F0'%3E%3Crect width='400' height='300' fill='%23EEF8F0'/%3E%3Ctext x='200' y='150' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle' fill='%231B5E20'%3EListing Cover Image%3C/text%3E%3C/svg%3E"],
      listedAt: '2026-08-06T10:00:00Z',
      expiresAt: '2026-08-13T10:00:00Z',
      status: 'ACTIVE',
      distanceKm: 28.5,
    },
  ],
  purchaseRequests: [],
  orders: [],
  conversations: [
    {
      id: 3001,
      listingId: 1001,
      listingCode: 'LIST-BANANA-G9-001',
      cropName: 'Banana',
      varietyName: 'G9 / Grand Naine',
      batchNumber: 'BATCH-BANANA-501',
      qualityGrade: 'Grade A Premium',
      quantityKg: 1000,
      inquiryId: 2001,
      participantFarmerId: 101,
      participantFarmerName: 'Ramasamy K.',
      participantBuyerId: 102,
      participantBuyerName: 'Senthil Kumar',
      conversationType: 'INQUIRY_NEGOTIATION',
      lastMessageText: 'Hello Ramasamy, I am interested in your Grade A G9 Bananas. Can pick up 1000 kg.',
      lastMessageTime: '2026-08-08T11:30:00Z',
      unreadCount: 1,
      isOnline: true,
      createdAt: '2026-08-08T11:30:00Z',
    },
    {
      id: 3002,
      listingId: 1002,
      listingCode: 'LIST-TOMATO-CO3-002',
      cropName: 'Tomato',
      varietyName: 'CO-3 (Hybrid Country)',
      batchNumber: 'BATCH-TOMATO-511',
      qualityGrade: 'Grade A Premium',
      quantityKg: 2500,
      inquiryId: 2002,
      participantFarmerId: 101,
      participantFarmerName: 'Ramasamy K.',
      participantBuyerId: 103,
      participantBuyerName: 'Anitha Traders (Trichy)',
      conversationType: 'INQUIRY_NEGOTIATION',
      lastMessageText: 'Is the batch quality certificate verified by AI Vision?',
      lastMessageTime: '2026-08-08T14:15:00Z',
      unreadCount: 0,
      isOnline: false,
      createdAt: '2026-08-08T14:00:00Z',
    },
  ],
  messages: [
    {
      id: 4001,
      conversationId: 3001,
      senderId: 102,
      senderName: 'Senthil Kumar',
      senderRole: 'BUYER',
      messageText: 'Hello Ramasamy, I am interested in your Grade A G9 Bananas. Can pick up 1000 kg.',
      sentAt: '2026-08-08T11:30:00Z',
    },
  ],
  notifications: [
    {
      id: 5001,
      userId: 101,
      title: 'New Purchase Request Received',
      body: 'Senthil Kumar offered ₹25.00/kg for 1,000 KG of Banana G9.',
      notificationType: 'BUYER_INQUIRY',
      referenceType: 'PURCHASE_REQUEST',
      referenceId: 2001,
      createdAt: '2026-08-08T11:30:00Z',
    },
  ],
  systemHealth: {
    apiStatus: 'ONLINE',
    databaseStatus: 'ONLINE',
    aiWorkerStatus: 'ACTIVE',
    webSocketStatus: 'CONNECTED',
    activeUsersCount: 1420,
    totalBatchesToday: 48,
    totalTradeVolume: 1285000,
  },
  auditLogs: [
    { id: 1, actorName: 'Ramasamy K.', actionType: 'CREATE_BATCH', entityName: 'product_batches', entityId: 501, createdAt: '2026-08-06T09:00:00Z' },
    { id: 2, actorName: 'System AI Worker', actionType: 'AI_INSPECTION', entityName: 'ai_analyses', entityId: 701, createdAt: '2026-08-06T09:16:30Z' },
  ],
};

class MockRepository {
  private activeUserId: number | null = null;
  private userStates: Map<number, MockState> = new Map();

  constructor() {
    this.refreshActiveUser();
  }

  public getActiveUserId(): number | null {
    try {
      const saved = localStorage.getItem('AGRIGRADE_SESSION_USER');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id) {
          return u.id;
        }
      }
    } catch (e) {
      console.warn('Failed to parse AGRIGRADE_SESSION_USER:', e);
    }
    return null;
  }

  public refreshActiveUser(): number | null {
    const currentId = this.getActiveUserId();
    this.activeUserId = currentId;
    return currentId;
  }

  private createEmptyStateForUser(userId: number): MockState {
    return {
      users: INITIAL_SEED_STATE.users,
      farmerProfiles: INITIAL_SEED_STATE.farmerProfiles,
      buyerProfiles: INITIAL_SEED_STATE.buyerProfiles,
      batches: [],
      analyses: [],
      certificates: [],
      inspectionHistory: [],
      diseaseDetections: [],
      markets: INITIAL_SEED_STATE.markets,
      marketRates: INITIAL_SEED_STATE.marketRates,
      listings: [],
      purchaseRequests: [],
      orders: [],
      conversations: [],
      messages: [],
      notifications: [],
      systemHealth: INITIAL_SEED_STATE.systemHealth,
      auditLogs: [],
    };
  }

  private loadFromStorageForUser(userId: number | null): MockState {
    const effectiveId = userId || 101;
    // Demo user 101 gets initial seed state with sample Banana & Tomato batches
    if (effectiveId === 101) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.batches) && Array.isArray(parsed.users)) {
            if (!Array.isArray(parsed.inspectionHistory)) {
              parsed.inspectionHistory = INITIAL_SEED_STATE.inspectionHistory;
            }
            if (!Array.isArray(parsed.diseaseDetections)) {
              parsed.diseaseDetections = [];
            }
            parsed.batches.forEach((b: ProductBatch) => {
              if (!Array.isArray(b.photos)) b.photos = [];
            });
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to load mock storage for demo user, recovering to seed state:', e);
      }
      this.saveToStorageForUser(101, INITIAL_SEED_STATE);
      return INITIAL_SEED_STATE;
    }

    // Isolated user-scoped storage key for all other users
    const userStorageKey = `AGRIGRADE_AI_MOCK_STORAGE_V4_USER_${effectiveId}`;
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.batches)) {
          if (!Array.isArray(parsed.inspectionHistory)) parsed.inspectionHistory = [];
          if (!Array.isArray(parsed.diseaseDetections)) parsed.diseaseDetections = [];
          parsed.batches.forEach((b: ProductBatch) => {
            if (!Array.isArray(b.photos)) b.photos = [];
          });
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Failed to load mock storage for user ${effectiveId}:`, e);
    }

    const empty = this.createEmptyStateForUser(effectiveId);
    this.saveToStorageForUser(effectiveId, empty);
    return empty;
  }

  private saveToStorageForUser(userId: number | null, state: MockState) {
    const effectiveId = userId || 101;
    const userStorageKey = effectiveId === 101 ? STORAGE_KEY : `AGRIGRADE_AI_MOCK_STORAGE_V4_USER_${effectiveId}`;
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to write user mock state to localStorage:', e);
    }
  }

  public getState(userId?: number): MockState {
    const targetUserId = userId || this.getActiveUserId();
    const effectiveId = targetUserId || 101;
    return this.loadFromStorageForUser(effectiveId);
  }

  public updateState(updater: (draft: MockState) => void, userId?: number) {
    const targetUserId = userId || this.getActiveUserId();
    const effectiveId = targetUserId || 101;
    const currentState = this.loadFromStorageForUser(effectiveId);
    updater(currentState);
    this.saveToStorageForUser(effectiveId, currentState);
  }

  public resetToSeed(userId?: number) {
    const targetUserId = userId || this.getActiveUserId();
    const effectiveId = targetUserId || 101;
    if (effectiveId === 101) {
      this.saveToStorageForUser(101, JSON.parse(JSON.stringify(INITIAL_SEED_STATE)));
    } else {
      this.saveToStorageForUser(effectiveId, this.createEmptyStateForUser(effectiveId));
    }
  }

  public clearUserState(userId: number) {
    const userStorageKey = `AGRIGRADE_AI_MOCK_STORAGE_V4_USER_${userId}`;
    localStorage.removeItem(userStorageKey);
  }
}

export const mockRepository = new MockRepository();


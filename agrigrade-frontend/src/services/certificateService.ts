import { apiClient } from './apiClient';
import { mockRepository } from './mockRepository';
import { AiCertificate } from '../types/ai';
import { batchService } from './batchService';

export const certificateService = {
  async getCertificateByBatchId(batchId: number): Promise<AiCertificate | null> {
    try {
      const resp = await apiClient.get<any>(`/batches/${batchId}/ai-analysis`);
      if (resp && resp.certificate && resp.certificate.certificateNumber) {
        const batch = await batchService.getBatchById(batchId);
        return {
          id: batchId,
          certificateNumber: resp.certificate.certificateNumber,
          batchId,
          cropName: batch?.cropName || resp.classification?.detectedCropName || 'Crop',
          varietyName: batch?.varietyName || 'Standard',
          harvestDate: batch?.harvestDate || new Date().toISOString().split('T')[0],
          inspectionDate: resp.certificate.issuedAt ? resp.certificate.issuedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          cropAgeDays: batch?.cropAgeDays || 0,
          qualityGrade: resp.aiAnalysis?.qualityGrade || 'GRADE_A_PREMIUM',
          qualityScore: resp.aiAnalysis?.qualityScore || 95.0,
          estimatedRemainingDays: batch?.remainingShelfLifeDays || 8,
          digitalSignature: resp.certificate.digitalSignature || 'SIG-VALID',
          status: resp.certificate.status || 'ISSUED',
          issuedAt: resp.certificate.issuedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      // Backend returned 404 or analysis not found
    }

    const state = mockRepository.getState();
    return state.certificates.find((c) => c.batchId === batchId) || null;
  },

  async getCertificateByNumber(certNumber: string): Promise<AiCertificate | null> {
    const state = mockRepository.getState();
    return (
      state.certificates.find(
        (c) => c.certificateNumber.toLowerCase() === certNumber.toLowerCase().trim()
      ) || null
    );
  },

  async getCertificatesForFarmer(_farmerId?: number): Promise<AiCertificate[]> {
    try {
      const batches = await batchService.getBatches();
      const verifiedBatches = batches.filter(
        (b) => (b.status === 'AI_GRADED' || b.status === 'LISTED' || !!b.certificateNumber)
      );
      const certPromises = verifiedBatches.map(async (b) => certificateService.getCertificateByBatchId(b.id));
      const results = await Promise.all(certPromises);
      return results.filter((c): c is AiCertificate => c !== null);
    } catch (err) {
      console.warn('Error fetching farmer certificates:', err);
      return [];
    }
  },
};

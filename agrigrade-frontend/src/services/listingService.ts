import { apiClient } from './apiClient';
import { mockRepository } from './mockRepository';
import { MarketplaceListing, ListingFilterRequest } from '../types/listing';
import { resolveImageUrl } from './batchService';

function mapBackendListing(l: any): MarketplaceListing {
  return {
    ...l,
    coverImageUrl: resolveImageUrl(l.coverImageUrl, l.cropName),
    images: (l.images && l.images.length > 0)
      ? l.images.map((img: string) => resolveImageUrl(img, l.cropName))
      : [resolveImageUrl(null, l.cropName)],
  };
}

export const listingService = {
  async getListings(filters?: ListingFilterRequest): Promise<MarketplaceListing[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.cropName && filters.cropName !== 'ALL') params.append('cropName', filters.cropName);
      if (filters?.grade && filters.grade !== ('ALL' as any)) params.append('grade', filters.grade);
      if (filters?.district && filters.district !== 'ALL') params.append('district', filters.district);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);

      const queryString = params.toString();
      const endpoint = `/marketplace/listings${queryString ? `?${queryString}` : ''}`;
      const data = await apiClient.get<any[]>(endpoint);
      if (Array.isArray(data)) {
        return data.map(mapBackendListing);
      }
    } catch (err) {
      console.warn('Backend GET /marketplace/listings failed, falling back to repository:', err);
    }

    const state = mockRepository.getState();
    let result = (state.listings || []).filter((l) => {
      const b = (state.batches || []).find((batch) => batch.id === l.batchId);
      return l.status === 'ACTIVE' && (!b || b.status === 'LISTED');
    });

    if (filters) {
      if (filters.cropName && filters.cropName !== 'ALL') {
        result = result.filter((l) => l.cropName.toLowerCase() === filters.cropName!.toLowerCase());
      }
      if (filters.varietyName && filters.varietyName !== 'ALL') {
        result = result.filter((l) => l.varietyName.toLowerCase().includes(filters.varietyName!.toLowerCase()));
      }
      if (filters.grade && filters.grade !== ('ALL' as any)) {
        result = result.filter((l) => l.assignedGrade === filters.grade);
      }
      if (filters.district && filters.district !== 'ALL') {
        result = result.filter((l) => l.farmerDistrict.toLowerCase() === filters.district!.toLowerCase());
      }
      if (filters.minPrice !== undefined) {
        result = result.filter((l) => l.askingPricePerUnit >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        result = result.filter((l) => l.askingPricePerUnit <= filters.maxPrice!);
      }

      if (filters.sortBy === 'PRICE_LOW_HIGH') {
        result.sort((a, b) => a.askingPricePerUnit - b.askingPricePerUnit);
      } else if (filters.sortBy === 'PRICE_HIGH_LOW') {
        result.sort((a, b) => b.askingPricePerUnit - a.askingPricePerUnit);
      } else if (filters.sortBy === 'QUALITY') {
        result.sort((a, b) => b.qualityScore - a.qualityScore);
      } else if (filters.sortBy === 'FRESHNESS') {
        result.sort((a, b) => a.cropAgeDays - b.cropAgeDays);
      }
    }

    return result;
  },

  async getListingById(id: number): Promise<MarketplaceListing | null> {
    try {
      const data = await apiClient.get<any>(`/marketplace/listings/${id}`);
      if (data && data.id) {
        return mapBackendListing(data);
      }
    } catch (err) {
      console.warn('Backend GET /marketplace/listings/:id failed, falling back:', err);
    }

    const state = mockRepository.getState();
    return (state.listings || []).find((l) => l.id === id) || null;
  },

  async getFarmerActiveListings(): Promise<MarketplaceListing[]> {
    try {
      const data = await apiClient.get<any[]>('/farmer/listings');
      if (Array.isArray(data)) {
        return data.map(mapBackendListing);
      }
    } catch (err) {
      console.warn('Backend GET /farmer/listings failed:', err);
    }
    const state = mockRepository.getState();
    return (state.listings || []).filter((l) => l.status === 'ACTIVE');
  },

  async createListingFromBatch(
    batchId: number,
    askingPrice: number,
    minOrderQty: number
  ): Promise<MarketplaceListing> {
    try {
      const payload = {
        askingPricePerUnit: askingPrice,
        minimumOrderQuantity: minOrderQty,
      };

      const backendListing = await apiClient.post<any>(`/batches/${batchId}/listing`, payload);
      if (backendListing && backendListing.id) {
        const mapped = mapBackendListing(backendListing);
        mockRepository.updateState((draft) => {
          draft.listings.unshift(mapped);
          const b = draft.batches.find((x) => x.id === batchId);
          if (b) b.status = 'LISTED';
        });
        return mapped;
      }
    } catch (err) {
      console.warn('Backend POST /batches/:id/listing failed:', err);
      const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');
      if (token) {
        throw err;
      }
    }

    const state = mockRepository.getState();
    const batch = state.batches.find((b) => b.id === batchId);
    if (!batch) throw new Error('Batch not found');

    const newId = 200 + state.listings.length + 1;
    const listingCode = `LIST-TN-${newId}`;

    const newListing: MarketplaceListing = {
      id: newId,
      batchId: batch.id,
      listingCode,
      farmerId: batch.farmerId,
      farmerName: batch.farmerName,
      farmerCode: `FARM-TN-${batch.farmerId}`,
      farmerDistrict: batch.harvestLocationDistrict,
      farmerVerified: true,
      cropName: batch.cropName,
      varietyName: batch.varietyName,
      askingPricePerUnit: askingPrice,
      minimumOrderQuantity: minOrderQty,
      quantityRemaining: batch.quantity,
      quantityUnit: batch.quantityUnit,
      assignedGrade: 'GRADE_A_PREMIUM',
      qualityScore: 94.5,
      harvestDate: batch.harvestDate,
      cropAgeDays: 2,
      inspectionDate: batch.harvestDate,
      estimatedRemainingDays: 6.5,
      certificateNumber: `AGRI-CERT-2026-${batch.id}`,
      coverImageUrl: batch.photos?.[0]?.previewUrl || '',
      images: batch.photos?.map((p) => p.previewUrl) || [],
      listedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'ACTIVE',
      distanceKm: 25,
    };

    mockRepository.updateState((draft) => {
      draft.listings.unshift(newListing);
      const b = draft.batches.find((x) => x.id === batchId);
      if (b) b.status = 'LISTED';
    });

    return newListing;
  },

  async withdrawListing(listingId: number): Promise<MarketplaceListing> {
    try {
      const data = await apiClient.patch<any>(`/farmer/listings/${listingId}/withdraw`, {});
      if (data && data.id) {
        const mapped = mapBackendListing(data);
        mockRepository.updateState((draft) => {
          const l = draft.listings.find((x) => x.id === listingId);
          if (l) l.status = 'WITHDRAWN';
          const b = draft.batches.find((x) => x.id === mapped.batchId);
          if (b) b.status = 'AI_GRADED';
        });
        return mapped;
      }
    } catch (err: any) {
      console.warn('Backend PATCH /farmer/listings/:id/withdraw failed:', err);
      throw err;
    }

    mockRepository.updateState((draft) => {
      const l = draft.listings.find((x) => x.id === listingId);
      if (l) {
        l.status = 'WITHDRAWN';
        const b = draft.batches.find((x) => x.id === l.batchId);
        if (b) b.status = 'AI_GRADED';
      }
    });

    const state = mockRepository.getState();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) throw new Error('Listing not found');
    return listing;
  },

  async deleteListing(listingId: number): Promise<MarketplaceListing> {
    try {
      const data = await apiClient.delete<any>(`/farmer/listings/${listingId}`);
      if (data && data.id) {
        const mapped = mapBackendListing(data);
        mockRepository.updateState((draft) => {
          const l = draft.listings.find((x) => x.id === listingId);
          if (l) l.status = 'DELETED';
          const b = draft.batches.find((x) => x.id === mapped.batchId);
          if (b) b.status = 'AI_GRADED';
        });
        return mapped;
      }
    } catch (err: any) {
      console.warn('Backend DELETE /farmer/listings/:id failed:', err);
      throw err;
    }

    mockRepository.updateState((draft) => {
      const l = draft.listings.find((x) => x.id === listingId);
      if (l) {
        l.status = 'DELETED';
        const b = draft.batches.find((x) => x.id === l.batchId);
        if (b) b.status = 'AI_GRADED';
      }
    });

    const state = mockRepository.getState();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) throw new Error('Listing not found');
    return listing;
  },

  async createOrder(
    listingId: number,
    requestedQuantity: number,
    offeredPricePerUnit?: number,
    notes?: string
  ): Promise<any> {
    return apiClient.post<any>(`/marketplace/listings/${listingId}/orders`, {
      requestedQuantity,
      offeredPricePerUnit,
      notes,
    });
  },

  async updateListingPrice(listingId: number, unitPrice: number): Promise<MarketplaceListing> {
    try {
      const data = await apiClient.patch<any>(`/farmer/listings/${listingId}/price`, { unitPrice });
      if (data && data.id) {
        const mapped = mapBackendListing(data);
        mockRepository.updateState((draft) => {
          const l = draft.listings.find((x) => x.id === listingId);
          if (l) l.askingPricePerUnit = unitPrice;
        });
        return mapped;
      }
    } catch (err: any) {
      console.warn('Backend PATCH /farmer/listings/:id/price failed:', err);
      throw err;
    }

    mockRepository.updateState((draft) => {
      const l = draft.listings.find((x) => x.id === listingId);
      if (l) l.askingPricePerUnit = unitPrice;
    });

    const state = mockRepository.getState();
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) throw new Error('Listing not found');
    return listing;
  },
};

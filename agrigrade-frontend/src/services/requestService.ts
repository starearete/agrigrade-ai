import { apiClient } from './apiClient';
import { mockRepository } from './mockRepository';
import { listingService } from './listingService';
import { PurchaseRequest, DeliveryPreference, RequestStatus, Order } from '../types/request';

const delay = (ms: number = 200) => new Promise((res) => setTimeout(res, ms));

function mapBackendRequest(r: any): PurchaseRequest {
  return {
    id: r.id,
    listingId: r.listingId,
    listingCode: r.listingCode || `LIST-${r.listingId}`,
    cropName: r.cropName || 'Produce',
    varietyName: r.varietyName || 'Standard',
    buyerId: r.buyerId,
    buyerName: r.buyerName || 'Buyer',
    buyerBusinessName: r.buyerBusinessName || 'Buyer Traders',
    buyerDistrict: r.buyerDistrict || 'Dindigul',
    farmerId: r.farmerId,
    farmerName: r.farmerName || 'Farmer',
    offeredPricePerUnit: r.offeredPricePerUnit || r.offeredPricePerKg,
    askingPricePerUnit: r.askingPricePerUnit || r.offeredPricePerUnit,
    requestedQuantity: r.requestedQuantity,
    quantityUnit: r.quantityUnit || 'KG',
    deliveryPreference: r.deliveryPreference || 'BUYER_DELIVERY_NEEDED',
    message: r.message || r.buyerMessage,
    status: (r.status === 'DECLINED' ? 'REJECTED' : r.status) as RequestStatus,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function mapBackendOrder(o: any): Order {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    listingId: o.listingId,
    buyerId: o.buyerId,
    buyerName: o.buyerName || 'Buyer',
    buyerBusinessName: o.buyerBusinessName || 'Buyer Traders',
    farmerId: o.farmerId,
    farmerName: o.farmerName || 'Farmer',
    cropName: o.cropName || 'Produce',
    varietyName: o.varietyName || 'Standard',
    agreedPricePerUnit: o.agreedPricePerUnit,
    quantity: o.quantity,
    quantityUnit: o.quantityUnit || 'KG',
    totalAmount: o.totalAmount,
    status: o.status,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export const requestService = {
  async getPurchaseRequests(userId?: number, role?: 'FARMER' | 'BUYER'): Promise<PurchaseRequest[]> {
    const endpoint = role === 'FARMER' ? '/farmer/purchase-requests' : '/buyer/purchase-requests';
    try {
      const data = await apiClient.get<any[]>(endpoint);
      if (Array.isArray(data)) {
        const mapped = data.map(mapBackendRequest);
        mockRepository.updateState((draft) => {
          mapped.forEach((req) => {
            if (!draft.purchaseRequests.some((x) => x.id === req.id)) {
              draft.purchaseRequests.unshift(req);
            } else {
              const idx = draft.purchaseRequests.findIndex((x) => x.id === req.id);
              draft.purchaseRequests[idx] = req;
            }
          });
        });
        return mapped;
      }
    } catch (err: any) {
      console.warn(`Backend GET ${endpoint} failed:`, err);
      if (err?.status === 401 || err?.status === 403 || err?.status === 500) {
        throw err;
      }
    }

    await delay(150);
    const state = mockRepository.getState();
    if (role === 'FARMER') {
      return state.purchaseRequests.filter((r) => !userId || r.farmerId === userId);
    }
    if (role === 'BUYER') {
      return state.purchaseRequests.filter((r) => !userId || r.buyerId === userId);
    }
    return state.purchaseRequests;
  },

  async createPurchaseRequest(
    listingId: number,
    offeredPrice: number,
    quantity: number,
    deliveryPreference: DeliveryPreference,
    buyerId: number,
    buyerName: string,
    buyerDistrict: string,
    message?: string,
    clientRequestId?: string
  ): Promise<PurchaseRequest> {
    let backendResult: any = null;
    const effectiveClientId = clientRequestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    try {
      backendResult = await apiClient.post<any>('/purchase-requests', {
        listingId,
        offeredPricePerUnit: offeredPrice,
        offeredPricePerKg: offeredPrice,
        requestedQuantity: quantity,
        deliveryPreference: typeof deliveryPreference === 'string' ? deliveryPreference : 'BUYER_DELIVERY_NEEDED',
        buyerMessage: message,
        message,
        clientRequestId: effectiveClientId,
      });
      if (backendResult && backendResult.id) {
        const mapped = mapBackendRequest(backendResult);
        mockRepository.updateState((draft) => {
          draft.purchaseRequests.unshift(mapped);
        });
        return mapped;
      }
    } catch (err: any) {
      console.warn('Backend POST /purchase-requests failed:', err);
      throw err;
    }

    const state = mockRepository.getState();
    const listing = state.listings.find((l) => l.id === listingId);
    const newId = 2000 + state.purchaseRequests.length + 1;
    const now = new Date().toISOString();

    const newRequest: PurchaseRequest = {
      id: newId,
      listingId,
      listingCode: listing?.listingCode || `LIST-${listingId}`,
      cropName: listing?.cropName || 'Produce',
      varietyName: listing?.varietyName || 'Standard',
      buyerId,
      buyerName,
      buyerBusinessName: `${buyerName} Traders`,
      buyerDistrict,
      farmerId: listing?.farmerId || 101,
      farmerName: listing?.farmerName || 'Farmer',
      offeredPricePerUnit: offeredPrice,
      askingPricePerUnit: listing?.askingPricePerUnit || offeredPrice,
      requestedQuantity: quantity,
      quantityUnit: listing?.quantityUnit || 'KG',
      deliveryPreference,
      message,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    mockRepository.updateState((draft) => {
      draft.purchaseRequests.unshift(newRequest);
    });

    return newRequest;
  },

  async acceptRequest(requestId: number): Promise<PurchaseRequest> {
    try {
      const res = await apiClient.post<any>(`/farmer/purchase-requests/${requestId}/accept`, {});
      const raw = (res as any).data || res;
      const mapped = mapBackendRequest(raw);
      mockRepository.updateState((draft) => {
        const req = draft.purchaseRequests.find((r) => r.id === requestId);
        if (req) {
          req.status = 'ACCEPTED';
          req.updatedAt = mapped.updatedAt;
        }
      });
      return mapped;
    } catch (err: any) {
      console.error(`Accept request #${requestId} failed:`, err);
      throw err;
    }
  },

  async declineRequest(requestId: number, reason?: string): Promise<PurchaseRequest> {
    try {
      const res = await apiClient.post<any>(`/farmer/purchase-requests/${requestId}/reject`, { reason });
      const raw = (res as any).data || res;
      const mapped = mapBackendRequest(raw);
      mockRepository.updateState((draft) => {
        const req = draft.purchaseRequests.find((r) => r.id === requestId);
        if (req) {
          req.status = 'REJECTED';
          req.updatedAt = mapped.updatedAt;
        }
      });
      return mapped;
    } catch (err: any) {
      console.error(`Decline request #${requestId} failed:`, err);
      throw err;
    }
  },

  async updateRequestStatus(
    requestId: number,
    status: RequestStatus,
    counterPrice?: number,
    counterMsg?: string
  ): Promise<PurchaseRequest> {
    if (status === 'ACCEPTED') {
      return this.acceptRequest(requestId);
    }
    if (status === 'REJECTED') {
      return this.declineRequest(requestId, counterMsg);
    }

    let backendResult: any = null;
    if (status === 'COUNTERED' && counterPrice) {
      try {
        backendResult = await apiClient.post<any>(`/farmer/purchase-requests/${requestId}/counter`, {
          counterPricePerKg: counterPrice,
          counterQuantity: 100,
          message: counterMsg,
        });
      } catch (err) {
        console.warn(`Backend counter request failed for ID ${requestId}:`, err);
      }
    }

    if (backendResult && backendResult.id) {
      const mapped = mapBackendRequest(backendResult);
      mockRepository.updateState((draft) => {
        const req = draft.purchaseRequests.find((r) => r.id === requestId);
        if (req) {
          req.status = mapped.status;
          req.updatedAt = mapped.updatedAt;
        }
      });
      return mapped;
    }

    await delay(150);
    let updated: PurchaseRequest | undefined;
    const now = new Date().toISOString();

    mockRepository.updateState((draft) => {
      const req = draft.purchaseRequests.find((r) => r.id === requestId);
      if (req) {
        req.status = status;
        req.updatedAt = now;
        if (status === 'COUNTERED' && counterPrice) {
          req.counterOfferPrice = counterPrice;
          req.counterOfferMessage = counterMsg || 'Counter offer submitted';
        }
        updated = { ...req };
      }
    });

    return updated || ({ id: requestId, status } as any);
  },

  async getOrders(userId?: number, role?: 'FARMER' | 'BUYER'): Promise<Order[]> {
    const endpoint = role === 'FARMER' ? '/farmer/orders' : '/buyer/orders';
    try {
      const data = await apiClient.get<any[]>(endpoint);
      if (Array.isArray(data)) {
        return data.map(mapBackendOrder);
      }
    } catch (err) {
      console.warn(`Backend GET ${endpoint} failed:`, err);
    }

    await delay(150);
    const state = mockRepository.getState();
    if (role === 'FARMER') {
      return state.orders.filter((o) => !userId || o.farmerId === userId);
    }
    if (role === 'BUYER') {
      return state.orders.filter((o) => !userId || o.buyerId === userId);
    }
    return state.orders;
  },
};

export const orderService = {
  getOrders: requestService.getOrders.bind(requestService),
};

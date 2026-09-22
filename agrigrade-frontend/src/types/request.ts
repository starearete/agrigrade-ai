export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'CANCELLED' | 'EXPIRED';

export type DeliveryPreference = 'FARMER_LOCATION_PICKUP' | 'BUYER_DELIVERY_NEEDED' | 'MANDI_HUB_TRANSFER';

export interface PurchaseRequest {
  id: number;
  listingId: number;
  listingCode: string;
  cropName: string;
  varietyName: string;
  buyerId: number;
  buyerName: string;
  buyerBusinessName: string;
  buyerDistrict: string;
  farmerId: number;
  farmerName: string;
  offeredPricePerUnit: number;
  askingPricePerUnit: number;
  requestedQuantity: number;
  quantityUnit: string;
  deliveryPreference: DeliveryPreference;
  message?: string;
  status: RequestStatus;
  counterOfferPrice?: number;
  counterOfferMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'AGREED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface Order {
  id: number;
  orderNumber: string;
  listingId: number;
  buyerId: number;
  buyerName: string;
  buyerBusinessName: string;
  farmerId: number;
  farmerName: string;
  cropName: string;
  varietyName: string;
  agreedPricePerUnit: number;
  quantity: number;
  quantityUnit: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

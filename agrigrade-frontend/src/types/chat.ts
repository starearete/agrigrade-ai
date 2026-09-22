export interface MessageAttachment {
  id: number;
  messageId: number;
  fileKey: string;
  fileType: 'IMAGE' | 'CERTIFICATE' | 'DOCUMENT';
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface PurchaseRequestDetails {
  requestId?: number;
  requestPublicId?: string;
  listingId?: number;
  listingCode?: string;
  cropName?: string;
  varietyName?: string;
  buyerName?: string;
  buyerDistrict?: string;
  farmerName?: string;
  requestedQuantity: number;
  quantityUnit?: string;
  offeredPricePerKg: number;
  totalPrice: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REJECTED' | 'COUNTER_OFFER' | 'CANCELLED' | 'EXPIRED';
}

export interface ChatMessage {
  id: number;
  messagePublicId?: string;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: 'FARMER' | 'BUYER' | 'ADMIN';
  messageType?: 'TEXT' | 'PURCHASE_REQUEST' | 'FARMER_SELL_OFFER' | 'SYSTEM';
  messageText: string;
  clientMessageId?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  status?: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';
  purchaseRequestId?: number;
  purchaseRequestDetails?: PurchaseRequestDetails;
  editedAt?: string;
  deletedAt?: string;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: number;
  publicId?: string;
  listingId?: number;
  listingCode?: string;
  cropName?: string;
  varietyName?: string;
  batchNumber?: string;
  qualityGrade?: string;
  quantityKg?: number;
  inquiryId?: number;
  participantFarmerId: number;
  participantFarmerName: string;
  participantBuyerId: number;
  participantBuyerName: string;
  conversationType: 'INQUIRY_NEGOTIATION' | 'DIRECT_SUPPORT' | 'ORDER_FULFILLMENT';
  lastMessageText?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  createdAt: string;
}

export type NotificationType = 'AI_ANALYSIS_COMPLETE' | 'MARKET_ALERT' | 'BUYER_INQUIRY' | 'CHAT_MESSAGE' | 'ORDER_UPDATE' | 'PURCHASE_REQUEST' | 'PURCHASE_REQUEST_CREATED' | 'PURCHASE_REQUEST_ACCEPTED' | 'PURCHASE_REQUEST_DECLINED' | 'LISTING_SOLD_OUT' | 'SYSTEM' | string;

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  body: string;
  notificationType: NotificationType;
  referenceType?: string;
  referenceId?: number;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userName?: string;
  actorName?: string;
  action?: string;
  actionType?: string;
  entityType?: string;
  entityName?: string;
  entityId?: number;
  ipAddress?: string;
  details?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface SystemHealth {
  status?: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'ONLINE' | string;
  apiStatus?: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'ONLINE' | string;
  databaseStatus?: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'ONLINE' | string;
  aiWorkerStatus?: 'ACTIVE' | 'IDLE' | 'DOWN' | string;
  webSocketStatus?: 'CONNECTED' | 'DISCONNECTED' | string;
  activeUsersCount?: number;
  totalBatchesToday?: number;
  totalTradeVolume?: number;
  timestamp?: string;
  services?: {
    database: boolean;
    redis: boolean;
    aiEngine: boolean;
    smsGateway: boolean;
  };
  [key: string]: any;
}

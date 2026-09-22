import { apiClient } from './apiClient';
import { Conversation, ChatMessage } from '../types/chat';
import { MarketplaceListing } from '../types/listing';

export const chatService = {
  async getConversations(_userId?: number, _role?: string): Promise<Conversation[]> {
    try {
      const res = await apiClient.get<Conversation[]>('/chat/conversations');
      const list = (res as any).data || res || [];
      return list.map(this.mapConversationResponse);
    } catch (err) {
      console.warn('Failed to fetch conversations from API:', err);
      return [];
    }
  },

  async getConversationById(id: number): Promise<Conversation | null> {
    try {
      const res = await apiClient.get<Conversation>(`/chat/conversations/${id}`);
      const raw = (res as any).data || res;
      return raw ? this.mapConversationResponse(raw) : null;
    } catch (err) {
      console.warn(`Failed to fetch conversation #${id}:`, err);
      return null;
    }
  },

  async getMessages(conversationId: number, page: number = 0, size: number = 50, beforeId?: number): Promise<ChatMessage[]> {
    try {
      const beforeQuery = beforeId ? `&before=${beforeId}` : '';
      const res = await apiClient.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages?page=${page}&size=${size}${beforeQuery}`);
      const list = (res as any).data || res || [];
      return list.map(this.mapMessageResponse);
    } catch (err) {
      console.warn(`Failed to fetch messages for conversation #${conversationId}:`, err);
      return [];
    }
  },

  async sendMessage(
    conversationId: number,
    _senderId: number,
    _senderName: string,
    _senderRole: 'FARMER' | 'BUYER' | 'ADMIN',
    messageText: string,
    clientMessageId?: string
  ): Promise<ChatMessage> {
    try {
      const res = await apiClient.post<ChatMessage>('/chat/messages', {
        conversationId,
        content: messageText,
        clientMessageId: clientMessageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      });
      const raw = (res as any).data || res;
      return this.mapMessageResponse(raw);
    } catch (err: any) {
      console.error('Failed to send message via REST:', err);
      throw err;
    }
  },

  async markAsRead(conversationId: number): Promise<void> {
    try {
      await apiClient.patch(`/chat/conversations/${conversationId}/read`, {});
    } catch (err) {
      console.warn(`Failed to mark conversation #${conversationId} as read:`, err);
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ totalUnread: number }>('/chat/unread-count');
      const data = (res as any).data || res;
      return data?.totalUnread || 0;
    } catch (err) {
      return 0;
    }
  },

  async deleteConversation(conversationId: number): Promise<void> {
    try {
      await apiClient.post(`/chat/conversations/${conversationId}/delete`, {});
    } catch (err: any) {
      try {
        await apiClient.delete(`/chat/conversations/${conversationId}`);
      } catch (e: any) {
        console.error(`Failed to delete conversation #${conversationId}:`, e);
        throw e;
      }
    }
  },

  async getOrCreateConversationForListing(
    listingOrId: MarketplaceListing | number,
    _buyerId?: number,
    _buyerName?: string,
    initialMessage?: string
  ): Promise<Conversation> {
    const listingId = typeof listingOrId === 'number' ? listingOrId : listingOrId.id;

    try {
      const res = await apiClient.post<Conversation>('/chat/conversations', {
        listingId,
        initialMessage: initialMessage || '',
      });
      const raw = (res as any).data || res;
      return this.mapConversationResponse(raw);
    } catch (err: any) {
      console.error('Failed to get/create conversation for listing:', err);
      throw err;
    }
  },

  mapConversationResponse(raw: any): Conversation {
    return {
      id: raw.id,
      publicId: raw.publicId || raw.conversationPublicId,
      listingId: raw.listingId,
      cropName: raw.listingCropName || raw.cropName || 'Produce',
      varietyName: raw.listingVarietyName || raw.cropVariety || '',
      qualityGrade: raw.listingQualityGrade || raw.qualityGrade || 'GRADE A PREMIUM',
      quantityKg: raw.listingQuantityKg || raw.quantityRemaining || 0,
      participantFarmerId: raw.farmerUserId || raw.farmerId,
      participantFarmerName: raw.farmerName || 'Farmer',
      participantBuyerId: raw.buyerUserId || raw.buyerId,
      participantBuyerName: raw.buyerName || 'Buyer',
      conversationType: 'INQUIRY_NEGOTIATION',
      lastMessageText: raw.lastMessageText || '',
      lastMessageTime: raw.lastMessageTime || raw.lastMessageAt || raw.createdAt,
      unreadCount: raw.unreadCount || 0,
      createdAt: raw.createdAt,
    };
  },

  mapMessageResponse(raw: any): ChatMessage {
    return {
      id: raw.id,
      messagePublicId: raw.publicId || raw.messagePublicId,
      conversationId: raw.conversationId,
      senderId: raw.senderUserId || raw.senderId,
      senderName: raw.senderName || 'Participant',
      senderRole: raw.senderRole || 'BUYER',
      messageType: raw.messageType || 'TEXT',
      messageText: raw.content || raw.messageText || '',
      clientMessageId: raw.clientMessageId,
      sentAt: raw.sentAt || new Date().toISOString(),
      deliveredAt: raw.deliveredAt,
      readAt: raw.readAt,
      status: raw.status || 'SENT',
      purchaseRequestId: raw.purchaseRequestId,
      purchaseRequestDetails: raw.purchaseRequestDetails,
      editedAt: raw.deliveredAt,
      deletedAt: raw.readAt,
    };
  },
};

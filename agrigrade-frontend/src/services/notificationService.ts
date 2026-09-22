import { apiClient } from './apiClient';
import { NotificationItem, SystemHealth, AuditLog } from '../types/chat';

export const notificationService = {
  async getNotifications(_userId?: number): Promise<NotificationItem[]> {
    try {
      const res = await apiClient.get<NotificationItem[]>('/notifications');
      const list = (res as any).data || res || [];
      return list.map(this.mapNotificationResponse);
    } catch (err) {
      console.warn('Failed to fetch notifications from API:', err);
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
      const data = (res as any).data || res;
      return data?.unreadCount || 0;
    } catch (err) {
      return 0;
    }
  },

  async markAsRead(notificationId: number): Promise<void> {
    try {
      await apiClient.post(`/notifications/${notificationId}/read`, {});
    } catch (err) {
      console.warn(`Failed to mark notification #${notificationId} as read:`, err);
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.post('/notifications/read-all', {});
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    }
  },

  mapNotificationResponse(raw: any): NotificationItem {
    return {
      id: raw.id,
      userId: raw.userId,
      title: raw.title,
      body: raw.body || raw.message,
      notificationType: raw.notificationType || raw.type || 'SYSTEM',
      referenceType: raw.referenceType,
      referenceId: raw.referenceId,
      readAt: raw.readAt || (raw.isRead ? raw.createdAt : undefined),
      createdAt: raw.createdAt || new Date().toISOString(),
    };
  },
};

export const adminService = {
  async getSystemHealth(): Promise<SystemHealth> {
    return {
      status: 'UP',
      uptimeSeconds: 86400,
      activeConnections: 12,
      databaseStatus: 'HEALTHY',
    };
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return [];
  },

  async getUsers() {
    return [];
  },

  async getKycQueue() {
    return [];
  },
};

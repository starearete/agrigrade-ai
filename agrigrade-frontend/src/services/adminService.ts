import { apiClient } from './apiClient';

export interface AdminDashboardStats {
  totalUsers: number;
  totalFarmers: number;
  totalBuyers: number;
  activeFarmers: number;
  activeBuyers: number;
  suspendedUsers: number;
  verifiedFarmers: number;
  verifiedBuyers: number;
  activeListings: number;
  suspendedListings: number;
  pendingPurchaseRequests: number;
  completedTrades: number;
  totalCrops: number;
  totalDiseases: number;
  totalMarkets: number;
  totalListedQuantity: number;
  totalTradedQuantity: number;
}

export interface UserAdmin {
  id: number;
  publicId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: 'FARMER' | 'BUYER' | 'ADMIN';
  district: string;
  taluk: string;
  village: string;
  address: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
  acreage?: number;
  buyingCapacity?: number;
  primaryCrop?: string;
  preferredCrops?: string;
  businessName?: string;
  farmerCode?: string;
  buyerCode?: string;
  createdAt: string;
  lastActive: string;
}

export interface AuditLog {
  id: number;
  adminUserId: number;
  adminEmail: string;
  adminName: string;
  targetUserId?: number;
  targetUserName?: string;
  actionCode: string;
  reason: string;
  executedAt: string;
}

export interface UserFilterParams {
  role?: string;
  district?: string;
  status?: string;
  verification?: string;
  minAcreage?: number;
  maxAcreage?: number;
  minBuyingCapacity?: number;
  search?: string;
  sort?: string;
}

export const adminService = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    return await apiClient.get<AdminDashboardStats>('/admin/dashboard/stats');
  },

  getAllUsers: async (params?: UserFilterParams): Promise<UserAdmin[]> => {
    return await apiClient.get<UserAdmin[]>('/admin/users', params as any);
  },

  updateUserStatus: async (
    userId: number,
    status?: string,
    verificationStatus?: string,
    reason?: string
  ): Promise<UserAdmin> => {
    return await apiClient.patch<UserAdmin>(`/admin/users/${userId}/status`, {
      status,
      verificationStatus,
      reason,
    });
  },

  moderateListing: async (
    listingId: number,
    status: 'SUSPENDED' | 'ACTIVE' | 'REMOVED',
    reason?: string
  ): Promise<any> => {
    return await apiClient.patch<any>(`/admin/listings/${listingId}/moderate`, {
      status,
      reason,
    });
  },

  deleteListing: async (listingId: number, reason?: string): Promise<void> => {
    const params: Record<string, string> = {};
    if (reason) params.reason = reason;
    return await apiClient.delete<void>(`/admin/listings/${listingId}${reason ? '?reason=' + encodeURIComponent(reason) : ''}`);
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    return await apiClient.get<AuditLog[]>('/admin/audit-logs');
  },

  getSystemHealth: async (): Promise<any> => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/admin/system/health');
      if (response.ok) return await response.json();
    } catch (err) {
      console.warn('Direct Python AI health check fetch failed, using gateway fallback', err);
    }
    return await apiClient.get<any>('/admin/system/health');
  },

  triggerMarketRefresh: async (): Promise<any> => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/admin/market/refresh', { method: 'POST' });
      if (response.ok) return await response.json();
    } catch (err) {
      console.warn('Direct Python AI market refresh fetch failed, using gateway fallback', err);
    }
    return await apiClient.post<any>('/admin/market/refresh', {});
  },
};

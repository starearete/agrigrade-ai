import { apiClient } from './apiClient';
import { AddressDto, FarmerProfile, BuyerProfile, ProfileCompletionStatus, User } from '../types/auth';

export interface FarmerProfileSavePayload {
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  preferredLanguage?: string;
  preferredTheme?: string;
  contactAddress?: AddressDto;
  farmAddress?: AddressDto;
  farmSameAsContact?: boolean;
  totalLandAcres?: number;
  primaryCropIds?: number[];
  kisanCreditCardNo?: string;
}

export interface BuyerProfileSavePayload {
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  preferredLanguage?: string;
  preferredTheme?: string;
  businessName?: string;
  buyerType?: string;
  businessAddress?: AddressDto;
  procurementCropIds?: number[];
  purchaseCapacity?: string;
  gstNumber?: string;
  businessRegistrationNumber?: string;
}

export const profileService = {
  getCompletionStatus: async (): Promise<ProfileCompletionStatus> => {
    try {
      return await apiClient.get<ProfileCompletionStatus>('/profile/completion');
    } catch {
      return {
        completed: false,
        role: 'FARMER',
        missingFields: ['contactAddress', 'farmAddress', 'totalLandAcres', 'primaryCrops'],
        preferredLanguage: 'en',
        preferredTheme: 'LIGHT',
      };
    }
  },

  getFarmerProfile: async (): Promise<FarmerProfile> => {
    return apiClient.get<FarmerProfile>('/profile/farmer');
  },

  saveFarmerProfile: async (payload: FarmerProfileSavePayload): Promise<FarmerProfile> => {
    return apiClient.put<FarmerProfile>('/profile/farmer', payload);
  },

  getBuyerProfile: async (): Promise<BuyerProfile> => {
    return apiClient.get<BuyerProfile>('/profile/buyer');
  },

  saveBuyerProfile: async (payload: BuyerProfileSavePayload): Promise<BuyerProfile> => {
    return apiClient.put<BuyerProfile>('/profile/buyer', payload);
  },

  updatePreferences: async (payload: { preferredLanguage?: string; preferredTheme?: string }): Promise<User> => {
    return apiClient.patch<User>('/profile/preferences', payload);
  },

  deleteAccount: async (): Promise<void> => {
    return apiClient.delete<void>('/profile');
  },
};

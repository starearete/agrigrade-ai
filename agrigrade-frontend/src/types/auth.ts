export type RoleType = 'FARMER' | 'BUYER' | 'ADMIN';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface User {
  id: number;
  publicId: string;
  fullName: string;
  email: string | null;
  mobileNumber: string | null;
  status: UserStatus;
  roles: RoleType[];
  profileCompleted?: boolean;
  preferredLanguage?: string;
  preferredTheme?: 'LIGHT' | 'DARK' | 'SYSTEM';
  createdAt: string;
  updatedAt?: string;
}

export interface AddressDto {
  id?: number;
  addressType?: string;
  addressLine1: string;
  addressLine2?: string;
  villageTownCity?: string;
  taluk?: string;
  locality?: string;
  district: string;
  state: string;
  stateId?: number;
  districtId?: number;
  pincode: string;
  landmark?: string;
}

export interface FarmerProfile {
  id: number;
  userId: number;
  publicId?: string;
  farmerCode: string;
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  kisanCreditCardNo?: string;
  totalLandAcres?: number;
  contactAddress?: AddressDto;
  farmAddress?: AddressDto;
  farmSameAsContact?: boolean;
  primaryCrops?: any[];
  profileCompleted?: boolean;
  preferredLanguage?: string;
  preferredTheme?: string;
  createdAt: string;
}

export interface BuyerProfile {
  id: number;
  userId: number;
  publicId?: string;
  buyerCode: string;
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  businessName: string;
  gstNumber?: string;
  businessRegistrationNumber?: string;
  buyerType: string;
  purchaseCapacity?: string;
  businessAddress?: AddressDto;
  procurementCrops?: any[];
  profileCompleted?: boolean;
  preferredLanguage?: string;
  preferredTheme?: string;
  createdAt: string;
}

export interface LoginRequest {
  emailOrMobile: string;
  password?: string;
  passwordHash?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  farmerProfile?: FarmerProfile;
  buyerProfile?: BuyerProfile;
}

export interface GoogleAuthRequest {
  credential: string;
  role?: 'FARMER' | 'BUYER';
  district?: string;
  businessName?: string;
}

export interface RegisterRequest {
  fullName: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  role: 'FARMER' | 'BUYER';
  businessName?: string;
  district?: string;
}

export interface UserProfileResponse {
  user: User;
  farmerProfile?: FarmerProfile;
  buyerProfile?: BuyerProfile;
}

export interface ProfileCompletionStatus {
  completed: boolean;
  role: string;
  missingFields: string[];
  preferredLanguage: string;
  preferredTheme: string;
}

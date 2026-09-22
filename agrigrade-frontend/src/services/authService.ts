import { apiClient } from './apiClient';
import { GoogleAuthRequest, LoginRequest, LoginResponse, RegisterRequest, User, UserProfileResponse } from '../types/auth';

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const payload = {
      emailOrMobile: request.emailOrMobile,
      password: request.password || request.passwordHash || 'Password123!',
    };

    const response = await apiClient.post<LoginResponse>('/auth/login', payload);

    if (response.token) {
      localStorage.setItem('AGRIGRADE_ACCESS_TOKEN', response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem('AGRIGRADE_REFRESH_TOKEN', response.refreshToken);
    }
    if (response.user) {
      localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(response.user));
    }

    return response;
  },

  async googleLogin(
    credentialOrRequest: string | GoogleAuthRequest,
    role?: 'FARMER' | 'BUYER',
    district?: string,
    businessName?: string
  ): Promise<LoginResponse> {
    const payload: GoogleAuthRequest = typeof credentialOrRequest === 'string'
      ? {
          credential: credentialOrRequest,
          role,
          district: district || undefined,
          businessName,
        }
      : credentialOrRequest;

    const response = await apiClient.post<LoginResponse>('/auth/google', payload);

    if (response.token) {
      localStorage.setItem('AGRIGRADE_ACCESS_TOKEN', response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem('AGRIGRADE_REFRESH_TOKEN', response.refreshToken);
    }
    if (response.user) {
      localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(response.user));
    }

    return response;
  },

  async register(request: RegisterRequest): Promise<LoginResponse> {
    const payload = {
      fullName: request.fullName,
      email: request.email || null,
      mobileNumber: request.mobileNumber || null,
      password: request.password || (request as any).passwordHash || 'Password123!',
      role: request.role,
      businessName: request.businessName || null,
      district: request.district || undefined,
    };

    const response = await apiClient.post<LoginResponse>('/auth/register', payload);

    if (response.token) {
      localStorage.setItem('AGRIGRADE_ACCESS_TOKEN', response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem('AGRIGRADE_REFRESH_TOKEN', response.refreshToken);
    }
    if (response.user) {
      localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(response.user));
    }

    return response;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<UserProfileResponse>('/auth/me');
      if (response && response.user) {
        localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(response.user));
        return response.user;
      }
    } catch (err: any) {
      localStorage.removeItem('AGRIGRADE_ACCESS_TOKEN');
      localStorage.removeItem('AGRIGRADE_REFRESH_TOKEN');
      localStorage.removeItem('AGRIGRADE_SESSION_USER');
      return null;
    }

    return null;
  },
};

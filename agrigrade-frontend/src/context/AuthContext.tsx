import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleType, LoginRequest, RegisterRequest, GoogleAuthRequest } from '../types/auth';
import { authService } from '../services/authService';
import { mockRepository } from '../services/mockRepository';

interface AuthContextType {
  user: User | null;
  role: RoleType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<User>;
  googleLogin: (
    credentialOrRequest: string | GoogleAuthRequest,
    role?: 'FARMER' | 'BUYER',
    district?: string,
    businessName?: string
  ) => Promise<User>;
  register: (request: RegisterRequest) => Promise<User>;
  logout: () => void;
  updateUserState: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (u: any): User | null => {
  if (!u) return null;
  let rawRoles: any[] = [];
  if (Array.isArray(u.roles) && u.roles.length > 0) {
    rawRoles = u.roles;
  } else if (u.role) {
    rawRoles = [u.role];
  } else {
    rawRoles = ['FARMER'];
  }

  const roleSet = new Set<string>();
  rawRoles.forEach((r: any) => {
    const str = typeof r === 'string' ? r : r.code || r.name || 'FARMER';
    const clean = str.replace(/^ROLE_/, '');
    roleSet.add(clean);
    roleSet.add('ROLE_' + clean);
  });

  const roles = Array.from(roleSet) as RoleType[];

  return {
    ...u,
    roles,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('AGRIGRADE_SESSION_USER');
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');

      if (!token) {
        setUser(null);
        localStorage.removeItem('AGRIGRADE_SESSION_USER');
        localStorage.removeItem('AGRIGRADE_REFRESH_TOKEN');
        setIsLoading(false);
        return;
      }

      // Validate session with backend /api/v1/auth/me
      try {
        const meUserRaw = await authService.getCurrentUser();
        const meUser = normalizeUser(meUserRaw);
        if (meUser) {
          setUser(meUser);
          localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(meUser));
          if (meUser.preferredLanguage) {
            localStorage.setItem('AGRIGRADE_LANGUAGE', meUser.preferredLanguage);
          }
        } else {
          setUser(null);
          localStorage.removeItem('AGRIGRADE_ACCESS_TOKEN');
          localStorage.removeItem('AGRIGRADE_REFRESH_TOKEN');
          localStorage.removeItem('AGRIGRADE_SESSION_USER');
        }
      } catch (e) {
        setUser(null);
        localStorage.removeItem('AGRIGRADE_ACCESS_TOKEN');
        localStorage.removeItem('AGRIGRADE_REFRESH_TOKEN');
        localStorage.removeItem('AGRIGRADE_SESSION_USER');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (request: LoginRequest): Promise<User> => {
    setIsLoading(true);
    try {
      const resp = await authService.login(request);
      const normalized = normalizeUser(resp.user);
      if (!normalized) {
        throw new Error('Authentication response is missing user information.');
      }
      setUser(normalized);
      localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(normalized));
      if (normalized.preferredLanguage) {
        localStorage.setItem('AGRIGRADE_LANGUAGE', normalized.preferredLanguage);
      }
      return normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (
    credentialOrRequest: string | GoogleAuthRequest,
    role?: 'FARMER' | 'BUYER',
    district?: string,
    businessName?: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const resp = await authService.googleLogin(credentialOrRequest, role, district, businessName);
      const normalized = normalizeUser(resp.user);
      if (!normalized) {
        throw new Error('Google authentication response is missing user information.');
      }
      setUser(normalized);
      localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(normalized));
      if (normalized.preferredLanguage) {
        localStorage.setItem('AGRIGRADE_LANGUAGE', normalized.preferredLanguage);
      }
      return normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (request: RegisterRequest): Promise<User> => {
    setIsLoading(true);
    try {
      const resp = await authService.register(request);
      const normalized = normalizeUser(resp.user);
      if (!normalized) {
        throw new Error('Registration response is missing user information.');
      }
      setUser(normalized);
      localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(normalized));
      return normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('AGRIGRADE_ACCESS_TOKEN');
    localStorage.removeItem('AGRIGRADE_REFRESH_TOKEN');
    localStorage.removeItem('AGRIGRADE_SESSION_USER');
    mockRepository.refreshActiveUser();
  };

  const updateUserState = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = normalizeUser({ ...prev, ...partial });
      if (updated) {
        localStorage.setItem('AGRIGRADE_SESSION_USER', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const primaryRole: RoleType | null =
    user && user.roles && Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles.includes('ADMIN')
        ? 'ADMIN'
        : user.roles.includes('BUYER')
        ? 'BUYER'
        : user.roles.includes('FARMER')
        ? 'FARMER'
        : (user.roles[0] as RoleType)
      : user && (user as any).role
      ? ((user as any).role as RoleType)
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: primaryRole,
        isAuthenticated: !!user && !!primaryRole,
        isLoading,
        login,
        googleLogin,
        register,
        logout,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

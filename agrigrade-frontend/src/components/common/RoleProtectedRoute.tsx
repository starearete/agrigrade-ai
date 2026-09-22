import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleType } from '../../types/auth';
import { AuthenticatedLayout } from './AuthenticatedLayout';

interface RoleProtectedRouteProps {
  element: React.ReactElement;
  allowedRole?: RoleType | RoleType[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ element, allowedRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF5] text-[#17201A]">
        <div className="w-10 h-10 border-3 border-[#2E7D32] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[#1B5E20]">Verifying agricultural credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Profile completion gate: Gated users must complete profile first
  if (user.profileCompleted === false && !user.roles?.includes('ADMIN')) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  // Role validation & isolation
  if (allowedRole) {
    const rolesToCheck: RoleType[] = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    const hasRole = rolesToCheck.some((r) => user.roles?.includes(r));
    if (!hasRole) {
      if (user.roles?.includes('BUYER')) {
        return <Navigate to="/buyer/marketplace" replace />;
      } else if (user.roles?.includes('FARMER')) {
        return <Navigate to="/farmer/dashboard" replace />;
      } else if (user.roles?.includes('ADMIN')) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  // Admin module has its own full layout (AdminLayout with AdminSidebar + Header)
  // — skip AuthenticatedLayout to avoid double-wrapping
  if (user.roles?.includes('ADMIN')) {
    return element;
  }

  return <AuthenticatedLayout>{element}</AuthenticatedLayout>;
};

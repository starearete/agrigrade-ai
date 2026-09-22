import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from '../../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { RoleType } from '../../types/auth';
import { LanguageSelector } from '../../components/common/LanguageSelector';

export const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const { showToast } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [emailOrMobile, setEmailOrMobile] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('FARMER');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSelectPreset = (role: RoleType) => {
    setSelectedRole(role);
  };

  const handleRedirect = (authenticatedUser: any) => {
    const roles: string[] = Array.isArray(authenticatedUser?.roles)
      ? authenticatedUser.roles
      : authenticatedUser?.role
      ? [authenticatedUser.role]
      : [];

    const isBuyer = roles.includes('BUYER');
    const isAdmin = roles.includes('ADMIN');

    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }

    if (authenticatedUser?.profileCompleted === false) {
      navigate('/onboarding/profile', { replace: true });
    } else if (isBuyer) {
      navigate('/buyer/marketplace', { replace: true });
    } else {
      navigate('/farmer/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const authUser = await login({ emailOrMobile, password, passwordHash: password });
      showToast(`Welcome back to AgriGrade AI!`, 'success');
      handleRedirect(authUser);
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF5] p-4 sm:p-6 text-[#17201A]">
      <div className="max-w-md w-full bg-white border border-[#C5E6CC] rounded-3xl p-6 sm:p-8 shadow-sm animate-fade-in">
        <div className="flex justify-end items-center mb-4">
          <LanguageSelector variant="compact" />
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1B5E20]">{t('auth.loginTitle')}</h2>
          <p className="text-xs text-[#526158] mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Role Presets */}
        <div className="grid grid-cols-3 gap-2 bg-[#F4FAF4] border border-[#C5E6CC] p-1.5 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSelectPreset('FARMER')}
            className={`py-2 rounded-xl transition-all ${
              selectedRole === 'FARMER' ? 'bg-[#2E7D32] text-white shadow-xs' : 'text-[#17201A] hover:bg-[#EEF8F0]'
            }`}
          >
            {t('auth.farmer')}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('BUYER')}
            className={`py-2 rounded-xl transition-all ${
              selectedRole === 'BUYER' ? 'bg-[#2E7D32] text-white shadow-xs' : 'text-[#17201A] hover:bg-[#EEF8F0]'
            }`}
          >
            {t('auth.buyer')}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('ADMIN')}
            className={`py-2 rounded-xl transition-all ${
              selectedRole === 'ADMIN' ? 'bg-[#17201A] text-white shadow-xs' : 'text-[#17201A] hover:bg-[#EEF8F0]'
            }`}
          >
            {t('auth.admin')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#17201A] mb-1">
              {t('auth.email')} / {t('auth.mobileNumber')}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#526158] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={emailOrMobile}
                onChange={(e) => setEmailOrMobile(e.target.value)}
                placeholder="Enter email address or mobile number"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:outline-none font-medium text-[#17201A]"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-bold text-[#17201A]">{t('auth.password')}</label>
              <Link to="/forgot-password" className="text-[#2E7D32] font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#526158] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:outline-none font-medium text-[#17201A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 text-sm mt-2"
          >
            {isLoading ? t('common.loading') : t('auth.loginButton')} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Google Sign-In Divider & Button */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#C5E6CC]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-3 text-[#526158] font-bold tracking-wider">{t('common.or')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            setIsLoading(true);
            try {
              const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
              if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && clientId) {
                (window as any).google.accounts.id.initialize({
                  client_id: clientId,
                  callback: async (response: any) => {
                    if (response?.credential) {
                      const authUser = await googleLogin(response.credential, selectedRole === 'ADMIN' ? 'FARMER' : (selectedRole as 'FARMER' | 'BUYER'));
                      showToast(`Welcome to AgriGrade AI!`, 'success');
                      handleRedirect(authUser);
                    }
                  }
                });
                (window as any).google.accounts.id.prompt();
              } else {
                const credential = window.prompt('Enter your verified Google ID Token:');
                if (credential) {
                  const authUser = await googleLogin(credential, selectedRole === 'ADMIN' ? 'FARMER' : (selectedRole as 'FARMER' | 'BUYER'));
                  showToast(`Welcome to AgriGrade AI!`, 'success');
                  handleRedirect(authUser);
                }
              }
            } catch (err: any) {
              showToast(err.message || 'Google authentication failed.', 'error');
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="w-full py-2.5 bg-white border border-[#C5E6CC] text-[#17201A] font-bold rounded-xl hover:bg-[#EEF8F0] transition-all shadow-xs flex items-center justify-center gap-3 text-xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {t('auth.googleSignIn')}
        </button>

        <div className="text-center mt-6 text-xs text-[#526158]">
          {selectedRole === 'ADMIN' ? (
            <span className="font-bold text-[#17201A]">Administrator accounts are provisioned by AgriGrade AI.</span>
          ) : (
            <>
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register" className="text-[#2E7D32] font-bold hover:underline">
                {t('auth.registerButton')}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Menu, X, ArrowRight, UserCheck } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from '../../context/LanguageContext';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const { showToast } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavClick = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (window.location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      window.location.hash = sectionId;
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleMarketplaceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Sign in as a buyer to access the verified marketplace.', 'info');
      navigate('/signin');
    } else if (role === 'BUYER') {
      navigate('/buyer/marketplace');
    } else if (role === 'FARMER') {
      navigate('/farmer/dashboard');
    } else if (role === 'ADMIN') {
      navigate('/admin');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#C5E6CC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LEFT: Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#2E7D32] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#1B5E20] leading-none block">
                AgriGrade<span className="text-[#2E7D32]">.AI</span>
              </span>
              <span className="text-[10px] text-[#526158] font-medium tracking-tight">
                Agricultural Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* CENTER: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#17201A]">
          <a href="#product" onClick={handleNavClick('product')} className="hover:text-[#2E7D32] transition-colors">
            Product
          </a>
          <a href="#how-it-works" onClick={handleNavClick('how-it-works')} className="hover:text-[#2E7D32] transition-colors">
            How It Works
          </a>
          <a href="#ai-inspection" onClick={handleNavClick('ai-inspection')} className="hover:text-[#2E7D32] transition-colors">
            AI Inspection
          </a>
          <a href="#marketplace" onClick={handleMarketplaceClick} className="hover:text-[#2E7D32] transition-colors">
            Marketplace
          </a>
          <a href="#about" onClick={handleNavClick('about')} className="hover:text-[#2E7D32] transition-colors">
            About
          </a>
        </nav>

        {/* RIGHT: Language & Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSelector variant="compact" />

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (role === 'BUYER') navigate('/buyer/marketplace');
                  else if (role === 'ADMIN') navigate('/admin');
                  else navigate('/farmer/dashboard');
                }}
                className="px-3 py-2 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" /> Workspace
              </button>
              <button
                onClick={() => {
                  logout();
                  showToast('Signed out successfully.', 'info');
                  navigate('/');
                }}
                className="px-3 py-2 bg-red-50 text-[#B3261E] border border-red-100 font-bold text-xs rounded-xl hover:bg-red-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/signin"
                className="px-4 py-2 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#EEF8F0] transition-colors shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1"
              >
                Create Account <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#17201A] hover:bg-[#EEF8F0] rounded-xl transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#1B5E20]" /> : <Menu className="w-6 h-6 text-[#1B5E20]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#C5E6CC] bg-white px-4 pt-3 pb-6 space-y-4 animate-fade-in">
          <nav className="flex flex-col space-y-2.5 text-xs font-bold text-[#17201A]">
            <a
              href="#product"
              onClick={handleNavClick('product')}
              className="px-3 py-2 rounded-lg hover:bg-[#EEF8F0]"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              onClick={handleNavClick('how-it-works')}
              className="px-3 py-2 rounded-lg hover:bg-[#EEF8F0]"
            >
              How It Works
            </a>
            <a
              href="#ai-inspection"
              onClick={handleNavClick('ai-inspection')}
              className="px-3 py-2 rounded-lg hover:bg-[#EEF8F0]"
            >
              AI Inspection
            </a>
            <a
              href="#marketplace"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleMarketplaceClick(e);
              }}
              className="px-3 py-2 rounded-lg hover:bg-[#EEF8F0]"
            >
              Marketplace
            </a>
            <a
              href="#about"
              onClick={handleNavClick('about')}
              className="px-3 py-2 rounded-lg hover:bg-[#EEF8F0]"
            >
              About
            </a>
          </nav>

          <div className="pt-3 border-t border-[#C5E6CC] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#526158]">Language:</span>
              <LanguageSelector variant="compact" />
            </div>

            {user ? (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (role === 'BUYER') navigate('/buyer/marketplace');
                    else if (role === 'ADMIN') navigate('/admin');
                    else navigate('/farmer/dashboard');
                  }}
                  className="flex-1 py-2.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" /> Workspace
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    showToast('Signed out successfully.', 'info');
                    navigate('/');
                  }}
                  className="py-2.5 px-4 bg-red-50 text-[#B3261E] border border-red-100 font-bold text-xs rounded-xl"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl text-center"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

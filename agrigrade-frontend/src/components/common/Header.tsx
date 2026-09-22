import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation, useLanguage } from '../../context/LanguageContext';
import { Sprout, Bell, Menu, User as UserIcon, LogOut, CheckCheck, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';
import { NotificationItem } from '../../types/chat';

interface HeaderProps {
  onOpenMobileDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileDrawer }) => {
  const { user, role, logout } = useAuth();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotification();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (n: NotificationItem) => {
    await markAsRead(n.id);
    setShowNotifMenu(false);

    if (n.notificationType === 'CHAT_MESSAGE' || n.referenceType === 'CONVERSATION') {
      const convParam = n.referenceId ? `?convId=${n.referenceId}` : '';
      navigate(role === 'FARMER' ? `/farmer/messages${convParam}` : `/buyer/messages${convParam}`);
    } else if (n.notificationType.startsWith('PURCHASE_REQUEST') || n.referenceType === 'PURCHASE_REQUEST') {
      const convParam = n.referenceId ? `?convId=${n.referenceId}` : '';
      if (role === 'FARMER') {
        navigate(`/farmer/messages${convParam}`);
      } else {
        navigate(`/buyer/messages${convParam}`);
      }
    } else if (n.notificationType === 'LISTING_SOLD_OUT' || n.referenceType === 'LISTING') {
      if (role === 'FARMER') {
        navigate('/farmer/batches');
      } else {
        navigate('/buyer/marketplace');
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#C5E6CC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileDrawer}
            className="md:hidden p-2 text-[#17201A] hover:bg-[#EEF8F0] rounded-xl transition-colors"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-6 h-6 text-[#1B5E20]" />
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#2E7D32] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#1B5E20] leading-none block">AgriGrade<span className="text-[#2E7D32]">.AI</span></span>
              <span className="text-[10px] text-[#526158] font-medium tracking-tight">{isTa ? 'விவசாய நுண்ணறிவு' : 'Agricultural Intelligence'}</span>
            </div>
          </Link>
        </div>

        {/* Right: Language, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector variant="compact" />

          {/* Notification Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 text-[#17201A] hover:bg-[#EEF8F0] rounded-xl transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#1B5E20]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#B3261E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#C5E6CC] rounded-2xl shadow-xl z-50 p-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-3">
                  <h4 className="font-bold text-sm text-[#1B5E20]">{isTa ? 'அறிவிப்புகள்' : 'Notifications'}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#526158] font-medium">{unreadCount} {isTa ? 'வாசிக்கப்படாதவை' : 'unread'}</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-[#2E7D32] hover:underline font-bold flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> {isTa ? 'அனைத்தும் வாசித்தவை' : 'Mark all read'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#526158] text-center py-4">{isTa ? 'அறிவிப்புகள் எதுவும் இல்லை' : 'No notifications yet'}</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          n.readAt ? 'bg-white border-gray-100 text-[#526158]' : 'bg-[#EEF8F0] border-[#C5E6CC] font-medium text-[#17201A]'
                        }`}
                      >
                        <p className="font-bold text-[#1B5E20] mb-0.5">{n.title}</p>
                        <p className="line-clamp-2 leading-relaxed">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          {user ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-[#EEF8F0] rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] rounded-full flex items-center justify-center font-bold text-xs">
                  {user.fullName ? user.fullName.charAt(0) : 'U'}
                </div>
                <span className="hidden sm:block text-xs font-bold text-[#17201A] max-w-[120px] truncate">
                  {user.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#526158]" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#C5E6CC] rounded-2xl shadow-xl z-50 p-2 text-xs font-medium animate-fade-in">
                  <div className="px-3 py-2 border-b border-[#C5E6CC] mb-1">
                    <p className="font-bold text-[#17201A] truncate">{user.fullName}</p>
                    <p className="text-[11px] text-[#526158] uppercase font-bold text-[#2E7D32]">{role}</p>
                  </div>
                  <Link
                    to={role === 'FARMER' ? '/farmer/profile' : role === 'BUYER' ? '/buyer/profile' : '/admin'}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[#F4FAF4] rounded-lg text-[#17201A] transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#2E7D32]" /> {t('nav.profile', 'Account Profile')}
                  </Link>
                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-[#B3261E] rounded-lg transition-colors text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" /> {t('nav.logout', 'Sign Out')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-[#2E7D32] text-white text-xs font-bold rounded-xl hover:bg-[#1B5E20] transition-colors shadow-xs"
            >
              {t('nav.login', 'Sign In')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

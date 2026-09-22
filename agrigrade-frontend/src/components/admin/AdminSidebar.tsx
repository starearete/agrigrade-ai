import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Sprout,
  FileText,
  LogOut,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/admin/dashboard', label: t('admin.commandCenter', 'Dashboard'), icon: LayoutDashboard },
    { to: '/admin/users', label: t('admin.userManagement', 'User Management'), icon: Users },
    { to: '/admin/listings', label: t('admin.marketplaceModeration', 'Marketplace Moderation'), icon: ShoppingBag },
    { to: '/admin/taxonomy', label: t('admin.taxonomy', 'Crops, Diseases & Markets'), icon: Sprout },
    { to: '/admin/audit-logs', label: t('admin.auditLogs', 'Audit Logs'), icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#C5E6CC] text-[#17201A] flex flex-col h-full shrink-0 shadow-xs">
      <div className="p-4 border-b border-[#C5E6CC] flex items-center gap-3">
        <div className="w-9 h-9 bg-[#2E7D32] rounded-xl flex items-center justify-center text-white shadow-xs">
          <Sprout className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-[#17201A] tracking-wide">AgriGrade.AI</h1>
          <p className="text-[10px] text-[#2E7D32] font-bold uppercase tracking-wider">{t('admin.commandCenter', 'Admin Command Center')}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1 text-xs font-semibold">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] font-bold shadow-xs'
                  : 'text-[#17201A] hover:bg-[#F4FAF4] hover:text-[#2E7D32]'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0 text-[#2E7D32]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#C5E6CC]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all text-xs font-bold"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{t('nav.logout', 'Sign Out')}</span>
        </button>
      </div>
    </aside>
  );
};

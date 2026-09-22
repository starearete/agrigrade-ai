import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Package,
  PlusCircle,
  Activity,
  TrendingUp,
  MapPin,
  Award,
  MessageSquare,
  User,
  ShoppingBag,
  Clock,
  Shield,
  LogOut,
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();

  if (!isOpen || !role) return null;

  const farmerNav = [
    { to: '/farmer/dashboard', label: 'Command Center', icon: Package },
    { to: '/farmer/batches', label: 'My Batches', icon: Package },
    { to: '/farmer/batches/create', label: 'Create Batch (AI Scan)', icon: PlusCircle },
    { to: '/farmer/price-prediction', label: 'Price Prediction', icon: TrendingUp },
    { to: '/farmer/market-recommendations', label: 'Market Recommendations', icon: MapPin },
    { to: '/farmer/certificates', label: 'AI Certificates', icon: Award },
    { to: '/farmer/messages', label: 'Messages', icon: MessageSquare },
  ];

  const buyerNav = [
    { to: '/buyer/marketplace', label: 'Crop Marketplace', icon: ShoppingBag },
    { to: '/buyer/requests', label: 'Purchase Requests', icon: Clock },
    { to: '/buyer/orders', label: 'Trade Orders', icon: Package },
    { to: '/buyer/messages', label: 'Messages', icon: MessageSquare },
  ];

  const adminNav = [
    { to: '/admin', label: 'Governance Console', icon: Shield },
    { to: '/admin/users', label: 'User Management', icon: User },
    { to: '/admin/kyc', label: 'KYC Queue', icon: Clock },
    { to: '/admin/crops', label: 'Crop Master', icon: Package },
    { to: '/admin/diseases', label: 'Disease Taxonomy', icon: Activity },
    { to: '/admin/ai-models', label: 'AI Models', icon: Shield },
    { to: '/admin/markets', label: 'Markets Hub', icon: MapPin },
  ];

  const items = role === 'ADMIN' ? adminNav : role === 'BUYER' ? buyerNav : farmerNav;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col p-4 z-10 animate-fade-in">
        <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2E7D32] text-white rounded-lg flex items-center justify-center font-bold text-xs">
              AG
            </div>
            <div>
              <p className="font-bold text-sm text-[#1B5E20]">AgriGrade AI</p>
              <p className="text-[10px] text-[#526158] capitalize">{role} Workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#526158] hover:bg-[#F4FAF4] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-[#EEF8F0] border border-[#C5E6CC] p-3 rounded-2xl mb-4 text-xs">
          <p className="font-extrabold text-[#1B5E20] truncate">{user?.fullName || 'User'}</p>
          <p className="text-[11px] text-[#526158] font-mono truncate">{user?.email || user?.mobileNumber || ''}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-[10px] rounded-md uppercase">
            {role}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC]'
                      : 'text-[#17201A] hover:bg-[#F4FAF4] hover:text-[#2E7D32]'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-[#2E7D32]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="pt-3 border-t border-[#C5E6CC] mt-auto">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-[#B3261E] rounded-xl text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

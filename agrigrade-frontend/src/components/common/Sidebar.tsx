import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation, useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Activity,
  TrendingUp,
  MapPin,
  Award,
  MessageSquare,
  ShoppingBag,
  Clock,
  Shield,
  Users,
  CheckSquare,
  BookOpen,
  Store,
  Cpu,
  FileText,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  if (!role) {
    return null;
  }

  const farmerNav = [
    { to: '/farmer/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/farmer/batches', label: t('nav.batches'), icon: Package },
    { to: '/farmer/batches/create', label: t('nav.newBatch'), icon: PlusCircle },
    { to: '/farmer/price-prediction', label: t('nav.pricePrediction'), icon: TrendingUp },
    { to: '/farmer/market-recommendations', label: t('nav.marketRecommendations'), icon: MapPin },
    { to: '/farmer/certificates', label: t('nav.certificates'), icon: Award },
    { to: '/farmer/messages', label: t('nav.messages'), icon: MessageSquare },
  ];

  const buyerNav = [
    { to: '/buyer/marketplace', label: t('nav.marketplace'), icon: ShoppingBag },
    { to: '/buyer/requests', label: t('nav.requests'), icon: Clock },
    { to: '/buyer/orders', label: t('nav.orders'), icon: Package },
    { to: '/buyer/messages', label: t('nav.messages'), icon: MessageSquare },
  ];

  const adminNav = [
    { to: '/admin', label: isTa ? 'நிர்வாகக் கட்டளை மையம்' : 'Governance Overview', icon: Shield },
    { to: '/admin/users', label: isTa ? 'பயனர் நிர்வாகம்' : 'User Management', icon: Users },
    { to: '/admin/kyc', label: isTa ? 'KYC சரிபார்ப்பு வரிசை' : 'KYC Review Queue', icon: CheckSquare },
    { to: '/admin/crops', label: isTa ? 'பயிர்கள் & ரகங்கள்' : 'Crop & Variety Master', icon: BookOpen },
    { to: '/admin/diseases', label: isTa ? 'நோய் வகைப்பாடு' : 'Disease Taxonomy', icon: Activity },
    { to: '/admin/ai-models', label: isTa ? 'AI மாடல் பதிவேடு' : 'AI Model Registry', icon: Cpu },
    { to: '/admin/markets', label: isTa ? 'சந்தை தகவல் மையம்' : 'Market Data Hub', icon: Store },
    { to: '/admin/system-health', label: isTa ? 'கணினி நிலை' : 'System Health', icon: Activity },
    { to: '/admin/audit-logs', label: isTa ? 'தணிக்கைப் பதிவு' : 'Audit Logs', icon: FileText },
  ];

  const items = role === 'ADMIN' ? adminNav : role === 'BUYER' ? buyerNav : farmerNav;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#C5E6CC] h-full overflow-y-auto p-4 shrink-0 shadow-xs">
      <div className="text-[11px] font-bold tracking-wider text-[#526158] uppercase px-3 mb-3">
        {role === 'ADMIN' ? (isTa ? 'நிர்வாக மேலாண்மை' : 'Admin Governance') : role === 'BUYER' ? (isTa ? 'வாங்குபவர் வேலைக்களம்' : 'Buyer Workspace') : (isTa ? 'விவசாயி கட்டளை மையம்' : 'Farmer Command')}
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/farmer/dashboard' || item.to === '/buyer/marketplace'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC]'
                    : 'text-[#17201A] hover:bg-[#F4FAF4] hover:text-[#2E7D32]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-[#2E7D32]" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

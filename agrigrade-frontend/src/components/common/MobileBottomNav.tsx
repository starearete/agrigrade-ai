import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, ShoppingBag, ScanLine, MessageSquare, User, Package, Clock } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { role } = useAuth();

  // Hide bottom nav if no active role or admin mode
  if (!role || role === 'ADMIN') return null;

  if (role === 'BUYER') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#C5E6CC] px-2 py-1.5 shadow-lg flex items-center justify-around">
        <NavLink
          to="/buyer/marketplace"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              isActive ? 'text-[#1B5E20] font-bold' : 'text-[#526158] font-medium'
            }`
          }
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">Marketplace</span>
        </NavLink>

        <NavLink
          to="/buyer/orders"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              isActive ? 'text-[#1B5E20] font-bold' : 'text-[#526158] font-medium'
            }`
          }
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">Orders</span>
        </NavLink>

        {/* Center Action Button: Requests */}
        <NavLink
          to="/buyer/requests"
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-full flex items-center justify-center shadow-lg border-4 border-[#FCFBF5] hover:bg-[#1B5E20] transition-colors">
            <Clock className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-[#1B5E20] mt-0.5">Requests</span>
        </NavLink>

        <NavLink
          to="/buyer/messages"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              isActive ? 'text-[#1B5E20] font-bold' : 'text-[#526158] font-medium'
            }`
          }
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Messages</span>
        </NavLink>

        <NavLink
          to="/buyer/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              isActive ? 'text-[#1B5E20] font-bold' : 'text-[#526158] font-medium'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profile</span>
        </NavLink>
      </nav>
    );
  }

  // Farmer Bottom Nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#C5E6CC] px-2 py-1.5 shadow-lg flex items-center justify-around">
      <NavLink
        to="/farmer/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-[#1B5E20] font-bold' : 'text-[#526158] font-medium'
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Command</span>
      </NavLink>

      <NavLink
        to="/farmer/batches"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-[#1B5E20] font-bold' : 'text-[#526158] font-medium'
          }`
        }
      >
        <Package className="w-5 h-5" />
        <span className="text-[10px]">Batches</span>
      </NavLink>

      {/* Center Action Button: AI Scan */}
      <NavLink
        to="/farmer/batches/create"
        className="flex flex-col items-center -mt-5"
      >
        <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-full flex items-center justify-center shadow-lg border-4 border-[#FCFBF5] hover:bg-[#1B5E20] transition-colors">
          <ScanLine className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-[#1B5E20] mt-0.5">AI Scan</span>
      </NavLink>

      <NavLink
        to="/farmer/messages"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-[#1B5E20] font-bold' : 'text-[#526158] font-medium'
          }`
        }
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px]">Messages</span>
      </NavLink>

      <NavLink
        to="/farmer/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            isActive ? 'text-[#1B5E20] font-bold' : 'text-[#526158] font-medium'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </NavLink>
    </nav>
  );
};

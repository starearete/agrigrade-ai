import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileDrawer } from './MobileDrawer';
import { ToastContainer } from './Toast';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-[#FCFBF5] text-[#17201A] overflow-hidden">
      <ToastContainer />
      <Header onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)} />
      <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-full overflow-y-auto min-h-0">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};

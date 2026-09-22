import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Header } from '../common/Header';
import { ToastContainer } from '../common/Toast';

export const AdminLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FCFBF5] overflow-hidden">
      <ToastContainer />
      <Header onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

import React from 'react';
import { ToastContainer } from './Toast';
import { PublicHeader } from './PublicHeader';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF5] text-[#17201A]">
      <ToastContainer />
      <PublicHeader />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
};

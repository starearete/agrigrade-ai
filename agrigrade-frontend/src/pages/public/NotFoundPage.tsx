import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF5] p-6 text-center">
      <div className="max-w-md w-full bg-white border border-[#C5E6CC] rounded-3xl p-8 shadow-sm">
        <div className="w-16 h-16 bg-[#EEF8F0] text-[#1B5E20] rounded-full flex items-center justify-center mx-auto mb-4 font-black text-2xl">
          404
        </div>
        <h2 className="text-2xl font-extrabold text-[#1B5E20] mb-2">Route Not Found</h2>
        <p className="text-sm text-[#526158] mb-6">
          The requested page or resource could not be found. Please check the URL or return to home.
        </p>
        <Link
          to="/"
          className="w-full py-3 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <Home className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    </div>
  );
};

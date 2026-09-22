import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, ShoppingBag, Shield, ArrowRight } from 'lucide-react';

export const RoleSelectPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF5] p-4 sm:p-6">
      <div className="max-w-3xl w-full bg-white border border-[#C5E6CC] rounded-3xl p-6 sm:p-10 shadow-lg text-center animate-fade-in">
        <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Sprout className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#1B5E20] mb-2">Select Account Role</h2>
        <p className="text-sm text-[#526158] max-w-md mx-auto mb-8">
          AgriGrade AI supports specialized user interfaces tailored for Farmers, B2B Buyers, and System Administrators.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {/* Farmer Card */}
          <div
            onClick={() => navigate('/login')}
            className="bg-[#FCFBF5] border-2 border-[#C5E6CC] rounded-2xl p-6 hover:border-[#2E7D32] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-[#17201A] mb-2">Farmer</h3>
              <p className="text-xs text-[#526158] leading-relaxed">
                Scan harvest, run AI quality grading, predict prices, and receive market recommendations.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#2E7D32] group-hover:translate-x-1 transition-transform">
              Farmer Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Buyer Card */}
          <div
            onClick={() => navigate('/login')}
            className="bg-[#FCFBF5] border-2 border-[#C5E6CC] rounded-2xl p-6 hover:border-[#2E7D32] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-[#17201A] mb-2">B2B Buyer</h3>
              <p className="text-xs text-[#526158] leading-relaxed">
                Browse verified AI-certified crop listings, submit purchase requests, and chat with farmers.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#2E7D32] group-hover:translate-x-1 transition-transform">
              Buyer Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Admin Card */}
          <div
            onClick={() => navigate('/login')}
            className="bg-[#FCFBF5] border-2 border-[#C5E6CC] rounded-2xl p-6 hover:border-[#2E7D32] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-[#17201A] mb-2">Administrator</h3>
              <p className="text-xs text-[#526158] leading-relaxed">
                System governance, crop master management, KYC approvals, AI model supervision, and audit logging.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-[#2E7D32] group-hover:translate-x-1 transition-transform">
              Admin Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

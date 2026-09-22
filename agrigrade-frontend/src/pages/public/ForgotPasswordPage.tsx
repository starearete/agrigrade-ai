import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Mail, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [step, setStep] = useState<'REQUEST' | 'OTP' | 'DONE'>('REQUEST');
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Mock OTP sent to registered mobile/email (123456).', 'info');
    setStep('OTP');
  };

  const handleVerifyReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') {
      showToast('Invalid OTP. Use 123456 for demo reset.', 'error');
      return;
    }
    showToast('Password reset successfully! Please sign in.', 'success');
    setStep('DONE');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF5] p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-[#C5E6CC] rounded-3xl p-6 sm:p-8 shadow-lg animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1B5E20]">Password Recovery</h2>
          <p className="text-xs text-[#526158] mt-1">Reset credentials via verified SMS/Email OTP</p>
        </div>

        {step === 'REQUEST' && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#17201A] mb-1">Registered Mobile or Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#526158] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="farmer@agrigrade.ai or +91 9876543210"
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-2 text-sm shadow-xs"
            >
              Send OTP Code <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyReset} className="space-y-4 text-xs">
            <div className="bg-[#EEF8F0] border border-[#C5E6CC] p-3 rounded-xl text-center text-xs">
              <span className="text-[#526158] block">Demo OTP Code:</span>
              <span className="font-extrabold text-base text-[#1B5E20]">123456</span>
            </div>

            <div>
              <label className="block font-bold text-[#17201A] mb-1">Enter 6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32] text-center font-mono font-bold text-base"
              />
            </div>

            <div>
              <label className="block font-bold text-[#17201A] mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#C5E6CC] rounded-xl focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-2 text-sm shadow-xs"
            >
              Reset & Update Password
            </button>
          </form>
        )}

        {step === 'DONE' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 bg-[#EEF8F0] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-lg text-[#1B5E20]">Password Reset Complete</h3>
            <p className="text-xs text-[#526158]">You can now log in with your updated credentials.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors"
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        <div className="text-center mt-6 text-xs text-[#526158]">
          Remember credentials?{' '}
          <Link to="/login" className="text-[#2E7D32] font-bold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

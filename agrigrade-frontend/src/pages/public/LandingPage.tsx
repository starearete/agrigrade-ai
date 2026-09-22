import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Award,
  ShieldCheck,
  TrendingUp,
  MapPin,
  ScanLine,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  Clock,
  MessageSquare,
  FileCheck,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from '../../context/LanguageContext';

export const LandingPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleExploreMarketplace = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Sign in as a buyer to access the verified marketplace.', 'info');
      navigate('/signin');
    } else if (role === 'BUYER') {
      navigate('/buyer/marketplace');
    } else if (role === 'FARMER') {
      navigate('/farmer/dashboard');
    } else if (role === 'ADMIN') {
      navigate('/admin');
    }
  };

  const handleStartAiScan = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signup');
    } else if (role === 'FARMER') {
      if (user.profileCompleted === false) {
        navigate('/onboarding/profile');
      } else {
        navigate('/farmer/batches/create');
      }
    } else if (role === 'BUYER') {
      showToast('AI crop inspection is available for farmer accounts.', 'info');
    } else if (role === 'ADMIN') {
      navigate('/admin/ai-models');
    }
  };

  React.useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="bg-[#FCFBF5] text-[#17201A] min-h-screen">
      {/* HERO / AI INSPECTION SECTION */}
      <section id="ai-inspection" className="relative overflow-hidden bg-gradient-to-b from-[#EEF8F0] via-[#FCFBF5] to-[#FCFBF5] border-b border-[#C5E6CC] pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#DDF2E1] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-full mb-6 shadow-2xs">
              <Sprout className="w-4 h-4 text-[#2E7D32]" />
              <span>Next-Gen Agricultural Intelligence & B2B Marketplace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1B5E20] leading-tight mb-6 tracking-tight">
              Grade Crops with <span className="text-[#2E7D32]">AI Vision.</span><br />
              Sell at Peak Realization.
            </h1>

            <p className="text-base sm:text-lg text-[#526158] mb-8 leading-relaxed max-w-xl font-medium">
              AgriGrade AI helps Tamil Nadu farmers verify crop quality using AI-powered image analysis, estimate shelf life, discover market opportunities, and connect with verified buyers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              {user ? (
                <button
                  onClick={handleStartAiScan}
                  className="px-6 py-3.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <ScanLine className="w-5 h-5" /> Start AI Crop Scan
                </button>
              ) : (
                <Link
                  to="/signup"
                  className="px-6 py-3.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" /> Create Free Account
                </Link>
              )}

              <button
                onClick={handleExploreMarketplace}
                className="px-6 py-3.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold text-sm rounded-xl hover:bg-[#EEF8F0] transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <ShoppingBag className="w-5 h-5 text-[#2E7D32]" /> Explore Marketplace
              </button>
            </div>

            {/* Quick Action bar */}
            <div className="p-4 bg-white border border-[#C5E6CC] rounded-2xl shadow-2xs flex items-center justify-between gap-4 text-xs font-semibold text-[#526158]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                <span>Verified Produce Batches</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
                <span>Digital Quality Passports</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2E7D32] shrink-0" />
                <span>Smart Shelf-Life Rules</span>
              </div>
            </div>
          </div>

          {/* RIGHT: AI Inspection Demo Card Preview */}
          <div className="relative">
            <div className="bg-white border-2 border-[#C5E6CC] rounded-3xl p-6 shadow-xl relative z-10">
              <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#EEF8F0] text-[#2E7D32] rounded-lg flex items-center justify-center font-bold">
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1B5E20]">AI INSPECTION PREVIEW</h3>
                    <p className="text-[10px] text-[#526158]">Automated Quality Classification & Certification</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  DEMO PREVIEW
                </span>
              </div>

              {/* Demo Inspection Details */}
              <div className="w-full aspect-video rounded-2xl mb-4 bg-gradient-to-br from-[#EEF8F0] via-[#DDF2E1] to-white border border-[#C5E6CC] flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
                <div className="w-14 h-14 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center mb-3 shadow-md">
                  <Award className="w-8 h-8" />
                </div>
                <span className="font-black text-xl text-[#1B5E20]">Tomato (CO-3 Hybrid Country)</span>
                <span className="text-xs text-[#526158] font-medium mt-1">
                  Computer Vision Grading • Color Purity • Defect Detection
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-xl">
                  <span className="text-[10px] font-bold text-[#526158] block uppercase">Quality Grade</span>
                  <span className="font-black text-base text-[#1B5E20]">GRADE A</span>
                </div>
                <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-xl">
                  <span className="text-[10px] font-bold text-[#526158] block uppercase">Quality Score</span>
                  <span className="font-black text-base text-[#2E7D32]">95 / 100</span>
                </div>
                <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-xl">
                  <span className="text-[10px] font-bold text-[#526158] block uppercase">Estimated Shelf Life</span>
                  <span className="font-bold text-sm text-[#17201A]">8 days remaining</span>
                </div>
                <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-xl">
                  <span className="text-[10px] font-bold text-[#526158] block uppercase">Digital Certificate</span>
                  <span className="font-bold text-xs text-[#1B5E20] truncate block">Issued after AI inspection</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-[#1B5E20] font-bold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                  <span>SHA-256 Digital Quality Passport</span>
                </div>
                <span className="text-[10px] bg-[#2E7D32] text-white px-2 py-0.5 rounded-full font-extrabold">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE & VALUE SECTION */}
      <section id="product" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold text-[#2E7D32] uppercase tracking-wider mb-2 block">
            Integrated Agricultural Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B5E20] mb-4">
            Built for Tamil Nadu Farmers, Wholesalers & Agri Enterprises
          </h2>
          <p className="text-sm text-[#526158] leading-relaxed">
            AgriGrade AI provides end-to-end transparency from harvest upload and AI inspection to digital certification and direct marketplace trading.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs hover:border-[#2E7D32] transition-all">
            <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 shadow-2xs">
              <ScanLine className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <h3 className="font-extrabold text-base text-[#17201A] mb-2">AI Crop Inspection</h3>
            <p className="text-xs text-[#526158] leading-relaxed">
              Computer-vision based crop classification and quality assessment using camera evidence to identify defects and variety characteristics.
            </p>
          </div>

          <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs hover:border-[#2E7D32] transition-all">
            <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 shadow-2xs">
              <Award className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <h3 className="font-extrabold text-base text-[#17201A] mb-2">Dynamic Quality Grading</h3>
            <p className="text-xs text-[#526158] leading-relaxed">
              AI-assisted grading with persisted inspection results, numerical quality scores, and grade rules based on crop standards.
            </p>
          </div>

          <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs hover:border-[#2E7D32] transition-all">
            <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 shadow-2xs">
              <Clock className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <h3 className="font-extrabold text-base text-[#17201A] mb-2">Smart Shelf-Life Engine</h3>
            <p className="text-xs text-[#526158] leading-relaxed">
              Shelf-life estimation calculated from crop variety rules, harvest date, storage condition, and AI quality inspection score.
            </p>
          </div>

          <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs hover:border-[#2E7D32] transition-all">
            <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 shadow-2xs">
              <ShoppingBag className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <h3 className="font-extrabold text-base text-[#17201A] mb-2">Verified Marketplace</h3>
            <p className="text-xs text-[#526158] leading-relaxed">
              Connect AI-verified harvest batches directly with registered B2B buyers and commercial wholesale procurers across regions.
            </p>
          </div>

          <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs hover:border-[#2E7D32] transition-all">
            <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 shadow-2xs">
              <FileCheck className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <h3 className="font-extrabold text-base text-[#17201A] mb-2">Digital Certificates</h3>
            <p className="text-xs text-[#526158] leading-relaxed">
              Persisted AI inspection certificates with cryptographic SHA-256 signatures for authenticating batch grade integrity.
            </p>
          </div>

          <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs hover:border-[#2E7D32] transition-all">
            <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold mb-4 shadow-2xs">
              <MessageSquare className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <h3 className="font-extrabold text-base text-[#17201A] mb-2">Real-Time Trade & Messaging</h3>
            <p className="text-xs text-[#526158] leading-relaxed">
              Direct Farmer ↔ Buyer counter-offer negotiations and WebSocket chat for closing produce orders quickly.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#EEF8F0]/60 border-y border-[#C5E6CC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-[#2E7D32] uppercase tracking-wider mb-2 block">
              Step-by-Step Execution
            </span>
            <h2 className="text-3xl font-extrabold text-[#1B5E20] mb-3">How AgriGrade AI Works</h2>
            <p className="text-sm text-[#526158]">
              Simple 4-step process for farmers and buyers from harvest scan to dispatch.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs relative">
              <div className="w-8 h-8 bg-[#2E7D32] text-white rounded-lg flex items-center justify-center font-black text-xs mb-4">
                01
              </div>
              <h4 className="font-extrabold text-sm text-[#1B5E20] mb-1">Create Harvest Batch</h4>
              <p className="text-xs text-[#526158] leading-relaxed">
                Farmer enters crop details, variety, harvest date, quantity (KG/Tons), and storage location.
              </p>
            </div>

            <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs relative">
              <div className="w-8 h-8 bg-[#2E7D32] text-white rounded-lg flex items-center justify-center font-black text-xs mb-4">
                02
              </div>
              <h4 className="font-extrabold text-sm text-[#1B5E20] mb-1">Run AI Vision Scan</h4>
              <p className="text-xs text-[#526158] leading-relaxed">
                Upload crop photo. Computer vision grades quality, detects defects, and computes shelf life.
              </p>
            </div>

            <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs relative">
              <div className="w-8 h-8 bg-[#2E7D32] text-white rounded-lg flex items-center justify-center font-black text-xs mb-4">
                03
              </div>
              <h4 className="font-extrabold text-sm text-[#1B5E20] mb-1">Publish to Marketplace</h4>
              <p className="text-xs text-[#526158] leading-relaxed">
                Publish batch with verified grade badge, asking price, and digital inspection passport.
              </p>
            </div>

            <div className="bg-white border border-[#C5E6CC] rounded-2xl p-6 shadow-2xs relative">
              <div className="w-8 h-8 bg-[#2E7D32] text-white rounded-lg flex items-center justify-center font-black text-xs mb-4">
                04
              </div>
              <h4 className="font-extrabold text-sm text-[#1B5E20] mb-1">Trade & Fulfill</h4>
              <p className="text-xs text-[#526158] leading-relaxed">
                Buyers submit purchase requests or counter-offers. Order is created upon acceptance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="bg-white border-t border-[#C5E6CC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#2E7D32] text-white rounded-lg flex items-center justify-center font-bold">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base text-[#1B5E20]">
              AgriGrade<span className="text-[#2E7D32]">.AI</span>
            </span>
          </div>

          <p className="text-xs text-[#526158] font-medium text-center">
            © {new Date().getFullYear()} AgriGrade AI. Agricultural Quality Intelligence & Mandi Realization Platform.
          </p>

          <div className="flex gap-4 text-xs font-bold text-[#1B5E20]">
            <Link to="/verify-certificate" className="hover:underline">
              Verify Digital Certificate
            </Link>
            <a href="#privacy" className="hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

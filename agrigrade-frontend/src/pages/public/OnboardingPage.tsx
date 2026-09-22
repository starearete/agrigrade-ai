import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, useTranslation } from '../../context/LanguageContext';
import { locationService, District } from '../../services/locationService';
import { profileService } from '../../services/profileService';
import { cropService, Crop } from '../../services/cropService';
import { LanguageSelector } from '../../components/common/LanguageSelector';
import {
  User as UserIcon,
  MapPin,
  Sprout,
  Building,
  Languages,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, updateUserState } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [role, setRole] = useState<'FARMER' | 'BUYER'>(() => {
    if (user?.roles?.includes('BUYER')) return 'BUYER';
    return 'FARMER';
  });

  // Master Data
  const [districts, setDistricts] = useState<District[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingMasterData, setLoadingMasterData] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State: Personal
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.mobileNumber || '');
  const [email, setEmail] = useState<string>(user?.email || '');

  // Form State: Contact Address
  const [contactAddressLine1, setContactAddressLine1] = useState<string>('');
  const [contactAddressLine2, setContactAddressLine2] = useState<string>('');
  const [contactVillage, setContactVillage] = useState<string>('');
  const [contactTaluk, setContactTaluk] = useState<string>('');
  const [contactDistrictId, setContactDistrictId] = useState<number>(27); // Default Theni
  const [contactDistrictName, setContactDistrictName] = useState<string>('Theni');
  const [contactPincode, setContactPincode] = useState<string>('');
  const [contactLandmark, setContactLandmark] = useState<string>('');

  // Form State: Farm (Farmer Specific)
  const [farmSameAsContact, setFarmSameAsContact] = useState<boolean>(true);
  const [farmAddressLine1, setFarmAddressLine1] = useState<string>('');
  const [farmVillage, setFarmVillage] = useState<string>('');
  const [farmTaluk, setFarmTaluk] = useState<string>('');
  const [farmDistrictId, setFarmDistrictId] = useState<number>(27);
  const [farmDistrictName, setFarmDistrictName] = useState<string>('Theni');
  const [farmPincode, setFarmPincode] = useState<string>('');
  const [totalLandAcres, setTotalLandAcres] = useState<string>('');
  const [selectedCropIds, setSelectedCropIds] = useState<number[]>([]);
  const [hasKcc, setHasKcc] = useState<boolean>(true);
  const [kccNumber, setKccNumber] = useState<string>('');

  // Form State: Business (Buyer Specific)
  const [businessName, setBusinessName] = useState<string>('');
  const [buyerType, setBuyerType] = useState<string>('WHOLESALER');
  const [purchaseCapacity, setPurchaseCapacity] = useState<string>('25-50 Metric Tons');
  const [procurementCropIds, setProcurementCropIds] = useState<number[]>([]);
  const [gstNumber, setGstNumber] = useState<string>('');
  const [businessRegNumber, setBusinessRegNumber] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoadingMasterData(true);
      try {
        const [dList, cList] = await Promise.all([
          locationService.getDistricts(1),
          cropService.getAllCrops().catch(() => []),
        ]);
        setDistricts(dList);
        setCrops(cList);
        if (dList.length > 0) {
          const defaultDist = dList[0];
          setContactDistrictId(defaultDist.id);
          setContactDistrictName(defaultDist.name);
          setFarmDistrictId(defaultDist.id);
          setFarmDistrictName(defaultDist.name);
        }
      } finally {
        setLoadingMasterData(false);
      }
    };
    loadData();
  }, []);

  const handleContactDistrictChange = (distId: number) => {
    setContactDistrictId(distId);
    const d = districts.find((dist) => dist.id === distId);
    if (d) setContactDistrictName(d.name);
  };

  const handleFarmDistrictChange = (distId: number) => {
    setFarmDistrictId(distId);
    const d = districts.find((dist) => dist.id === distId);
    if (d) setFarmDistrictName(d.name);
  };

  const togglePrimaryCrop = (cropId: number) => {
    if (selectedCropIds.includes(cropId)) {
      setSelectedCropIds(selectedCropIds.filter((id) => id !== cropId));
    } else {
      setSelectedCropIds([...selectedCropIds, cropId]);
    }
  };

  const toggleProcurementCrop = (cropId: number) => {
    if (procurementCropIds.includes(cropId)) {
      setProcurementCropIds(procurementCropIds.filter((id) => id !== cropId));
    } else {
      setProcurementCropIds([...procurementCropIds, cropId]);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name');
        return false;
      }
      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
      if (cleanMobile.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!contactAddressLine1.trim()) {
        setErrorMsg('Please enter Address Line 1');
        return false;
      }
      if (!contactVillage.trim()) {
        setErrorMsg('Please enter Village / Town / City');
        return false;
      }
      const cleanPin = contactPincode.trim();
      if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
        setErrorMsg('Please enter a valid 6-digit Indian PIN code (e.g. 625516)');
        return false;
      }
    }

    if (currentStep === 3) {
      if (role === 'FARMER') {
        const acres = parseFloat(totalLandAcres);
        if (isNaN(acres) || acres <= 0) {
          setErrorMsg('Please enter valid cultivated land acreage greater than 0');
          return false;
        }
        if (selectedCropIds.length === 0) {
          setErrorMsg('Please select at least one primary crop you cultivate');
          return false;
        }
        if (!farmSameAsContact) {
          if (!farmAddressLine1.trim()) {
            setErrorMsg('Please enter Farm Address Line 1');
            return false;
          }
          if (!farmVillage.trim()) {
            setErrorMsg('Please enter Farm Village / Town');
            return false;
          }
          if (!/^[1-9][0-9]{5}$/.test(farmPincode.trim())) {
            setErrorMsg('Please enter a valid 6-digit Farm PIN code');
            return false;
          }
        }
      } else {
        if (!businessName.trim()) {
          setErrorMsg('Please enter your Registered Business / Entity Name');
          return false;
        }
        if (procurementCropIds.length === 0) {
          setErrorMsg('Please select at least one target procurement commodity');
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (role === 'FARMER') {
        const normalizedAcres = parseFloat(totalLandAcres);
        const contactAddr = {
          addressType: 'CONTACT',
          addressLine1: contactAddressLine1.trim(),
          addressLine2: contactAddressLine2.trim() || undefined,
          villageTownCity: contactVillage.trim(),
          taluk: contactTaluk.trim() || undefined,
          district: contactDistrictName,
          state: 'Tamil Nadu',
          stateId: 1,
          districtId: contactDistrictId,
          pincode: contactPincode.trim(),
          landmark: contactLandmark.trim() || undefined,
        };

        const farmAddr = farmSameAsContact
          ? contactAddr
          : {
              addressType: 'FARM',
              addressLine1: farmAddressLine1.trim(),
              villageTownCity: farmVillage.trim(),
              taluk: farmTaluk.trim() || undefined,
              district: farmDistrictName,
              state: 'Tamil Nadu',
              stateId: 1,
              districtId: farmDistrictId,
              pincode: farmPincode.trim(),
            };

        await profileService.saveFarmerProfile({
          fullName: fullName.trim(),
          mobileNumber: mobileNumber.replace(/[^0-9]/g, ''),
          email: email.trim() || undefined,
          preferredLanguage: language,
          preferredTheme: 'LIGHT',
          contactAddress: contactAddr,
          farmAddress: farmAddr,
          farmSameAsContact,
          totalLandAcres: normalizedAcres,
          primaryCropIds: selectedCropIds,
          kisanCreditCardNo: hasKcc && kccNumber.trim() ? kccNumber.trim() : undefined,
        });

        if (updateUserState) {
          updateUserState({
            fullName: fullName.trim(),
            mobileNumber: mobileNumber.replace(/[^0-9]/g, ''),
            profileCompleted: true,
            preferredLanguage: language,
            preferredTheme: 'LIGHT',
          });
        }

        setStep(5); // Success step
      } else {
        const bizAddr = {
          addressType: 'BUSINESS',
          addressLine1: contactAddressLine1.trim(),
          addressLine2: contactAddressLine2.trim() || undefined,
          villageTownCity: contactVillage.trim(),
          taluk: contactTaluk.trim() || undefined,
          district: contactDistrictName,
          state: 'Tamil Nadu',
          stateId: 1,
          districtId: contactDistrictId,
          pincode: contactPincode.trim(),
          landmark: contactLandmark.trim() || undefined,
        };

        await profileService.saveBuyerProfile({
          fullName: fullName.trim(),
          mobileNumber: mobileNumber.replace(/[^0-9]/g, ''),
          email: email.trim() || undefined,
          preferredLanguage: language,
          preferredTheme: 'LIGHT',
          businessName: businessName.trim(),
          buyerType,
          purchaseCapacity,
          businessAddress: bizAddr,
          procurementCropIds,
          gstNumber: gstNumber.trim() || undefined,
          businessRegistrationNumber: businessRegNumber.trim() || undefined,
        });

        if (updateUserState) {
          updateUserState({
            fullName: fullName.trim(),
            mobileNumber: mobileNumber.replace(/[^0-9]/g, ''),
            profileCompleted: true,
            preferredLanguage: language,
            preferredTheme: 'LIGHT',
          });
        }

        setStep(5); // Success step
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to persist profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndNavigate = () => {
    if (role === 'BUYER') {
      navigate('/buyer/marketplace', { replace: true });
    } else {
      navigate('/farmer/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF5] text-[#17201A] py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* Step Indicator Card */}
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-2">
              <span>{t('onboarding.title')}</span>
              <span>Step {step} of 4</span>
            </div>
            <div className="w-full bg-[#F4FAF4] h-2 rounded-full overflow-hidden border border-[#C5E6CC]/40">
              <div
                className="bg-[#2E7D32] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#17201A] flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#2E7D32]" />
                  {t('onboarding.personalDetails')}
                </h2>
                <p className="text-xs text-[#526158] mt-1">
                  Confirm your identity and role in the agricultural supply network.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#F4FAF4] rounded-2xl border border-[#C5E6CC]">
                <button
                  type="button"
                  onClick={() => setRole('FARMER')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    role === 'FARMER'
                      ? 'bg-white text-[#1B5E20] shadow-xs border border-[#C5E6CC]'
                      : 'text-[#526158] hover:text-[#17201A]'
                  }`}
                >
                  <Sprout className="w-4 h-4" /> {t('auth.farmer')}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('BUYER')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    role === 'BUYER'
                      ? 'bg-white text-[#1B5E20] shadow-xs border border-[#C5E6CC]'
                      : 'text-[#526158] hover:text-[#17201A]'
                  }`}
                >
                  <Building className="w-4 h-4" /> {t('auth.buyer')}
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('auth.fullName')} *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium text-[#17201A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('auth.mobileNumber')} (+91) *
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-mono font-medium text-[#17201A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@agrigrade.ai"
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium text-[#17201A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Address & Location (Tamil Nadu Scoped) */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#17201A] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2E7D32]" />
                  {role === 'FARMER' ? t('onboarding.contactAddress') : t('onboarding.businessAddress')}
                </h2>
                <p className="text-xs text-[#526158] mt-1">
                  AgriGrade AI operates exclusively in Tamil Nadu districts.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('onboarding.country')}
                  </label>
                  <input
                    type="text"
                    value="India"
                    disabled
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-[#F4FAF4] text-[#526158] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('onboarding.state')}
                  </label>
                  <select
                    disabled
                    value="1"
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-[#F4FAF4] text-[#17201A] font-bold"
                  >
                    <option value="1">Tamil Nadu (தமிழ்நாடு)</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('onboarding.district')} *
                  </label>
                  <select
                    value={contactDistrictId}
                    onChange={(e) => handleContactDistrictChange(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium text-[#17201A]"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('onboarding.taluk')}
                  </label>
                  <input
                    type="text"
                    value={contactTaluk}
                    onChange={(e) => setContactTaluk(e.target.value)}
                    placeholder={t('onboarding.talukPlaceholder')}
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium text-[#17201A]"
                  />
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('onboarding.villageTownCity')} *
                  </label>
                  <input
                    type="text"
                    value={contactVillage}
                    onChange={(e) => setContactVillage(e.target.value)}
                    placeholder={t('onboarding.villagePlaceholder')}
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium text-[#17201A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17201A] mb-1">
                    {t('onboarding.addressLine1')} *
                  </label>
                  <input
                    type="text"
                    value={contactAddressLine1}
                    onChange={(e) => setContactAddressLine1(e.target.value)}
                    placeholder={t('onboarding.addressLine1Placeholder')}
                    className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium text-[#17201A]"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#17201A] mb-1">
                      {t('onboarding.pincode')} *
                    </label>
                    <input
                      type="text"
                      value={contactPincode}
                      onChange={(e) => setContactPincode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="625516"
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-mono font-bold text-[#17201A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#17201A] mb-1">
                      {t('onboarding.landmark')}
                    </label>
                    <input
                      type="text"
                      value={contactLandmark}
                      onChange={(e) => setContactLandmark(e.target.value)}
                      placeholder="Near Bus Stand / Cooperative Bank"
                      className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium text-[#17201A]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Role-Specific Details */}
          {step === 3 && (
            <div className="space-y-6">
              {role === 'FARMER' ? (
                <>
                  <div>
                    <h2 className="text-xl font-extrabold text-[#17201A] flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-[#2E7D32]" />
                      {t('onboarding.farmAddress')}
                    </h2>
                    <p className="text-xs text-[#526158] mt-1">
                      Land size and primary agricultural commodities.
                    </p>
                  </div>

                  <div className="p-4 bg-[#EEF8F0] border border-[#C5E6CC] rounded-2xl">
                    <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-[#1B5E20]">
                      <input
                        type="checkbox"
                        checked={farmSameAsContact}
                        onChange={(e) => setFarmSameAsContact(e.target.checked)}
                        className="w-4 h-4 text-[#2E7D32] rounded-md focus:ring-[#2E7D32]"
                      />
                      {t('onboarding.farmSameAsContact')}
                    </label>
                  </div>

                  {!farmSameAsContact && (
                    <div className="space-y-4 p-4 border border-[#C5E6CC] rounded-2xl text-xs bg-[#F4FAF4]">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-[#17201A] mb-1">
                            Farm District *
                          </label>
                          <select
                            value={farmDistrictId}
                            onChange={(e) => handleFarmDistrictChange(Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl border border-[#C5E6CC] bg-white font-medium text-[#17201A]"
                          >
                            {districts.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-[#17201A] mb-1">
                            Farm Taluk
                          </label>
                          <input
                            type="text"
                            value={farmTaluk}
                            onChange={(e) => setFarmTaluk(e.target.value)}
                            placeholder="e.g. Periyakulam"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#C5E6CC] bg-white font-medium text-[#17201A]"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-[#17201A] mb-1">
                            Farm Village / Town *
                          </label>
                          <input
                            type="text"
                            value={farmVillage}
                            onChange={(e) => setFarmVillage(e.target.value)}
                            placeholder="e.g. Thamaraikulam"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#C5E6CC] bg-white font-medium text-[#17201A]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-[#17201A] mb-1">
                            Farm PIN Code *
                          </label>
                          <input
                            type="text"
                            value={farmPincode}
                            onChange={(e) => setFarmPincode(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength={6}
                            placeholder="625601"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#C5E6CC] bg-white font-mono font-bold text-[#17201A]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#17201A] mb-1">
                          Farm Address Line 1 *
                        </label>
                        <input
                          type="text"
                          value={farmAddressLine1}
                          onChange={(e) => setFarmAddressLine1(e.target.value)}
                          placeholder="Survey No. 402/1, River Canal Road"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#C5E6CC] bg-white font-medium text-[#17201A]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-[#17201A] mb-1">
                        {t('onboarding.landAcreage')} *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={totalLandAcres}
                        onChange={(e) => setTotalLandAcres(e.target.value)}
                        placeholder={t('onboarding.acreagePlaceholder')}
                        className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-bold text-[#17201A]"
                      />
                      <p className="text-[11px] text-[#526158] mt-1">
                        {t('onboarding.acreageHelper')}
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-[#17201A] mb-1">
                        {t('onboarding.primaryCrops')} *
                      </label>
                      <p className="text-[11px] text-[#526158] mb-2">
                        {t('onboarding.selectPrimaryCropsHelper')}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-[#C5E6CC] rounded-2xl">
                        {crops.map((crop) => (
                          <button
                            key={crop.id}
                            type="button"
                            onClick={() => togglePrimaryCrop(crop.id)}
                            className={`p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                              selectedCropIds.includes(crop.id)
                                ? 'bg-[#EEF8F0] border-[#2E7D32] text-[#1B5E20] shadow-2xs'
                                : 'bg-white border-[#C5E6CC] text-[#17201A] hover:bg-[#F4FAF4]'
                            }`}
                          >
                            <span>{crop.name}</span>
                            {selectedCropIds.includes(crop.id) && (
                              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#C5E6CC]">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-bold text-[#17201A]">
                          {t('onboarding.kccLabel')}
                        </label>
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-[#526158] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!hasKcc}
                            onChange={(e) => {
                              setHasKcc(!e.target.checked);
                              if (e.target.checked) setKccNumber('');
                            }}
                            className="rounded text-[#2E7D32]"
                          />
                          {t('onboarding.noKccCheckbox')}
                        </label>
                      </div>

                      {hasKcc && (
                        <input
                          type="text"
                          value={kccNumber}
                          onChange={(e) => setKccNumber(e.target.value)}
                          placeholder="e.g. KCC-TN-9923"
                          className="w-full px-4 py-2.5 rounded-2xl border border-[#C5E6CC] bg-white font-mono font-medium text-[#17201A]"
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-xl font-extrabold text-[#17201A] flex items-center gap-2">
                      <Building className="w-5 h-5 text-[#2E7D32]" />
                      {t('onboarding.businessDetails')}
                    </h2>
                    <p className="text-xs text-[#526158] mt-1">
                      Business profile and procurement requirements.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-[#17201A] mb-1">
                        {t('onboarding.businessName')} *
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={t('onboarding.businessNamePlaceholder')}
                        className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium text-[#17201A]"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-[#17201A] mb-1">
                          {t('onboarding.buyerType')} *
                        </label>
                        <select
                          value={buyerType}
                          onChange={(e) => setBuyerType(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white font-medium text-[#17201A]"
                        >
                          <option value="INDIVIDUAL">Individual Consumer / Direct Buyer</option>
                          <option value="TRADER">Local Agricultural Trader</option>
                          <option value="WHOLESALER">Wholesale Distributor</option>
                          <option value="RETAILER">Supermarket / Retail Chain</option>
                          <option value="DISTRIBUTOR">Regional Supply Distributor</option>
                          <option value="PROCESSOR">Food Processor / Industrial</option>
                          <option value="RESTAURANT">Restaurant / Hotel Chain (HoReCa)</option>
                          <option value="EXPORTER">Agri Commodity Exporter</option>
                          <option value="OTHER">Other Institutional Buyer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#17201A] mb-1">
                          {t('onboarding.purchaseCapacity')} *
                        </label>
                        <input
                          type="text"
                          value={purchaseCapacity}
                          onChange={(e) => setPurchaseCapacity(e.target.value)}
                          placeholder="e.g. 20-50 Metric Tons"
                          className="w-full px-4 py-3 rounded-2xl border border-[#C5E6CC] bg-white font-medium text-[#17201A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#17201A] mb-1">
                        {t('onboarding.procurementCrops')} *
                      </label>
                      <p className="text-[11px] text-[#526158] mb-2">
                        {t('onboarding.selectProcurementCropsHelper')}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-[#C5E6CC] rounded-2xl">
                        {crops.map((crop) => (
                          <button
                            key={crop.id}
                            type="button"
                            onClick={() => toggleProcurementCrop(crop.id)}
                            className={`p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                              procurementCropIds.includes(crop.id)
                                ? 'bg-[#EEF8F0] border-[#2E7D32] text-[#1B5E20] shadow-2xs'
                                : 'bg-white border-[#C5E6CC] text-[#17201A] hover:bg-[#F4FAF4]'
                            }`}
                          >
                            <span>{crop.name}</span>
                            {procurementCropIds.includes(crop.id) && (
                              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-[#C5E6CC]">
                      <div>
                        <label className="block font-bold text-[#17201A] mb-1">
                          {t('onboarding.gstinLabel')}
                        </label>
                        <input
                          type="text"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                          placeholder={t('onboarding.gstinPlaceholder')}
                          maxLength={15}
                          className="w-full px-4 py-2.5 rounded-2xl border border-[#C5E6CC] bg-white font-mono font-medium uppercase text-[#17201A]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#17201A] mb-1">
                          {t('onboarding.regNoLabel')}
                        </label>
                        <input
                          type="text"
                          value={businessRegNumber}
                          onChange={(e) => setBusinessRegNumber(e.target.value)}
                          placeholder={t('onboarding.regNoPlaceholder')}
                          className="w-full px-4 py-2.5 rounded-2xl border border-[#C5E6CC] bg-white font-mono font-medium text-[#17201A]"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4: Language & Final Confirmation */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#17201A] flex items-center gap-2">
                  <Languages className="w-5 h-5 text-[#2E7D32]" />
                  {t('onboarding.languageTitle')}
                </h2>
                <p className="text-xs text-[#526158] mt-1">
                  {t('onboarding.languageSubtitle')}
                </p>
              </div>

              <div className="p-6 bg-[#EEF8F0] border border-[#C5E6CC] rounded-3xl space-y-4">
                <label className="block text-xs font-extrabold text-[#1B5E20] uppercase tracking-wider">
                  Select Language / மொழியைத் தேர்ந்தெடுக்கவும்
                </label>
                <LanguageSelector variant="pill" className="w-full flex justify-around" />
              </div>

              <div className="p-4 bg-[#F4FAF4] border border-[#C5E6CC] rounded-2xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#526158]">Selected Role:</span>
                  <span className="font-bold text-[#1B5E20]">
                    {role === 'FARMER' ? 'Farmer / Producer' : 'Buyer / Wholesaler'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526158]">Name:</span>
                  <span className="font-bold text-[#17201A]">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526158]">Contact District:</span>
                  <span className="font-bold text-[#17201A]">{contactDistrictName}, Tamil Nadu</span>
                </div>
                {role === 'FARMER' ? (
                  <div className="flex justify-between">
                    <span className="text-[#526158]">Total Cultivated Acres:</span>
                    <span className="font-bold text-[#2E7D32]">{totalLandAcres} Acres</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-[#526158]">Business Name:</span>
                    <span className="font-bold text-[#2E7D32]">{businessName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Success Completed State */}
          {step === 5 && (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-[#EEF8F0] border-2 border-[#C5E6CC] text-[#2E7D32] rounded-3xl flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-10 h-10" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl font-extrabold text-[#1B5E20]">
                  {t('onboarding.successTitle')}
                </h2>
                <p className="text-xs text-[#526158]">
                  {t('onboarding.successSubtitle')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinishAndNavigate}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-extrabold rounded-2xl text-xs shadow-xs transition-all"
              >
                {t('onboarding.proceedToDashboard')}
              </button>
            </div>
          )}

          {/* Navigation Controls (Steps 1-4) */}
          {step <= 4 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#C5E6CC] mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-xl border border-[#C5E6CC] text-[#17201A] text-xs font-bold hover:bg-[#F4FAF4] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {t('common.next')} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? t('onboarding.saving') : t('onboarding.completeButton')}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

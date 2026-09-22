import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { profileService } from '../../services/profileService';
import { locationService, District } from '../../services/locationService';
import { cropService, Crop } from '../../services/cropService';
import { FarmerProfile } from '../../types/auth';
import { useNotification } from '../../context/NotificationContext';
import {
  ShieldCheck,
  Edit,
  Save,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const FarmerProfilePage: React.FC = () => {
  const { user, updateUserState, logout } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Edit form state
  const [districts, setDistricts] = useState<District[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editMobile, setEditMobile] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editKcc, setEditKcc] = useState<string>('');
  const [editAcres, setEditAcres] = useState<string>('');
  const [editAddressLine1, setEditAddressLine1] = useState<string>('');
  const [editVillage, setEditVillage] = useState<string>('');
  const [editTaluk, setEditTaluk] = useState<string>('');
  const [editDistrictId, setEditDistrictId] = useState<number>(0);
  const [editDistrictName, setEditDistrictName] = useState<string>('');
  const [editPincode, setEditPincode] = useState<string>('');
  const [selectedCropIds, setSelectedCropIds] = useState<number[]>([]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const [fp, dList, cList] = await Promise.all([
        profileService.getFarmerProfile().catch(() => null),
        locationService.getDistricts(1),
        cropService.getAllCrops().catch(() => []),
      ]);
      setDistricts(dList);
      setCrops(cList);
      if (fp) {
        setProfile(fp);
        setEditFullName(fp.fullName || user?.fullName || '');
        setEditMobile(fp.mobileNumber || user?.mobileNumber || '');
        setEditEmail(fp.email || user?.email || '');
        setEditKcc(fp.kisanCreditCardNo || '');
        setEditAcres(fp.totalLandAcres ? String(fp.totalLandAcres) : '');
        const addr = fp.contactAddress || fp.farmAddress;
        if (addr) {
          setEditAddressLine1(addr.addressLine1 || '');
          setEditVillage(addr.villageTownCity || '');
          setEditTaluk(addr.taluk || '');
          setEditPincode(addr.pincode || '');
          if (addr.districtId) setEditDistrictId(addr.districtId);
          if (addr.district) setEditDistrictName(addr.district);
        }
        if (fp.primaryCrops) {
          setSelectedCropIds(fp.primaryCrops.map((c: any) => c.id));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const acres = parseFloat(editAcres);
      if (isNaN(acres) || acres <= 0) {
        showToast('Land acreage must be greater than 0', 'error');
        setIsSaving(false);
        return;
      }

      const updated = await profileService.saveFarmerProfile({
        fullName: editFullName.trim(),
        mobileNumber: editMobile.replace(/[^0-9]/g, ''),
        email: editEmail.trim() || undefined,
        totalLandAcres: acres,
        kisanCreditCardNo: editKcc.trim() || undefined,
        primaryCropIds: selectedCropIds,
        contactAddress: {
          addressType: 'CONTACT',
          addressLine1: editAddressLine1.trim(),
          villageTownCity: editVillage.trim(),
          taluk: editTaluk.trim() || undefined,
          district: editDistrictName,
          state: 'Tamil Nadu',
          stateId: 1,
          districtId: editDistrictId,
          pincode: editPincode.trim(),
        },
        farmSameAsContact: true,
      });

      setProfile(updated);
      setIsEditing(false);
      showToast(t('profile.updateSuccess'), 'success');
      if (updateUserState) {
        updateUserState({
          fullName: editFullName.trim(),
          mobileNumber: editMobile.replace(/[^0-9]/g, ''),
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const contactAddr = profile?.contactAddress || profile?.farmAddress;
  const primaryCropsList = profile?.primaryCrops || [];

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await profileService.deleteAccount();
      showToast('Your account and all associated data have been permanently deleted.', 'success');
      logout();
      navigate('/login');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete account.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#C5E6CC] p-6 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-[#17201A]">
            {t('profile.farmerProfile')}
          </h1>
          <p className="text-xs text-[#526158] mt-1">
            {t('profile.subtitle')}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Edit className="w-4 h-4" />
            {t('common.edit')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#526158]">{t('common.loading')}</div>
      ) : isEditing ? (
        /* Edit Mode Form */
        <form onSubmit={handleSave} className="bg-white border border-[#C5E6CC] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1B5E20] border-b border-[#C5E6CC] pb-2">
              {t('profile.personalInformation')}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.fullName')}</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.mobile')}</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.email')}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.totalLandAcres')}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={editAcres}
                  onChange={(e) => setEditAcres(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#C5E6CC]">
            <h3 className="text-sm font-bold text-[#1B5E20] border-b border-[#C5E6CC] pb-2">
              {t('profile.contactAddress')}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.addressLine1')}</label>
                <input
                  type="text"
                  required
                  value={editAddressLine1}
                  onChange={(e) => setEditAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.village')}</label>
                <input
                  type="text"
                  required
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.taluk')}</label>
                <input
                  type="text"
                  required
                  value={editTaluk}
                  onChange={(e) => setEditTaluk(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.district')}</label>
                <select
                  value={editDistrictId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setEditDistrictId(id);
                    const d = districts.find((x) => x.id === id);
                    if (d) setEditDistrictName(d.name);
                  }}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17201A] mb-1">{t('profile.pincode')}</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={editPincode}
                  onChange={(e) => setEditPincode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 border border-[#C5E6CC] rounded-xl text-xs text-[#17201A] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#C5E6CC]">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-[#EEF8F0] pb-6">
            <div className="w-16 h-16 bg-[#EEF8F0] text-[#1B5E20] border-2 border-[#C5E6CC] rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-xs">
              {profile?.fullName ? profile.fullName.charAt(0) : user?.fullName.charAt(0)}
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] text-[10px] font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3 h-3 text-[#2E7D32]" /> {t('profile.verifiedFarmerBadge')}
              </span>
              <h2 className="text-xl font-extrabold text-[#17201A]">
                {profile?.fullName || user?.fullName}
              </h2>
              <p className="text-xs text-[#526158] font-mono">
                {t('profile.farmerCode')}: {profile?.farmerCode || t('common.notAssigned')}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#F4FAF4] border border-[#C5E6CC] rounded-2xl">
              <span className="text-[#526158] block mb-1">{t('profile.totalLandAcres')}</span>
              <span className="font-mono font-bold text-[#17201A]">
                {profile?.totalLandAcres ? `${profile.totalLandAcres} Acres` : t('common.notProvided')}
              </span>
            </div>

            <div className="p-4 bg-[#F4FAF4] border border-[#C5E6CC] rounded-2xl">
              <span className="text-[#526158] block mb-1">{t('profile.kisanCreditCardNo')}</span>
              <span className="font-mono font-bold text-[#17201A]">
                {profile?.kisanCreditCardNo ? profile.kisanCreditCardNo : t('common.notProvided')}
              </span>
            </div>

            <div className="p-4 bg-[#F4FAF4] border border-[#C5E6CC] rounded-2xl">
              <span className="text-[#526158] block mb-1">{t('profile.mobile')}</span>
              <span className="font-mono font-bold text-[#17201A]">
                {profile?.mobileNumber || user?.mobileNumber ? `+91 ${profile?.mobileNumber || user?.mobileNumber}` : t('common.notProvided')}
              </span>
            </div>

            <div className="p-4 bg-[#F4FAF4] border border-[#C5E6CC] rounded-2xl">
              <span className="text-[#526158] block mb-1">{t('profile.email')}</span>
              <span className="font-bold text-[#17201A]">
                {profile?.email || user?.email || t('common.notProvided')}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#F4FAF4] border border-[#C5E6CC] rounded-2xl text-xs space-y-1">
            <span className="text-[#526158] block font-bold mb-1">{t('profile.contactAddress')}</span>
            {contactAddr ? (
              <p className="font-medium text-[#17201A] leading-relaxed">
                {contactAddr.addressLine1}
                {contactAddr.villageTownCity && `, ${contactAddr.villageTownCity}`}
                {contactAddr.taluk && `, ${contactAddr.taluk} Taluk`}
                {contactAddr.district && `, ${contactAddr.district} District`}
                {contactAddr.state && `, ${contactAddr.state}`}
                {contactAddr.pincode && ` - ${contactAddr.pincode}`}
              </p>
            ) : (
              <p className="text-gray-400 italic">{t('common.notProvided')}</p>
            )}
          </div>

          <div className="p-4 bg-[#F4FAF4] border border-[#C5E6CC] rounded-2xl text-xs">
            <span className="text-[#526158] block font-bold mb-2">{t('profile.primaryCrops')}</span>
            {primaryCropsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {primaryCropsList.map((crop: any) => (
                  <span
                    key={crop.id}
                    className="px-3 py-1 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-lg"
                  >
                    {crop.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">{t('common.notProvided')}</p>
            )}
          </div>

          {/* Delete Account Section */}
          <div className="pt-6 border-t border-red-100">
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Account Security & Danger Zone
                </h4>
                <p className="text-xs text-red-600/80 mt-0.5">
                  Permanently delete your account, batches, orders, and all personal data stored in AgriGrade AI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-end sm:self-auto shrink-0 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-red-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-[#17201A]">Delete Account & Erase All Data?</h3>
              <p className="text-xs text-[#526158] leading-relaxed">
                Are you sure you want to permanently delete your account? All your harvest batches, trade inquiries, orders, and profile details will be <span className="font-bold text-red-600">permanently deleted from the database</span>. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Delete Everything
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { adminService, UserAdmin } from '../../services/adminService';
import { LoadingState } from '../../components/common/LoadingState';
import { useNotification } from '../../context/NotificationContext';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Eye,
  SlidersHorizontal,
  MapPin,
  Sprout,
  UserCheck,
  Building2,
  Calendar,
  Phone,
  Mail,
  X,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useNotification();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'FARMER' | 'BUYER'>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('AZ');
  const [minAcreage, setMinAcreage] = useState<string>('');
  const [minBuyingCapacity, setMinBuyingCapacity] = useState<string>('');

  // Selected User Modal / Drawer
  const [selectedUser, setSelectedUser] = useState<UserAdmin | null>(null);

  // Action Dialog (Suspend / Reactivate / Verify)
  const [actionUser, setActionUser] = useState<UserAdmin | null>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'REACTIVATE' | 'VERIFY'>('SUSPEND');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllUsers({
        role: activeTab,
        district: districtFilter,
        status: statusFilter,
        verification: verificationFilter,
        search: searchQuery,
        sort: sortOrder,
        minAcreage: minAcreage ? Number(minAcreage) : undefined,
        minBuyingCapacity: minBuyingCapacity ? Number(minBuyingCapacity) : undefined,
      });
      setUsers(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load users list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab, districtFilter, statusFilter, verificationFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenActionDialog = (user: UserAdmin, type: 'SUSPEND' | 'REACTIVATE' | 'VERIFY') => {
    setActionUser(user);
    setActionType(type);
    setReasonInput(
      type === 'SUSPEND'
        ? 'Account suspended due to verification discrepancy.'
        : type === 'VERIFY'
        ? 'Profile documents verified successfully.'
        : 'Account reactivated by administrator.'
    );
  };

  const handleConfirmAction = async () => {
    if (!actionUser) return;
    setIsSubmitting(true);
    try {
      const newStatus = actionType === 'SUSPEND' ? 'SUSPENDED' : actionType === 'REACTIVATE' ? 'ACTIVE' : undefined;
      const newVer = actionType === 'VERIFY' ? 'VERIFIED' : undefined;

      await adminService.updateUserStatus(actionUser.id, newStatus, newVer, reasonInput);
      showToast(
        `User ${actionUser.fullName} set to ${newStatus || newVer}`,
        'success'
      );
      setActionUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">User Management</h1>
          <p className="text-xs text-[#526158] mt-0.5">
            Inspect, filter, verify, and moderate registered farmers and buyers across Tamil Nadu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#526158] bg-white border border-[#C5E6CC] px-3 py-1.5 rounded-xl shadow-xs">
            Total Results: <span className="text-[#1B5E20] font-extrabold">{users.length}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#C5E6CC] text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`pb-3 transition-all relative ${
            activeTab === 'ALL' ? 'text-[#2E7D32] font-extrabold border-b-2 border-[#2E7D32]' : 'text-[#526158] hover:text-[#17201A]'
          }`}
        >
          All Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('FARMER')}
          className={`pb-3 transition-all relative ${
            activeTab === 'FARMER' ? 'text-[#2E7D32] font-extrabold border-b-2 border-[#2E7D32]' : 'text-[#526158] hover:text-[#17201A]'
          }`}
        >
          Farmers
        </button>
        <button
          onClick={() => setActiveTab('BUYER')}
          className={`pb-3 transition-all relative ${
            activeTab === 'BUYER' ? 'text-[#2E7D32] font-extrabold border-b-2 border-[#2E7D32]' : 'text-[#526158] hover:text-[#17201A]'
          }`}
        >
          Buyers
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#C5E6CC] rounded-2xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#526158] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Name, Email, Mobile, Farmer/Buyer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl text-xs focus:ring-1 focus:ring-[#2E7D32] outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs font-semibold">
          <div>
            <label className="text-[10px] text-[#526158] uppercase font-bold block mb-1">District</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl outline-none"
            >
              <option value="ALL">All Districts (38 TN)</option>
              <option value="Theni">Theni</option>
              <option value="Dindigul">Dindigul</option>
              <option value="Erode">Erode</option>
              <option value="Salem">Salem</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Tiruppur">Tiruppur</option>
              <option value="Madurai">Madurai</option>
              <option value="Krishnagiri">Krishnagiri</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#526158] uppercase font-bold block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#526158] uppercase font-bold block mb-1">Verification</label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl outline-none"
            >
              <option value="ALL">All Verifications</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="UNVERIFIED">UNVERIFIED</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#526158] uppercase font-bold block mb-1">Sort Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl outline-none"
            >
              <option value="AZ">Name (A → Z)</option>
              <option value="ZA">Name (Z → A)</option>
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>

          {activeTab === 'FARMER' && (
            <div>
              <label className="text-[10px] text-[#526158] uppercase font-bold block mb-1">Min Acreage</label>
              <input
                type="number"
                placeholder="e.g. 2 acres"
                value={minAcreage}
                onChange={(e) => setMinAcreage(e.target.value)}
                onBlur={() => fetchUsers()}
                className="w-full p-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingState message="Fetching user records..." />
      ) : users.length === 0 ? (
        <div className="bg-white border border-[#C5E6CC] rounded-2xl p-8 text-center text-xs text-[#526158] font-bold">
          No records found matching current search and filter parameters.
        </div>
      ) : (
        <div className="bg-white border border-[#C5E6CC] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#EEF8F0] border-b border-[#C5E6CC] text-[#1B5E20] font-extrabold">
                  <th className="p-3.5">User / Code</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Contact / Email</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Verification</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF8F0] text-[#17201A]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FCFBF5] transition-colors">
                    <td className="p-3.5">
                      <div className="font-extrabold text-[#1B5E20]">{u.fullName}</div>
                      <div className="text-[10px] font-mono text-[#526158]">
                        {u.farmerCode || u.buyerCode || u.publicId.slice(0, 8)}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                          u.role === 'FARMER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.role === 'BUYER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold">{u.mobileNumber || '—'}</div>
                      <div className="text-[10px] text-[#526158]">{u.email || '—'}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold">{u.district}</div>
                      <div className="text-[10px] text-[#526158]">{u.taluk}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedUser(u)}
                        title="View Full Profile"
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {u.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleOpenActionDialog(u, 'VERIFY')}
                          title="Verify User"
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleOpenActionDialog(u, 'SUSPEND')}
                          title="Suspend User"
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition-all"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenActionDialog(u, 'REACTIVATE')}
                          title="Reactivate User"
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-all"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1B5E20]">{selectedUser.fullName}</h3>
                <p className="text-[11px] text-[#526158]">
                  {selectedUser.role} • {selectedUser.farmerCode || selectedUser.buyerCode || 'ID: ' + selectedUser.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#FCFBF5] p-4 rounded-2xl border border-[#C5E6CC]">
              <div>
                <span className="text-[10px] text-[#526158] font-bold block uppercase">Email Address</span>
                <span className="font-semibold">{selectedUser.email || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#526158] font-bold block uppercase">Mobile Number</span>
                <span className="font-semibold">{selectedUser.mobileNumber || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#526158] font-bold block uppercase">District & Taluk</span>
                <span className="font-semibold">{selectedUser.district}, {selectedUser.taluk}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#526158] font-bold block uppercase">Account Status</span>
                <span className="font-bold text-[#1B5E20]">{selectedUser.status} ({selectedUser.verificationStatus})</span>
              </div>

              {selectedUser.role === 'FARMER' && (
                <div className="col-span-2">
                  <span className="text-[10px] text-[#526158] font-bold block uppercase">Cultivated Acreage</span>
                  <span className="font-semibold">{selectedUser.acreage ? selectedUser.acreage + ' Acres' : '1.5 Acres'}</span>
                </div>
              )}

              {selectedUser.role === 'BUYER' && (
                <div className="col-span-2">
                  <span className="text-[10px] text-[#526158] font-bold block uppercase">Business Name & Capacity</span>
                  <span className="font-semibold">{selectedUser.businessName || 'Wholesale Enterprise'} • Capacity: {selectedUser.buyingCapacity ? selectedUser.buyingCapacity + ' KG' : '500 KG/month'}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-[#2E7D32] text-white font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Reason Dialog */}
      {actionUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-[#1B5E20]">
              Confirm Action: {actionType} ({actionUser.fullName})
            </h3>
            <p className="text-[#526158]">
              Please specify an administrative reason. A persistent notification will be dispatched to the user's inbox.
            </p>

            <div>
              <label className="text-[10px] text-[#526158] font-bold uppercase block mb-1">Reason for {actionType}</label>
              <textarea
                rows={3}
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="e.g. Identity verification pending or policy violation"
                className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionUser(null)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`px-4 py-2 text-white font-bold rounded-xl ${
                  actionType === 'SUSPEND' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

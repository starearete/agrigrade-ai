import React, { useState, useEffect } from 'react';
import { batchService } from '../../services/batchService';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import { ProductBatch } from '../../types/batch';
import { BatchCard } from '../../components/farmer/BatchCard';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter } from 'lucide-react';

export const BatchListPage: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBatches = async () => {
    try {
      const pData = await profileService.getFarmerProfile().catch(() => null);
      const farmerIdToFilter = pData?.id || user?.id;
      const data = await batchService.getBatches(farmerIdToFilter);
      setBatches(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [user?.id]);

  if (isLoading) return <LoadingState message="Loading your farm batches..." />;

  const filtered = batches.filter((b) => {
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchesSearch =
      b.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.varietyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">My Farm Batches</h1>
          <p className="text-xs text-[#526158] mt-0.5">Manage harvested loads, AI inspection reports, and listings.</p>
        </div>

        <Link
          to="/farmer/batches/create"
          className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors shadow-xs flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Create New Batch
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-[#C5E6CC] rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#526158] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search crop, variety or batch #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-bold">
          {['ALL', 'PENDING_AI', 'AI_GRADED', 'LISTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterStatus === st
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-[#FCFBF5] border border-[#C5E6CC] text-[#17201A] hover:bg-[#EEF8F0]'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No Farm Batches Found"
          description="No batches matched your filter criteria. Create a new batch to run AI inspection."
          actionLabel="Create New Batch"
          onAction={() => (window.location.href = '/farmer/batches/create')}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((batch) => (
            <BatchCard key={batch.id} batch={batch} onRefresh={fetchBatches} />
          ))}
        </div>
      )}
    </div>
  );
};

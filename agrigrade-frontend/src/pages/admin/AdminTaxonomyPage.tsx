import React, { useEffect, useState } from 'react';
import { cropService } from '../../services/cropService';
import { marketService } from '../../services/marketService';
import { LoadingState } from '../../components/common/LoadingState';
import { useNotification } from '../../context/NotificationContext';
import { Sprout, Building2, ShieldAlert } from 'lucide-react';

export const AdminTaxonomyPage: React.FC = () => {
  const { showToast } = useNotification();
  const [crops, setCrops] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'CROPS' | 'DISEASES' | 'MARKETS'>('CROPS');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cData, mData] = await Promise.all([
          cropService.getCrops(),
          marketService.getMarkets(),
        ]);
        setCrops(cData || []);
        setMarkets(mData || []);
        setDiseases([
          { code: 'BAN-SIG', name: 'Sigatoka Leaf Spot', severityLevel: 'High' },
          { code: 'TOM-BLT', name: 'Late Blight', severityLevel: 'Critical' },
          { code: 'ONI-ROTY', name: 'Yellow Rot', severityLevel: 'Moderate' },
        ]);
      } catch (err: any) {
        showToast('Loaded taxonomy metadata.', 'info');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading taxonomy and market metadata..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">Taxonomy & Market Governance</h1>
          <p className="text-xs text-[#526158] mt-0.5">
            Manage supported crops, varieties, disease diagnosis rules, and mandi benchmark markets across 38 TN districts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#C5E6CC] text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('CROPS')}
          className={`pb-3 transition-all relative ${
            activeTab === 'CROPS' ? 'text-[#2E7D32] font-extrabold border-b-2 border-[#2E7D32]' : 'text-[#526158] hover:text-[#17201A]'
          }`}
        >
          Crops & Varieties ({crops.length})
        </button>
        <button
          onClick={() => setActiveTab('DISEASES')}
          className={`pb-3 transition-all relative ${
            activeTab === 'DISEASES' ? 'text-[#2E7D32] font-extrabold border-b-2 border-[#2E7D32]' : 'text-[#526158] hover:text-[#17201A]'
          }`}
        >
          AI Disease Types ({diseases.length})
        </button>
        <button
          onClick={() => setActiveTab('MARKETS')}
          className={`pb-3 transition-all relative ${
            activeTab === 'MARKETS' ? 'text-[#2E7D32] font-extrabold border-b-2 border-[#2E7D32]' : 'text-[#526158] hover:text-[#17201A]'
          }`}
        >
          Benchmark Markets ({markets.length})
        </button>
      </div>

      {activeTab === 'CROPS' && (
        <div className="bg-white border border-[#C5E6CC] rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EEF8F0] border-b border-[#C5E6CC] text-[#1B5E20] font-extrabold">
                <th className="p-3.5">Crop Name</th>
                <th className="p-3.5">Scientific Name</th>
                <th className="p-3.5">Base Shelf Life</th>
                <th className="p-3.5">Default Storage</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF8F0]">
              {crops.map((c) => (
                <tr key={c.id} className="hover:bg-[#FCFBF5]">
                  <td className="p-3.5 font-extrabold text-[#1B5E20]">{c.name}</td>
                  <td className="p-3.5 italic text-[#526158]">{c.scientificName || 'Musa acuminata'}</td>
                  <td className="p-3.5 font-semibold">{c.baseShelfLifeDays || 14} Days</td>
                  <td className="p-3.5">{c.defaultStorageCondition || 'Cool Dry Place'}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'DISEASES' && (
        <div className="bg-white border border-[#C5E6CC] rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EEF8F0] border-b border-[#C5E6CC] text-[#1B5E20] font-extrabold">
                <th className="p-3.5">Disease Code</th>
                <th className="p-3.5">Disease Name</th>
                <th className="p-3.5">Severity Level</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF8F0]">
              {diseases.map((d, idx) => (
                <tr key={d.id || idx} className="hover:bg-[#FCFBF5]">
                  <td className="p-3.5 font-mono text-[#526158]">{d.code || 'DIS-00' + (idx + 1)}</td>
                  <td className="p-3.5 font-extrabold text-[#17201A]">{d.name}</td>
                  <td className="p-3.5 font-bold text-amber-700">{d.severityLevel || 'Moderate'}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                      Enabled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'MARKETS' && (
        <div className="bg-white border border-[#C5E6CC] rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EEF8F0] border-b border-[#C5E6CC] text-[#1B5E20] font-extrabold">
                <th className="p-3.5">Market Name</th>
                <th className="p-3.5">District</th>
                <th className="p-3.5">State</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF8F0]">
              {markets.map((m, idx) => (
                <tr key={m.id || idx} className="hover:bg-[#FCFBF5]">
                  <td className="p-3.5 font-extrabold text-[#1B5E20]">{m.name}</td>
                  <td className="p-3.5 font-bold">{m.district || 'Theni'}</td>
                  <td className="p-3.5 font-semibold text-[#526158]">{m.state || 'Tamil Nadu'}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                      Active Mandi
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

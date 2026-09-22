import React from 'react';
import { FileSpreadsheet, Download, TrendingUp, Award, Sprout } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const FarmerReportsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">Farm Analytics & Quality Reports</h1>
          <p className="text-xs text-[#526158] mt-0.5">
            Download seasonal harvest reports, Mandi price trends, and grade distribution metrics.
          </p>
        </div>

        <button
          onClick={() => alert('Harvest Quality CSV Report exported successfully.')}
          className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold text-xs rounded-xl hover:bg-[#1B5E20] transition-colors shadow-xs flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-[#526158] block uppercase">Grade A Premium Ratio</span>
          <div className="text-3xl font-black text-[#2E7D32] my-1">85.4%</div>
          <p className="text-[11px] text-[#526158]">Highest price tier ratio</p>
        </div>
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-[#526158] block uppercase">Average Net Realization</span>
          <div className="text-3xl font-black text-[#1B5E20] my-1">₹25.80 / KG</div>
          <p className="text-[11px] text-[#2E7D32] font-semibold">+14% vs un-graded farmgate</p>
        </div>
        <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-[#526158] block uppercase">Total Volume Graded</span>
          <div className="text-3xl font-black text-[#17201A] my-1">3,700 KG</div>
          <p className="text-[11px] text-[#526158]">Banana G9 & Tomato CO-3</p>
        </div>
      </div>

      {/* Detailed Quality Breakdown */}
      <div className="bg-white border border-[#C5E6CC] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-[#1B5E20]">Quality Grade Distribution Analysis</h3>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between font-bold mb-1">
              <span className="text-[#1B5E20]">Grade A Premium (Score 90-100)</span>
              <span className="text-[#2E7D32]">85.4% (3,160 KG)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-[#C5E6CC]">
              <div className="h-full bg-[#2E7D32] rounded-full" style={{ width: '85.4%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold mb-1">
              <span className="text-[#1B5E20]">Grade B Standard (Score 80-89)</span>
              <span className="text-[#2E7D32]">14.6% (540 KG)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-[#C5E6CC]">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '14.6%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

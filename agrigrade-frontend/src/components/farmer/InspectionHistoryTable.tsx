import React from 'react';
import { formatDateTime } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export interface InspectionRecord {
  id: number;
  inspectionName: string;
  timestamp: string;
  status: string;
  grade: string;
  score: number;
  confidence: number;
}

interface InspectionHistoryTableProps {
  records: InspectionRecord[];
}

export const InspectionHistoryTable: React.FC<InspectionHistoryTableProps> = ({ records }) => {
  return (
    <div className="bg-white border border-[#C5E6CC] rounded-2xl p-5 shadow-xs">
      <h4 className="font-extrabold text-sm text-[#1B5E20] mb-3 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-[#2E7D32]" /> Inspection Audit & Timeline History
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#C5E6CC] text-[#526158] font-bold uppercase text-[11px]">
              <th className="py-2.5 px-3">Inspection</th>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Quality Grade</th>
              <th className="py-2.5 px-3">Score</th>
              <th className="py-2.5 px-3">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-[#F4FAF4] transition-colors">
                <td className="py-3 px-3 font-bold text-[#17201A]">{r.inspectionName}</td>
                <td className="py-3 px-3 text-[#526158]">{formatDateTime(r.timestamp)}</td>
                <td className="py-3 px-3">
                  <StatusBadge status={r.status} size="sm" />
                </td>
                <td className="py-3 px-3 font-bold text-[#1B5E20]">{r.grade.replace(/_/g, ' ')}</td>
                <td className="py-3 px-3 font-extrabold text-[#2E7D32]">{r.score}%</td>
                <td className="py-3 px-3 text-[#526158]">{r.confidence}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

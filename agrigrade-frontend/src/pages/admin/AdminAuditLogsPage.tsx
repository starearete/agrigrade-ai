import React, { useEffect, useState } from 'react';
import { adminService, AuditLog } from '../../services/adminService';
import { LoadingState } from '../../components/common/LoadingState';
import { useNotification } from '../../context/NotificationContext';
import { FileText, ShieldAlert, CheckCircle2, Calendar, User } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await adminService.getAuditLogs();
        setLogs(data);
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch administrative audit logs.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return <LoadingState message="Loading administrative audit logs..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">System Audit Trail</h1>
          <p className="text-xs text-[#526158] mt-0.5">
            Immutable log of user status changes, listing moderations, and governance actions.
          </p>
        </div>
        <div className="text-xs font-bold text-[#526158] bg-white border border-[#C5E6CC] px-3 py-1.5 rounded-xl shadow-xs">
          Logged Actions: <span className="text-[#1B5E20] font-extrabold">{logs.length}</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border border-[#C5E6CC] rounded-2xl p-8 text-center text-xs text-[#526158] font-bold">
          No administrative actions logged in system memory yet.
        </div>
      ) : (
        <div className="bg-white border border-[#C5E6CC] rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EEF8F0] border-b border-[#C5E6CC] text-[#1B5E20] font-extrabold">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Administrator</th>
                <th className="p-3.5">Action Code</th>
                <th className="p-3.5">Target Account / Subject</th>
                <th className="p-3.5">Reason & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF8F0] text-[#17201A]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FCFBF5] transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-[#526158] whitespace-nowrap">
                    {log.executedAt ? new Date(log.executedAt).toLocaleString() : 'Just now'}
                  </td>
                  <td className="p-3.5">
                    <div className="font-extrabold text-[#1B5E20]">{log.adminName}</div>
                    <div className="text-[10px] text-[#526158]">{log.adminEmail}</div>
                  </td>
                  <td className="p-3.5 font-bold">
                    <span className={`px-2 py-0.5 text-[10px] rounded-md font-mono font-bold ${
                      log.actionCode?.includes('DELETED') || log.actionCode?.includes('REMOVED')
                        ? 'bg-rose-100 text-rose-800'
                        : log.actionCode?.includes('SUSPENDED')
                        ? 'bg-amber-100 text-amber-800'
                        : log.actionCode?.includes('VERIFIED') || log.actionCode?.includes('ACTIVE')
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.actionCode}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-[#17201A]">
                    {log.targetUserName || (log.targetUserId ? `User ID: ${log.targetUserId}` : 'System Wide')}
                  </td>
                  <td className="p-3.5 text-[#526158] font-semibold max-w-xs truncate">
                    {log.reason || 'Standard administrative action'}
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

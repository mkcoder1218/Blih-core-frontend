/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Clock, CheckSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { StatCard, StatCardGrid, SectionCard, UserAvatar } from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import { useLegacyUser } from '../../api/legacyUserStore';
import { useApproveAttendanceRequest, useAttendanceRequests, useRejectAttendanceRequest } from '../../hooks/useAttendanceRequests';
import { useMyPermissions } from '../../hooks/usePermissions';

interface AttendanceRequestsTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AttendanceRequestsTab({ showAlert }: AttendanceRequestsTabProps) {
  const legacyUser = useLegacyUser();
  const perms = useMyPermissions();
  const canApprove = legacyUser?.role === 'Business Admin' || legacyUser?.role === 'HR Manager' || perms.isSuperAdmin || perms.hasAny('attendance.manage', 'attendance.checkin_correction.approve');
  const pending = useAttendanceRequests({ requestType: 'check_in_correction', status: 'pending', size: 50 });
  const archive = useAttendanceRequests({ requestType: 'check_in_correction', status: 'all', size: 1 });
  const approve = useApproveAttendanceRequest();
  const reject = useRejectAttendanceRequest();
  const rows = pending.data?.rows || [];

  const handleApprove = async (id: string) => {
    await approve.mutateAsync(id);
    showAlert('Approved check-in correction.', 'success');
  };

  const handleReject = async (id: string) => {
    await reject.mutateAsync({ id, reason: 'Rejected by Business Admin' });
    showAlert('Rejected check-in correction.', 'info');
  };

  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Top row of statistics */}
      <StatCardGrid cols={3}>
        <StatCard label="Pending Adjustments" value={pending.data?.total || 0} icon={<Calendar className="w-5 h-5" />} tone="blue" />
        <StatCard label="All Adjustments" value={archive.data?.total || 0} icon={<CheckSquare className="w-5 h-5" />} tone="emerald" />
        <StatCard label="Approval Required" value={rows.length} icon={<Clock className="w-5 h-5" />} tone="amber" />
      </StatCardGrid>

      <div>
        <h2 className="text-sm font-black text-slate-950 tracking-tight">Punctuality Adjustment Requests</h2>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Approve or audit employee punch adjustment logs.</p>
      </div>

      {/* Content card logs */}
      <SectionCard title="Pending Adjustments">
        <div className="space-y-4 pt-1">
          {pending.isLoading && (
            <div className="text-xs font-semibold text-slate-500 py-4">Loading correction requests...</div>
          )}

          {!pending.isLoading && rows.length === 0 && (
            <div className="text-xs font-semibold text-slate-500 py-4">No pending manual check-in corrections.</div>
          )}

          {rows.map((item) => (
            <div
              key={item.id}
              className="border border-slate-150 rounded-2xl p-5 hover:bg-slate-50/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <UserAvatar name={item.employee?.fullName || 'Employee'} size="sm" />
                  <h4 className="text-xs font-extrabold text-slate-900">{item.employee?.fullName || 'Employee'}</h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{item.employee?.BusinessUserProfile?.department?.name || 'Unassigned'}</span>
                </div>
                <p className="text-xs font-semibold text-slate-600">{item.reason}</p>
                <div className="flex gap-4 text-[11px] font-bold pt-1">
                  <div>Type: <span className="text-slate-700 font-mono">{String(item.category || '').replace(/_/g, ' ')}</span></div>
                  <div>Requested time: <span className="text-blue-600 font-mono">{formatDateTime(item.fromAt)}</span></div>
                </div>
              </div>

              {canApprove ? (
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    type="button"
                    disabled={approve.isPending || reject.isPending}
                    onClick={() => handleApprove(item.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex-1 md:flex-none"
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={approve.isPending || reject.isPending}
                    onClick={() => handleReject(item.id)}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl flex-1 md:flex-none"
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="text-[11px] font-bold text-slate-400">Waiting for Business Admin</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

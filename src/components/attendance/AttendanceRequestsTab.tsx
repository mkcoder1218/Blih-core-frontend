/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Clock, CheckSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { StatCard, StatCardGrid, SectionCard, UserAvatar } from '@/components/ui/blih';

interface AttendanceRequestsTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

const adjustmentItems = [
  { id: '1', name: 'Jessica Parker', dept: 'Marketing', desc: 'Missing morning fingerprint register due to biometric sensor failure.', original: 'Missed', proposed: '09:00 AM' },
  { id: '2', name: 'Jessica Parker', dept: 'Marketing', desc: 'Punch outward missed due to project demo extension.', original: 'Missed', proposed: '06:30 PM' },
];

export default function AttendanceRequestsTab({ showAlert }: AttendanceRequestsTabProps) {
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
        <StatCard label="Adjustment Count" value={8} icon={<Calendar className="w-5 h-5" />} tone="blue" />
        <StatCard label="Completed Adjustment" value={16} icon={<CheckSquare className="w-5 h-5" />} tone="emerald" />
        <StatCard label="Total Logs Today" value={45} icon={<Clock className="w-5 h-5" />} tone="amber" />
      </StatCardGrid>

      <div>
        <h2 className="text-sm font-black text-slate-950 tracking-tight">Punctuality Adjustment Requests</h2>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Approve or audit employee punch adjustment logs.</p>
      </div>

      {/* Content card logs */}
      <SectionCard title="Pending Adjustments">
        <div className="space-y-4 pt-1">
          {adjustmentItems.map((item) => (
            <div
              key={item.id}
              className="border border-slate-150 rounded-2xl p-5 hover:bg-slate-50/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <UserAvatar name={item.name} size="sm" />
                  <h4 className="text-xs font-extrabold text-slate-900">{item.name}</h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{item.dept}</span>
                </div>
                <p className="text-xs font-semibold text-slate-600">{item.desc}</p>
                <div className="flex gap-4 text-[11px] font-bold pt-1">
                  <div>Original: <span className="text-rose-500 line-through font-mono">{item.original}</span></div>
                  <div>Proposed shift: <span className="text-blue-600 font-mono">{item.proposed}</span></div>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => showAlert('Approved punch adjustment request!', 'success')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all select-none flex-1 md:flex-none text-center cursor-pointer"
                >
                  Accept
                </button>
                <button
                  onClick={() => showAlert('Rejected punch adjustment request.', 'info')}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all select-none flex-1 md:flex-none text-center cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}

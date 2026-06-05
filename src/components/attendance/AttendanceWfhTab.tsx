/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, CheckSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { StatCard, StatCardGrid, SectionCard, UserAvatar, StatusBadge, FilterBar } from '@/components/ui/blih';

interface WfhRequest {
  id: string;
  employee: string;
  role: string;
  type: string;
  from: string;
  to: string;
  duration: string;
  submitted: string;
  title: string;
  reason: string;
  approvedBy: string;
  status: string;
}

interface PreviousLeave {
  name: string;
  role: string;
  dept: string;
  leaveType: string;
  dates: string;
  duration: string;
  status: string;
}

interface AttendanceWfhTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
  wfhRequests: WfhRequest[];
  setWfhRequests: React.Dispatch<React.SetStateAction<WfhRequest[]>>;
  previousLeaves: PreviousLeave[];
}

export default function AttendanceWfhTab({ showAlert, wfhRequests, setWfhRequests, previousLeaves }: AttendanceWfhTabProps) {
  const [selectedWfhIndex, setSelectedWfhIndex] = useState(0);

  const handleAction = (id: string, status: 'Accepted' | 'Rejected') => {
    setWfhRequests((prev) => prev.map((item) => item.id === id ? { ...item, status: status.toLowerCase() } : item));
    showAlert(`${status} request successfully!`, status === 'Accepted' ? 'success' : 'info');
  };

  return (
    <motion.div
      key="work-from-home"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Top key parameters row */}
      <StatCardGrid cols={3}>
        <StatCard label="Total WFH Requests This Month" value={12} icon={<Clock className="w-5 h-5" />} tone="blue" />
        <StatCard label="Pending Approval"              value={28} icon={<Clock className="w-5 h-5" />} tone="amber" />
        <StatCard label="Total Work-From-Home Requests" value={45} icon={<CheckSquare className="w-5 h-5" />} tone="emerald" />
      </StatCardGrid>

      {/* Work-from-Home requests */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Work-From-Home Requests</h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">WFH requests pending approval.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wfhRequests.map((wfh) => (
            <div key={wfh.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={wfh.employee} size="sm" color="blue" />
                <div>
                  <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{wfh.employee}</h4>
                  <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{wfh.role}</span>
                </div>
              </div>

              {/* Meta section */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50/70 rounded-xl p-3 text-[10.5px]">
                <div>
                  <span className="text-slate-400 block font-medium">From</span>
                  <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{wfh.from}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">To</span>
                  <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{wfh.to}</span>
                </div>
                <div className="pt-2 border-t border-slate-100/50">
                  <span className="text-slate-400 block font-medium">Duration</span>
                  <span className="text-blue-600 block font-black text-[11px] font-mono">{wfh.duration}</span>
                </div>
                <div className="pt-2 border-t border-slate-100/50">
                  <span className="text-slate-400 block font-medium">Submitted</span>
                  <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{wfh.submitted}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#b9c4d2] uppercase">{wfh.title}</span>
                <p className="text-[11px] text-slate-500 leading-normal font-semibold">{wfh.reason}</p>
              </div>

              {/* Controls */}
              <div className="flex gap-2 pt-2 border-t border-slate-50">
                {wfh.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleAction(wfh.id, 'Accepted')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(wfh.id, 'Rejected')}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center text-xs font-bold uppercase py-1 text-blue-600 bg-blue-50 rounded-lg">
                    {wfh.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Previous WFH requests */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Previous WFH Requests</h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Archived WFH requests.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left pane */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search previous WFH requests..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs select-none"
                />
              </div>
              <div className="flex gap-2">
                <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                  <option>Marketing</option>
                </select>
                <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                  <option>Status</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-50 max-h-[350px] overflow-y-auto space-y-2">
              {previousLeaves.map((l, index) => {
                const isSelected = selectedWfhIndex === index;
                const isRejected = index === 2 || index === 4;
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedWfhIndex(index)}
                    className={`flex justify-between items-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50/80 border-blue-300 shadow-3xs'
                        : 'bg-white border-transparent hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                      <div>
                        <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{l.name}</h4>
                        <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{l.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{l.dept}</span>
                      <span className={`text-[9px] font-mono font-bold border px-2.5 py-0.5 rounded-lg ${
                        isRejected ? 'border-rose-400 text-rose-600' : 'border-blue-400 text-blue-600'
                      }`}>
                        {isRejected ? 'Rejected' : 'Accepted'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Details Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">JP</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 truncate">Jessica Parker</h4>
                  <span className="text-[7.5px] font-black tracking-wider bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded">TECHNICAL DEPT.</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold block mt-1">jessica@company.com</p>
                <p className="text-[9.5px] text-slate-500 font-mono tracking-tight mt-0.5">+251 987 78 6353</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100/60 rounded-2xl p-4 space-y-3 relative">
              <h5 className="text-[11px] font-black text-slate-950 uppercase tracking-tight">Work-From-Home Details</h5>
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase">From</span>
                  <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase">To</span>
                  <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Total Hours</span>
                  <strong className="text-blue-600 block mt-0.5 text-xs font-black font-mono">2Days</strong>
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Submitted</span>
                  <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Working-From-Home</span>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
                We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Approved By</span>
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/30">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-sans font-bold flex-shrink-0">JP</span>
                <span className="text-[11px] font-bold text-slate-800">Jessica Parker</span>
                <span className="text-[8px] bg-blue-50 text-[#1a56db] rounded ml-auto px-1.5 py-0.5 font-mono font-black text-center">TECHNICAL DEPT.</span>
              </div>
            </div>

            <button
              onClick={() => showAlert('Displaying Jessica Parker detailed directory profile cards details!', 'info')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all select-none w-full text-center cursor-pointer"
            >
              View Profile
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

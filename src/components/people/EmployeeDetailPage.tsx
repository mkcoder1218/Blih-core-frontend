/**
 * Employee Detail Page
 * Full-screen employee profile view shown when clicking the profile icon.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  User,
  Briefcase,
  FileText,
  Calendar,
  Eye,
  Download,
  ClipboardList,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SideTab = 'profile' | 'attendance' | 'performance' | 'leave';
type ProfileTab = 'personal' | 'professional' | 'documents';

interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut: string;
  breakTime: string;
  workingHours: string;
  status: 'On Time' | 'Late';
}

// ─── Static mock data ─────────────────────────────────────────────────────────

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { date: 'July 01, 2023', checkIn: '09:28 AM', checkOut: '07:00 PM', breakTime: '00:30 Min', workingHours: '09:02 Hrs', status: 'On Time' },
  { date: 'July 02, 2023', checkIn: '09:20 AM', checkOut: '07:00 PM', breakTime: '00:20 Min', workingHours: '09:20 Hrs', status: 'On Time' },
  { date: 'July 03, 2023', checkIn: '09:25 AM', checkOut: '07:00 PM', breakTime: '00:30 Min', workingHours: '09:05 Hrs', status: 'On Time' },
  { date: 'July 04, 2023', checkIn: '09:45 AM', checkOut: '07:00 PM', breakTime: '00:40 Min', workingHours: '08:35 Hrs', status: 'Late' },
  { date: 'July 05, 2023', checkIn: '10:00 AM', checkOut: '07:00 PM', breakTime: '00:30 Min', workingHours: '08:30 Hrs', status: 'Late' },
  { date: 'July 06, 2023', checkIn: '09:28 AM', checkOut: '07:00 PM', breakTime: '00:30 Min', workingHours: '09:02 Hrs', status: 'On Time' },
  { date: 'July 07, 2023', checkIn: '09:30 AM', checkOut: '07:00 PM', breakTime: '00:15 Min', workingHours: '09:15 Hrs', status: 'On Time' },
  { date: 'July 08, 2023', checkIn: '09:52 AM', checkOut: '07:00 PM', breakTime: '00:45 Min', workingHours: '08:23 Hrs', status: 'Late' },
  { date: 'July 09, 2023', checkIn: '09:10 AM', checkOut: '07:00 PM', breakTime: '00:30 Min', workingHours: '09:02 Hrs', status: 'On Time' },
];

const MOCK_DOCUMENTS = [
  { name: 'Appointment Letter.pdf' },
  { name: 'Education_paper.pdf' },
  { name: 'ID Number.pdf' },
  { name: 'Contract Sign.pdf' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
      <p className="text-[13px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: 'On Time' | 'Late' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
        status === 'On Time'
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-red-50 text-red-500'
      }`}
    >
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface EmployeeDetailPageProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
}

export default function EmployeeDetailPage({ user, onBack }: EmployeeDetailPageProps) {
  const [activeSideTab, setActiveSideTab] = useState<SideTab>('profile');
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('personal');

  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ─── Side nav items ─────────────────────────────────────────────────────────
  const sideNavItems: { id: SideTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'performance', label: 'Performance', icon: ClipboardList },
    { id: 'leave', label: 'Leave', icon: FileText },
  ];

  // ─── Profile sub-tabs ───────────────────────────────────────────────────────
  const profileTabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'professional', label: 'Professional Information', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="min-h-full space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition-colors mb-0.5 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-bold">Employee Detail</span>
        </button>
        <p className="text-[12px] text-slate-500 font-medium pl-6">Directory of employees and profiles</p>
      </div>

      {/* ── Main Card ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Employee Header Strip */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-black flex-shrink-0 border border-blue-100 overflow-hidden">
              {initials}
            </div>
            {/* Name & info */}
            <div className="space-y-1">
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">{user.name}</h3>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Briefcase className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{user.role}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="text-xs font-medium">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Employment type badge — shown on attendance tab */}
            {activeSideTab === 'attendance' && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3 py-1">
                Permanent
              </span>
            )}
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* ── Two-column body ─────────────────────────────────────────────── */}
        <div className="flex">

          {/* Left side nav */}
          <div className="w-52 flex-shrink-0 border-r border-slate-100 py-4 px-3 space-y-1">
            {sideNavItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeSideTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveSideTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Right content area */}
          <div className="flex-1 min-w-0 p-6">
            <AnimatePresence mode="wait">

              {/* ── PROFILE TAB ──────────────────────────────────────────── */}
              {activeSideTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Profile sub-tabs */}
                  <div className="flex items-center gap-6 border-b border-slate-100 mb-6">
                    {profileTabs.map(({ id, label, icon: Icon }) => {
                      const isActive = activeProfileTab === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setActiveProfileTab(id)}
                          className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-all ${
                            isActive
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">

                    {/* Personal Information */}
                    {activeProfileTab === 'personal' && (
                      <motion.div
                        key="personal"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.12 }}
                        className="grid grid-cols-2 gap-x-10 gap-y-6"
                      >
                        <InfoField label="First Name" value="Lemmi" />
                        <InfoField label="Last Name" value="Tadesse" />
                        <InfoField label="Mobile Number" value="(251) 9555-0122" />
                        <InfoField label="Email Address" value={user.email} />
                        <InfoField label="Date of Birth" value="July 14, 1995" />
                        <InfoField label="Marital Status" value="Married" />
                        <InfoField label="Gender" value="male" />
                        <InfoField label="Nationality" value="Ethiopia" />
                        <InfoField label="Address" value="haile garment," />
                        <InfoField label="City" value="Addis Ababa" />
                        <InfoField label="Country" value="Ethiopia" />
                        <InfoField label="Zip Code" value="1000" />
                      </motion.div>
                    )}

                    {/* Professional Information */}
                    {activeProfileTab === 'professional' && (
                      <motion.div
                        key="professional"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.12 }}
                        className="grid grid-cols-2 gap-x-10 gap-y-6"
                      >
                        <InfoField label="Employee ID" value="05" />
                        <InfoField label="User Name" value="Lemmi" />
                        <InfoField label="Employee Type" value="On-Site" />
                        <InfoField label="Email Address" value={user.email} />
                        <InfoField label="Department" value="Creative" />
                        <InfoField label="Designation" value={user.role} />
                        <InfoField label="Working Days" value="5 Days" />
                        <InfoField label="Joining Date" value="July 10, 2025" />
                        <InfoField label="Office Location" value="Bole Dembel. Bitweded Mall" />
                      </motion.div>
                    )}

                    {/* Documents */}
                    {activeProfileTab === 'documents' && (
                      <motion.div
                        key="documents"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.12 }}
                        className="grid grid-cols-2 gap-4"
                      >
                        {MOCK_DOCUMENTS.map((doc) => (
                          <div
                            key={doc.name}
                            className="flex items-center justify-between px-4 py-3.5 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
                          >
                            <span className="text-xs font-semibold text-slate-700">{doc.name}</span>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── ATTENDANCE TAB ───────────────────────────────────────── */}
              {activeSideTab === 'attendance' && (
                <motion.div
                  key="attendance"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Table */}
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          {['Date', 'Check In', 'Check Out', 'Break', 'Working Hours', 'Status'].map((h) => (
                            <th key={h} className="pb-3 text-[11px] font-semibold text-slate-400 tracking-wide pr-6 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {MOCK_ATTENDANCE.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 pr-6 text-xs font-medium text-slate-700 whitespace-nowrap">{row.date}</td>
                            <td className="py-3 pr-6 text-xs font-medium text-slate-700 whitespace-nowrap">{row.checkIn}</td>
                            <td className="py-3 pr-6 text-xs font-medium text-slate-700 whitespace-nowrap">{row.checkOut}</td>
                            <td className="py-3 pr-6 text-xs font-medium text-slate-700 whitespace-nowrap">{row.breakTime}</td>
                            <td className="py-3 pr-6 text-xs font-medium text-slate-700 whitespace-nowrap">{row.workingHours}</td>
                            <td className="py-3">
                              <StatusBadge status={row.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── PERFORMANCE TAB ─────────────────────────────────────── */}
              {activeSideTab === 'performance' && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Performance Reviews</p>
                  <p className="text-xs text-slate-400 font-medium text-center max-w-xs">
                    Performance data and review history will appear here once evaluations are completed.
                  </p>
                </motion.div>
              )}

              {/* ── LEAVE TAB ────────────────────────────────────────────── */}
              {activeSideTab === 'leave' && (
                <motion.div
                  key="leave"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Leave Records</p>
                  <p className="text-xs text-slate-400 font-medium text-center max-w-xs">
                    Leave requests and balances for this employee will be displayed here.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

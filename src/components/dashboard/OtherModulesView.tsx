/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  mockEmployees,
  mockLeaveRequests,
  mockAttendanceRecords,
  mockPayrollDetails
} from '../../mockData';
import {
  Users,
  Search,
  Filter,
  Check,
  Calendar,
  Clock,
  Briefcase,
  TrendingUp,
  Award,
  BookOpen,
  UserCheck,
  UserX,
  Plus,
  Coins,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface OtherModulesProps {
  module: 'onboarding' | 'profiles' | 'attendance' | 'performance' | 'talent' | 'exit' | 'finance';
  onDraftAiSuggestion: (context: string) => void;
}

export default function OtherModulesView({ module, onDraftAiSuggestion }: OtherModulesProps) {
  // Common Search & Filters state
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  // Employee directory states
  const [employees, setEmployees] = useState(mockEmployees);
  const [selectedEmp, setSelectedEmp] = useState<typeof mockEmployees[0] | null>(mockEmployees[0]);

  // Attendance lists
  const [attendance, setAttendance] = useState(mockAttendanceRecords);
  const [clockedIn, setClockedIn] = useState(false);

  // Leave approval rows
  const [leaves, setLeaves] = useState(mockLeaveRequests);

  // Payroll state
  const [payroll, setPayroll] = useState(mockPayrollDetails);

  // Onboarding milestones
  const onboardingChecklist = [
    { id: 1, text: 'Complete background checks & verification', done: true },
    { id: 2, text: 'Issue company hardware & accounts config', done: true },
    { id: 3, text: 'Introduce to departmental stakeholders', done: false },
    { id: 4, text: 'Assign structural buddy/mentor', done: false },
    { id: 5, text: 'Conduct initial 1-on-1 probation alignment', done: false }
  ];

  const handleApproveLeave = (id: string) => {
    setLeaves(
      leaves.map((l) => (l.id === id ? { ...l, status: 'Approved' } : l))
    );
  };

  const handleProcessPayroll = (id: string) => {
    setPayroll(
      payroll.map((p) => (p.id === id ? { ...p, paymentStatus: 'Paid' } : p))
    );
  };

  const handleRecordAttendance = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Prepend new attendance record
    const newRec = {
      id: `att-${Date.now()}`,
      name: 'Aytenew Yihunie',
      date: 'Today',
      checkIn: timeStr,
      checkOut: '--',
      status: 'On-time' as const
    };

    setAttendance([newRec, ...attendance]);
    setClockedIn(true);
  };

  // --- 1. PEOPLE PROFILES MODULE ---
  if (module === 'profiles') {
    const filteredEmployees = employees.filter((emp) => {
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.role.toLowerCase().includes(search.toLowerCase());
      const matchesDept = filterDept === 'All' || emp.dept === filterDept;
      return matchesSearch && matchesDept;
    });

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">People Profiles</h4>
            <p className="text-[11px] text-slate-400 font-medium">Manage corporate directory and roles</p>
          </div>
          <button
            onClick={() => onDraftAiSuggestion('profiles')}
            className="text-xs bg-[#f0fdf4] hover:bg-[#dcfce7] border border-green-100 text-green-700 font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Bio Draft</span>
          </button>
        </div>

        {/* Directory View split column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List panel */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search profile..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-medium text-slate-700"
                />
              </div>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-xs text-slate-600 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Dr.</option>
                <option value="CREATIVE DEPT.">Creative</option>
                <option value="TECHNICAL DEPT.">Technical</option>
                <option value="HR DEPT.">HR</option>
                <option value="FINANCE DEPT.">Finance</option>
              </select>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmp(emp)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedEmp?.id === emp.id
                      ? 'bg-[#f7fafe] border-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-50 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-mono">
                      {emp.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 leading-none">{emp.name}</h5>
                      <p className="text-[10px] text-slate-500 mt-1">{emp.role}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Details inspector panel */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6">
            {selectedEmp ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-black font-mono shadow-md">
                      {selectedEmp.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-950 tracking-tight leading-none">{selectedEmp.name}</h3>
                      <p className="text-xs font-medium text-[#2563eb] uppercase tracking-wider mt-1">{selectedEmp.dept}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      selectedEmp.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {selectedEmp.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-b border-slate-100 py-4 text-[11px] text-slate-500 font-semibold">
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Title</span>
                    <span className="text-slate-800">{selectedEmp.role}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Salary</span>
                    <span className="text-slate-800 font-extrabold">${Number(selectedEmp.salary).toLocaleString()}/mo</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Exp Group</span>
                    <span className="text-slate-800">{selectedEmp.experience}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Gender</span>
                    <span className="text-slate-700">{selectedEmp.gender}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Performance Rating</span>
                    <span className="text-blue-600 font-extrabold">{selectedEmp.performanceRating} / 5</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5 text-slate-400">Email Contact</span>
                    <span className="text-slate-600 block line-clamp-1">{selectedEmp.email}</span>
                  </div>
                </div>

                <div>
                  <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Associated Tags / Focus Skills</h6>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEmp.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.2 py-0.5 rounded transition-all">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Users className="w-12 h-12 text-slate-300 mb-2" />
                <span className="text-xs">Select any employee directory profile to inspect</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. ONBOARDING & PROBATION ---
  if (module === 'onboarding') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Onboarding & Probation</h4>
          <p className="text-[11px] text-slate-400 font-medium">Coordinate mentor assignments and checklist steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Hires List list */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Recruits Listing</h5>
            <div className="space-y-3">
              {[
                { name: 'Sophia Ross', role: 'Junior Content Writer', mentor: 'Marcus Brody', start: 'May 1, 2026', done: 2, total: 5 },
                { name: 'David Kim', role: 'Junior QA Engineer', mentor: 'Jessica Parker', start: 'May 15, 2026', done: 1, total: 5 }
              ].map((hire, i) => (
                <div key={i} className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">In Onboarding</span>
                      <h4 className="text-xs font-bold text-slate-900">{hire.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{hire.role}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold leading-none">{hire.done} / {hire.total} steps</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3.5">
                    <div className="bg-[#2563eb] h-full" style={{ width: `${(hire.done / hire.total) * 100}%` }} />
                  </div>
                  <div className="mt-3.5 pt-2.5 border-t border-slate-150 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span>Mentor: <strong className="text-slate-700">{hire.mentor}</strong></span>
                    <span>Start: <span className="text-slate-600">{hire.start}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Onboarding Steps tracker */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Onboarding Milestones</h5>
              <div className="space-y-3.5 mt-4">
                {onboardingChecklist.map((step) => (
                  <div key={step.id} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-4.5 h-4.5 rounded-md flex items-center justify-center border  ${
                      step.done
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={`text-[11.5px] font-medium leading-normal ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onDraftAiSuggestion('onboarding')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors self-start px-4"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Onboarding Plan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. ATTENDANCE & LEAVE ---
  if (module === 'attendance') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100">
          <div>
            <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Attendance & Leave Planner</h4>
            <p className="text-[11px] text-slate-400 font-medium font-sans">Track daily timestamps, active leaves, and sick summaries</p>
          </div>
          <button
            onClick={handleRecordAttendance}
            disabled={clockedIn}
            className={`min-w-32 py-2.5 px-4 rounded-xl text-xs font-bold leading-none select-none active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              clockedIn
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{clockedIn ? 'Clocked In' : 'Clock In Now'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Leave approvals */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Leave Approvals Queue</h5>
            <div className="space-y-3">
              {leaves.map((lv) => (
                <div key={lv.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex justify-between items-center">
                  <div>
                    <h6 className="text-[12px] font-bold text-slate-900 leading-none">{lv.name}</h6>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {lv.type} &bull; <strong className="text-slate-700">{lv.days} days</strong>
                    </span>
                  </div>
                  {lv.status === 'Approved' ? (
                    <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Approved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveLeave(lv.id)}
                      className="bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Clock-in timelines */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Attendance Ledger (Today)</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-semibold border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                    <th className="py-2.5">Name</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {attendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-900">{rec.name}</td>
                      <td>{rec.date}</td>
                      <td>{rec.checkIn}</td>
                      <td>{rec.checkOut}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'On-time' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 4. PERFORMANCE ---
  if (module === 'performance') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Performance Statistics</h4>
          <p className="text-[11px] text-slate-400 font-medium">Monitor employee evaluation ratings and reviews status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance reviews matrix */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Scheduled Reviews</h5>
            <div className="space-y-3">
              {[
                { name: 'David Kim', period: 'Probation 3-Month Review', due: 'In 3 days', done: false },
                { name: 'Aytenew Yihunie', period: 'Q2 Performance review', due: 'In 1 week', done: false },
                { name: 'Eleanor Vance', period: 'Pre-Promotion review', due: 'Completed yesterday', done: true }
              ].map((rev, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900 leading-none">{rev.name}</p>
                    <span className="text-[10px] text-slate-500 mt-1.5 block">{rev.period} &bull; <span className="text-blue-600 font-semibold">{rev.due}</span></span>
                  </div>
                  {rev.done ? (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">Completed</span>
                  ) : (
                    <button
                      onClick={() => onDraftAiSuggestion(`performance for ${rev.name}`)}
                      className="bg-[#2563eb] hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>Draft Evaluation</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Average metrics overview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">KPI Alignment Insights</h5>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-50 mt-4 text-xs text-slate-600 font-semibold leading-relaxed">
                System calculated average performance score across the firm matches <strong className="text-blue-600">4.52 / 5.00</strong> stars. Excellent employee retention and feedback align to annual KPI objectives.
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Historical trend</span>
              <div className="flex h-3 items-center gap-1">
                <div className="bg-slate-300 h-full w-4 rounded-xs" />
                <div className="bg-slate-300 h-full w-4 rounded-xs" />
                <div className="bg-blue-300 h-full w-4 rounded-xs" />
                <div className="bg-blue-500 h-full w-4 rounded-xs" />
                <div className="bg-blue-600 h-full w-4 rounded-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 5. TALENT MANAGEMENT ---
  if (module === 'talent') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Talent Management & Training</h4>
          <p className="text-[11px] text-slate-400 font-medium">Coordinate coaching, certifications and structural workshops</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scheduled Workshops lists */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h5 className="text-xs font-extrabold text-[#111827] uppercase tracking-tight">Scheduled Classes</h5>
            <div className="space-y-3">
              {[
                { title: 'Leadership Workshop', date: 'May 25, 2026', time: '10:00 AM', status: 'Scheduled' },
                { title: 'Advanced React Architecture', date: 'Jun 2, 2026', time: '02:00 PM', status: 'Drafting' }
              ].map((c, i) => (
                <div key={i} className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between font-sans text-xs">
                  <div>
                    <h6 className="font-bold text-slate-900 leading-tight">{c.title}</h6>
                    <span className="text-[10px] text-slate-500 mt-1 block font-semibold">{c.date} &bull; {c.time}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    c.status === 'Scheduled' ? 'bg-purple-100/50 text-purple-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Training insights helper */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Certification Matrix</h5>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-3">
                Blih CORE offers active education stipends. Track ongoing courses on cybersecurity, design principles, and engineering models.
              </p>
            </div>
            <button
              onClick={() => onDraftAiSuggestion('talent education programs')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-xs self-start transition-colors cursor-pointer"
            >
              Draft Training Stipend Policy
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 6. EXIT & OFFBOARDING ---
  if (module === 'exit') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Exit & Offboarding</h4>
          <p className="text-[11px] text-slate-400 font-medium">Handle structural departures, exit surveys and asset returns</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Pending Exit Handlers</h5>
            <div className="space-y-3">
              {[
                { name: 'Sarah Jenkins', role: 'Support Representative', date: 'May 30, 2026', assetStatus: 'Awaiting Handover' }
              ].map((ex, i) => (
                <div key={i} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <h6 className="font-bold text-slate-900">{ex.name}</h6>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ex.role}</p>
                    <span className="text-[10.5px] text-slate-400 font-semibold block mt-1">Depart date: {ex.date}</span>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-100 px-2 py-0.5 rounded">
                    {ex.assetStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#fffbeb] rounded-2xl border border-amber-100 p-5 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold text-amber-900 font-sans">Exit Process Policy</h5>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2.5">
                The checklist requires returning company hardware within 5 days of offboarding, clearing intellectual properties, and holding a structured feedback survey with the HR VP.
              </p>
            </div>
            <button
              onClick={() => onDraftAiSuggestion('exit offboarding templates')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-xs self-start transition-colors cursor-pointer"
            >
              Draft Exit Survey
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 7. WORKFORCE FINANCE ---
  if (module === 'finance') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100">
          <div>
            <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Workforce Finance & Payroll</h4>
            <p className="text-[11px] text-slate-400 font-medium">Verify employee salaries, custom allowances, and execute direct deposit transfers</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Payroll Status:</span>
            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-extrabold px-2 py-0.5 rounded">Processed (98%)</span>
          </div>
        </div>

        {/* Ledger table */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">Finance Pay Ledger</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-semibold border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                  <th className="py-2.5">Employee Name</th>
                  <th>Base Pay</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Remuneration</th>
                  <th>Payment Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {payroll.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-bold text-slate-900">{pay.name}</td>
                    <td>${pay.baseSalary.toLocaleString()}</td>
                    <td className="text-green-600">+${pay.allowances}</td>
                    <td className="text-rose-500">-${pay.deductions}</td>
                    <td className="text-slate-900 font-extrabold">${pay.netPay.toLocaleString()}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pay.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-600'
                          : pay.paymentStatus === 'Processed'
                          ? 'bg-sky-50 text-sky-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {pay.paymentStatus}
                      </span>
                    </td>
                    <td className="text-right">
                      {pay.paymentStatus !== 'Paid' && (
                        <button
                          onClick={() => handleProcessPayroll(pay.id)}
                          className="bg-[#2563eb] hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer select-none"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

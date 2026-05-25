/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertTriangle,
  Download,
  Check,
  X,
  MapPin,
  ChevronRight,
  Calendar,
  Layers,
  Percent,
  Coins,
  ShieldCheck,
  Compass,
  ArrowRight
} from 'lucide-react';

interface WorkforceFinanceViewProps {
  currentTab: 'overview' | 'salary' | 'payroll' | 'budget' | 'expense' | 'benefits';
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function WorkforceFinanceView({
  currentTab,
  onDraftAiSuggestion,
  showAlert,
}: WorkforceFinanceViewProps) {
  // Common states
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Interactive local states for approvals
  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 'pa-1',
      type: 'Salary Adjustment',
      priority: 'High',
      employee: 'Emily Davis',
      descr: 'Competitive salary adjustment based on recent engineering lead role',
      amount: 10000,
      date: '2024-04-10',
      status: 'pending',
    },
    {
      id: 'pa-2',
      type: 'Salary Adjustment',
      priority: 'Medium',
      employee: 'Emily Davis',
      descr: 'Annual market rate parity realignment for marketing coordinator',
      amount: 6500,
      date: '2024-04-10',
      status: 'pending',
    },
    {
      id: 'pa-3',
      type: 'Expense Approval',
      priority: 'Low',
      employee: 'Emily Davis',
      descr: 'Offsite design workshop catering and canvas rental supplies',
      amount: 1200,
      date: '2024-04-10',
      status: 'pending',
    },
    {
      id: 'pa-4',
      type: 'Expense Approval',
      priority: 'Low',
      employee: 'Emily Davis',
      descr: 'Client strategy dinner at Grand Brasserie including transport',
      amount: 850,
      date: '2024-04-10',
      status: 'pending',
    }
  ]);

  const [salaryAdjustRequests, setSalaryAdjustRequests] = useState([
    {
      id: 'sar-1',
      employee: 'Sarah Johnson',
      dept: 'Marketing',
      rating: '4.71/5.00',
      currentSalary: 85000,
      requestedSalary: 100000,
      increase: 15000,
      pct: '17.6%',
      reason: 'Annual performance increase + market adjustment',
      date: '2024-02-18',
      status: 'pending',
    },
    {
      id: 'sar-2',
      employee: 'Sarah Johnson',
      dept: 'Marketing',
      rating: '4.71/5.00',
      currentSalary: 85000,
      requestedSalary: 100000,
      increase: 15000,
      pct: '17.6%',
      reason: 'Annual performance increase + market adjustment',
      date: '2024-02-18',
      status: 'pending',
    }
  ]);

  const [expenseAwaiting, setExpenseAwaiting] = useState([
    {
      id: 'exp-1',
      title: 'Production Equipment Rental',
      priority: 'High',
      dept: 'Engineering Dev Team',
      reason: 'Temporary backup servers to meet high traffic during launch week',
      budget: 'Project Budget',
      requestedBy: 'John Smith',
      date: '2024-02-15',
      amount: 8500,
      status: 'pending',
    },
    {
      id: 'exp-2',
      title: 'Transportation Reimbursement',
      priority: 'Medium',
      dept: 'Sales Team',
      reason: 'Research team marketing travel and client on-site workshops',
      budget: 'Department Budget - Sales',
      requestedBy: 'Nelson Cruz',
      date: '2024-02-14',
      amount: 3200,
      status: 'pending',
    },
    {
      id: 'exp-3',
      title: 'Marketing Campaign Launch',
      priority: 'High',
      dept: 'Marketing Department',
      reason: 'Beacon ads and offline community billboard space lease',
      budget: 'Department Budget - Marketing',
      requestedBy: 'Sarah Johnson',
      date: '2024-02-13',
      amount: 12000,
      status: 'pending',
    }
  ]);

  // Action helpers
  const handleAction = (id: string, action: 'approve' | 'reject', listType: 'pending' | 'salary' | 'expense') => {
    if (listType === 'pending') {
      setPendingApprovals(prev => prev.filter(p => {
        if (p.id === id) {
          showAlert(`Successfully ${action === 'approve' ? 'Approved' : 'Rejected'} ${p.type} of $${p.amount.toLocaleString()}!`, 'success');
          return false;
        }
        return true;
      }));
    } else if (listType === 'salary') {
      setSalaryAdjustRequests(prev => prev.filter(p => {
        if (p.id === id) {
          showAlert(`Successfully ${action === 'approve' ? 'Approved' : 'Rejected'} Salary adjustment for ${p.employee}!`, 'success');
          return false;
        }
        return true;
      }));
    } else if (listType === 'expense') {
      setExpenseAwaiting(prev => prev.filter(p => {
        if (p.id === id) {
          showAlert(`Successfully ${action === 'approve' ? 'Approved' : 'Rejected'} Expense: ${p.title}!`, 'success');
          return false;
        }
        return true;
      }));
    }
  };

  // 1. OVERVIEW DATA
  const payrollTrendData = [
    { name: 'Aug', amount: 440000 },
    { name: 'Sep', amount: 445000 },
    { name: 'Oct', amount: 448000 },
    { name: 'Nov', amount: 452000 },
    { name: 'Dec', amount: 458000 },
    { name: 'Jan', amount: 455000 },
    { name: 'Feb', amount: 462000 }
  ];

  const deptBudgetUtilizationData = [
    { name: 'Marketing', spent: 400000, allocated: 500000 },
    { name: 'Sales', spent: 380000, allocated: 450000 },
    { name: 'Design', spent: 290000, allocated: 320000 },
    { name: 'Analytics', spent: 310000, allocated: 380000 },
    { name: 'HR', spent: 200000, allocated: 250000 },
    { name: 'Engineering', spent: 850000, allocated: 1000000 }
  ];

  // 2. SALARY DATA
  const scatterData = [
    { x: 55, y: 3.2, name: 'Analyst' },
    { x: 65, y: 3.5, name: 'Designer' },
    { x: 75, y: 3.8, name: 'Developer' },
    { x: 82, y: 4.1, name: 'Sr. Recruiter' },
    { x: 95, y: 4.5, name: 'Lead Dev' },
    { x: 110, y: 4.7, name: 'Manager' },
    { x: 125, y: 4.8, name: 'Director' }
  ];

  const deptSalaryData = [
    { name: 'Engineering', amount: 110000 },
    { name: 'Marketing', amount: 85000 },
    { name: 'Sales', amount: 80000 },
    { name: 'Design', amount: 90000 },
    { name: 'Analytics', amount: 95000 },
    { name: 'HR', amount: 75000 }
  ];

  // 5. EXPENSE DATA
  const expensePieData = [
    { name: 'Software Licenses', value: 45, color: '#1d4ed8' },
    { name: 'Equipment Rental', value: 25, color: '#3b82f6' },
    { name: 'Office Supplies', value: 15, color: '#93c5fd' },
    { name: 'Team Travel', value: 10, color: '#60a5fa' },
    { name: 'Miscellaneous', value: 5, color: '#bfdbfe' }
  ];

  const expenseTrendData = [
    { month: 'Sep', amount: 56000 },
    { month: 'Oct', amount: 62000 },
    { month: 'Nov', amount: 64000 },
    { month: 'Dec', amount: 68000 },
    { month: 'Jan', amount: 65000 },
    { month: 'Feb', amount: 72000 }
  ];

  // 6. BENEFITS DATA
  const benefitsDeptData = [
    { name: 'Engineering', value: 110500 },
    { name: 'Marketing', value: 102000 },
    { name: 'Sales', value: 98500 },
    { name: 'Design', value: 89000 },
    { name: 'Analytics', value: 92000 },
    { name: 'HR', value: 78000 }
  ];

  return (
    <div className="space-y-6">
      {/* 1. OVERVIEW VIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
                    <span className="bg-blue-50 text-blue-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {pendingApprovals.length} items
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">$53,500</h3>
                </div>
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expenses This Month</p>
                    <span className="bg-blue-50 text-blue-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      15 items
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">$22,300</h3>
                </div>
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Budget</p>
                    <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> +8%
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">$2.5M</h3>
                </div>
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Panel with blue outline */}
          <div className="bg-white rounded-2xl border border-blue-500/30 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-50">
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">i</span>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Recent Notifications</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 rounded-xl p-3.5 flex items-start gap-3 border border-slate-100">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[11.5px] font-bold text-slate-800 leading-tight">February payroll processing scheduled for Feb 25</h5>
                  <span className="text-[9.5px] text-slate-400 font-bold block mt-1">2024-02-18</span>
                </div>
              </div>

              <div className="bg-red-50/40 rounded-xl p-3.5 flex items-start gap-3 border border-red-50">
                <div className="w-7 h-7 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-[11.5px] font-bold text-slate-800 leading-tight">4 salary adjustments pending approval</h5>
                  <span className="text-[9.5px] text-red-500 font-bold block mt-1">2024-02-16</span>
                </div>
              </div>

              <div className="bg-amber-50/45 rounded-xl p-3.5 flex items-start gap-3 border border-amber-50">
                <div className="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-[11.5px] font-bold text-slate-800 leading-tight">Q1 budget review meeting on Feb 22</h5>
                  <span className="text-[9.5px] text-amber-600 font-bold block mt-1">2024-02-17</span>
                </div>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-3.5 flex items-start gap-3 border border-slate-100">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[11.5px] font-bold text-slate-800 leading-tight">Annual benefits enrollment opens March 1</h5>
                  <span className="text-[9.5px] text-slate-400 font-bold block mt-1">2024-02-15</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approval Requests Section */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Pending Approval Requests</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Review and Approve Salary adjustment requests</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((req) => (
                  <div key={req.id} className="bg-slate-50/55 rounded-2xl border border-slate-100 p-4.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-extrabold text-slate-800">{req.type}</h5>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              req.priority === 'High' ? 'bg-red-50 text-red-600' : req.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {req.priority}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Requester: {req.employee}</p>
                        </div>
                        <h4 className="text-sm font-black text-blue-600">${req.amount.toLocaleString()}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-2.5 bg-white p-2.5 rounded-xl border border-slate-100/70">{req.descr}</p>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-slate-100/90">
                      <span className="text-[10px] text-slate-400 font-bold">Requested: {req.date}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, 'reject', 'pending')}
                          className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'approve', 'pending')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <span className="text-xs font-semibold">No pending workforce requests for approval at this time.</span>
                </div>
              )}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Monthly Payroll Trend</h4>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={payrollTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Monthly Cost']} />
                    <Line type="monotone" dataKey="amount" stroke="#1d4ed8" strokeWidth={3} dot={{ fill: '#1d4ed8', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Department Budget Utilization</h4>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptBudgetUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700, pt: 10 }} />
                    <Bar dataKey="spent" name="Spent" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="allocated" name="Allocated" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALARY TABS */}
      {currentTab === 'salary' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Salary</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$87,450</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payroll</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$13.14M</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{salaryAdjustRequests.length}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Increase</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">8.5%</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>
          </div>

          {/* Salary Adjustment Requests Container */}
          <div className="bg-white rounded-2xl border border-blue-500/20 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-blue-600"><DollarSign className="w-4 h-4 stroke-[3]" /></span>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Salary Adjustment Requests</h4>
              </div>
              <button
                onClick={() => onDraftAiSuggestion('salary adjustment guidelines')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer select-none transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Compensation Guidance</span>
              </button>
            </div>

            <div className="space-y-3">
              {salaryAdjustRequests.length > 0 ? (
                salaryAdjustRequests.map((sar) => (
                  <div key={sar.id} className="bg-slate-50/70 rounded-2xl border border-slate-100 p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs font-mono">
                        SJ
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900">{sar.employee}</h5>
                          <span className="text-[10px] text-slate-400 font-semibold">{sar.dept}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          Performance: <strong className="text-emerald-600">{sar.rating}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-3.5 rounded-xl border border-slate-100/80 flex-1 max-w-2xl text-[11px] font-semibold">
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Current Salary</span>
                        <span className="text-slate-800">${sar.currentSalary.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Requested Salary</span>
                        <span className="text-[#2563eb] font-extrabold">${sar.requestedSalary.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Increase</span>
                        <span className="text-emerald-600 font-extrabold">+${sar.increase.toLocaleString()} ({sar.pct})</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Requested Date</span>
                        <span className="text-slate-700">{sar.date}</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center text-[11px] font-medium leading-normal bg-white/70 p-3 rounded-xl border border-slate-100 text-slate-650 max-w-xs flex-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Reason</span>
                      <p className="line-clamp-2">{sar.reason}</p>
                    </div>

                    <div className="flex gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleAction(sar.id, 'reject', 'salary')}
                        className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(sar.id, 'approve', 'salary')}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                  <span className="text-xs font-semibold">All salary adjustments fully reviewed.</span>
                </div>
              )}
            </div>
          </div>

          {/* Sub Row Charts AND Dept Data Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Correlation scatter chart */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Salary vs Performance Correlation</h4>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Salary" unit="k" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                    <YAxis type="number" dataKey="y" name="Performance" min={3} max={5} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Employees" data={scatterData} fill="#2563eb" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Salary by Department Bar chart */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Salary by Department</h4>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptSalaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Breakdowns details */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Staffing Breakdowns</h4>
              <div className="space-y-3.5 overflow-y-auto max-h-[220px]">
                {[
                  { name: 'Engineering', count: 45, avg: '$88k', total: '$4.43M' },
                  { name: 'Marketing', count: 28, avg: '$75k', total: '$2.10M' },
                  { name: 'Sales', count: 32, avg: '$65k', total: '$2.04M' }
                ].map((dep, idx) => (
                  <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100/80 flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-bold text-slate-800">{dep.name}</h5>
                      <span className="text-[10px] text-slate-400 font-semibold">{dep.count} employees</span>
                    </div>
                    <div className="text-right font-semibold">
                      <p className="text-slate-800">{dep.avg} avg</p>
                      <span className="text-[10px] text-blue-600 font-bold block">{dep.total} Total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Salary Details list */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-50">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Employee Salary Details</h4>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { name: 'John Smith', dept: 'Engineering', role: 'Lead Engineer', sal: '$110,000', perf: '4.5/5.0', join: '2020-03-15' },
                { name: 'Sarah Johnson', dept: 'Marketing', role: 'Marketing Manager', sal: '$95,000', perf: '4.7/5.0', join: '2019-06-20' },
                { name: 'Dr. Samantha Lee', dept: 'Analytics', role: 'Analytics Director', sal: '$125,000', perf: '4.8/5.0', join: '2019-01-10' }
              ].filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.role.toLowerCase().includes(searchQuery.toLowerCase())).map((emp, i) => (
                <div key={i} className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h5 className="text-[12px] font-black text-slate-800 leading-none">{emp.name}</h5>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">{emp.dept}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => showAlert(`Inspecting records for ${emp.name}`, 'info')}
                      className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-500 font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-100/80 text-[10.5px] font-semibold text-slate-700">
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase tracking-wider mb-0.5">Salary</span>
                      <strong className="text-blue-600 font-bold">{emp.sal}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase tracking-wider mb-0.5">Rating</span>
                      <span>{emp.perf}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase tracking-wider mb-0.5">Join Date</span>
                      <span className="text-slate-500">{emp.join}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest pb-1 border-b border-slate-50">Salary Audit Log</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[
                  { name: 'Michael Chen', action: 'Salary Adjustment', original: '$85,000', outcome: '$110,000', badge: 'Annual review', date: '2024-02-01', by: 'HR Manager' },
                  { name: 'Emily Rodriguez', action: 'New Employee', original: '$85,000', outcome: '$85,000', badge: 'New hire', date: '2024-01-15', by: 'Department Head' },
                  { name: 'Sarah Johnson', action: 'Bonus Payment', original: '$5,000', outcome: '$5,000', badge: 'Performance bonus', date: '2024-01-10', by: 'CFO' }
                ].map((log, i) => (
                  <div key={i} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/70 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-slate-900">{log.name}</h5>
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-md">{log.action}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                        <span>{log.original}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-[#2563eb]">{log.outcome}</span>
                        <span className="text-[9.5px] text-slate-400 font-bold ml-1">({log.badge})</span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-bold">
                      <p>{log.date}</p>
                      <span className="block mt-1 font-semibold text-slate-500">By {log.by}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Second column symmetric logs to match Image 2 */}
              <div className="space-y-3">
                {[
                  { name: 'Michael Chen', action: 'Salary Adjustment', original: '$85,000', outcome: '$110,000', badge: 'Annual review', date: '2024-02-01', by: 'HR Manager' },
                  { name: 'Emily Rodriguez', action: 'New Employee', original: '$85,000', outcome: '$85,000', badge: 'New hire', date: '2024-01-15', by: 'Department Head' },
                  { name: 'Sarah Johnson', action: 'Bonus Payment', original: '$5,000', outcome: '$5,000', badge: 'Performance bonus', date: '2024-01-10', by: 'CFO' }
                ].map((log, i) => (
                  <div key={i} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/70 flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-slate-900">{log.name}</h5>
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-md">{log.action}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                        <span>{log.original}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-[#2563eb]">{log.outcome}</span>
                        <span className="text-[9.5px] text-slate-400 font-bold ml-1">({log.badge})</span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-bold">
                      <p>{log.date}</p>
                      <span className="block mt-1 font-semibold text-slate-500">By {log.by}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PAYROLL TABS */}
      {currentTab === 'payroll' && (
        <div className="space-y-6 animate-fade-in font-sans">
          {/* Upcoming Payroll Schedule (Next 5 Days) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Upcoming Payroll Schedule (Next 5 Days)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { date: 'Feb 25', title: 'scheduled', val: '$425,680', label: '5 days left', color: 'bg-blue-600/10 text-blue-700' },
                { date: 'Feb 28', title: 'commission', val: '$15,000', label: '8 days left', color: 'bg-slate-100 text-slate-700 font-bold' },
                { date: 'Feb 28', title: 'bonus', val: '$12,500', label: '8 days left', color: 'bg-emerald-50 text-emerald-700' },
                { date: 'Mar 1', title: 'overtime', val: '$3,500', label: '9 days left', color: 'bg-indigo-50 text-indigo-700' }
              ].map((sch, i) => (
                <div key={i} className="bg-slate-50/70 rounded-2xl border border-slate-100/90 p-4 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[13px] font-black text-slate-900 leading-none">{sch.date}</h4>
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md inline-block mt-2 ${sch.color}`}>
                        {sch.title}
                      </span>
                    </div>
                    <h5 className="text-sm font-black text-slate-950">{sch.val}</h5>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold text-right uppercase tracking-wider">{sch.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtering row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-bold"
                />
              </div>

              <select className="bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-3 text-xs text-slate-600 font-bold focus:outline-none cursor-pointer">
                <option>Department</option>
              </select>
              <select className="bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-3 text-xs text-slate-600 font-bold focus:outline-none cursor-pointer">
                <option>Salary Range</option>
              </select>
              <select className="bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-3 text-xs text-slate-600 font-bold focus:outline-none cursor-pointer">
                <option>Period</option>
              </select>
              <select className="bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-3 text-xs text-slate-600 font-bold focus:outline-none cursor-pointer">
                <option>Job Type</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs py-1.5 px-3.5 flex items-center gap-1.5 cursor-pointer">
                <Compass className="w-3.5 h-3.5" />
                <span>Sort</span>
              </button>
              <button
                onClick={() => showAlert('Initiated CSV summary download', 'success')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs py-1.5 px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employee Payroll Details (3)</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { name: 'Sarah Johnson', role: 'Lead Engineer', base: '$110,000', pension: '$550', gross: '$9,167', tax: '$2,292', net: '$6,325' },
                { name: 'Sarah Johnson', role: 'Lead Engineer', base: '$110,000', pension: '$550', gross: '$9,167', tax: '$2,292', net: '$6,325' },
                { name: 'Sarah Johnson', role: 'Lead Engineer', base: '$110,000', pension: '$550', gross: '$9,167', tax: '$2,292', net: '$6,325' }
              ].map((emp, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      {emp.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-none">{emp.name}</h4>
                      <span className="text-[10px] text-slate-405 font-bold block mt-1 uppercase">{emp.role}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3.5 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Base Salary</span>
                      <span className="text-slate-800 font-extrabold">{emp.base}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Pension</span>
                      <span className="text-slate-800 font-extrabold">{emp.pension}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Monthly Gross</span>
                      <span className="text-slate-800 font-extrabold">{emp.gross}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest mb-0.5 text-rose-450">Tax</span>
                      <span className="text-rose-500 font-extrabold">{emp.tax}</span>
                    </div>
                  </div>

                  <div className="bg-[#f0f4ff]/70 px-4 py-2.5 rounded-xl border border-[#2563eb]/5 flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider">Net Pay</span>
                    <strong className="text-[#2563eb] text-[13px] font-black">{emp.net}</strong>
                  </div>

                  <button
                    onClick={() => showAlert(`Displaying payment history for ${emp.name}`, 'info')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer select-none"
                  >
                    View Payment History
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Payment Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Monthly Payment Summary</h4>
              <button
                onClick={() => showAlert('Prepared Excel sheets download', 'success')}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-605 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { name: 'January 2024', count: '150 employees', gross: '$1,095,600', pension: '$50,000', tax: '$273,800', net: '$755,964' },
                { name: 'February 2024', count: '155 employees', gross: '$1,120,000', pension: '$52,000', tax: '$280,000', net: '$780,000' },
                { name: 'March 2024', count: '160 employees', gross: '$1,150,000', pension: '$54,000', tax: '$290,000', net: '$800,000' }
              ].map((sum, i) => (
                <div key={i} className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 p-4.5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs">JS</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-none">{sum.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold block mt-1">{sum.count}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 text-[11px] font-semibold text-slate-600">
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider">Total Gross</span>
                      <strong className="text-slate-800">${sum.gross}</strong>
                    </div>
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider">Total Pension</span>
                      <strong className="text-slate-800">${sum.pension}</strong>
                    </div>
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider text-rose-450">Total Tax</span>
                      <strong className="text-rose-500">${sum.pension}</strong>
                    </div>
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider text-[#2563eb]">Total Net</span>
                      <strong className="text-[#2563eb]">${sum.net}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => showAlert(`Inspecting ledger stats for ${sum.name}`, 'info')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    View Payment History
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. BUDGET TABS */}
      {currentTab === 'budget' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Allocated</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$1.79M</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$1.25M</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$0.55M</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilization</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">69.6%</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>
          </div>

          {/* Budget Management Banner */}
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div>
              <h4 className="text-[14px] font-black text-slate-900 tracking-tight">Budget Management</h4>
              <p className="text-[11px] text-slate-400 font-semibold font-sans">Create and manage different budget types for your organization</p>
            </div>
            <button
              onClick={() => onDraftAiSuggestion('budget planning framework')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Request Budget Reallocation</span>
            </button>
          </div>

          {/* Department Budgets double columns chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Department Budget vs Actual Spending</h4>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBudgetUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                  <Bar dataKey="allocated" name="Allocated" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Current Budget Allocations cards */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Current Budget Allocations</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Project Budget', tier: 'Q1 2024', text: 'Development of new product features and infrastructure upgrades', tags: ['Engineering', 'Product', 'Design'], alloc: '$850,000', spent: '$625,000', rem: '$225,000', pct: 73.5 },
                { name: 'Culture Building', tier: 'Q1 2024', text: 'Development of new product features and infrastructure upgrades', tags: ['Engineering', 'Product', 'Design'], alloc: '$850,000', spent: '$625,000', rem: '$225,000', pct: 73.5 },
                { name: 'Project Budget', tier: 'Q1 2024', text: 'Development of new product features and infrastructure upgrades', tags: ['Engineering', 'Product', 'Design'], alloc: '$850,000', spent: '$625,000', rem: '$225,000', pct: 73.5 },
                { name: 'Culture Building', tier: 'Q1 2024', text: 'Development of new product features and infrastructure upgrades', tags: ['Engineering', 'Product', 'Design'], alloc: '$850,000', spent: '$625,000', rem: '$225,000', pct: 73.5 }
              ].map((bud, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 hover:shadow-xs transition-shadow">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-50">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">{bud.name}</h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1.5">{bud.tier}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-650 font-bold px-2.5 py-0.5 rounded-md">
                      Pending
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{bud.text}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {bud.tags.map((tag) => (
                      <span key={tag} className="text-[9px] bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-slate-50 text-[10.5px] font-semibold text-slate-700">
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider mb-0.5">Allocated</span>
                      <strong className="text-slate-900 font-extrabold">{bud.alloc}</strong>
                    </div>
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider text-blue-600">Spent</span>
                      <strong className="text-blue-600 font-extrabold">{bud.spent}</strong>
                    </div>
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider">Remaining</span>
                      <strong className="text-slate-800 font-extrabold">{bud.rem}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>UTILIZATION</span>
                      <span className="text-slate-700">{bud.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${bud.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Annual Budgets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Previous Annual Budgets</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { year: 'Year 2022', variance: 'Variance: Under by $220,000', total: '$7.20M', alloc: '$7.20M', spent: '$6.98M' },
                { year: 'Year 2022', variance: 'Variance: Under by $220,000', total: '$7.20M', alloc: '$7.20M', spent: '$6.98M' }
              ].map((an, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-100/60">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">{an.year}</h4>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
                        {an.variance}
                      </p>
                    </div>
                    <h3 className="text-sm font-black text-blue-700">{an.total}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold">
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Total Allocated</span>
                      <strong className="text-slate-800">{an.alloc}</strong>
                    </div>
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Total Spent</span>
                      <strong className="text-slate-800">{an.spent}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2.5">Department Breakdown</span>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-550">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                        <span>Engineering:</span>
                        <strong className="text-blue-600 font-bold">$2,100k</strong>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                        <span>Marketing:</span>
                        <strong className="text-blue-600 font-bold">$820k</strong>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                        <span>Sales:</span>
                        <strong className="text-blue-600 font-bold">$1250k</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. EXPENSE TABS */}
      {currentTab === 'expense' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expense</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$683.7k</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Compass className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{expenseAwaiting.length}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Clock className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unexpected</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">2</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-650 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Month</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$654k</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>
          </div>

          {/* Breakdown / Pie Charts & Line charts split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Expense Breakdown</h4>
              <div className="flex items-center justify-between gap-4">
                <div className="w-[140px] h-[140px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 flex-1 text-[10.5px] font-bold text-slate-600">
                  {expensePieData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-1.5 rounded border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 block" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="text-slate-800 font-extrabold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Monthly Expense Trend</h4>
              <div className="h-[148px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Expense Requests Awaiting Approval */}
          <div className="bg-white rounded-2xl border border-blue-500/20 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1">
              <span>●</span>
              <span>Expense Requests Awaiting Approval ({expenseAwaiting.length})</span>
            </h4>

            <div className="space-y-4">
              {expenseAwaiting.length > 0 ? (
                expenseAwaiting.map((exp) => (
                  <div key={exp.id} className="bg-slate-50/50 p-4.5 rounded-2xl border border-slate-105 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-900">{exp.title}</h4>
                        <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          exp.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {exp.priority}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-bold uppercase">{exp.dept}</p>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">{exp.reason}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200/50 text-[10px] font-semibold text-slate-600 flex-none w-full md:w-80">
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Project</span>
                        <span className="text-slate-800 font-bold block truncate">{exp.budget}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Requested By</span>
                        <span className="text-slate-800 font-bold block truncate">{exp.requestedBy}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Requested Date</span>
                        <span className="text-slate-700 block">{exp.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between md:justify-center">
                      <h4 className="text-base font-black text-blue-600">${exp.amount.toLocaleString()}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(exp.id, 'reject', 'expense')}
                          className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(exp.id, 'approve', 'expense')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-xs"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                  <span>All expense requests processed.</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses cards list */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recent Expenses</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'Office Supplies', amount: '$2,500', budget: 'Miscellaneous Budget', resp: 'Operations Team', status: 'Completed', date: 'Feb 2024' },
                { title: 'Software Licenses', amount: '$15,000', budget: 'Department Budget - Engineering', resp: 'IT Department', status: 'Completed', date: 'Feb 2024' },
                { title: 'Team Building', amount: '$4,500', budget: 'Culture Building', resp: 'HR Department', status: 'Unassigned', date: 'Jan 2024' }
              ].map((rec, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-105 p-5 space-y-4 shadow-xs">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-50">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 leading-none">{rec.title}</h5>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block mt-2 ${
                        rec.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-950">{rec.amount}</h4>
                  </div>

                  <div className="text-[10.5px] font-semibold text-slate-600 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Part Budget:</span>
                      <strong className="text-slate-800 truncate block max-w-[140px]">{rec.budget}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Responsibility:</span>
                      <strong className="text-slate-800">{rec.resp}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Date:</span>
                      <strong className="text-slate-700">{rec.date}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unexpected Expenses Warnings */}
          <div className="bg-red-50/20 rounded-2xl border border-rose-500/20 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-red-700 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Unexpected Expenses (2)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-red-500/[0.04] p-4 rounded-xl border border-red-50 border-l-4 border-l-red-500 flex justify-between items-start">
                <div>
                  <h5 className="text-xs font-extrabold text-red-800">Emergency equipment repair</h5>
                  <p className="text-[10.5px] text-slate-505 font-bold mt-1">Date: 2024-02-12</p>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block mt-2">Covered by Buffer Budget</span>
                </div>
                <div className="text-right font-semibold">
                  <h5 className="font-extrabold text-red-700">$5,200</h5>
                  <span className="text-[10px] text-slate-400 mt-1 block">Approved by: CTO</span>
                </div>
              </div>

              <div className="bg-red-500/[0.04] p-4 rounded-xl border border-red-50 border-l-4 border-l-red-500 flex justify-between items-start">
                <div>
                  <h5 className="text-xs font-extrabold text-red-800">Legal consultation fees</h5>
                  <p className="text-[10.5px] text-slate-505 font-bold mt-1">Date: 2024-02-10</p>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block mt-2">Covered by Buffer Budget</span>
                </div>
                <div className="text-right font-semibold">
                  <h5 className="font-extrabold text-red-700">$3,800</h5>
                  <span className="text-[10px] text-slate-400 mt-1 block">Approved by: CEO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expense History Cards */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-404 uppercase tracking-wider block font-sans">Expense History</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { period: 'January 2024', total: '$683,720', details: ['Salaries & Benefits $458,000', 'Operations $124,000', 'Marketing $48,000', 'Equipment $45,000', 'Other $8,720'] },
                { period: 'December 2023', total: '$855,280', details: ['Salaries & Benefits $482,000', 'Operations $185,000', 'Marketing $120,000', 'Equipment $52,000', 'Other $16,280'] }
              ].map((hist, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100/60">
                    <h4 className="text-xs font-black text-slate-900">{hist.period}</h4>
                    <span className="text-sm font-black text-blue-600">Total Expenses: {hist.total}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-semibold text-slate-600">
                    {hist.details.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px]">
                        {item.split(' ').slice(0, -1).join(' ')}: <strong className="text-slate-800">{item.split(' ').slice(-1)[0]}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. BENEFITS VIEW */}
      {currentTab === 'benefits' && (
        <div className="space-y-6 animate-fade-in font-sans">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Benefits Value</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$2.85M</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-emerald-600 font-bold text-xs flex items-center justify-center">+12%</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg per Employee</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">$18,269</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center">-5%</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Enrollments</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">150</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1a56db] flex items-center justify-center"><Percent className="w-4 h-4" /></div>
            </div>
          </div>

          {/* Annual Profit Sharing */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Annual Profit Sharing</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold font-sans">
              <div className="bg-[#eff6ff] p-4.5 rounded-2xl border border-blue-100 text-center">
                <span className="block text-[9.5px] text-blue-500 uppercase tracking-widest">Total Pool</span>
                <h3 className="text-xl font-black text-blue-600 mt-1.5">$450,000</h3>
              </div>
              <div className="bg-slate-50 p-4.5 rounded-2xl text-center border border-slate-150">
                <span className="block text-[9.5px] text-slate-400 uppercase tracking-widest">Eligible Employees</span>
                <h3 className="text-xl font-black text-slate-800 mt-1.5">142</h3>
              </div>
              <div className="bg-slate-50 p-4.5 rounded-2xl text-center border border-slate-150">
                <span className="block text-[9.5px] text-slate-400 uppercase tracking-widest">Payout per Employee</span>
                <h3 className="text-xl font-black text-slate-850 mt-1.5">$3,169</h3>
              </div>
            </div>

            <div className="space-y-1 block">
              <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Division-by-Tier details</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { name: 'Executive', count: 5, value: 'Executive: 5 employees', label: '$15,000 avg', width: '10%' },
                  { name: 'Mid-level', count: 55, value: 'Mid-level: 55 employees', label: '$3,500 avg', width: '70%' },
                  { name: 'Senior', count: 25, value: 'Senior: 25 employees', label: '$10,000 avg', width: '30%' },
                  { name: 'Junior', count: 57, value: 'Junior: 57 employees', label: '$1,500 avg', width: '90%' }
                ].map((tier, i) => (
                  <div key={i} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-2">
                    <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-700">
                      <span>{tier.name}</span>
                      <span className="text-slate-450">{tier.label}</span>
                    </div>
                    {/* Linear slider mock indicator */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: tier.width }} />
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-bold block">{tier.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Annual Performance Bonuses */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Annual Performance Bonuses</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="block text-[9.5px] text-slate-400 uppercase tracking-widest font-bold">Total Budget</span>
                <h3 className="text-lg font-black text-slate-900 mt-1.5">$320,000</h3>
              </div>
              <div className="bg-blue-50 p-4.5 rounded-2xl border border-blue-100">
                <span className="block text-[9.5px] text-blue-500 uppercase tracking-widest font-bold">Paid Out</span>
                <h3 className="text-lg font-black text-blue-600 mt-1.5">$285,000</h3>
              </div>
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="block text-[9.5px] text-slate-400 uppercase tracking-widest font-bold">Pending</span>
                <h3 className="text-lg font-black text-slate-800 mt-1.5">$35,000</h3>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Top Recipients</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((rec) => (
                  <div key={rec} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">JS</div>
                      <div>
                        <h5 className="font-bold text-slate-800 leading-none">John Smith</h5>
                        <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase leading-none truncate">Outstanding Leadership</p>
                      </div>
                    </div>
                    <strong className="text-blue-600 font-black">$12,000</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Allowances */}
          <div className="space-y-1.5 animate-fade-in block">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Monthly Allowances</span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: 'Transportation Allowance', pct: 85, allocated: '$40,000', count: '120 employees', max: '$175' },
                { title: 'Meal Allowance', pct: 100, allocated: '$35,000', count: '150 employees', max: '$233' },
                { title: 'Remote Work Stipend', pct: 50, allocated: '$20,000', count: '45 employees', max: '$115' },
                { title: 'Phone & Internet Stipend', pct: 100, allocated: '$15,000', count: '150 employees', max: '$70' }
              ].map((all, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3 shadow-xs">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-50">
                    <h5 className="text-[11.5px] font-black text-slate-900 leading-tight block max-w-[140px]">{all.title}</h5>
                    <span className="text-[10px] bg-[#eff6ff] text-blue-600 font-extrabold px-1.5 py-0.5 rounded-md">
                      {all.pct}%
                    </span>
                  </div>

                  <div className="space-y-2.5 text-[10.5px] font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Monthly Budget:</span>
                      <strong className="text-slate-800">{all.allocated}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Enrolled Employees:</span>
                      <strong className="text-slate-800">{all.count}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Per Employee Max:</span>
                      <strong className="text-blue-600 font-bold">{all.max}</strong>
                    </div>
                  </div>

                  {/* Slider indicator */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${all.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insurance columns */}
          <div className="space-y-1.5 block">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Insurance Benefits</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Health Insurance', total: '$125,000/mo', employer: '85%', employee: '15%', coverage: 'Medical, Dental, Vision', enrolled: '150 employees' },
                { name: 'Dental Insurance', total: '$15,000/mo', employer: '85%', employee: '15%', coverage: 'Medical, Dental, Vision', enrolled: '151 employees' } // micro mismatch to resemble Image 4
              ].map((ins, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <h5 className="text-[12.5px] font-black text-slate-900 leading-none">{ins.name}</h5>
                    <span className="text-sm font-black text-blue-600">{ins.total}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-[10.5px] font-semibold text-slate-600">
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100/80">
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Employer</span>
                      <strong className="text-slate-900">{ins.employer}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100/80">
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Employee</span>
                      <strong className="text-slate-900">{ins.employee}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100/80">
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Enrolled</span>
                      <strong className="text-[#2563eb]">{ins.enrolled}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retirement benefits matches Image 4 */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Retirement Benefits</h4>
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="flex-1 md:pr-6 pb-4 md:pb-0 space-y-1.5">
                <h5 className="text-xs font-extrabold text-slate-900">401(k) with Company Match</h5>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  The company matches 100% of employee contributions up to 4% of their structural base salary. Immediate vesting rules apply.
                </p>
              </div>

              <div className="flex-1 md:px-6 py-4 md:py-0 grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Participants</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">145</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-105">
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Participation Rate</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">93%</span>
                </div>
              </div>

              <div className="flex-1 md:pl-6 pt-4 md:pt-0 grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <span className="block text-[9px] text-blue-500 uppercase font-bold tracking-wider">Employer Match</span>
                  <span className="text-sm font-extrabold text-blue-600 mt-1 block">$93k</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[9px] text-slate-450 uppercase font-bold tracking-wider">Total Contributions</span>
                  <span className="text-sm font-extrabold text-[#111827] mt-1 block">$185k</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Benefits & Perks Grid Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-50">
              <span className="text-blue-600"><Compass className="w-4 h-4 stroke-[2.5]" /></span>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Additional Benefits & Perks</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { title: 'Professional Development', details: 'Budget: $15,000 • Participants: 30', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
                { title: 'Wellness Programs', details: 'Budget: $12,000 • Participants: 120', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
                { title: 'Gym Membership', details: 'Budget: $4,000 • Participants: 95', icon: ShieldCheck, color: 'text-sky-600 bg-sky-50' },
                { title: 'Childcare Assistance', details: 'Budget: $35,050 • Participants: 20', icon: ShieldCheck, color: 'text-teal-600 bg-teal-50' },
                { title: 'Tuition Reimbursement', details: 'Budget: $72,500 • Participants: 8', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' },
                { title: 'Employee Assistance Program', details: 'Budget: $19,500 • Participants: 153', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50' }
              ].map((perk, i) => {
                const Icon = perk.icon;
                return (
                  <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/70 flex items-start gap-3.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${perk.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-[11.5px] font-black text-slate-900 leading-tight">{perk.title}</h5>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">{perk.details}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart value by department bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Benefits Value by Department</h4>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={benefitsDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1e40af" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Benefits Department metrics</h4>
              <div className="space-y-3">
                {[
                  { name: 'Engineering', employees: '45 employees', val: '$110.5k avg' },
                  { name: 'Marketing', employees: '28 employees', val: '$102.0k avg' },
                  { name: 'Sales', employees: '32 employees', val: '$98.5k avg' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-bold text-slate-800">{item.name}</h5>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.employees}</span>
                    </div>
                    <strong className="text-blue-600 font-extrabold">{item.val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

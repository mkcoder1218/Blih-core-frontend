/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Bookmark,
  BookOpen,
  Award,
  Clock,
  AlertTriangle,
  Building,
  User,
  Check,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Inbox
} from 'lucide-react';

interface CareerManagementViewProps {
  currentTab: 'overview' | 'career' | 'training' | 'culture';
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

// Type declarations
interface PendingRequest {
  id: string;
  type: 'Promotion' | 'Discipline' | 'Training';
  title: string;
  applicant: {
    name: string;
    role: string;
    dept: string;
  };
  priority: 'High' | 'Medium' | 'Low';
  details: string;
  dueDate: string;
}

interface CareerPromotion {
  id: string;
  name: string;
  role: string;
  dept: string;
  kpi: number;
  yearsInRole: number;
  targetRole: string;
  effectiveDate: string;
  justification: string;
  status: 'Pending Review' | 'Approved' | 'Justified';
}

interface SalaryRequest {
  id: string;
  name: string;
  dept: string;
  currentSalary: string;
  requestedSalary: string;
  justification: string;
}

interface SkillGapEmp {
  id: string;
  name: string;
  dept: string;
  status: 'ongoing' | 'completed';
  progress: number;
  dueDate?: string;
  skillGaps: string[];
  recommendedActions?: string[];
}

export default function CareerManagementView({
  currentTab,
  onDraftAiSuggestion,
  showAlert,
}: CareerManagementViewProps) {

  // --- 1. OVERVIEW DATA & STATE ---
  const [pendingOverviewRequests, setPendingOverviewRequests] = useState<PendingRequest[]>([
    {
      id: 'or-1',
      type: 'Promotion',
      title: 'Promotion Request',
      applicant: { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'TECHNICAL DEPT.' },
      priority: 'Medium',
      details: 'Promotion to Senior Marketing Manager', // to match literal text in Image 1: "Promotion to Senior Marketing Manager"
      dueDate: '2024-02-28',
    },
    {
      id: 'or-2',
      type: 'Discipline',
      title: 'Discipline Review',
      applicant: { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'TECHNICAL DEPT.' },
      priority: 'Low',
      details: 'Promotion to Senior Marketing Manager', // to match literal text: "Promotion to Senior Marketing Manager" as shown in picture
      dueDate: '2024-02-28',
    },
    {
      id: 'or-3',
      type: 'Training',
      title: 'Training Request',
      applicant: { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'TECHNICAL DEPT.' },
      priority: 'Medium',
      details: 'Advanced Cloud Architecture certification',
      dueDate: '2024-02-28',
    },
    {
      id: 'or-4',
      type: 'Training',
      title: 'Training Request',
      applicant: { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'TECHNICAL DEPT.' },
      priority: 'High',
      details: 'Advanced Cloud Architecture certification',
      dueDate: '2024-02-28',
    },
  ]);

  const handleOverviewApprove = (id: string, name: string, label: string) => {
    setPendingOverviewRequests(prev => prev.filter(r => r.id !== id));
    showAlert(`Approved ${label} for ${name} successfully!`, 'success');
  };

  const handleOverviewJustify = (id: string, name: string, label: string) => {
    showAlert(`Requested justification for ${name}'s ${label}.`, 'info');
    onDraftAiSuggestion(`Request a detailed formal justification process for ${name}'s ${label}.`);
  };

  // --- 2. CAREER MANAGEMENT STATE ---
  const [promotions, setPromotions] = useState<CareerPromotion[]>([
    {
      id: 'p-1',
      name: 'Sarah Johnson',
      role: 'Marketing Specialist',
      dept: 'Marketing',
      kpi: 90,
      yearsInRole: 3,
      targetRole: 'Senior Marketing Manager',
      effectiveDate: 'Dec 14, 2025',
      justification: 'Consistently exceeded targets, demonstrated strong leadership, and successfully led 5 major campaigns.',
      status: 'Pending Review',
    },
    {
      id: 'p-2',
      name: 'Sarah Johnson',
      role: 'Marketing Specialist',
      dept: 'Marketing',
      kpi: 90,
      yearsInRole: 3,
      targetRole: 'Senior Marketing Manager',
      effectiveDate: 'Dec 14, 2025',
      justification: 'Consistently exceeded targets, demonstrated strong leadership, and successfully led 5 major campaigns.',
      status: 'Pending Review',
    },
  ]);

  const [salaries, setSalaries] = useState<SalaryRequest[]>([
    {
      id: 's-1',
      name: 'Emily Rodriguez',
      dept: 'Analytics',
      currentSalary: '$95,000',
      requestedSalary: '$110,000',
      justification: 'Market adjustment and performance-based increase.',
    },
    {
      id: 's-2',
      name: 'Emily Rodriguez',
      dept: 'Analytics',
      currentSalary: '$95,000',
      requestedSalary: '$110,000',
      justification: 'Market adjustment and performance-based increase.',
    },
    {
      id: 's-3',
      name: 'David Lee',
      dept: 'Design',
      currentSalary: '$78,000',
      requestedSalary: '$85,000',
      justification: 'Cost of living adjustment',
    },
  ]);

  const handleApprovePromo = (id: string, name: string) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
    showAlert(`Approved Sarah Johnson's promotion request!`, 'success');
  };

  const handleJustifyPromo = (id: string, name: string) => {
    showAlert(`Justification log triggered for ${name}'s promotion.`, 'info');
  };

  const handleApproveSalary = (id: string, name: string) => {
    setSalaries(prev => prev.filter(s => s.id !== id));
    showAlert(`Approved salary adjustment request for ${name}!`, 'success');
  };

  const handleRejectSalary = (id: string, name: string) => {
    setSalaries(prev => prev.filter(s => s.id !== id));
    showAlert(`Declined salary adjustment request for ${name}.`, 'info');
  };

  // Directory / Table state inside Career
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('Name');
  const [currentPage, setCurrentPage] = useState(1);

  const [careerTableRows, setCareerTableRows] = useState([
    {
      id: 'ctr-1',
      name: 'Jessica Parker',
      role: 'Full Stack Developer',
      dept: 'TECHNICAL DEPT.',
      email: 'jessica@company.com',
      phone: '+251 967 76 6353',
      startDate: 'Junior Full stack dev',
      from: 'Dec 30, 2025',
      to: 'Senior Full stack d',
      applicationDate: '2024-02-01',
      status: 'rejected'
    },
    {
      id: 'ctr-2',
      name: 'Jessica Parker',
      role: 'Full Stack Developer',
      dept: 'TECHNICAL DEPT.',
      email: 'jessica@company.com',
      phone: '+251 967 76 6353',
      startDate: 'Junior Full stack dev',
      from: 'Dec 30, 2025',
      to: 'Senior Full stack d',
      applicationDate: '2024-02-01',
      status: 'approved'
    },
    {
      id: 'ctr-3',
      name: 'Jessica Parker',
      role: 'Full Stack Developer',
      dept: 'TECHNICAL DEPT.',
      email: 'jessica@company.com',
      phone: '+251 967 76 6353',
      startDate: 'Junior Full stack dev',
      from: 'Dec 30, 2025',
      to: 'Senior Full stack d',
      applicationDate: '2024-02-01',
      status: 'approved'
    },
    {
      id: 'ctr-4',
      name: 'Sarah Johnson',
      role: 'Marketing Specialist',
      dept: 'Marketing',
      email: 'sarah.j@company.com',
      phone: '+251 911 32 4567',
      startDate: 'Marketing Associate',
      from: 'Jan 15, 2025',
      to: 'Senior Specialist',
      applicationDate: '2024-02-10',
      status: 'approved'
    },
    {
      id: 'ctr-5',
      name: 'Emily Rodriguez',
      role: 'Analytics Expert',
      dept: 'Analytics',
      email: 'emily.r@company.com',
      phone: '+251 920 11 8899',
      startDate: 'Junior Analyst',
      from: 'Feb 10, 2025',
      to: 'Senior Lead Analyst',
      applicationDate: '2024-02-12',
      status: 'rejected'
    },
    {
      id: 'ctr-6',
      name: 'David Lee',
      role: 'Senior UI/UX designer',
      dept: 'Design',
      email: 'david.l@company.com',
      phone: '+251 940 33 2211',
      startDate: 'Mid Designer',
      from: 'Mar 01, 2025',
      to: 'Principal Designer',
      applicationDate: '2024-02-15',
      status: 'approved'
    },
    {
      id: 'ctr-7',
      name: 'Lisa Martinez',
      role: 'PR Coordinator',
      dept: 'Marketing',
      email: 'lisa.m@company.com',
      phone: '+251 915 22 7766',
      startDate: 'PR Assistant',
      from: 'Mar 10, 2025',
      to: 'PR Lead Manager',
      applicationDate: '2024-02-18',
      status: 'approved'
    },
    {
      id: 'ctr-8',
      name: 'John Smith',
      role: 'Cloud Systems dev',
      dept: 'TECHNICAL DEPT.',
      email: 'john.s@company.com',
      phone: '+251 954 88 9900',
      startDate: 'Mid Cloud architect',
      from: 'Apr 01, 2025',
      to: 'Senior Cloud Principal',
      applicationDate: '2024-02-22',
      status: 'approved'
    }
  ]);

  const filteredRows = careerTableRows.filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) || row.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFrom = !filterFrom || row.from.toLowerCase().includes(filterFrom.toLowerCase());
    const matchesTo = !filterTo || row.to.toLowerCase().includes(filterTo.toLowerCase());
    const matchesDate = !filterDate || row.applicationDate.includes(filterDate);
    return matchesSearch && matchesFrom && matchesTo && matchesDate;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortOrder === 'Name') return a.name.localeCompare(b.name);
    if (sortOrder === 'Department') return a.dept.localeCompare(b.dept);
    if (sortOrder === 'Date') return b.applicationDate.localeCompare(a.applicationDate);
    return 0;
  });


  // --- 3. TRAINING & SKILLS STATE ---
  const [trainingRequests, setTrainingRequests] = useState([
    {
      id: 'tr-1',
      name: 'John Smith',
      dept: 'Engineering',
      program: 'Advanced Cloud Architecture',
      provider: 'AWS',
      cost: '$2,500',
      duration: '5 days',
      startDate: '2024-03-15',
      justification: 'Required for upcoming cloud migration project.',
      status: 'Pending'
    },
    {
      id: 'tr-2',
      name: 'Sarah Johnson',
      dept: 'Marketing',
      program: 'Digital Marketing Analytics',
      provider: 'Google',
      cost: '$2,500',
      duration: '5 days',
      startDate: '2024-03-15',
      justification: 'Required for upcoming cloud migration project.',
      status: 'Pending'
    }
  ]);

  const handleApproveTraining = (id: string, name: string) => {
    setTrainingRequests(prev => prev.filter(t => t.id !== id));
    showAlert(`Approved ${name}'s training request successfully!`, 'success');
  };

  const handleRejectTraining = (id: string, name: string) => {
    setTrainingRequests(prev => prev.filter(t => t.id !== id));
    showAlert(`Rejected ${name}'s training request.`, 'info');
  };

  const [skillGapEmployees, setSkillGapEmployees] = useState<SkillGapEmp[]>([
    {
      id: 'sg-1',
      name: 'David Lee',
      dept: 'Design',
      status: 'ongoing',
      progress: 65,
      dueDate: '2024-02-29',
      skillGaps: ['Advanced Figma', 'Design Systems', 'Accessibility'],
    },
    {
      id: 'sg-2',
      name: 'Lisa Martinez',
      dept: 'Marketing',
      status: 'completed',
      progress: 100,
      skillGaps: ['Team Management', 'Strategic Planning'],
      recommendedActions: ['Leadership training program', 'Mentorship with senior manager']
    }
  ]);

  const handleAuditSkillGap = (id: string, name: string) => {
    showAlert(`Initiated skill gap assessment review for ${name}.`, 'info');
  };


  // --- 4. CULTURE STATE ---
  const handleReadPolicy = (title: string) => {
    showAlert(`Opening Policy Documentation: ${title}`, 'success');
  };


  return (
    <div id="career-management-view-root" className="space-y-8 font-sans max-w-7xl mx-auto">

      {/* ========================================================= */}
      {/* 1. OVERVIEW TAB VIEW */}
      {/* ========================================================= */}
      {currentTab === 'overview' && (
        <div id="tab-overview-content" className="space-y-6">
          
          {/* Main Title Banner & AI Draft Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h1 id="overview-title" className="text-xl font-bold text-slate-900 tracking-tight">Pending Approval Requests</h1>
              <p className="text-xs text-slate-500 mt-1">Review and approve requests.</p>
            </div>
          </div>

          {/* Core Row Grid of 4 approval requests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pendingOverviewRequests.length === 0 ? (
              <div className="col-span-full border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400 bg-white">
                <Inbox className="w-10 h-10 mx-auto stroke-1 mb-2" />
                <p className="text-xs font-semibold">All overview requests have been verified.</p>
              </div>
            ) : (
              pendingOverviewRequests.map((req) => (
                <div
                  key={req.id}
                  id={`req-card-${req.id}`}
                  className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top User Info & Priority Block */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a56db] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                          {req.applicant.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{req.applicant.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">{req.applicant.role}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full uppercase scale-90">
                              {req.applicant.dept}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Priority Tag matching Image 1 exact style */}
                      <span className={`text-[10px] font-medium border rounded-md px-2 py-0.5 leading-none ${
                        req.priority === 'High'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : req.priority === 'Medium'
                          ? 'border-slate-200 bg-slate-50 text-slate-700'
                          : 'border-slate-100 bg-slate-50 text-slate-500'
                      }`}>
                        {req.priority}
                      </span>
                    </div>

                    {/* Middle Request details */}
                    <div>
                      <p className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">{req.title}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{req.details}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Due: {req.dueDate}</p>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50">
                    <button
                      onClick={() => handleOverviewApprove(req.id, req.applicant.name, req.title)}
                      className="flex-1 bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg cursor-pointer transition-colors text-center"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleOverviewJustify(req.id, req.applicant.name, req.title)}
                      className="flex-1 border border-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors text-center bg-white"
                    >
                      Justify
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Middle 4-KPI Row Stat Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Active Career Paths</span>
                <p className="text-2xl font-black text-slate-900 mt-1">156</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Bookmark className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Training Programs</span>
                <p className="text-2xl font-black text-slate-900 mt-1">24</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Culture Initiatives</span>
                <p className="text-2xl font-black text-slate-900 mt-1">8</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Pending Actions</span>
                <p className="text-2xl font-black text-slate-900 mt-1">4</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Bottom Grid containing two main panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Box: Current Hot Discipline Issue */}
            <div className="border border-red-500 bg-red-50/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-red-600 font-bold text-xs uppercase tracking-wide">
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                    <span>Current Hot Discipline Issue</span>
                  </div>
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">+25%</span>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Late Arrivals</h3>
                    <p className="text-[11px] text-slate-400 leading-none mt-1">Most frequent issue this month</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-red-100/50 pt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight font-medium uppercase">Total cases this month</span>
                      <p className="text-xl font-bold text-slate-900 mt-1">12</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight font-medium uppercase">Total Cases</span>
                      <p className="text-xl font-bold text-slate-950 mt-1">28</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-red-100/50 pt-4 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">Resolved</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">18</p>
                </div>
                <button
                  onClick={() => handleOverviewJustify('hot-issue-discipline', 'All Staff', 'Late arrivals audit review')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors"
                >
                  Investigate Action
                </button>
              </div>
            </div>

            {/* Right Box: Average Discipline Rate */}
            <div className="border border-blue-600 bg-blue-50/5 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-blue-600 font-bold text-xs uppercase tracking-wide">
                    Average Discipline Rate
                  </div>
                  <span className="bg-[#e6f0ff] text-[#1a56db] text-[10px] font-bold px-2.5 py-0.5 rounded-full">3.2%</span>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Pending Cases</span>
                    <p className="text-3xl font-black text-slate-950 mt-1">10</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Resolved Cases</span>
                    <p className="text-3xl font-black text-slate-950 mt-1">18</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={() => onDraftAiSuggestion('Suggest training structures to lower our current 3.2% discipline occurrence rate.')}
                  className="w-full bg-[#f2f6ff] hover:bg-blue-100 text-[#1a56db] font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                  <span>Recommend Training to lower rate</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}


      {/* ========================================================= */}
      {/* 2. CAREER TAB VIEW */}
      {/* ========================================================= */}
      {currentTab === 'career' && (
        <div id="tab-career-content" className="space-y-6">

          {/* Stat Row containing Career status summaries */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Promoted (Last 6 months)</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">24</p>
              </div>
              <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Under Review</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">12</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Bookmark className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Demoted</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">2</p>
              </div>
              <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                <ArrowDown className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Lateral Move</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">8</p>
              </div>
              <div className="p-2.5 bg-[#e6f0ff] text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Promotion Requests - Awaiting Approval Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Promotion Requests - Awaiting Approval (2)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {promotions.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Person header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                            <span className="text-[10px] border border-slate-200 text-slate-500 font-medium px-1.5 rounded-full">{p.dept}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{p.role}</p>
                        </div>
                      </div>

                      {/* KPI tag */}
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-bold px-1.5 py-0.5 rounded-md leading-none">
                          KPI: {p.kpi}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-1">{p.yearsInRole} years in role</span>
                      </div>
                    </div>

                    {/* Path mapping blocks */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-tight">Current</span>
                        <p className="text-xs font-bold text-slate-700 mt-1">{p.role}</p>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-tight flex items-center gap-1">
                          <span>Proposed</span>
                          <ArrowUp className="w-3 h-3 text-blue-600 stroke-[3]" />
                        </span>
                        <p className="text-xs font-bold text-blue-600 mt-1 leading-tight">{p.targetRole}</p>
                      </div>
                    </div>

                    {/* Date and Status tag */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase">Date</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{p.effectiveDate}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase">Status</span>
                        <span className="inline-block text-[9px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2 py-0.5 rounded-md mt-0.5">
                          {p.status}
                        </span>
                      </div>
                    </div>

                    {/* Justification quote box */}
                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-dashed border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">Justification:</span>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed italic">"{p.justification}"</p>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleApprovePromo(p.id, p.name)}
                      className="flex-1 bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg cursor-pointer transition-colors text-center"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleJustifyPromo(p.id, p.name)}
                      className="flex-1 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors text-center bg-white"
                    >
                      Justify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Adjustment Requests Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Salary Adjustment Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salaries.map((s) => (
                <div key={s.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-slate-200 transition-all">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a56db]/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{s.dept}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 mt-4 text-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Current Salary</span>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">{s.currentSalary}</p>
                      </div>
                      <div className="border-l border-slate-250">
                        <span className="text-[9px] text-slate-400 block uppercase font-medium text-blue-600">Requested</span>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">{s.requestedSalary}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-3 leading-tight italic bg-slate-50/20 p-2 rounded-md border border-slate-100">
                      {s.justification}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                    <button
                      onClick={() => handleApproveSalary(s.id, s.name)}
                      className="flex-1 bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectSalary(s.id, s.name)}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] py-1.5 rounded-lg transition-colors cursor-pointer bg-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Search Employees List & History table matching Image 2 */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
              
              {/* Dynamic Filter Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-50">
                <div className="flex flex-1 flex-col md:flex-row items-stretch md:items-center gap-3">
                  {/* Search Query */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-1.5 focus:ring-blue-100 transition-all placeholder-slate-400"
                    />
                  </div>

                  {/* Filter Group selectors */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={filterFrom}
                        onChange={(e) => setFilterFrom(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 pr-8 font-medium focus:outline-none focus:ring-1 hover:bg-slate-50 transition-colors"
                      >
                        <option value="">From (Role)</option>
                        <option value="Junior">Junior Staff</option>
                        <option value="Associate">Associate Staff</option>
                        <option value="Mid">Mid Staff</option>
                      </select>
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={filterTo}
                        onChange={(e) => setFilterTo(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 pr-8 font-medium focus:outline-none focus:ring-1 hover:bg-slate-50 transition-colors"
                      >
                        <option value="">To (Role)</option>
                        <option value="Senior">Senior Staff</option>
                        <option value="Principal">Principal/Lead</option>
                        <option value="Manager">Management</option>
                      </select>
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 pr-8 font-medium focus:outline-none focus:ring-1 hover:bg-slate-50 transition-colors"
                      >
                        <option value="">Date</option>
                        <option value="2024">Year 2024</option>
                        <option value="2025">Year 2025</option>
                      </select>
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <span className="text-xs text-slate-500 font-medium">{sortedRows.length} employees found</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Sort by:</span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="bg-transparent text-xs text-slate-800 font-bold border-none focus:outline-none cursor-pointer"
                    >
                      <option value="Name">Name</option>
                      <option value="Department">Department</option>
                      <option value="Date">Date</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table exact replica */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-blue-600 tracking-wider">
                      <th className="pb-3 uppercase">Name & Position</th>
                      <th className="pb-3 uppercase">Start Date</th>
                      <th className="pb-3 uppercase">From</th>
                      <th className="pb-3 uppercase">To</th>
                      <th className="pb-3 uppercase">Application Date</th>
                      <th className="pb-3 uppercase text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {sortedRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">No records found matching current query.</td>
                      </tr>
                    ) : (
                      sortedRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                          {/* Name Block with Blue Outline for first card representation */}
                          <td className="py-4.5 pr-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#1a56db] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {row.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span>{row.name}</span>
                                  <span className="text-[9px] bg-blue-100 text-[#1a56db] px-1.5 rounded-full scale-90 font-extrabold uppercase shrink-0">
                                    {row.dept}
                                  </span>
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{row.email}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{row.phone}</p>
                              </div>
                            </div>
                          </td>

                          {/* Start Date & Previous role representation */}
                          <td className="py-4.5 font-medium text-slate-500 whitespace-nowrap">
                            {row.startDate}
                          </td>

                          {/* Role From */}
                          <td className="py-4.5 font-semibold text-slate-600 whitespace-nowrap">
                            {row.from}
                          </td>

                          {/* Role To */}
                          <td className="py-4.5 font-bold text-blue-600 whitespace-nowrap">
                            {row.to}
                          </td>

                          {/* App date */}
                          <td className="py-4.5 font-medium text-slate-500 whitespace-nowrap">
                            {row.applicationDate}
                          </td>

                          {/* Action Status label with border pills matching Image 2 */}
                          <td className="py-4.5 text-right whitespace-nowrap">
                            {row.status === 'rejected' ? (
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 border border-red-200 bg-red-50 text-red-600 text-[10px] font-extrabold rounded-md uppercase">
                                rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 bg-blue-600 border border-blue-600 text-white text-[10px] font-extrabold rounded-md uppercase">
                                Approved
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Minimal Pagination footer */}
              <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-50">
                <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center scale-95">1</button>
                <button className="w-6 h-6 rounded-full text-slate-500 hover:bg-slate-100 font-bold text-xs flex items-center justify-center scale-95">2</button>
                <button className="w-6 h-6 rounded-full text-slate-500 hover:bg-slate-100 font-bold text-xs flex items-center justify-center scale-95">3</button>
                <button className="w-6 h-6 rounded-full text-slate-500 hover:bg-slate-100 font-bold text-xs flex items-center justify-center scale-95">4</button>
                <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      )}


      {/* ========================================================= */}
      {/* 3. TRAINING & SKILLS TAB VIEW */}
      {/* ========================================================= */}
      {currentTab === 'training' && (
        <div id="tab-training-content" className="space-y-6">

          {/* Stats KPI Header block */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Pending Requests</span>
                <p className="text-2xl font-black text-slate-900 mt-1">2</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Completed Trainings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">3</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Active Assessments</span>
                <p className="text-2xl font-black text-slate-900 mt-1">1</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-50 rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Certifications</span>
                <p className="text-2xl font-black text-slate-900 mt-1">3</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Section: Training Requests - Awaiting Approval (2) */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Training Requests - Awaiting Approval (2)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {trainingRequests.map((tr) => (
                <div
                  key={tr.id}
                  className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Header profile info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                          {tr.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{tr.name}</h4>
                            <span className="text-[10px] border border-slate-200/80 bg-slate-100 text-slate-500 font-bold px-1.5 rounded-full uppercase scale-90">
                              {tr.dept}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Program Requester</p>
                        </div>
                      </div>

                      {/* Pending Tag in Image 3 */}
                      <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2.5 py-0.5 rounded-md leading-none uppercase scale-90">
                        {tr.status}
                      </span>
                    </div>

                    {/* Cost, Provider, Dates Row block */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-blue-700">{tr.program}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Provider: {tr.provider}</p>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/50 text-center">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium uppercase">Cost</span>
                          <p className="text-xs font-extrabold text-slate-800 mt-0.5">{tr.cost}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium uppercase">Duration</span>
                          <p className="text-xs font-extrabold text-slate-800 mt-0.5">{tr.duration}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium uppercase">Start Date</span>
                          <p className="text-xs font-extrabold text-slate-800 mt-0.5 font-mono">{tr.startDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Justification Box */}
                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-dashed border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Justification:</span>
                      <p className="text-xs text-slate-500 mt-1 italic">"{tr.justification}"</p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-50">
                    <button
                      onClick={() => handleApproveTraining(tr.id, tr.name)}
                      className="flex-1 bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg cursor-pointer transition-colors text-center"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectTraining(tr.id, tr.name)}
                      className="flex-1 border border-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors text-center bg-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Previous Trainings & Certifications (3 column row) */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Previous Trainings & Certifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200 flex-shrink-0 shadow-xs">
                      SL
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Dr. Samantha Lee</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Advanced Data Science</p>
                    </div>
                  </div>
                  <Award className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-4">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Certification</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Certified Data Scientist</p>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-slate-400 font-semibold">Score: <b className="text-slate-800 font-extrabold">95%</b></span>
                  <span className="text-slate-400 font-semibold">Completed: <b className="text-slate-800 font-mono font-bold">2024-02-01</b></span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200 flex-shrink-0 shadow-xs">
                      ER
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Emily Rodriguez</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Leadership Fundamentals</p>
                    </div>
                  </div>
                  <Award className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-4">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Certification</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Leadership Certificate</p>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-slate-400 font-semibold">Score: <b className="text-slate-800 font-extrabold">92%</b></span>
                  <span className="text-slate-400 font-semibold">Completed: <b className="text-slate-800 font-mono font-bold">2024-01-28</b></span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200 flex-shrink-0 shadow-xs">
                      MB
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Mike Brown</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">UX Design Principles</p>
                    </div>
                  </div>
                  <Award className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-4">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Certification</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">UX Design Certificate</p>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-slate-400 font-semibold">Score: <b className="text-slate-800 font-extrabold">88%</b></span>
                  <span className="text-slate-400 font-semibold">Completed: <b className="text-slate-800 font-mono font-bold">2024-01-15</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Skill Gap Improvement (2 columns layout matching Image 3) */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Skill Gap Improvement</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {skillGapEmployees.map((sg) => (
                <div key={sg.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200/80 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                          {sg.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{sg.name}</h4>
                            <span className="text-[10px] border border-slate-250/50 text-slate-500 font-medium px-1.5 rounded-full scale-90">{sg.dept}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Technical Skills Audit</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase scale-90 ${
                        sg.status === 'ongoing'
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {sg.status}
                      </span>
                    </div>

                    {/* Progress slider bar matching Image 3 */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                        <span>Progress</span>
                        <span className="text-blue-600">{sg.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${sg.progress}%` }} />
                      </div>
                      {sg.dueDate && (
                        <p className="text-[9px] text-slate-400 font-mono mt-1.5">Due: {sg.dueDate}</p>
                      )}
                    </div>

                    {/* Skills list tags block */}
                    <div className="mt-5 pt-4 border-t border-slate-50 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-tight">Identified Skill Gaps:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {sg.skillGaps.map((skill, index) => (
                          <span key={index} className="text-[10px] bg-blue-50/70 border border-blue-100 text-blue-600 px-2 py-0.5 rounded-md font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Actions custom block */}
                    {sg.recommendedActions && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4 space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Recommended Actions:</span>
                        <ul className="list-disc list-inside text-xs text-slate-500 font-medium space-y-1">
                          {sg.recommendedActions.map((act, index) => (
                            <li key={index} className="marker:text-blue-600">{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-50">
                    <button
                      onClick={() => handleAuditSkillGap(sg.id, sg.name)}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs py-2 rounded-lg transition-colors border border-slate-200"
                    >
                      Audit Assessment Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: AI Training & Skills Recommendations (Grid of 4 recommendations matching Image 3) */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>AI Training & Skills Recommendations</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Cloud Security */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900">Cloud Security</h4>
                      <span className="text-[9px] border bg-slate-100 text-slate-500 px-1.5 rounded-full font-bold scale-90">Engineering</span>
                    </div>
                    <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 uppercase font-extrabold px-1.5 py-0.5 rounded-md">
                      high priority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Affects 12 employees</p>
                </div>
                <div className="bg-[#f0f4ff] p-3 rounded-xl border border-blue-50/50 mt-4 text-[#1a56db]">
                  <p className="text-xs font-bold leading-relaxed">
                    AI Recommendation: Implement company-wide cloud security certification program
                  </p>
                </div>
              </div>

              {/* Card 2: AI Design Tools */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900">AI Design Tools</h4>
                      <span className="text-[9px] border bg-slate-100 text-slate-500 px-1.5 rounded-full font-bold scale-90">Design</span>
                    </div>
                    <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 uppercase font-extrabold px-1.5 py-0.5 rounded-md">
                      medium priority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Affects 6 employees</p>
                </div>
                <div className="bg-[#f0f4ff] p-3 rounded-xl border border-blue-50/50 mt-4 text-[#1a56db]">
                  <p className="text-xs font-bold leading-relaxed">
                    AI Recommendation: Early adoption training for AI-assisted design tools
                  </p>
                </div>
              </div>

              {/* Card 3: AI Marketing Tools */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900">AI Marketing Tools</h4>
                      <span className="text-[9px] border bg-slate-100 text-slate-500 px-1.5 rounded-full font-bold scale-90">Marketing</span>
                    </div>
                    <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 uppercase font-extrabold px-1.5 py-0.5 rounded-md">
                      medium priority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Affects 8 employees</p>
                </div>
                <div className="bg-[#f0f4ff] p-3 rounded-xl border border-blue-50/50 mt-4 text-[#1a56db]">
                  <p className="text-xs font-bold leading-relaxed">
                    AI Recommendation: Provide training on AI-powered marketing automation platforms
                  </p>
                </div>
              </div>

              {/* Card 4: Certification Opportunities */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900 font-sans leading-tight">Advanced Analytics Certification</h4>
                      <span className="text-[9px] border bg-slate-100 text-slate-500 px-1.5 rounded-full font-bold scale-90">Analytics</span>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 uppercase font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                      low priority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Affects 5 employees</p>
                </div>
                <div className="bg-[#f0f4ff] p-3 rounded-xl border border-blue-50/50 mt-4 text-[#1a56db]">
                  <p className="text-xs font-bold leading-relaxed">
                    AI Recommendation: Support team members pursuing professional certifications
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}


      {/* ========================================================= */}
      {/* 4. CULTURE TAB VIEW */}
      {/* ========================================================= */}
      {currentTab === 'culture' && (
        <div id="tab-culture-content" className="space-y-6">

          {/* Group header block describing Company Culture & Values */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Company Culture & Values</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Our company culture is built on values of innovation, collaboration, and continuous learning. We believe in creating an environment where every employee can thrive and contribute to our collective success.
            </p>
          </div>

          {/* 4 grid policy sheets matching Image 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-start justify-between">
              <div className="space-y-2 pr-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Company Values & Mission</h3>
                </div>
                <p className="text-xs text-slate-500">Our core values guide everything we do, from hiring to daily operations.</p>
                <p className="text-[9px] text-slate-450 font-mono">Updated: 2024-01-15</p>
              </div>
              <button
                onClick={() => handleReadPolicy('Company Values & Mission')}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-all border border-slate-200 select-none whitespace-nowrap"
              >
                <span>Read Policy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-start justify-between">
              <div className="space-y-2 pr-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Code of Conduct</h3>
                </div>
                <p className="text-xs text-slate-500">Professional standards and behavioral expectations for all employees.</p>
                <p className="text-[9px] text-slate-450 font-mono">Updated: 2024-02-01</p>
              </div>
              <button
                onClick={() => handleReadPolicy('Code of Conduct')}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-all border border-slate-200 select-none whitespace-nowrap"
              >
                <span>Read Policy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-start justify-between">
              <div className="space-y-2 pr-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <Building className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Diversity & Inclusion Policy</h3>
                </div>
                <p className="text-xs text-slate-500">Our commitment to creating an inclusive workplace for everyone.</p>
                <p className="text-[9px] text-slate-450 font-mono">Updated: 2024-01-20</p>
              </div>
              <button
                onClick={() => handleReadPolicy('Diversity & Inclusion Policy')}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-all border border-slate-200 select-none whitespace-nowrap"
              >
                <span>Read Policy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-start justify-between">
              <div className="space-y-2 pr-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Work-Life Balance Guidelines</h3>
                </div>
                <p className="text-xs text-slate-500">Policies supporting employee wellbeing and flexible work arrangements.</p>
                <p className="text-[9px] text-slate-450 font-mono">Updated: 2024-02-10</p>
              </div>
              <button
                onClick={() => handleReadPolicy('Work-Life Balance Guidelines')}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-all border border-slate-200 select-none whitespace-nowrap"
              >
                <span>Read Policy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Culture Initiatives Header with 6 Programs tag */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Culture Initiatives</h2>
              <span className="bg-blue-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase leading-normal">
                6 Programs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Innovation Fridays */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">Innovation Fridays</h3>
                    <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-100 rounded-md">
                      active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dedicated time every Friday afternoon for employees to work on passion projects and innovative ideas.
                  </p>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-500 space-y-2">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timeline: <b className="text-slate-800">Ongoing - Started Jan 2024</b></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned To: <b className="text-slate-800">Engineering & Product Teams</b></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">Participants (45)</span>
                    <div className="flex items-center -space-x-1.5 shrink-0 scale-90">
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">JS</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">SJ</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">MB</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">ER</div>
                      <div className="w-6 h-6 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[9px] font-bold text-white">+41</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReadPolicy('Innovation Fridays Details')}
                    className="flex items-center gap-1 hover:underline text-xs text-slate-600 font-semibold cursor-pointer"
                  >
                    <span>Full Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Wellness Wednesdays */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">Wellness Wednesdays</h3>
                    <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-100 rounded-md">
                      active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Weekly wellness activities including yoga, meditation, and health workshops to promote employee wellbeing.
                  </p>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-500 space-y-2">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timeline: <b className="text-slate-800">Ongoing - Started Feb 2024</b></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned To: <b className="text-slate-800">All Departments</b></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">Participants (120)</span>
                    <div className="flex items-center -space-x-1.5 shrink-0 scale-90">
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">SL</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">DL</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">LM</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">TA</div>
                      <div className="w-6 h-6 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[9px] font-bold text-white">+116</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReadPolicy('Wellness Wednesdays Details')}
                    className="flex items-center gap-1 hover:underline text-xs text-slate-600 font-semibold cursor-pointer"
                  >
                    <span>Full Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Innovation Fridays duplicate to match Image 4 precisely */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">Innovation Fridays</h3>
                    <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-100 rounded-md">
                      active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dedicated time every Friday afternoon for employees to work on passion projects and innovative ideas.
                  </p>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-500 space-y-2">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timeline: <b className="text-slate-800">Ongoing - Started Jan 2024</b></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned To: <b className="text-slate-800">Engineering & Product Teams</b></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">Participants (45)</span>
                    <div className="flex items-center -space-x-1.5 shrink-0 scale-90">
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">JS</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">SJ</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">MB</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">ER</div>
                      <div className="w-6 h-6 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[9px] font-bold text-white">+41</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReadPolicy('Innovation Fridays Details')}
                    className="flex items-center gap-1 hover:underline text-xs text-slate-600 font-semibold cursor-pointer"
                  >
                    <span>Full Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 4: Wellness Wednesdays duplicate to match Image 4 precisely */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">Wellness Wednesdays</h3>
                    <span className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-100 rounded-md">
                      active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Weekly wellness activities including yoga, meditation, and health workshops to promote employee wellbeing.
                  </p>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-500 space-y-2">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timeline: <b className="text-slate-800">Ongoing - Started Feb 2024</b></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned To: <b className="text-slate-800">All Departments</b></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">Participants (120)</span>
                    <div className="flex items-center -space-x-1.5 shrink-0 scale-90">
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">SL</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">DL</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">LM</div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">TA</div>
                      <div className="w-6 h-6 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[9px] font-bold text-white">+116</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReadPolicy('Wellness Wednesdays Details')}
                    className="flex items-center gap-1 hover:underline text-xs text-slate-600 font-semibold cursor-pointer"
                  >
                    <span>Full Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Culture Impact Metrics matching Image 4 row precisely */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Culture Impact Metrics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center flex flex-col justify-center">
                <p className="text-3xl font-black text-blue-600">92%</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Employee Satisfaction</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center flex flex-col justify-center">
                <p className="text-3xl font-black text-blue-600">465</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Total Participants</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center flex flex-col justify-center">
                <p className="text-3xl font-black text-blue-600">6</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Active Programs</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center flex flex-col justify-center">
                <p className="text-3xl font-black text-blue-600">88%</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Participation Rate</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

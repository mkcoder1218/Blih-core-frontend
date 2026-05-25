/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  MoreHorizontal, 
  User, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Users,
  PieChart as PieChartIcon,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check
} from 'lucide-react';
import TopMatchCard from './TopMatchCard';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { JobRequest } from '../../types';

// Let's create robust mock data for our active jobs
interface ActiveJob extends JobRequest {
  applicantsCount: number;
  viewsCount: number;
  seniority: 'Senior' | 'Junior' | 'Intern' | 'Mid-Level';
  isActiveBadge?: boolean;
}

const initialActiveJobs: ActiveJob[] = [
  {
    id: 'act-101',
    title: 'Marketing Manager',
    department: 'DIGITAL MARKETING DEPT.',
    type: 'Full-time',
    positions: 1,
    requestedDate: 'Dec 15, 2024',
    dueDate: 'Dec 15, 2024',
    expectedDate: 'Dec 15, 2024',
    priority: 'High',
    status: 'approved',
    applicantsCount: 124,
    viewsCount: 1420,
    seniority: 'Senior',
    requestedBy: {
      name: 'Jessica Parker',
      role: 'Full Stack Developer',
      dept: 'TECHNICAL DEPT.',
      avatar: 'JP'
    },
    overview: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.",
    requirements: [
      '7+ years in marketing',
      'Experience with digital marketing',
      'Strong analytical skills',
      'Team leadership experience'
    ],
    qualifications: [
      '7+ years in marketing',
      'Experience with digital marketing',
      'Strong analytical skills',
      'Team leadership experience'
    ],
    importance: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform. We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform."
  },
  {
    id: 'act-102',
    title: 'Marketing Manager',
    department: 'DIGITAL MARKETING DEPT.',
    type: 'Full-time',
    positions: 1,
    requestedDate: 'Dec 15, 2024',
    dueDate: 'Dec 15, 2024',
    expectedDate: 'Dec 15, 2024',
    priority: 'High',
    status: 'approved',
    applicantsCount: 124,
    viewsCount: 1420,
    seniority: 'Intern',
    isActiveBadge: true,
    requestedBy: {
      name: 'Jessica Parker',
      role: 'Full Stack Developer',
      dept: 'TECHNICAL DEPT.',
      avatar: 'JP'
    },
    overview: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.",
    requirements: [
      '7+ years in marketing',
      'Experience with digital marketing',
      'Strong analytical skills',
      'Team leadership experience'
    ],
    qualifications: [
      '7+ years in marketing',
      'Experience with digital marketing',
      'Strong analytical skills',
      'Team leadership experience'
    ],
    importance: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform. We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform."
  },
  {
    id: 'act-103',
    title: 'Marketing Manager',
    department: 'DIGITAL MARKETING DEPT.',
    type: 'Full-time',
    positions: 1,
    requestedDate: 'Dec 15, 2024',
    dueDate: 'Dec 15, 2024',
    expectedDate: 'Dec 15, 2024',
    priority: 'High',
    status: 'approved',
    applicantsCount: 124,
    viewsCount: 1420,
    seniority: 'Senior',
    requestedBy: {
      name: 'Jessica Parker',
      role: 'Full Stack Developer',
      dept: 'TECHNICAL DEPT.',
      avatar: 'JP'
    },
    overview: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.",
    requirements: [
      '7+ years in marketing',
      'Experience with digital marketing',
      'Strong analytical skills',
      'Team leadership experience'
    ],
    qualifications: [
      '7+ years in marketing',
      'Experience with digital marketing',
      'Strong analytical skills',
      'Team leadership experience'
    ],
    importance: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform. We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform."
  }
];

// Mock applicants list for Jessica's job
interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  matchScore: number;
  experience: string;
  status: 'Reviewed' | 'Shortlisted' | 'Interview Scheduled' | 'Rejected';
  appliedDate: string;
  salaryExpectation: string;
  checked?: boolean;
}

const mockApplicants: Applicant[] = [
  { id: 'app-01', name: 'Alex Johnson', email: 'alex.johnson@domain.com', phone: '+251 967 97 3799', university: 'Addis Ababa University', matchScore: 90, experience: '3 Years', status: 'Shortlisted', appliedDate: 'Feb 24, 2025', salaryExpectation: '15,000', checked: true },
  { id: 'app-02', name: 'Alex Johnson', email: 'alex.johnson@domain.com', phone: '+251 967 97 3799', university: 'Stanford University', matchScore: 90, experience: '3 Years', status: 'Shortlisted', appliedDate: 'Feb 24, 2025', salaryExpectation: '15,000', checked: true },
  { id: 'app-03', name: 'Alex Johnson', email: 'alex.johnson@domain.com', phone: '+251 967 97 3799', university: 'Oxford University', matchScore: 90, experience: '3 Years', status: 'Reviewed', appliedDate: 'Feb 24, 2025', salaryExpectation: '15,000', checked: true },
  { id: 'app-04', name: 'Alex Johnson', email: 'alex.johnson@domain.com', phone: '+251 967 97 3799', university: 'Unity University', matchScore: 90, experience: '3 Years', status: 'Reviewed', appliedDate: 'Feb 24, 2025', salaryExpectation: '15,000', checked: false },
  { id: 'app-05', name: 'Alex Johnson', email: 'alex.johnson@domain.com', phone: '+251 967 97 3799', university: 'Addis Ababa University', matchScore: 90, experience: '3 Years', status: 'Reviewed', appliedDate: 'Feb 24, 2025', salaryExpectation: '15,000', checked: false },
  { id: 'app-06', name: 'Alex Johnson', email: 'alex.johnson@domain.com', phone: '+251 967 97 3799', university: 'Hilcoe College', matchScore: 90, experience: '3 Years', status: 'Reviewed', appliedDate: 'Feb 24, 2025', salaryExpectation: '15,000', checked: false },
  { id: 'app-07', name: 'Alex Johnson', email: 'alex.johnson@domain.com', phone: '+251 967 97 3799', university: 'Harvard University', matchScore: 90, experience: '3 Years', status: 'Reviewed', appliedDate: 'Feb 24, 2025', salaryExpectation: '15,000', checked: false },
  { id: 'app-08', name: 'Alex Johnson', email: 'alex.johnson@domain.com', phone: '+251 967 97 3799', university: 'Addis Ababa University', matchScore: 90, experience: '3 Years', status: 'Reviewed', appliedDate: 'Feb 24, 2025', salaryExpectation: '15,000', checked: false },
];

const mockAnalyticsData = [
  { week: 'Wk 1', views: 320, applications: 24, conversion: 7.5 },
  { week: 'Wk 2', views: 450, applications: 38, conversion: 8.4 },
  { week: 'Wk 3', views: 580, applications: 45, conversion: 7.7 },
  { week: 'Wk 4', views: 420, applications: 32, conversion: 7.6 },
  { week: 'Wk 5', views: 650, applications: 54, conversion: 8.3 },
  { week: 'Wk 6', views: 740, applications: 62, conversion: 8.3 },
];

interface RecruitmentActivePostingProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function RecruitmentActivePosting({ onDraftAiSuggestion, showAlert }: RecruitmentActivePostingProps) {
  const [jobs, setJobs] = useState<ActiveJob[]>(initialActiveJobs);
  const [expandedJobId, setExpandedJobId] = useState<string | null>('act-102'); // Starts with the second item expanded by default as per visual mockup
  const [activeSubTab, setActiveSubTab] = useState<'detail' | 'applicants' | 'analytics'>('detail');
  
  // Local modifications state
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  // Close direct active job post handler
  const handleCloseJob = (jobId: string, jobTitle: string) => {
    if (confirm(`Are you sure you want to close the job posting for "${jobTitle}"? This will archive the post.`)) {
      setJobs(prev => prev.filter(j => j.id !== jobId));
      showAlert(`Job vacancy for "${jobTitle}" was closed successfully!`, 'success');
      if (expandedJobId === jobId) {
        setExpandedJobId(null);
      }
    }
  };

  const handleEditJob = (jobTitle: string) => {
    showAlert(`Opening editor for "${jobTitle}" posting.`, 'info');
    onDraftAiSuggestion(`Generate an optimized, search-friendly description for the position "${jobTitle}". Include relevant keywords and attractive benefits.`);
  };

  const handleApplicantStatusChange = (applicantId: string, newStatus: Applicant['status']) => {
    setApplicants(prev => prev.map(app => app.id === applicantId ? { ...app, status: newStatus } : app));
    showAlert(`Applicant status updated to "${newStatus}"`, 'success');
  };

  // Toggle individual applicant checkboxes
  const handleToggleApplicant = (id: string) => {
    setApplicants(prev => prev.map(app => app.id === id ? { ...app, checked: !app.checked } : app));
  };

  // Toggle all applicant checkboxes
  const allChecked = applicants.length > 0 && applicants.every(a => a.checked);
  const handleToggleAll = () => {
    if (allChecked) {
      setApplicants(prev => prev.map(a => ({ ...a, checked: false })));
    } else {
      setApplicants(prev => prev.map(a => ({ ...a, checked: true })));
    }
  };

  // Bulk actions triggers
  const handleBulkAction = (action: 'shortlist' | 'reviewed' | 'reject') => {
    const checkedCount = applicants.filter(a => a.checked).length;
    if (checkedCount === 0) {
      showAlert('Please select at least one applicant to apply actions', 'info');
      return;
    }
    
    // Scale count to reflect the 124 pipeline from the mockup
    const pipelineCount = checkedCount === 8 ? 124 : checkedCount * 8;
    
    if (action === 'shortlist') {
      setApplicants(prev => prev.map(a => a.checked ? { ...a, status: 'Shortlisted' } : a));
      showAlert(`Successfully shortlisted ${pipelineCount} selected applicants.`, 'success');
    } else if (action === 'reviewed') {
      setApplicants(prev => prev.map(a => a.checked ? { ...a, status: 'Reviewed' } : a));
      showAlert(`Marked ${pipelineCount} selected applicants as reviewed.`, 'success');
    } else if (action === 'reject') {
      setApplicants(prev => prev.map(a => a.checked ? { ...a, status: 'Rejected' } : a));
      showAlert(`Rejected ${pipelineCount} selected applicants.`, 'error');
    }
  };

  return (
    <div id="active-posting-view-main" className="space-y-6">
      {/* Tab Descriptive Header */}
      <div className="mb-4">
        <h3 id="active-jobs-title" className="text-[15px] font-bold text-slate-900 tracking-tight">Active Jobs</h3>
        <p className="text-[11px] text-slate-400 font-medium font-sans">View and manage active job posts</p>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => {
          const isExpanded = expandedJobId === job.id;

          return (
            <div 
              key={job.id} 
              id={`active-job-card-${job.id}`}
              className={`bg-white rounded-3xl border transition-all duration-250 overflow-hidden ${
                isExpanded 
                  ? 'border-blue-200 ring-4 ring-blue-50/40 shadow-sm' 
                  : 'border-slate-100/90 hover:border-slate-200 shadow-xs'
              }`}
            >
              {/* Card Summary Header row */}
              <div 
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none ${
                  isExpanded ? 'bg-slate-50/40 border-b border-slate-100/70' : ''
                }`}
                onClick={() => {
                  setExpandedJobId(isExpanded ? null : job.id);
                  setActiveSubTab('detail'); // Reset default expand subtab
                }}
              >
                <div className="flex flex-col space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[14px] font-black text-slate-800 tracking-tight">{job.title}</h4>
                    <span className="text-[10px] text-slate-600 bg-slate-100/80 font-semibold px-2 py-0.5 rounded">
                      {job.seniority}
                    </span>
                    {job.isActiveBadge && (
                      <span className="text-[9px] text-white bg-[#1a56db] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        Active Job
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium font-sans">
                    <span className="text-[#1a56db] font-bold tracking-tight bg-blue-50/70 px-2 py-0.5 rounded text-[10px]">
                      {job.department}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span>{job.type}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span>{job.positions} Position</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  {/* Applicants Pill Counter */}
                  <div className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-center">
                    <span className="block text-[11px] font-bold text-slate-700 leading-none">
                      {job.applicantsCount} applicants
                    </span>
                  </div>

                  {/* Views Pill Counter */}
                  <div className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-center">
                    <span className="block text-[11px] font-bold text-slate-700 leading-none">
                      {job.viewsCount} views
                    </span>
                  </div>

                  {/* Toggle Expander Trigger */}
                  <button 
                    type="button" 
                    className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    {isExpanded ? (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold px-3">
                        <span className="text-[10px]">Less</span>
                        <ChevronUp className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold px-3">
                        <span className="text-[10px]">More</span>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Details Container */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden bg-white"
                  >
                    {/* Inner Segmented Control Navigation Tabs Switcher */}
                    <div id="active-posting-tabs-switcher" className="grid grid-cols-3 gap-3 p-3 bg-slate-50/70 border-b border-slate-100 rounded-t-3xl">
                      <button
                        onClick={() => setActiveSubTab('detail')}
                        className={`py-3.5 text-xs font-bold transition-all text-center rounded-2xl cursor-pointer ${
                          activeSubTab === 'detail' 
                            ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs' 
                            : 'bg-slate-100/50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        Job Detail
                      </button>
                      <button
                        onClick={() => setActiveSubTab('applicants')}
                        className={`py-3.5 text-xs font-bold transition-all text-center rounded-2xl cursor-pointer ${
                          activeSubTab === 'applicants' 
                            ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs' 
                            : 'bg-slate-100/50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        Applicants (40)
                      </button>
                      <button
                        onClick={() => setActiveSubTab('analytics')}
                        className={`py-3.5 text-xs font-bold transition-all text-center rounded-2xl cursor-pointer ${
                          activeSubTab === 'analytics' 
                            ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs' 
                            : 'bg-slate-100/50 hover:bg-[#e2e8f0] text-slate-600'
                        }`}
                      >
                        Analytics
                      </button>
                    </div>

                    {/* Inner Sub-panel Content */}
                    <div className="p-6 space-y-6">
                      {activeSubTab === 'detail' && (
                        <div className="space-y-6 animate-fade-in">
                          {/* 1. Job Request Details Grid (Image 4-like Panel) */}
                          <div className="bg-[#f8fafc] rounded-2xl border border-slate-100 p-5">
                            <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight mb-4">
                              Job Request Details
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Priority</span>
                                <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold uppercase tracking-wider px-2 py-0.5 border border-blue-100 rounded">
                                  {job.priority}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Due Date</span>
                                <span className="text-xs text-slate-700 font-bold">{job.dueDate}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Expected Date</span>
                                <span className="text-xs text-slate-700 font-bold">{job.expectedDate}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Date Requested</span>
                                <span className="text-xs text-slate-700 font-bold">{job.requestedDate}</span>
                              </div>
                            </div>

                            {/* Requested By Info Banner */}
                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Requested By</span>
                              <div className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl py-1 px-2.5 shadow-3xs">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-[9px] font-black">
                                  {job.requestedBy?.avatar || 'JP'}
                                </div>
                                <div className="leading-tight">
                                  <h6 className="text-[11px] font-bold text-slate-800">{job.requestedBy?.name || 'Jessica Parker'}</h6>
                                  <span className="text-[8.5px] text-blue-600 font-black uppercase tracking-wider block">
                                    {job.requestedBy?.dept || 'TECHNICAL DEPT.'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2. Double-column Overview & Requirements */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 font-sans">
                            {/* Left Column Overview & Requirements */}
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wider mb-2">
                                  Job Overview
                                </h5>
                                <p className="leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                  {job.overview}
                                </p>
                              </div>

                              <div>
                                <h5 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wider mb-2">
                                  Requirements
                                </h5>
                                <ul className="space-y-1.5 pl-1.5">
                                  {job.requirements?.map((req, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                      <span className="leading-relaxed">{req}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Right Column Qualifications & Importance */}
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wider mb-2">
                                  Qualifications
                                </h5>
                                <ul className="space-y-1.5 pl-1.5">
                                  {job.qualifications?.map((qual, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                      <span className="leading-relaxed">{qual}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h5 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wider mb-1">
                                  Importance of this Hire
                                </h5>
                                <p className="leading-relaxed text-slate-500 italic bg-slate-50/30 p-2.5 rounded-lg border border-slate-100/30">
                                  {job.importance}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 3. High Fidelity Accordion Widgets (Hiring Committee, Revisions, Approved By) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Hiring Committee Container row */}
                            <div className="bg-[#f8fafc]/40 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                                  Hiring Committee
                                </h6>
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <div className="space-y-2">
                                {[1, 2, 3].map((num) => (
                                  <div key={num} className="flex items-center gap-3 bg-white p-2 border border-slate-100 rounded-xl">
                                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                                      JP
                                    </div>
                                    <div className="leading-tight flex-1">
                                      <h6 className="text-[11px] font-bold text-slate-900">Jessica Parker</h6>
                                      <span className="text-[9px] text-slate-400">Full Stack Developer</span>
                                    </div>
                                    <span className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                                      TECHNICAL DEPT.
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Revisions & Approved By Column */}
                            <div className="space-y-4">
                              {/* Revisions From */}
                              <div className="bg-[#eef2fe] rounded-xl p-3 border border-blue-100/50">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">
                                    Revisions From
                                  </h6>
                                  <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <div className="flex items-center gap-2.5 bg-white p-2.5 border border-[#dbeafe] rounded-lg">
                                  <div className="w-6 h-6 bg-blue-650 rounded-full flex items-center justify-center text-slate-700 bg-slate-200 text-[10px] font-black">
                                    JP
                                  </div>
                                  <div className="leading-tight flex-1">
                                    <span className="text-[11px] font-bold text-slate-800">Jessica Parker</span>
                                    <span className="text-[8.5px] text-blue-600 font-bold ml-2">TECHNICAL DEPT.</span>
                                    <span className="block text-[8px] text-slate-400 mt-0.5 flex items-center gap-1">
                                      <Clock className="w-2 h-2" /> 02:33 PM Dec 30, 2025
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Approved By */}
                              <div className="bg-[#eff6ff] rounded-xl p-3 border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">
                                    Approved By
                                  </h6>
                                  <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                  {[1, 2, 3].map((num) => (
                                    <div key={num} className="flex items-center gap-2.5 bg-white p-2 border border-blue-50/50 rounded-lg">
                                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[9px] font-black">
                                        JP
                                      </div>
                                      <div className="leading-tight flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-bold text-slate-800">Jessica Parker</span>
                                          <span className="text-[8.5px] text-[#1e40af] font-black">TECHNICAL DEPT.</span>
                                        </div>
                                        <span className="block text-[8px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                                          <Clock className="w-2 h-2" /> 02:33 PM Dec 30, 2025
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                      {activeSubTab === 'applicants' && (
                        <div className="animate-fade-in space-y-4">
                          {/* Bulk Actions Header Row mirroring Image 2 */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 shadow-3xs">
                            {/* Checkbox + Select Count */}
                            <div className="flex items-center gap-3 select-none">
                              {/* Custom Styled Select All Checkbox */}
                              <div 
                                onClick={handleToggleAll}
                                className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                                  allChecked 
                                    ? 'bg-[#1a56db] border border-[#1a56db]' 
                                    : 'bg-white border border-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {allChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />}
                              </div>
                              <span className="text-xs font-bold text-slate-700">
                                Select All
                              </span>
                              <span id="select-counter-badge" className="text-[11px] font-extrabold bg-[#1a56db]/10 text-[#1a56db] px-2.5 py-0.5 rounded-full font-mono">
                                {applicants.filter(a => a.checked).length === 8 ? 124 : applicants.filter(a => a.checked).length * 8}/124
                              </span>
                            </div>

                            {/* Batch action buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleBulkAction('shortlist')}
                                className="px-4 py-2 bg-[#1a56db] hover:bg-[#1a56db]/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs border border-[#1a56db]"
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => handleBulkAction('reviewed')}
                                className="px-4 py-2 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                              >
                                Mark Reviewed
                              </button>
                              <button
                                onClick={() => handleBulkAction('reject')}
                                className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                              >
                                Reject
                              </button>
                            </div>
                          </div>

                          {/* Grid/Table layout for applicants */}
                          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-3xs">
                            <div className="grid grid-cols-12 gap-2 bg-slate-50/80 p-4 text-[10px] font-extrabold text-[#1a56db] uppercase tracking-wider font-sans border-b border-slate-100 select-none">
                              <span className="col-span-1"></span>
                              <span className="col-span-4 flex items-center gap-1">
                                NAME OF APPLICANT <span className="text-[9px] text-[#1a56db]/80">▼</span>
                              </span>
                              <span className="col-span-3 flex items-center gap-1">
                                APPLIED DATE <span className="text-[9px] text-[#1a56db]/80">▼</span>
                              </span>
                              <span className="col-span-2 text-center flex items-center gap-1 justify-center">
                                SALARY EXPECTATION <span className="text-[9px] text-[#1a56db]/80">▼</span>
                              </span>
                              <span className="col-span-2 text-center flex items-center gap-1 justify-center">
                                AI SCORE <span className="text-[9px] text-[#1a56db]/80">▼</span>
                              </span>
                            </div>

                            <div className="divide-y divide-slate-100/70 p-1.5 space-y-2">
                              {applicants.map((candidate) => {
                                const isRowChecked = !!candidate.checked;
                                return (
                                  <div 
                                    key={candidate.id}
                                    className={`grid grid-cols-12 gap-2 p-3.5 items-center rounded-xl transition-all border cursor-pointer ${
                                      isRowChecked 
                                        ? 'border-blue-200 bg-blue-50/10' 
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                                    }`}
                                    onClick={() => handleToggleApplicant(candidate.id)}
                                  >
                                    {/* Action Checkbox Column */}
                                    <div className="col-span-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                      <div 
                                        onClick={() => handleToggleApplicant(candidate.id)}
                                        className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                                          isRowChecked 
                                            ? 'bg-[#1a56db] border border-[#1a56db]' 
                                            : 'bg-white border border-slate-300 hover:border-slate-400'
                                        }`}
                                      >
                                        {isRowChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />}
                                      </div>
                                    </div>

                                    {/* Profile name and metadata */}
                                    <div className="col-span-4 flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[11px] border border-slate-200/50">
                                        AJ
                                      </div>
                                      <div>
                                        <h6 className="font-extrabold text-slate-800 leading-tight">{candidate.name}</h6>
                                        <p className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">
                                          {candidate.phone}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Applied Date */}
                                    <span className="col-span-3 text-slate-500 font-semibold font-sans">
                                      {candidate.appliedDate}
                                    </span>

                                    {/* Salary Expectation */}
                                    <div className="col-span-2 text-center text-slate-600 font-extrabold font-mono">
                                      {candidate.salaryExpectation}
                                    </div>

                                    {/* AI Score Sparkle Badge */}
                                    <div className="col-span-2 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        title="Click to view detailed score card"
                                        onClick={() => {
                                          setSelectedApplicant(candidate);
                                          onDraftAiSuggestion(`Analyze the CV profile of candidate ${candidate.name} (${candidate.experience} exp, score: ${candidate.matchScore}%) for this Marketing position.`);
                                          showAlert(`Opening match analysis of ${candidate.name}`, 'info');
                                        }}
                                        className="bg-blue-50/40 hover:bg-blue-50 border border-blue-200/80 text-blue-600 px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 text-[11.5px] transition-all shadow-3xs cursor-pointer"
                                      >
                                        <span className="text-[12px]">✨</span>
                                        <span>{candidate.matchScore}%</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Pagination and numbers matching Image 2 */}
                            <div className="p-4 bg-slate-50/40 border-t border-slate-100 flex items-center justify-center gap-1 select-none">
                              <button 
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 font-bold transition-colors cursor-pointer"
                              >
                                &lt;
                              </button>
                              
                              <button 
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a56db] text-white font-extrabold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                1
                              </button>
                              
                              <button 
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                              >
                                2
                              </button>
                              
                              <button 
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                              >
                                3
                              </button>
                              
                              <button 
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                              >
                                4
                              </button>
                              
                              <button 
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 font-bold transition-colors cursor-pointer"
                              >
                                &gt;
                              </button>
                            </div>
                          </div>

                          {/* Candidate Detail Modal Simulation */}
                          <AnimatePresence>
                            {selectedApplicant && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#f0f4f8] rounded-2xl border border-slate-200 p-5 space-y-4"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">
                                      {selectedApplicant.name.split(' ').map(n=>n[0]).join('')}
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-slate-900 leading-tight">{selectedApplicant.name}</h5>
                                      <p className="text-[11px] text-slate-500 mt-0.5">{selectedApplicant.email} &bull; {selectedApplicant.phone}</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setSelectedApplicant(null)}
                                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700"
                                  >
                                    <XCircle className="w-4.5 h-4.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                                    <span className="block text-[9px] uppercase text-slate-400 font-black mb-1">Education Background</span>
                                    <p className="font-bold text-slate-800 leading-relaxed font-sans">{selectedApplicant.university}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">First-class honors equivalent degree</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                                    <span className="block text-[9px] uppercase text-slate-400 font-black mb-1">Experience Status</span>
                                    <p className="font-bold text-slate-800 leading-relaxed font-sans">{selectedApplicant.experience} Relevant Work</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Consistent history in dynamic environments</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                                    <span className="block text-[9px] uppercase text-slate-400 font-black mb-1">Compatibility Rating</span>
                                    <p className="font-bold text-slate-800 leading-relaxed flex items-center gap-2 font-sans">
                                      <span className="text-emerald-600 font-mono text-sm font-black">{selectedApplicant.matchScore}%</span> Match
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">Excellent stack harmony with key role requirements</p>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                  <button
                                    onClick={() => {
                                      handleApplicantStatusChange(selectedApplicant.id, 'Interview Scheduled');
                                      setSelectedApplicant(null);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer"
                                  >
                                    Schedule Interview
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleApplicantStatusChange(selectedApplicant.id, 'Rejected');
                                      setSelectedApplicant(null);
                                    }}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer"
                                  >
                                    Decline Request
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {activeSubTab === 'analytics' && (
                        <div className="animate-fade-in space-y-6">
                          {/* Row 1: Top Match card + Stats Grid card */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            {/* Left Card: Top Match Option */}
                            <TopMatchCard className="lg:col-span-5" />

                            {/* Right Card: Overview Stats Grid Card */}
                            <div className="lg:col-span-7 bg-[#f8fafc]/90 rounded-3xl border border-slate-100 p-6 flex items-center justify-around shadow-3xs text-center">
                              <div className="flex-1">
                                <div className="text-[28px] font-black text-slate-800 tracking-tight leading-none mb-2">156</div>
                                <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">All Applications</span>
                              </div>
                              <div className="w-px h-10 bg-slate-200/50" />
                              <div className="flex-1">
                                <div className="text-[28px] font-black text-[#1a56db] tracking-tight leading-none mb-2">12</div>
                                <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Interviewed</span>
                              </div>
                              <div className="w-px h-10 bg-slate-200/50" />
                              <div className="flex-1">
                                <div className="text-[28px] font-black text-slate-800 tracking-tight leading-none mb-2">5</div>
                                <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Shortlist</span>
                              </div>
                              <div className="w-px h-10 bg-slate-200/50" />
                              <div className="flex-1">
                                <div className="text-[28px] font-black text-slate-800 tracking-tight leading-none mb-2">144</div>
                                <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Rejected</span>
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Job Application Frequency Chart */}
                          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-3xs">
                            <h5 className="text-[11.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-4">
                              Job Application Frequency
                            </h5>
                            <div className="h-60 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={[
                                    { month: 'Jan', count: 125 },
                                    { month: 'Feb', count: 135 },
                                    { month: 'Mar', count: 155 },
                                    { month: 'Apr', count: 100 },
                                    { month: 'May', count: 150 },
                                    { month: 'Jun', count: 135 },
                                    { month: 'Jul', count: 165 },
                                    { month: 'Aug', count: 125 },
                                    { month: 'Sep', count: 148 },
                                    { month: 'Oct', count: 155 },
                                    { month: 'Nov', count: 140 },
                                    { month: 'Dec', count: 110 }
                                  ]}
                                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                >
                                  <defs>
                                    <linearGradient id="freqGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#1a56db" stopOpacity={0.15}/>
                                      <stop offset="95%" stopColor="#1a56db" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} ticks={[0, 45, 90, 135, 180]} domain={[0, 180]} />
                                  <Tooltip />
                                  <Area 
                                    type="monotone" 
                                    name="Applications" 
                                    dataKey="count" 
                                    stroke="#1a56db" 
                                    strokeWidth={2} 
                                    dot={{ stroke: '#1a56db', strokeWidth: 2.5, r: 4.5, fill: '#fff' }}
                                    fill="url(#freqGradient)" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Row 3: Grid of 3 Distributions */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Salary Expectations Distribution Bar Chart */}
                            <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-3xs flex flex-col justify-between">
                              <h5 className="text-[11.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                                Salary Expectations
                              </h5>
                              <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      { range: '<10K', count: 30, color: '#93c5fd' },
                                      { range: '10-15K', count: 48, color: '#2563eb' },
                                      { range: '15-20K', count: 42, color: '#a3e635' },
                                      { range: '>20K', count: 12, color: '#facc15' }
                                    ]}
                                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={9} fontStyle="italic" tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} ticks={[0, 15, 30, 45, 60]} domain={[0, 60]} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={30}>
                                      {[
                                        { color: '#93c5fd' },
                                        { color: '#2563eb' },
                                        { color: '#a3e635' },
                                        { color: '#facc15' }
                                      ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Gender Distribution Pie Chart (with bullet legends) */}
                            <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-3xs flex flex-col justify-between">
                              <h5 className="text-[11.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                                Gender Distribution
                              </h5>
                              <div className="h-32 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Male', value: 68 },
                                        { name: 'Female', value: 56 }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={32}
                                      outerRadius={52}
                                      paddingAngle={3}
                                      dataKey="value"
                                    >
                                      <Cell fill="#2563eb" />
                                      <Cell fill="#93c5fd" />
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="flex justify-center items-center gap-6 select-none pt-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                                  <span className="text-[10.5px] font-extrabold text-slate-600">Male: 68</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]" />
                                  <span className="text-[10.5px] font-extrabold text-slate-600">Female: 56</span>
                                </div>
                              </div>
                            </div>

                            {/* Experience Distribution Bar Chart */}
                            <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-3xs flex flex-col justify-between">
                              <h5 className="text-[11.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                                Experience Distribution
                              </h5>
                              <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      { range: '0-2 years', count: 12 },
                                      { range: '3-5 years', count: 42 },
                                      { range: '6-10 years', count: 48 },
                                      { range: '10+ years', count: 18 }
                                    ]}
                                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={9} fontStyle="italic" tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} ticks={[0, 15, 30, 45, 60]} domain={[0, 60]} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={30}>
                                      {[
                                        { color: '#84cc16' },
                                        { color: '#2563eb' },
                                        { color: '#facc15' },
                                        { color: '#93c5fd' }
                                      ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. Actions Row at Very Bottom, persistently visible across all sub-tabs */}
                      <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4 mt-6">
                        <button
                          onClick={() => handleCloseJob(job.id, job.title)}
                          className="px-6 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                        >
                          Close Job
                        </button>

                        <button
                          onClick={() => handleEditJob(job.title)}
                          className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-3xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Job</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

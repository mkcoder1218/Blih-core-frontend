/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import TopMatchCard from './TopMatchCard';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  Eye,
  BarChart2,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Briefcase
} from 'lucide-react';

interface ClosedPostsProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function RecruitmentClosedPosts({
  onDraftAiSuggestion,
  showAlert
}: ClosedPostsProps) {
  // Collapsible state for closed job postings
  const [closedJobs, setClosedJobs] = useState([
    {
      id: 'job-closed-1',
      title: 'Marketing Manager',
      label: 'Intern',
      status: 'Closed Job',
      department: 'DIGITAL MARKETING DEPT.',
      type: 'Full-time',
      positions: '1 Position',
      applicants: 124,
      views: 1420,
      expanded: true,
      activeSubTab: 'Analytics' as 'Job Detail' | 'Applicants (40)' | 'Analytics'
    },
    {
      id: 'job-closed-2',
      title: 'Finance Executive',
      label: 'Senior',
      status: 'Closed Job',
      department: 'TECHNICAL DEPT.',
      type: 'Full-time',
      positions: '1 Position',
      applicants: 124,
      views: 1420,
      expanded: false,
      activeSubTab: 'Analytics' as 'Job Detail' | 'Applicants (40)' | 'Analytics'
    },
    {
      id: 'job-closed-3',
      title: 'Senior Software Engineer',
      label: 'Full-time',
      status: 'Closed Job',
      department: 'TECHNICAL DEPT.',
      type: 'Full-time',
      positions: '2 Positions',
      applicants: 184,
      views: 2150,
      expanded: false,
      activeSubTab: 'Analytics' as 'Job Detail' | 'Applicants (40)' | 'Analytics'
    }
  ]);

  const toggleExpand = (id: string) => {
    setClosedJobs(prev =>
      prev.map(j => (j.id === id ? { ...j, expanded: !j.expanded } : j))
    );
  };

  const setSubTab = (id: string, tab: 'Job Detail' | 'Applicants (40)' | 'Analytics') => {
    setClosedJobs(prev =>
      prev.map(j => (j.id === id ? { ...j, activeSubTab: tab } : j))
    );
  };

  // Chart data definitions
  const lineChartData = [
    { name: 'Jan', count: 125 },
    { name: 'Feb', count: 140 },
    { name: 'Mar', count: 155 },
    { name: 'Apr', count: 95 },
    { name: 'May', count: 148 },
    { name: 'Jun', count: 142 },
    { name: 'Jul', count: 175 },
    { name: 'Aug', count: 114 },
    { name: 'Sep', count: 146 },
    { name: 'Oct', count: 152 },
    { name: 'Nov', count: 141 },
    { name: 'Dec', count: 105 }
  ];

  const salaryExpectationsData = [
    { name: '<10K', count: 22, fill: '#bfdbfe' },
    { name: '10-15K', count: 48, fill: '#2563eb' },
    { name: '15-20K', count: 39, fill: '#a3e635' },
    { name: '>20K', count: 15, fill: '#facc15' }
  ];

  const genderDistributionData = [
    { name: 'Male', value: 68, color: '#2563eb' },
    { name: 'Female', value: 56, color: '#93c5fd' }
  ];

  const experienceDistributionData = [
    { name: '0-2 years', count: 18, fill: '#a3e635' },
    { name: '3-5 years', count: 45, fill: '#2563eb' },
    { name: '6-10 years', count: 52, fill: '#facc15' },
    { name: '10+ years', count: 21, fill: '#93c5fd' }
  ];

  const handleAiInsightRequest = (title: string) => {
    const prompt = `Synthesize recruitment diagnostics and funnel optimization insights for a closed '${title}' posting. Break down key performance indicators, application rate trends, and demographic profiles.`;
    onDraftAiSuggestion(prompt);
  };

  return (
    <div id="recruitment-closed-posts-view" className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-xs gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">Closed Job Postings</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Completed recruitment processes and hires</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-slate-100 hover:bg-slate-150 text-slate-700 font-extrabold text-[11px] px-3 py-1.5 rounded-lg border border-slate-205">
            4 Closed Positions
          </span>
          <button
            onClick={() => handleAiInsightRequest('Marketing Management')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Audit Funnel</span>
          </button>
        </div>
      </div>

      {/* Main Closed Postings Collapsible Container */}
      <div className="space-y-5">
        {closedJobs.map((job) => {
          return (
            <div key={job.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              
              {/* Card Title Header with brief counts */}
              <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-black text-slate-900 tracking-tight">{job.title}</h4>
                    <span className="bg-blue-50 text-blue-650 font-extrabold text-[9.5px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                      {job.label}
                    </span>
                    <span className="bg-slate-100 text-slate-650 font-bold text-[9.5px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 text-[11.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    <span className="text-blue-600 font-extrabold">{job.department}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                    <span>•</span>
                    <span>{job.positions}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
                    <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-bold block text-slate-600">
                      <strong>{job.applicants}</strong> applicants
                    </span>
                    <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-bold block text-slate-600">
                      <strong>{job.views}</strong> views
                    </span>
                  </div>

                  <button
                    onClick={() => toggleExpand(job.id)}
                    className="text-xs font-black text-blue-600 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>{job.expanded ? 'Less' : 'More'}</span>
                    {job.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsed Internal Information Pane */}
              {job.expanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/20 space-y-6 animate-fade-in">
                  
                  {/* Internal Sub Navigation Tabs */}
                  <div className="flex border-b border-slate-100 gap-1.5">
                    {['Job Detail', 'Applicants (40)', 'Analytics'].map((tabName) => {
                      const isActive = job.activeSubTab === tabName;
                      return (
                        <button
                          key={tabName}
                          onClick={() => setSubTab(job.id, tabName as any)}
                          className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer border-t-2 ${
                            isActive
                              ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                              : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'
                          }`}
                        >
                          {tabName}
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE TAB CONTENT ROUTER */}
                  {job.activeSubTab === 'Analytics' && (
                    <div className="space-y-6">
                      
                      {/* Top Match Card Panel & Core Stats Breakdown row */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                        
                        {/* Top Match box */}
                        <TopMatchCard className="lg:col-span-5" />

                        {/* Core Stats Overview on the right */}
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-5 items-center">
                          <div className="text-center p-3.5 rounded-xl hover:bg-slate-50/60 transition-colors">
                            <h3 className="text-2xl font-black text-slate-950">156</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Total</span>
                          </div>
                          <div className="text-center p-3.5 rounded-xl hover:bg-slate-50/60 transition-colors">
                            <h3 className="text-2xl font-black text-blue-600">12</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Interviewed</span>
                          </div>
                          <div className="text-center p-3.5 rounded-xl hover:bg-slate-50/60 transition-colors">
                            <h3 className="text-2xl font-black text-emerald-600">5</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Shortlist</span>
                          </div>
                          <div className="text-center p-3.5 rounded-xl hover:bg-slate-50/60 transition-colors">
                            <h3 className="text-2xl font-black text-rose-500">144</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Rejected</span>
                          </div>
                        </div>
                      </div>

                      {/* Job Application Frequency graph inside expand panel */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Job Application Frequency</h4>
                          <span className="text-[9.5px] font-bold text-slate-400 tracking-wider">Historical monthly application counts</span>
                        </div>
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 180]} ticks={[0, 45, 90, 135, 180]} tick={{ fontSize: 9.5, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip formatter={(value) => [`${value} Submissions`, 'Applicants']} />
                              <Line type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={2.4} dot={{ fill: '#1d4ed8', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Bottom Distributions group matching the mockup */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* Salary Expectations Bar Chart */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                          <div className="pb-1.5 border-b border-slate-50">
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Salary Expectations</h4>
                          </div>
                          <div className="h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={salaryExpectationsData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(val) => [`${val} candidates`, 'Salary Expectation']} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                  {salaryExpectationsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Gender Distribution Pie Chart */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                          <div className="pb-1.5 border-b border-slate-50">
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Gender Distribution</h4>
                          </div>
                          <div className="flex flex-row items-center justify-around h-[150px]">
                            <div className="w-[100px] h-[100px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={genderDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={24}
                                    outerRadius={45}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {genderDistributionData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 text-[10.5px] font-bold text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                                <span>Male: <strong>68</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]" />
                                <span>Female: <strong>56</strong></span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Experience Distribution Bar Chart */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                          <div className="pb-1.5 border-b border-slate-50">
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Experience Distribution</h4>
                          </div>
                          <div className="h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={experienceDistributionData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(val) => [`${val} applicants`, 'Applicants count']} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                  {experienceDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* Other child tabs stubs */}
                  {job.activeSubTab === 'Job Detail' && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-fade-in font-semibold text-xs text-slate-600">
                      <h5 className="font-black text-slate-900 border-b border-slate-100 pb-2">Full Specifications</h5>
                      <p className="leading-relaxed font-medium">
                        Coordinate corporate brand guidelines, lead targeted outbound digital advertisement loops, analyze multi-channel performance coefficients, and direct lead capture integrations securely.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <strong className="block text-slate-800 mb-0.5">Qualifications Needed</strong>
                          <span className="block text-slate-550">BA in Marketing, 2+ Years analytics proficiency</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <strong className="block text-slate-800 mb-0.5">Key Deliverables</strong>
                          <span className="block text-slate-550">Channel ROI improvements, detailed audience profiles</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {job.activeSubTab === 'Applicants (40)' && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5 animate-fade-in text-xs font-semibold">
                      <h5 className="font-black text-slate-900 border-b border-slate-100 pb-2">Qualified Pipeline Resume Index</h5>
                      <div className="space-y-2">
                        {[
                          { name: 'Jessica Parker', match: '90%', status: 'Shortlisted' },
                          { name: 'Alexander Webb', match: '85%', status: 'Interviewed' },
                          { name: 'Chloe Vance', match: '81%', status: 'Reviewed' }
                        ].map((appl, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/70">
                            <span className="text-slate-800 font-bold block">{appl.name}</span>
                            <div className="flex gap-2 items-center">
                              <span className="bg-blue-50 text-blue-600 border border-blue-105 rounded px-2 py-0.5 text-[10px] font-black">{appl.match} match</span>
                              <span className="bg-slate-150 text-slate-700 rounded px-2 py-0.5 text-[10px] font-black">{appl.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}

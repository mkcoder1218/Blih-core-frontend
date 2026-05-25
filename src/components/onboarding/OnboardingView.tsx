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
  Tooltip
} from 'recharts';
import {
  UserPlus,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  FileText,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Plus,
  Square,
  CheckSquare,
  Search,
  Trash2,
  Copy,
  Edit2,
  Lock,
  Compass
} from 'lucide-react';

interface OnboardingViewProps {
  currentTab: 'overview' | 'contract' | 'progress' | 'probation' | 'checklists';
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function OnboardingView({
  currentTab,
  onDraftAiSuggestion,
  showAlert,
}: OnboardingViewProps) {
  // Common states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  // --- TAB 2: CONTRACT STATE ---
  const [contracts, setContracts] = useState([
    {
      id: 'con-1',
      employee: 'Jessica Parker',
      dept: 'Technical Dept.',
      role: 'Full Stack Developer',
      offerDate: 'Dec 30, 2025',
      startDate: 'Dec 30, 2025',
      probationPeriod: '3 months',
      hours: '40 hrs/wk',
      salary: '15,000',
      summary: 'Develop and maintain full-stack applications using React, Node.js, and cloud infrastructure. Lead technical initiatives and mentor junior developers.',
      responsibilities: [
        'Experience with digital marketing',
        'Strong analytical skills',
        'Team leadership experience'
      ],
      expanded: true,
    },
    {
      id: 'con-2',
      employee: 'Sarah Jenkins',
      dept: 'Marketing Dept.',
      role: 'Growth Marketing Manager',
      offerDate: 'Jan 15, 2026',
      startDate: 'Jan 22, 2026',
      probationPeriod: '3 months',
      hours: '38 hrs/wk',
      salary: '12,500',
      summary: 'Formulate lead-acquisition roadmaps, establish conversion tags across channels, coordinate seasonal campaigns, and monitor overall media spending.',
      responsibilities: [
        'Analytical SEO and PPC campaigns execution',
        'Collaborative work with content design stakeholders',
        'Advanced Hubspot analytics metrics configuration'
      ],
      expanded: false,
    },
    {
      id: 'con-3',
      employee: 'Arthur Miller',
      dept: 'Product Dept.',
      role: 'Senior UI/UX Designer',
      offerDate: 'Feb 10, 2026',
      startDate: 'Feb 20, 2026',
      probationPeriod: '6 months',
      hours: '40 hrs/wk',
      salary: '14,000',
      summary: 'Redesign client portfolio displays, build standard Figma component kits, lead cross-team co-design workshops, and conduct primary customer testing sessions.',
      responsibilities: [
        'Figma Design Systems curation',
        'Atomic Design principles fluency',
        'Client journey research analysis'
      ],
      expanded: false,
    }
  ]);

  const toggleContractExpand = (id: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c));
  };


  // --- TAB 3: PROGRESS STATE (Dynamic Checklists) ---
  const [processes, setProcesses] = useState([
    {
      id: 'proc-1',
      employee: 'Jessica Parker',
      dept: 'Technical Dept.',
      role: 'Full Stack Developer',
      tasks: [
        { label: 'Profile Created', done: true },
        { label: 'Assets Assigned', done: true },
        { label: 'System Access', done: false },
        { label: 'Policies Signed', done: true },
        { label: 'Access and Credential', done: true },
        { label: 'Compliance Overview', done: false },
        { label: 'Access Setup', done: true },
        { label: 'Workstation Setup', done: false },
        { label: 'Intro Meeting', done: true },
      ],
    },
    {
      id: 'proc-2',
      employee: 'Sarah Jenkins',
      dept: 'Marketing Dept.',
      role: 'Growth Marketing Manager',
      tasks: [
        { label: 'Profile Created', done: true },
        { label: 'Assets Assigned', done: false },
        { label: 'System Access', done: false },
        { label: 'Policies Signed', done: true },
        { label: 'Brand Guidelines Intro', done: false },
        { label: 'Access Setup', done: false },
      ],
    }
  ]);

  const toggleTaskStatus = (processId: string, taskIndex: number) => {
    setProcesses(prev => prev.map(p => {
      if (p.id === processId) {
        const updatedTasks = [...p.tasks];
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          done: !updatedTasks[taskIndex].done
        };
        const completedCount = updatedTasks.filter(t => t.done).length;
        showAlert(`Updated checkpoint status for ${p.employee} (${completedCount}/${updatedTasks.length} tasks completed)`, 'info');
        return { ...p, tasks: updatedTasks };
      }
      return p;
    }));
  };

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignCandidate, setAssignCandidate] = useState({ name: '', role: '', dept: 'Technical Dept.' });

  const handleAssignChecklistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCandidate.name || !assignCandidate.role) return;

    const newProcess = {
      id: `proc-${Date.now()}`,
      employee: assignCandidate.name,
      dept: assignCandidate.dept,
      role: assignCandidate.role,
      tasks: [
        { label: 'Profile Created', done: true },
        { label: 'Assets Assigned', done: false },
        { label: 'System Access', done: false },
        { label: 'Policies Signed', done: false },
        { label: 'Access and Credential', done: false },
      ]
    };

    setProcesses(prev => [newProcess, ...prev]);
    setAssignModalOpen(false);
    showAlert(`Successfully started onboarding process for ${assignCandidate.name}!`, 'success');
    setAssignCandidate({ name: '', role: '', dept: 'Technical Dept.' });
  };


  // --- TAB 4: PROBATION STATE ---
  const [probationStaff, setProbationStaff] = useState([
    {
      id: 'prob-1',
      employee: 'Jessica Parker',
      dept: 'Technical Dept.',
      role: 'Full Stack Developer',
      startDate: 'Dec 30, 2025',
      endDate: 'Dec 30, 2025', // Matches visual mockup
      daysRemaining: 77,
      score: 87,
      expanded: true,
      reviews: [
        { title: 'First Review Date', date: 'Dec 30, 2025', label: 'Review Score', val: '45%' },
        { title: 'Second Review Date', date: 'Dec 30, 2025', label: 'Review Score', val: '45%' }
      ],
      kpis: [
        { label: 'Code Quality', score: 85, target: 90, pct: '30%' },
        { label: 'Project Delivery', score: 95, target: 100, pct: '40%' },
        { label: 'Team Collaboration', score: 88, target: 85, pct: '30%' }
      ],
      overallKpi: '90%',
    },
    {
      id: 'prob-2',
      employee: 'Sarah Jenkins',
      dept: 'Marketing Dept.',
      role: 'Growth Marketing Manager',
      startDate: 'Jan 22, 2026',
      endDate: 'Apr 22, 2026',
      daysRemaining: 99,
      score: 72,
      expanded: false,
      reviews: [
        { title: 'First Review Date', date: 'Feb 22, 2026', label: 'Review Score', val: '75%' }
      ],
      kpis: [
        { label: 'Campaign Accuracy', score: 70, target: 90, pct: '30%' },
        { label: 'Lead Sourcing Volume', score: 80, target: 100, pct: '40%' },
        { label: 'Creative Alignment', score: 90, target: 85, pct: '30%' }
      ],
      overallKpi: '80%',
    }
  ]);

  const toggleProbationExpand = (id: string) => {
    setProbationStaff(prev => prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p));
  };

  const handleUpdateKpi = (probId: string, kpiIndex: number, newScore: number) => {
    setProbationStaff(prev => prev.map(p => {
      if (p.id === probId) {
        const updatedKpis = [...p.kpis];
        updatedKpis[kpiIndex] = { ...updatedKpis[kpiIndex], score: Math.min(newScore, 100) };
        const average = Math.round(updatedKpis.reduce((acc, k) => acc + k.score, 0) / updatedKpis.length);
        return {
          ...p,
          kpis: updatedKpis,
          score: average,
          overallKpi: `${average}%`
        };
      }
      return p;
    }));
    showAlert('KPI score calibrated! Recalculating totals...', 'success');
  };


  // --- TAB 5: CHECKLIST TEMPLATES ---
  const [templates, setTemplates] = useState([
    {
      id: 'tpl-1',
      title: 'Software Engineer Onboarding',
      dept: 'Technical Dept.',
      itemsCount: 12,
      timesUsed: 8,
      created: 'Dec 15, 2024',
      lastUsed: 'Dec 15, 2024',
      checklist: [
        'Create employee profile in system',
        'Send offer letter via email',
        'Provide login credentials',
        'Schedule company policy review',
        'Set up development environment'
      ]
    },
    {
      id: 'tpl-2',
      title: 'Marketing Team Onboarding',
      dept: 'Marketing Dept.',
      itemsCount: 12,
      timesUsed: 8,
      created: 'Dec 15, 2024',
      lastUsed: 'Dec 15, 2024',
      checklist: [
        'Create employee profile in system',
        'Send offer letter via email',
        'Provide login credentials',
        'Schedule company policy review',
        'Set up development environment'
      ]
    },
    {
      id: 'tpl-3',
      title: 'General Employee Onboarding',
      dept: 'HR Department',
      itemsCount: 12,
      timesUsed: 8,
      created: 'Dec 15, 2024',
      lastUsed: 'Dec 15, 2024',
      checklist: [
        'Create employee profile in system',
        'Send offer letter via email',
        'Provide login credentials',
        'Schedule company policy review',
        'Set up development environment'
      ]
    }
  ]);

  const [newTemplate, setNewTemplate] = useState({ title: '', dept: 'Technical Dept.', items: '' });
  const [tplFormOpen, setTplFormOpen] = useState(false);

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title) return;

    const parsedItems = newTemplate.items
      ? newTemplate.items.split('\n').filter(i => i.trim() !== '')
      : ['Create employee profile', 'Coordinate direct-deposit setups', 'Compliance brief'];

    const newTpl = {
      id: `tpl-${Date.now()}`,
      title: newTemplate.title,
      dept: newTemplate.dept,
      itemsCount: parsedItems.length,
      timesUsed: 0,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      checklist: parsedItems.slice(0, 5)
    };

    setTemplates(prev => [...prev, newTpl]);
    setNewTemplate({ title: '', dept: 'Technical Dept.', items: '' });
    setTplFormOpen(false);
    showAlert(`Successfully created new checklist: ${newTpl.title}!`, 'success');
  };

  const deleteTemplate = (id: string, name: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    showAlert(`Deleted template: ${name}`, 'info');
  };

  const duplicateTemplate = (template: typeof templates[0]) => {
    const duplicated = {
      ...template,
      id: `tpl-${Date.now()}`,
      title: `${template.title} (Copy)`,
      timesUsed: 0,
    };
    setTemplates(prev => [...prev, duplicated]);
    showAlert(`Duplicated: ${template.title}`, 'success');
  };

  const handleUseChecklist = (title: string) => {
    showAlert(`Instantiated onboarding trackers utilizing ${title}`, 'success');
  };

  const handleAiTemplateGeneration = (roleName: string) => {
    const p = `Formulate a complete, 8-step high-fidelity employee onboarding checklist template specifically tailored for a '${roleName}' role. Detail the core dependencies, system clearances, and milestones.`;
    onDraftAiSuggestion(p);
  };


  // --- OVERVIEW DATA ---
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

  return (
    <div id="onboarding-module-container" className="space-y-6">

      {/* --- OVERVIEW TAB --- */}
      {currentTab === 'overview' && (
        <div id="tab-overview-pane" className="space-y-6 animate-fade-in font-sans pb-12">
          {/* Top Summary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Onboarding</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">12</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserPlus className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Completed This Month</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">28</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">On Probation</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">45</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Work Hours Performance Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Work Hours Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Daily */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Daily</span>
                    <h3 className="text-2xl font-black text-blue-600 mt-1">8.5h</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Target: 8h</p>
                  </div>
                  <div className="text-blue-600 bg-blue-50/70 p-1.5 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                    <span>Performance</span>
                    <span className="text-blue-600">108%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              {/* Monthly */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Monthly</span>
                    <h3 className="text-2xl font-black text-blue-600 mt-1">168h</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Target: 160h</p>
                  </div>
                  <div className="text-blue-600 bg-blue-50/70 p-1.5 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                    <span>Performance</span>
                    <span className="text-blue-600">105%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              {/* Annually */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Annually</span>
                    <h3 className="text-2xl font-black text-blue-600 mt-1">2016h</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Target: 1920h</p>
                  </div>
                  <div className="text-blue-600 bg-blue-50/70 p-1.5 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                    <span>Performance</span>
                    <span className="text-blue-600">105%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Application Frequency Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Job Application Frequency</h4>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-normal">Monthly metric registry</span>
            </div>
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 180]} ticks={[0, 45, 90, 135, 180]} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} Apps`, 'Applications']} />
                  <Line type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={2.5} dot={{ fill: '#1d4ed8', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom simple stats row matching mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-450 tracking-wider">Total Checklists</span>
                <h4 className="text-2xl font-black text-slate-900 mt-2">3</h4>
              </div>
              <div className="text-blue-500">
                <CheckSquare className="w-5 h-5 line-clamp-1" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-450 tracking-wider">Total Items</span>
                <h4 className="text-2xl font-black text-slate-900 mt-2">37</h4>
              </div>
              <div className="text-blue-500">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-450 tracking-wider">Times Used</span>
                <h4 className="text-2xl font-black text-slate-900 mt-2">28</h4>
              </div>
              <div className="text-blue-500">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* --- CONTRACTS TAB --- */}
      {currentTab === 'contract' && (
        <div id="tab-contract-pane" className="space-y-6 animate-fade-in font-sans pb-12">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Contracts</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">12</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Offer Letters Sent</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">28</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">On Probation</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">45</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* New Employee Contracts header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">New Employee Contracts</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Details of signed employment contracts and offers.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-bold"
                />
              </div>
              <button
                onClick={() => onDraftAiSuggestion('Draft a standard executive-level offer letter template.')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Draft Offer</span>
              </button>
            </div>
          </div>

          {/* Collapsible contracts list */}
          <div className="space-y-4">
            {contracts
              .filter(c => c.employee.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((con) => (
                <div key={con.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                  {/* Card Header (Visible Summary) */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                        {con.employee.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900">{con.employee}</h4>
                          <span className="bg-blue-50 text-[9.5px] text-blue-600 font-extrabold uppercase px-2 py-0.5 rounded-md">
                            {con.dept}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{con.role}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleContractExpand(con.id)}
                      className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-150"
                    >
                      <span>{con.expanded ? 'Less' : 'More'}</span>
                      {con.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expandable Body */}
                  {con.expanded && (
                    <div className="border-t border-slate-100 p-5 bg-slate-50/30 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                      {/* Left Side Role details */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="bg-blue-50/70 border border-blue-100 text-blue-700 rounded-xl p-3 flex items-center gap-2 font-bold text-[11px]">
                          <Mail className="w-4 h-4 fill-blue-600/10 text-blue-600" />
                          <span>Offer letter sent on: {con.offerDate}</span>
                        </div>

                        <div className="space-y-1.5">
                          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Role Summary</h5>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold bg-white p-3.5 rounded-xl border border-slate-100/70">
                            {con.summary}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Responsibilities</h5>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                            {con.responsibilities.map((resp, i) => (
                              <li key={i} className="flex items-start gap-2 bg-white/70 px-3 py-2 rounded-xl border border-slate-50/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Right Side Overview attributes & actions */}
                      <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                        <div className="bg-white rounded-xl border border-slate-100 p-4.5 space-y-4.5 text-xs font-semibold text-slate-700">
                          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest pb-1 border-b border-slate-100">Overview</h5>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Start Date</span>
                              <span className="text-slate-800 font-extrabold">{con.startDate}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Probation Period</span>
                              <span className="text-slate-800 font-extrabold">{con.probationPeriod}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Work Hours</span>
                              <span className="text-slate-800 font-extrabold">{con.hours}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5 text-blue-600">Salary & Payroll</span>
                              <span className="text-blue-605 font-black">${con.salary}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => showAlert(`Navigating with system records identifier for ${con.employee}`, 'info')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
                          >
                            View Record
                          </button>
                          <button
                            onClick={() => showAlert(`Redirecting to public user profiles index for ${con.employee}`, 'info')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
                          >
                            Visit Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}


      {/* --- PROGRESS TAB --- */}
      {currentTab === 'progress' && (
        <div id="tab-progress-pane" className="space-y-6 animate-fade-in font-sans pb-12">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Onboarding</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{processes.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserPlus className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Completed This Month</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">28</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">On Probation</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">45</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Active Onboarding processes header block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Active Onboarding Processes</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Checklists and tracking new employees</p>
            </div>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Assign Checklist</span>
            </button>
          </div>

          {/* List of active processes */}
          <div className="space-y-4">
            {processes.map((proc) => {
              const completedCount = proc.tasks.filter(t => t.done).length;
              const originalPct = proc.tasks.length > 0 ? Math.round((completedCount / proc.tasks.length) * 100) : 0;
              // Circle progress params
              const radius = 24;
              const strokeWidth = 5.5;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (originalPct / 100) * circumference;

              return (
                <div key={proc.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col xl:flex-row gap-5 items-stretch shadow-xs">
                  {/* Left segment employee info & task items */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                        {proc.employee.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900">{proc.employee}</h4>
                          <span className="bg-blue-50 text-[9.5px] text-blue-600 font-extrabold uppercase px-2 py-0.5 rounded-md">
                            {proc.dept}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{proc.role}</p>
                      </div>
                    </div>

                    {/* Interactive milestones checklists checklist */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-1">
                      {proc.tasks.map((task, idx) => {
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleTaskStatus(proc.id, idx)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all cursor-pointer border ${
                              task.done
                                ? 'bg-blue-50/50 border-blue-105 text-blue-600'
                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-500'
                            }`}
                          >
                            {task.done ? (
                              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 fill-blue-50/80 stroke-[2.5]" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="truncate">{task.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right segment Completion rate block matching Image 3 visual style */}
                  <div className="w-full xl:w-56 bg-slate-50/50 rounded-2xl border border-slate-100/80 p-4.5 flex flex-row xl:flex-col items-center justify-between text-center xl:justify-center xl:space-y-3.5">
                    {/* Compact Title block matching Completion Bar outline */}
                    <div className="flex items-center gap-1.5 pb-1 xl:border-b xl:border-slate-100 w-full xl:justify-center">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Completion Bar</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    </div>

                    {/* Radial Progress Graphic */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          stroke="#e2e8f0"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r={radius}
                          stroke="#2563eb"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-slate-900 tracking-tight">
                        {originalPct}%
                      </span>
                    </div>

                    {/* Compact stats breakdown */}
                    <div className="text-right xl:text-center text-[11px] font-semibold">
                      <p className="text-slate-800">Overall Progress</p>
                      <span className="text-[#2563eb] font-black block mt-0.5">{completedCount}/{proc.tasks.length} tasks</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Simulated empty state slot */}
            <div className="border border-dashed border-slate-205 rounded-2xl bg-white/40 p-8 text-center text-slate-400 font-semibold text-xs leading-normal">
              No active onboarding to track.
            </div>
          </div>
        </div>
      )}


      {/* --- PROBATION TAB --- */}
      {currentTab === 'probation' && (
        <div id="tab-probation-pane" className="space-y-6 animate-fade-in font-sans pb-12">
          {/* Top summary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">On Probation</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">3</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Avg Performance</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">57%</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Reviews</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">3</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Award className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Section title header */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Performance and Probation</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">KPI tracking, reviews, and results of employees on probation.</p>
            </div>
            <button
              onClick={() => onDraftAiSuggestion('Provide strategic tips to manage low-performing probation employees with sensitivity.')}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Coaching Tips</span>
            </button>
          </div>

          {/* Probation staff cards */}
          <div className="space-y-4">
            {probationStaff.map((prob) => (
              <div key={prob.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                {/* Visible Header element */}
                <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      {prob.employee.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">{prob.employee}</h4>
                        <span className="bg-blue-50 text-[9.5px] text-blue-600 font-extrabold uppercase px-2 py-0.5 rounded-md">
                          {prob.dept}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{prob.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex-1 max-w-lg text-[11px] font-semibold text-slate-700">
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Start Date</span>
                      <strong className="text-slate-800">{prob.startDate}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider">End Date</span>
                      <strong className="text-slate-800">{prob.endDate}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider text-blue-600">Days Remaining</span>
                      <strong className="text-[#2563eb] block font-black">{prob.daysRemaining} Days</strong>
                    </div>
                  </div>

                  {/* Automated Score Panel */}
                  <div className="bg-[#f0f4ff]/80 border border-blue-50 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs min-w-[210px]">
                    <div>
                      <div className="flex items-center gap-1 text-slate-850 font-bold">
                        <span>Automated Score</span>
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                      </div>
                      <span className="text-[9.5px] text-slate-400 leading-tight block">Based on KPI, OKR, and review data</span>
                    </div>
                    <span className="text-lg font-black text-[#2563eb]">{prob.score}%</span>
                  </div>

                  <button
                    onClick={() => toggleProbationExpand(prob.id)}
                    className="text-xs font-bold text-blue-600 self-center hover:bg-slate-50 p-2 rounded-xl border border-slate-150 cursor-pointer transition-all flex items-center gap-1"
                  >
                    <span>{prob.expanded ? 'Less' : 'More'}</span>
                    {prob.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded content details matching image 4 */}
                {prob.expanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/30 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in font-sans">
                    {/* Left side Reviews list */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5">Reviews</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {prob.reviews.map((rev, i) => (
                          <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-100/90 flex flex-col justify-between space-y-3.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400">{rev.title}</span>
                                <h5 className="font-extrabold text-slate-800 text-[11.5px] mt-0.5">{rev.date}</h5>
                              </div>
                              <span className="text-[10px] text-blue-600 bg-blue-50/90 px-1.5 py-0.5 rounded font-black">{rev.label}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/60">
                              <span className="text-[10.5px] text-slate-550 font-bold">Reviewer</span>
                              <span className="text-xs font-black text-slate-900">John Smith</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Staff Rating</span>
                              <strong className="text-blue-600 font-black">{rev.val}</strong>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* AI integration scheduled block */}
                      <div className="bg-blue-50/60 border border-blue-105 text-blue-700 rounded-xl p-3 flex justify-between items-center text-[11.5px] font-bold">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4.5 h-4.5 text-blue-600" />
                          <span>Next Review Schedule</span>
                        </div>
                        <span className="text-xs font-black bg-white px-2.5 py-1 rounded-md border border-blue-200">Dec 8, 2025</span>
                      </div>
                    </div>

                    {/* Right side KPI Performance lists */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5">KPI Performance</h4>
                        
                        <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100/80">
                          {prob.kpis.map((kpi, idx) => {
                            return (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold">
                                  <span className="text-slate-700">{kpi.label}</span>
                                  <div className="flex items-center gap-2">
                                    {/* Score controller increments */}
                                    <button
                                      onClick={() => handleUpdateKpi(prob.id, idx, kpi.score - 5)}
                                      className="w-4 h-4 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-500 rounded flex items-center justify-center text-[9px] cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-slate-800">{kpi.score}/{kpi.target} ({kpi.pct})</span>
                                    <button
                                      onClick={() => handleUpdateKpi(prob.id, idx, kpi.score + 5)}
                                      className="w-4 h-4 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-500 rounded flex items-center justify-center text-[9px] cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-105 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${(kpi.score / kpi.target) * 100}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cumulative total indicator */}
                      <div className="flex justify-between items-center pt-3.5 border-t border-slate-100">
                        <div className="text-xs font-semibold">
                          <p className="text-slate-500">Overall KPI Score</p>
                          <span className="text-2xl font-black text-[#2563eb]">{prob.overallKpi}</span>
                        </div>

                        {/* Interactive triggers */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => showAlert('Displaying comprehensive audit records tracker', 'info')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Preview Evaluations
                          </button>
                          <button
                            onClick={() => showAlert('Opened evaluation drafting sheet workspace', 'success')}
                            className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-black px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Give Evaluation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* --- CHECKLISTS TEMPLATING TAB --- */}
      {currentTab === 'checklists' && (
        <div id="tab-lists-pane" className="space-y-6 animate-fade-in font-sans pb-12">
          {/* Summary stats matching visual cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Checklists</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{templates.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckSquare className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Items</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">37</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckSquare className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-105 p-5 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Times Used</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">28</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* New template and AI section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Onboarding Checklists</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Create and manage reusable onboarding checklists</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTplFormOpen(!tplFormOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Template</span>
              </button>
            </div>
          </div>

          {/* Interactive creation Form inline */}
          {tplFormOpen && (
            <form onSubmit={handleCreateTemplate} className="bg-white rounded-2xl border border-blue-500/20 p-5 space-y-4 animate-scale-up">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Configure New Checklist Template</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-450 uppercase">Template Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Copywriter Onboarding"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1.5 focus:ring-blue-600/10 placeholder-slate-400 text-slate-705"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-450 uppercase">Target Department</label>
                  <select
                    value={newTemplate.dept}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, dept: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold text-slate-655 focus:outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="Technical Dept.">Technical Dept.</option>
                    <option value="Marketing Dept.">Marketing Dept.</option>
                    <option value="HR Department">HR Department</option>
                    <option value="Design & Creative">Design & Creative</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-slate-450 uppercase">Custom Items (One Per Line)</label>
                    {newTemplate.title && (
                      <button
                        type="button"
                        onClick={() => handleAiTemplateGeneration(newTemplate.title)}
                        className="text-[9px] font-extrabold text-blue-605 flex items-center gap-0.5"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600 fill-blue-50" />
                        <span>AI Draft Items</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    placeholder="Create employee file&#10;Coordinate workstation assets setups&#10;Conduct security awareness tutorial"
                    rows={2}
                    value={newTemplate.items}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, items: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3.5 text-xs font-semibold focus:outline-none focus:bg-white placeholder-slate-400 text-slate-705 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTplFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 font-bold rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs transition-colors shadow-xs"
                >
                  Save Template
                </button>
              </div>
            </form>
          )}

          {/* Cards Bento Grid of checklists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:translate-y-[-1px] transition-all">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-[12.5px] font-black text-slate-900 tracking-tight leading-none">{tpl.title}</h4>
                    <span className="text-[9px] font-extrabold text-blue-600 block mt-2 uppercase tracking-widest">{tpl.dept}</span>
                  </div>

                  {/* Summary row stats */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10.5px] font-semibold text-slate-600">
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Total Items</span>
                      <strong className="text-slate-800">{tpl.itemsCount}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Times Used</span>
                      <strong className="text-slate-800">{tpl.timesUsed}</strong>
                    </div>
                    <div className="mt-1.5 border-t border-slate-100 pt-1.5 col-span-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Created</span>
                        <span className="text-slate-500">{tpl.created}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Last Used</span>
                        <span className="text-slate-500">{tpl.lastUsed}</span>
                      </div>
                    </div>
                  </div>

                  {/* Item checklists preview list */}
                  <div className="space-y-1.5 bg-[#fbfcfd] p-3 rounded-xl border border-slate-100/60 text-[11px] font-medium text-slate-650">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Checklist Items:</span>
                    {tpl.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 py-0.5">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600 fill-blue-50 flex-shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100/80 items-center justify-between">
                  <button
                    onClick={() => handleUseChecklist(tpl.title)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[11.5px] px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs flex-1 text-center"
                  >
                    Use This Checklist
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => duplicateTemplate(tpl)}
                      className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer transition-all"
                      title="Duplicate Template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(tpl.id, tpl.title)}
                      className="p-2 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl cursor-pointer transition-all"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ASSIGN CHECKLIST DIALOG MODAL --- */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="absolute inset-0" onClick={() => setAssignModalOpen(false)} />
          
          <form onSubmit={handleAssignChecklistSubmit} className="relative bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-5 space-y-4 shadow-xl z-10 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Assign Onboarding Checklist</h4>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 cursor-pointer font-extrabold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emily Davis"
                  value={assignCandidate.name}
                  onChange={(e) => setAssignCandidate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase">Target Role / Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Product Designer"
                  value={assignCandidate.role}
                  onChange={(e) => setAssignCandidate(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase">Target Department</label>
                <select
                  value={assignCandidate.dept}
                  onChange={(e) => setAssignCandidate(prev => ({ ...prev, dept: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:bg-white cursor-pointer"
                >
                  <option value="Technical Dept.">Technical Dept.</option>
                  <option value="Marketing Dept.">Marketing Dept.</option>
                  <option value="HR Department">HR Department</option>
                  <option value="Design & Creative">Design & Creative</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 font-bold rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Instantiate Onboarding
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

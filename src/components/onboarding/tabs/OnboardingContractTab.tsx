import React, { useState } from 'react';
import { FileText, Mail, Clock, Search, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Contract {
  id: string;
  employee: string;
  dept: string;
  role: string;
  offerDate: string;
  startDate: string;
  probationPeriod: string;
  hours: string;
  salary: string;
  summary: string;
  responsibilities: string[];
  expanded: boolean;
}

interface OnboardingContractTabProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'con-1', employee: 'Jessica Parker', dept: 'Technical Dept.', role: 'Full Stack Developer',
    offerDate: 'Dec 30, 2025', startDate: 'Dec 30, 2025', probationPeriod: '3 months', hours: '40 hrs/wk', salary: '15,000',
    summary: 'Develop and maintain full-stack applications using React, Node.js, and cloud infrastructure. Lead technical initiatives and mentor junior developers.',
    responsibilities: ['Experience with digital marketing', 'Strong analytical skills', 'Team leadership experience'],
    expanded: true,
  },
  {
    id: 'con-2', employee: 'Sarah Jenkins', dept: 'Marketing Dept.', role: 'Growth Marketing Manager',
    offerDate: 'Jan 15, 2026', startDate: 'Jan 22, 2026', probationPeriod: '3 months', hours: '38 hrs/wk', salary: '12,500',
    summary: 'Formulate lead-acquisition roadmaps, establish conversion tags across channels, coordinate seasonal campaigns, and monitor overall media spending.',
    responsibilities: ['Analytical SEO and PPC campaigns execution', 'Collaborative work with content design stakeholders', 'Advanced Hubspot analytics metrics configuration'],
    expanded: false,
  },
  {
    id: 'con-3', employee: 'Arthur Miller', dept: 'Product Dept.', role: 'Senior UI/UX Designer',
    offerDate: 'Feb 10, 2026', startDate: 'Feb 20, 2026', probationPeriod: '6 months', hours: '40 hrs/wk', salary: '14,000',
    summary: 'Redesign client portfolio displays, build standard Figma component kits, lead cross-team co-design workshops, and conduct primary customer testing sessions.',
    responsibilities: ['Figma Design Systems curation', 'Atomic Design principles fluency', 'Client journey research analysis'],
    expanded: false,
  },
];

export default function OnboardingContractTab({ onDraftAiSuggestion, showAlert }: OnboardingContractTabProps) {
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c));
  };

  const filtered = contracts.filter(c => c.employee.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div id="tab-contract-pane" className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Active Contracts', value: 12, icon: <FileText className="w-5 h-5" /> },
          { label: 'Offer Letters Sent', value: 28, icon: <Mail className="w-5 h-5" /> },
          { label: 'On Probation', value: 45, icon: <Clock className="w-5 h-5" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{value}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">{icon}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100">
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

      {/* Contracts list */}
      <div className="space-y-4">
        {filtered.map((con) => (
          <div key={con.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  {con.employee.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900">{con.employee}</h4>
                    <span className="bg-blue-50 text-[9.5px] text-blue-600 font-extrabold uppercase px-2 py-0.5 rounded-md">{con.dept}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{con.role}</p>
                </div>
              </div>
              <button
                onClick={() => toggleExpand(con.id)}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
              >
                <span>{con.expanded ? 'Less' : 'More'}</span>
                {con.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {con.expanded && (
              <div className="border-t border-slate-100 p-5 bg-slate-50/30 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-blue-50/70 border border-blue-100 text-blue-700 rounded-xl p-3 flex items-center gap-2 font-bold text-[11px]">
                    <Mail className="w-4 h-4" />
                    <span>Offer letter sent on: {con.offerDate}</span>
                  </div>
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Role Summary</h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold bg-white p-3.5 rounded-xl border border-slate-100/70">{con.summary}</p>
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

                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4 text-xs font-semibold text-slate-700">
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest pb-1 border-b border-slate-100">Overview</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Start Date', value: con.startDate },
                        { label: 'Probation Period', value: con.probationPeriod },
                        { label: 'Work Hours', value: con.hours },
                        { label: 'Salary & Payroll', value: `$${con.salary}`, highlight: true },
                      ].map(({ label, value, highlight }) => (
                        <div key={label}>
                          <span className={`block text-[9px] uppercase tracking-wider mb-0.5 ${highlight ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
                          <span className={`font-extrabold ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
  );
}

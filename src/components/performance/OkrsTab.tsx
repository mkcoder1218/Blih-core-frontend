import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp, Sparkles, Check, Plus } from 'lucide-react';
import { StatCardGrid, StatCard, FilterBar, EmptyState, SectionCard, FormField, FormRow } from '@/components/ui/blih';

interface KeyResult {
  id: string;
  text: string;
  progress: number;
}

interface OkrItem {
  id: string;
  objective: string;
  dept: string;
  owner: string;
  dateRange: string;
  keyResults: KeyResult[];
  aiSummary: string;
  keyImpacts: string[];
}

interface OkrTabProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function OkrsTab({ onDraftAiSuggestion, showAlert }: OkrTabProps) {
  const [okrs, setOkrs] = useState<OkrItem[]>([
    {
      id: 'okr-1',
      objective: 'Accelerate Product Development Velocity',
      dept: 'Engineering',
      owner: 'John Smith',
      dateRange: '2024-01-01 - 2024-03-31',
      keyResults: [
        { id: 'kr-1-1', text: 'Reduce deployment time from 2 days to 4 hours', progress: 85 },
        { id: 'kr-1-2', text: 'Increase automated test coverage to 90%', progress: 78 },
        { id: 'kr-1-3', text: 'Launch 3 major features per quarter', progress: 100 },
      ],
      aiSummary: 'Engineering team is on track to exceed deployment velocity targets. Exceptional progress on feature delivery, though test coverage needs attention in the final weeks.',
      keyImpacts: [
        '30% reduction in time-to-market for new features',
        'Improved developer productivity by 25%',
        'Enhanced product quality with automated testing',
        'Increased user satisfaction ratings by 15%',
        'Reduced operational costs by 20% through efficiency improvements',
        'Streamlined onboarding process, cutting training time in half',
        'Boosted collaboration across teams leading to 30% faster project delivery'
      ]
    },
    {
      id: 'okr-2',
      objective: 'Enable Data-Driven Decision Making',
      dept: 'Analytics',
      owner: 'Dr. Samantha Lee',
      dateRange: '2024-01-01 - 2024-03-31',
      keyResults: [
        { id: 'kr-2-1', text: 'Deploy unified telemetry analytics pipeline', progress: 75 },
        { id: 'kr-2-2', text: 'Ensure 100% metadata catalog dictionary mapping', progress: 80 },
        { id: 'kr-2-3', text: 'Train 45 business unit users on self-service SQL tools', progress: 80 },
      ],
      aiSummary: 'Unified pipeline has cleared local sandbox validation tests. Outstanding work in dashboard documentation has streamlined operations across core and satellite business units.',
      keyImpacts: [
        'Improved data accessibility speed by 40%',
        'Reduced ad-hoc metrics requests by 50% across marketing teams',
        'Boosted strategic decision clarity score by 15 points'
      ]
    },
    {
      id: 'okr-3',
      objective: 'Drive Revenue Growth and Customer Acquisition',
      dept: 'Marketing',
      owner: 'Sarah Johnson',
      dateRange: '2024-01-01 - 2024-03-31',
      keyResults: [
        { id: 'kr-3-1', text: 'Boost conversion ratios on key paid channels by 20%', progress: 90 },
        { id: 'kr-3-2', text: 'Execute 4 vertical SaaS co-marketing events', progress: 70 },
        { id: 'kr-3-3', text: 'Reduce post-sales CAC burn rate by 15%', progress: 75 },
      ],
      aiSummary: 'High conversion gains recorded on digital channels. Partnership events have successfully created new leads pipeline that will offset initial CAC expenditures.',
      keyImpacts: [
        'Acquired 18 new core Enterprise logo clients',
        'Optimized paid search spend allocation saving $12,000 in monthly ad burn',
        'Expanded customer referral loops reaching a total of 250 verified recommenders'
      ]
    }
  ]);

  const [expandedId, setExpandedId] = useState<string | null>('okr-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [newOkrOpen, setNewOkrOpen] = useState(false);
  const [newOkrForm, setNewOkrForm] = useState({
    objective: '',
    dept: 'Engineering',
    owner: 'John Smith',
    dateRange: '2024-01-01 - 2024-03-31',
    kr1: 'Aim for a 25% improvement in core deliverable velocity',
    kr2: 'Refactor 10 redundant visual component stylesheets',
    kr3: 'Draft team guidelines document with standard checklists'
  });

  const getOverallOkrScore = (okr: OkrItem) => {
    const total = okr.keyResults.reduce((acc, kr) => acc + kr.progress, 0);
    return Math.round(total / okr.keyResults.length);
  };

  const overallAvgCompletion = Math.round(
    okrs.map(getOverallOkrScore).reduce((acc, s) => acc + s, 0) / okrs.length
  );

  const handleKrSlide = (okrId: string, krId: string, newProgress: number) => {
    setOkrs(prev =>
      prev.map(okr => {
        if (okr.id !== okrId) return okr;
        return { ...okr, keyResults: okr.keyResults.map(kr => (kr.id === krId ? { ...kr, progress: newProgress } : kr)) };
      })
    );
  };

  const triggerAiOkrReport = (okr: OkrItem) => {
    const currentScore = getOverallOkrScore(okr);
    const krSummaryLine = okr.keyResults.map(kr => `"${kr.text}" is at ${kr.progress}%`).join(', ');
    const promptText = `Formulate an advanced, executive AI alignment summary for the OKR objective "${okr.objective}" managed by the ${okr.owner} (${okr.dept}). Metrics: Average objective progress is ${currentScore}% (${krSummaryLine}). Highlight specific operational recommendations for lagging KRs. Present in concise paragraphs.`;
    onDraftAiSuggestion(promptText);
  };

  const handleAddNewOkr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOkrForm.objective) return;

    const newOkr: OkrItem = {
      id: `okr-${Date.now()}`,
      objective: newOkrForm.objective,
      dept: newOkrForm.dept,
      owner: newOkrForm.owner,
      dateRange: newOkrForm.dateRange,
      keyResults: [
        { id: `kr-${Date.now()}-1`, text: newOkrForm.kr1, progress: 0 },
        { id: `kr-${Date.now()}-2`, text: newOkrForm.kr2, progress: 0 },
        { id: `kr-${Date.now()}-3`, text: newOkrForm.kr3, progress: 0 },
      ],
      aiSummary: 'Awaiting first progress check-in metrics to trigger automatic AI analysis.',
      keyImpacts: [
        'Aligned with organizational strategic excellence principles',
        'Reduces resource redundancy and aligns deliverables goals'
      ]
    };

    setOkrs(prev => [newOkr, ...prev]);
    setNewOkrOpen(false);
    setExpandedId(newOkr.id);
    showAlert(`Successfully added OKR Objective: ${newOkr.objective}!`, 'success');
  };

  const filteredOkrs = okrs.filter(okr => {
    const matchesSearch = okr.objective.toLowerCase().includes(searchTerm.toLowerCase()) || okr.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || okr.dept === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div id="okrs-tab-panel" className="space-y-4">
      {/* Stats */}
      <StatCardGrid cols={4}>
        <StatCard label="Total OKRs" value={okrs.length} icon={<Target className="w-4 h-4 stroke-[2]" />} tone="blue" />
        <StatCard label="Avg Completion" value={`${overallAvgCompletion}%`} icon={<Sparkles className="w-4 h-4" />} tone="blue" />
        <StatCard label="On Track" value={okrs.length} icon={<Check className="w-4 h-4 stroke-[3]" />} tone="emerald" />
        <StatCard label="At Risk" value={0} icon={<Target className="w-4 h-4" />} tone="rose" />
      </StatCardGrid>

      {/* Filter row */}
      <SectionCard>
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search objective..."
          filters={[
            {
              value: selectedDept,
              onChange: setSelectedDept,
              placeholder: 'All Departments',
              options: [
                { value: 'All', label: 'All Departments' },
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Analytics', label: 'Analytics' },
              ],
            },
          ]}
          actions={
            <button
              onClick={() => setNewOkrOpen(true)}
              className="w-full sm:w-auto bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer select-none shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Define OKR Objective</span>
            </button>
          }
        />
      </SectionCard>

      {/* OKRs List */}
      <div className="space-y-3.5">
        {filteredOkrs.map((okr) => {
          const isOpen = expandedId === okr.id;
          const currentAvgScore = getOverallOkrScore(okr);

          return (
            <div
              key={okr.id}
              className={`bg-white border rounded-3xl overflow-hidden transition-all duration-200 ${
                isOpen ? 'border-blue-100/80 shadow-xs' : 'border-slate-100 hover:border-slate-250'
              }`}
            >
              <div
                onClick={() => setExpandedId(isOpen ? null : okr.id)}
                className="p-4 px-6 flex items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide">{okr.dept}</span>
                      <span className="bg-slate-50 border border-slate-150 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">On Track</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 mt-1 sm:mt-1.5 tracking-tight truncate">{okr.objective}</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">Owner: {okr.owner} • {okr.dateRange}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold leading-none">Overall Score</span>
                    <span className="text-base font-extrabold text-blue-600 tracking-tight block mt-1">{currentAvgScore}%</span>
                  </div>
                  <div className="p-1 px-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600">
                    <span>{isOpen ? 'Less' : 'More'}</span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 p-6 pt-5 bg-slate-50/20 grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 space-y-5">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Results Metrics</h5>
                    <div className="space-y-4">
                      {okr.keyResults.map((kr) => (
                        <div key={kr.id} className="space-y-1.5 bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-3xs">
                          <div className="flex justify-between items-start gap-3">
                            <span className="text-xs font-bold text-slate-700 leading-tight">{kr.text}</span>
                            <span className="text-xs font-extrabold text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded select-none">{kr.progress}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range" min="0" max="100" value={kr.progress}
                              onChange={(e) => handleKrSlide(okr.id, kr.id, Number(e.target.value))}
                              className="flex-1 accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                            />
                            <span className="text-[9px] font-bold text-slate-405 tracking-tighter uppercase shrink-0">Adjust</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50/15 border border-blue-50 p-4 rounded-2xl mt-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-blue-900 uppercase tracking-tight flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-500 fill-blue-500" />
                          AI Summary
                        </span>
                        <button onClick={() => triggerAiOkrReport(okr)} className="text-[10px] font-extrabold text-blue-600 hover:underline flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Ask Copilot to analyze Objective</span>
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 bg-white border border-slate-100 p-3.5 rounded-xl font-semibold">{okr.aiSummary}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                      Key Impacts
                    </h5>
                    <div className="flex flex-col gap-2">
                      {okr.keyImpacts.map((ki, i) => (
                        <div key={i} className="flex gap-2.5 bg-white p-3 rounded-xl border border-slate-100 shadow-3xs hover:bg-slate-50/30 transition-colors">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                          <p className="text-xs text-slate-600 leading-tight font-medium">{ki}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New OKR Modal */}
      {newOkrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setNewOkrOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-lg space-y-5 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="text-[13px] font-bold text-slate-900">Define Strategic OKR Objective</h4>
              </div>
              <button onClick={() => setNewOkrOpen(false)} className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded">✕</button>
            </div>

            <form onSubmit={handleAddNewOkr} className="space-y-4">
              <FormField label="Objective Designation Title" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maximize API Ingress Performance SLA"
                  value={newOkrForm.objective}
                  onChange={(e) => setNewOkrForm(prev => ({ ...prev, objective: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </FormField>

              <FormRow cols={2}>
                <FormField label="Department Unit">
                  <select
                    value={newOkrForm.dept}
                    onChange={(e) => setNewOkrForm(prev => ({ ...prev, dept: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="Analytics">Analytics</option>
                  </select>
                </FormField>
                <FormField label="Direct Owner Name" required>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Smith"
                    value={newOkrForm.owner}
                    onChange={(e) => setNewOkrForm(prev => ({ ...prev, owner: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </FormField>
              </FormRow>

              <FormField label="Key Results Targets (Initial 0% progress)">
                <div className="space-y-2">
                  {[newOkrForm.kr1, newOkrForm.kr2, newOkrForm.kr3].map((val, i) => (
                    <input
                      key={i}
                      type="text"
                      required
                      value={val}
                      onChange={(e) => setNewOkrForm(prev => ({ ...prev, [`kr${i + 1}`]: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white"
                    />
                  ))}
                </div>
              </FormField>

              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setNewOkrOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer">Save Objective</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Calendar, TrendingUp, Award, Sparkles, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface KPI { label: string; score: number; target: number; pct: string }
interface Review { title: string; date: string; label: string; val: string }
interface ProbationStaff {
  id: string; employee: string; dept: string; role: string;
  startDate: string; endDate: string; daysRemaining: number;
  score: number; expanded: boolean; reviews: Review[]; kpis: KPI[]; overallKpi: string;
}

interface OnboardingProbationTabProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const INITIAL_STAFF: ProbationStaff[] = [
  {
    id: 'prob-1', employee: 'Jessica Parker', dept: 'Technical Dept.', role: 'Full Stack Developer',
    startDate: 'Dec 30, 2025', endDate: 'Dec 30, 2025', daysRemaining: 77, score: 87, expanded: true,
    reviews: [
      { title: 'First Review Date', date: 'Dec 30, 2025', label: 'Review Score', val: '45%' },
      { title: 'Second Review Date', date: 'Dec 30, 2025', label: 'Review Score', val: '45%' },
    ],
    kpis: [
      { label: 'Code Quality', score: 85, target: 90, pct: '30%' },
      { label: 'Project Delivery', score: 95, target: 100, pct: '40%' },
      { label: 'Team Collaboration', score: 88, target: 85, pct: '30%' },
    ],
    overallKpi: '90%',
  },
  {
    id: 'prob-2', employee: 'Sarah Jenkins', dept: 'Marketing Dept.', role: 'Growth Marketing Manager',
    startDate: 'Jan 22, 2026', endDate: 'Apr 22, 2026', daysRemaining: 99, score: 72, expanded: false,
    reviews: [{ title: 'First Review Date', date: 'Feb 22, 2026', label: 'Review Score', val: '75%' }],
    kpis: [
      { label: 'Campaign Accuracy', score: 70, target: 90, pct: '30%' },
      { label: 'Lead Sourcing Volume', score: 80, target: 100, pct: '40%' },
      { label: 'Creative Alignment', score: 90, target: 85, pct: '30%' },
    ],
    overallKpi: '80%',
  },
];

export default function OnboardingProbationTab({ onDraftAiSuggestion, showAlert }: OnboardingProbationTabProps) {
  const [probationStaff, setProbationStaff] = useState<ProbationStaff[]>(INITIAL_STAFF);

  const toggleExpand = (id: string) => {
    setProbationStaff(prev => prev.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p));
  };

  const handleUpdateKpi = (probId: string, kpiIndex: number, newScore: number) => {
    setProbationStaff(prev => prev.map(p => {
      if (p.id !== probId) return p;
      const updatedKpis = [...p.kpis];
      updatedKpis[kpiIndex] = { ...updatedKpis[kpiIndex], score: Math.min(newScore, 100) };
      const average = Math.round(updatedKpis.reduce((acc, k) => acc + k.score, 0) / updatedKpis.length);
      return { ...p, kpis: updatedKpis, score: average, overallKpi: `${average}%` };
    }));
    showAlert('KPI score calibrated! Recalculating totals...', 'success');
  };

  return (
    <div id="tab-probation-pane" className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'On Probation', value: 3, icon: <Calendar className="w-5 h-5" /> },
          { label: 'Avg Performance', value: '57%', icon: <TrendingUp className="w-5 h-5" /> },
          { label: 'Pending Reviews', value: 3, icon: <Award className="w-5 h-5" /> },
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
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

      {/* Staff cards */}
      <div className="space-y-4">
        {probationStaff.map((prob) => (
          <div key={prob.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  {prob.employee.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900">{prob.employee}</h4>
                    <span className="bg-blue-50 text-[9.5px] text-blue-600 font-extrabold uppercase px-2 py-0.5 rounded-md">{prob.dept}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{prob.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex-1 max-w-lg text-[11px] font-semibold text-slate-700">
                {[
                  { label: 'Start Date', value: prob.startDate },
                  { label: 'End Date', value: prob.endDate },
                  { label: 'Days Remaining', value: `${prob.daysRemaining} Days`, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label}>
                    <span className={`block text-[8px] uppercase tracking-wider ${highlight ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
                    <strong className={highlight ? 'text-blue-600 font-black' : 'text-slate-800'}>{value}</strong>
                  </div>
                ))}
              </div>

              <div className="bg-[#f0f4ff]/80 border border-blue-50 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs min-w-[210px]">
                <div>
                  <div className="flex items-center gap-1 text-slate-800 font-bold">
                    <span>Automated Score</span>
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                  </div>
                  <span className="text-[9.5px] text-slate-400 leading-tight block">Based on KPI, OKR, and review data</span>
                </div>
                <span className="text-lg font-black text-blue-600">{prob.score}%</span>
              </div>

              <button
                onClick={() => toggleExpand(prob.id)}
                className="text-xs font-bold text-blue-600 self-center hover:bg-slate-50 p-2 rounded-xl border border-slate-200 cursor-pointer transition-all flex items-center gap-1"
              >
                <span>{prob.expanded ? 'Less' : 'More'}</span>
                {prob.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {prob.expanded && (
              <div className="border-t border-slate-100 p-5 bg-slate-50/30 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reviews */}
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
                          <span className="text-[10.5px] text-slate-500 font-bold">Reviewer</span>
                          <span className="text-xs font-black text-slate-900">John Smith</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Staff Rating</span>
                          <strong className="text-blue-600 font-black">{rev.val}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50/60 border border-blue-100 text-blue-700 rounded-xl p-3 flex justify-between items-center text-[11.5px] font-bold">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Next Review Schedule</span>
                    </div>
                    <span className="text-xs font-black bg-white px-2.5 py-1 rounded-md border border-blue-200">Dec 8, 2025</span>
                  </div>
                </div>

                {/* KPIs */}
                <div className="space-y-4 flex flex-col justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5">KPI Performance</h4>
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100/80">
                    {prob.kpis.map((kpi, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-700">{kpi.label}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateKpi(prob.id, idx, kpi.score - 5)}
                              className="w-4 h-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded flex items-center justify-center text-[9px] cursor-pointer"
                            >-</button>
                            <span className="text-slate-800">{kpi.score}/{kpi.target} ({kpi.pct})</span>
                            <button
                              onClick={() => handleUpdateKpi(prob.id, idx, kpi.score + 5)}
                              className="w-4 h-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded flex items-center justify-center text-[9px] cursor-pointer"
                            >+</button>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${(kpi.score / kpi.target) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3.5 border-t border-slate-100">
                    <div className="text-xs font-semibold">
                      <p className="text-slate-500">Overall KPI Score</p>
                      <span className="text-2xl font-black text-blue-600">{prob.overallKpi}</span>
                    </div>
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
  );
}

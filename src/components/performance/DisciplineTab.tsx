import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, BadgeAlert, Plus, Sliders, ChevronDown, CheckSquare, Sparkles, Filter } from 'lucide-react';

interface CaseItem {
  id: string;
  name: string;
  dept: string;
  initials: string;
  avatarColor: string;
  issue: string;
  issueDate: string;
  severity: 'high' | 'medium' | 'low';
  score: string;
  details: string;
  status: 'Awaiting Action' | 'Reviewed' | 'Closed';
}

interface DisciplineTabProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function DisciplineTab({ onDraftAiSuggestion, showAlert }: DisciplineTabProps) {
  // Incident collection state
  const [cases, setCases] = useState<CaseItem[]>([
    {
      id: 'case-1',
      name: 'Mike Brown',
      dept: 'Design',
      initials: 'MB',
      avatarColor: 'bg-rose-500 text-white',
      issue: 'Attendance Issues',
      issueDate: '2024-02-15',
      severity: 'medium',
      score: '6.5/10',
      details: 'Repeated late arrivals without proper notification. Impacting standup schedules.',
      status: 'Awaiting Action'
    },
    {
      id: 'case-2',
      name: 'David Wilson',
      dept: 'Engineering',
      initials: 'DW',
      avatarColor: 'bg-red-600 text-white',
      issue: 'Policy Violation',
      issueDate: '2024-02-14',
      severity: 'high',
      score: '8.2/10',
      details: 'Unauthorized access to sensitive client production log analytics systems.',
      status: 'Awaiting Action'
    },
    {
      id: 'case-3',
      name: 'Tom Anderson',
      dept: 'Marketing',
      initials: 'TA',
      avatarColor: 'bg-orange-500 text-white',
      issue: 'Performance Issues',
      issueDate: '2024-02-10',
      severity: 'medium',
      score: '5.8/10',
      details: 'Continuous missed targets on vertical SaaS campaign launches.',
      status: 'Reviewed'
    },
    {
      id: 'case-4',
      name: 'Kevin Park',
      dept: 'Engineering',
      initials: 'KP',
      avatarColor: 'bg-amber-500 text-white',
      issue: 'Insubordination',
      issueDate: '2024-01-28',
      severity: 'high',
      score: '7.3/10',
      details: 'Refusal to follow code deployment compliance protocols over three continuous warnings.',
      status: 'Closed'
    }
  ]);

  // UI Interactive States
  const [activeCaseModal, setActiveCaseModal] = useState<CaseItem | null>(null);
  const [logIncidentOpen, setLogIncidentOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    name: '',
    dept: 'Engineering',
    issue: 'Attendance Issues',
    severity: 'medium' as 'high' | 'medium' | 'low',
    score: '6.0',
    details: ''
  });

  // Basic Sorter Calculations
  const activeCount = cases.filter(c => c.status !== 'Closed').length;
  const pendingCount = cases.filter(c => c.status === 'Awaiting Action').length;
  const avgSeverityScore = (cases.reduce((sum, c) => sum + parseFloat(c.score), 0) / cases.length).toFixed(1);
  const distinctIssueTypes = new Set(cases.map(c => c.issue)).size;

  // Handle case review action
  const handleReviewStatus = (caseId: string, nextStatus: 'Reviewed' | 'Closed') => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: nextStatus } : c));
    setActiveCaseModal(null);
    showAlert(`Successfully flagged case ID ${caseId} status to ${nextStatus}!`, 'success');
  };

  // Launch Gemini via standard Copilot callback to get correction notes (PIP, Verbal, Written warning)
  const handleAiCorrectionAdvisor = (c: CaseItem) => {
    const promptText = `Formulate a formal compliance corrective advice draft document regarding the incident details for ${c.name} (${c.dept}) who had a "${c.issue}" issue (severity score ${c.score}). Details of incident: "${c.details}". Suggest compliant, progressive disciplinary milestones (e.g. PIP benchmarks or written warnings) tailored to standard corporate compliance rules. Deliver in structured clear format.`;
    onDraftAiSuggestion(promptText);
  };

  const handleAddNewIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.name || !incidentForm.details) return;

    const initials = incidentForm.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newCase: CaseItem = {
      id: `case-${Date.now()}`,
      name: incidentForm.name,
      dept: incidentForm.dept,
      initials,
      avatarColor: incidentForm.severity === 'high' ? 'bg-red-650 text-white' : incidentForm.severity === 'medium' ? 'bg-orange-500 text-white' : 'bg-slate-500 text-white',
      issue: incidentForm.issue,
      issueDate: new Date().toISOString().split('T')[0],
      severity: incidentForm.severity,
      score: `${parseFloat(incidentForm.score).toFixed(1)}/10`,
      details: incidentForm.details,
      status: 'Awaiting Action'
    };

    setCases(prev => [newCase, ...prev]);
    setLogIncidentOpen(false);
    showAlert(`Logged incident ticket for ${newCase.name} successfully!`, 'success');
    setIncidentForm({
      name: '',
      dept: 'Engineering',
      issue: 'Attendance Issues',
      severity: 'medium',
      score: '6.0',
      details: ''
    });
  };

  return (
    <div id="discipline-tab-panel" className="space-y-6">
      {/* 2 Warning notification banner at page top */}
      <div className="bg-red-50/5 border border-red-500 rounded-3xl p-5 shadow-xs relative overflow-hidden ring-4 ring-rose-500/10">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertOctagon className="w-5.5 h-5.5 stroke-[2.5]" />
          </div>

          <div className="space-y-4 w-full">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-tight flex items-center gap-1.5 leading-none">
                <ShieldAlert className="w-4.5 h-4.5 text-red-650" />
                <span>Discipline Action Required</span>
              </h4>
              <span className="text-[10px] text-slate-500 block leading-tight font-semibold">
                {pendingCount} employees have active discipline tags requiring immediate review and corporate safety actions.
              </span>
            </div>

            {/* Two red-bordered urgent card elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.slice(0, 2).map((c) => (
                <div key={c.id} className="bg-white border border-rose-200 shadow-3xs p-4 rounded-2xl relative flex flex-col justify-between">
                  <div>
                    {/* Header profile row */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${c.avatarColor}`}>
                          {c.initials}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 leading-tight">{c.name}</h5>
                          <span className="text-[9px] bg-slate-50 border border-slate-150 text-slate-500 font-extrabold px-1 py-0.5 rounded uppercase tracking-wider block mt-0.5 max-w-fit">
                            {c.dept}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-bold">{c.issueDate}</span>
                    </div>

                    {/* Threat tags info */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="bg-rose-50 text-rose-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md leading-none border border-rose-100">
                        {c.issue}
                      </span>
                      <span className="bg-red-600 text-white text-[9px] font-bold uppercase p-0.5 px-1.5 rounded-md leading-none">
                        {c.severity}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-500 mt-2.5 leading-snug line-clamp-2">
                      "{c.details}"
                    </p>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Severity Score</span>
                      <span className="text-xs font-black text-rose-600">{c.score}</span>
                    </div>

                    <button
                      onClick={() => setActiveCaseModal(c)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Review Case</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Consolidated layout row block */}
      <div className="bg-slate-50/60 p-5 rounded-3xl border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <h4 className="text-xs font-black text-slate-950 uppercase tracking-tight">Discipline Statistics</h4>
        
        <div className="flex flex-wrap items-center gap-6 sm:gap-11 text-right">
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-405 block uppercase">Active Cases</span>
            <span className="text-lg font-black text-slate-900 leading-none block">{activeCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-450 block uppercase">Pending Review</span>
            <span className="text-lg font-black text-red-600 leading-none block">{pendingCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-405 block uppercase font-sans">Avg Severity</span>
            <span className="text-lg font-black text-blue-605 leading-none block">{avgSeverityScore}/10</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-405 block uppercase">Issue Types</span>
            <span className="text-lg font-black text-slate-900 leading-none block">{distinctIssueTypes}</span>
          </div>

          <button
            onClick={() => setLogIncidentOpen(true)}
            className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-black py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Document Incident</span>
          </button>
        </div>
      </div>

      {/* Grid of All Disciplinary Cases */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-3xs space-y-4">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight block pb-2 border-b border-slate-100">
          All Incident Files ({cases.length})
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveCaseModal(c)}
              className="bg-slate-50/50 hover:bg-white border hover:border-slate-350 border-slate-100/80 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between hover:shadow-xs space-y-4"
            >
              <div>
                <div className="flex justify-between items-start gap-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${c.avatarColor}`}>
                      {c.initials}
                    </div>
                    <span className="text-xs font-black text-slate-800 truncate block max-w-[80px]">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-405 font-bold">{c.issueDate}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="bg-slate-100 text-slate-650 text-[8px] font-black uppercase px-2 py-0.5 rounded leading-none">
                    {c.issue}
                  </span>
                  <span className={`text-[8px] font-bold uppercase rounded px-1 ${
                    c.status === 'Awaiting Action' ? 'bg-red-50 text-red-600' : c.status === 'Reviewed' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {c.status}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white border border-slate-100 rounded-xl p-2">
                <span className="text-[8px] font-black text-slate-400 block uppercase leading-none">Severity Score</span>
                <span className="text-xs font-bold text-slate-850 leading-none">{c.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Case Detailed Modal */}
      {activeCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setActiveCaseModal(null)} />

          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-lg space-y-5 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                <h4 className="text-[13px] font-bold text-slate-900">Incident Ticket File Action: {activeCaseModal.name}</h4>
              </div>
              <button
                onClick={() => setActiveCaseModal(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Subject Officer:</span>
                  <span className="text-slate-850">{activeCaseModal.name} ({activeCaseModal.dept})</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Incident Date:</span>
                  <span className="text-slate-850">{activeCaseModal.issueDate}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Categorization:</span>
                  <span className="text-slate-850">{activeCaseModal.issue}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Severity Severity Rating:</span>
                  <span className="text-red-600 font-extrabold">{activeCaseModal.score}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Incident Narrative Details</span>
                <p className="text-slate-700 bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl text-xs font-semibold leading-relaxed">
                  "{activeCaseModal.details}"
                </p>
              </div>

              {/* Ask Copilot for Corrective solutions action */}
              <div className="bg-blue-50/30 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <h5 className="font-extrabold text-blue-900 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600" />
                    AI Corrective Action Advisor
                  </h5>
                  <p className="text-slate-500 font-medium">Verify progressive warning, suspension or PIP requirements aligned with local compliance guidelines.</p>
                </div>
                <button
                  onClick={() => handleAiCorrectionAdvisor(activeCaseModal)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1 cursor-pointer w-full sm:w-auto shrink-0 justify-center transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Draft corrective PIP</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => handleReviewStatus(activeCaseModal.id, 'Closed')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Archived & Close Case
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCaseModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Dismiss
                </button>
                {activeCaseModal.status === 'Awaiting Action' && (
                  <button
                    onClick={() => handleReviewStatus(activeCaseModal.id, 'Reviewed')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Mark as Reviewed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Incident Modal */}
      {logIncidentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setLogIncidentOpen(false)} />

          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-lg space-y-4 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BadgeAlert className="w-5 h-5 text-red-650" />
                <h4 className="text-[13px] font-bold text-slate-900">Document Compliance Incident Ticket</h4>
              </div>
              <button
                onClick={() => setLogIncidentOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewIncident} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Employee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Wick"
                    value={incidentForm.name}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Department Unit</label>
                  <select
                    value={incidentForm.dept}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, dept: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="Analytics">Analytics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Classification</label>
                  <select
                    value={incidentForm.issue}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, issue: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Attendance Issues">Attendance Issues</option>
                    <option value="Policy Violation">Policy Violation</option>
                    <option value="Performance Issues">Performance Issues</option>
                    <option value="Insubordination">Insubordination</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Tier Severity</label>
                    <select
                      value={incidentForm.severity}
                      onChange={(e) => setIncidentForm(prev => ({ ...prev, severity: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wide block">Rating (1-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={incidentForm.score}
                      onChange={(e) => setIncidentForm(prev => ({ ...prev, score: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-1.5 text-xs font-bold focus:outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Incident Narrative Details Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Document specific actions, dates, and witnesses metrics..."
                  value={incidentForm.details}
                  onChange={(e) => setIncidentForm(prev => ({ ...prev, details: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setLogIncidentOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Log Incident Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

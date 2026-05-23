import React, { useState } from 'react';
import { Search, ChevronDown, SlidersHorizontal, User, UserCheck, Sparkles, Plus, CheckCircle, Clock } from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  dept: string;
  initials: string;
  avatarColor: string;
  kpiScore: string;
  okrScore: string;
  score: string;
  status: 'Completed' | 'In Progress';
  gender: 'Male' | 'Female' | 'Other';
  competencies: {
    delivery: number;
    teamwork: number;
    leadership: number;
    ownership: number;
  };
  notes: string;
  aiPlanText?: string;
}

interface PerformanceReviewTabProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function PerformanceReviewTab({ onDraftAiSuggestion, showAlert }: PerformanceReviewTabProps) {
  // Reviews dynamic State
  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: 'rev-1',
      name: 'John Smith',
      dept: 'Engineering',
      initials: 'JS',
      avatarColor: 'bg-blue-600 text-white',
      kpiScore: '88%',
      okrScore: '90%',
      score: '4.4/5.0',
      status: 'Completed',
      gender: 'Male',
      competencies: { delivery: 4.5, teamwork: 4.2, leadership: 4.0, ownership: 4.6 },
      notes: 'Strong developer with consistent technical results. Met all deliverables safely across Q1 milestones.'
    },
    {
      id: 'rev-2',
      name: 'Sarah Johnson',
      dept: 'Marketing',
      initials: 'SJ',
      avatarColor: 'bg-indigo-600 text-white',
      kpiScore: '95%',
      okrScore: '92%',
      score: '4.7/5.0',
      status: 'Completed',
      gender: 'Female',
      competencies: { delivery: 4.8, teamwork: 4.5, leadership: 4.6, ownership: 4.7 },
      notes: 'Creative campaigns generated high ROI. Exceptional presentation skills in company-wide alignments.'
    },
    {
      id: 'rev-3',
      name: 'Mike Brown',
      dept: 'Design',
      initials: 'MB',
      avatarColor: 'bg-purple-600 text-white',
      kpiScore: '78%',
      okrScore: '75%',
      score: '3.9/5.0',
      status: 'In Progress',
      gender: 'Male',
      competencies: { delivery: 3.8, teamwork: 4.0, leadership: 3.5, ownership: 4.0 },
      notes: 'Design aesthetics are remarkable. Needs some support with managing tight timelines and early communication of delivery delays.'
    },
    {
      id: 'rev-4',
      name: 'David Wilson',
      dept: 'Engineering',
      initials: 'DW',
      avatarColor: 'bg-blue-600 text-white',
      kpiScore: '80%',
      okrScore: '83%',
      score: '4.1/5.0',
      status: 'In Progress',
      gender: 'Male',
      competencies: { delivery: 4.2, teamwork: 3.8, leadership: 3.9, ownership: 4.1 },
      notes: 'Dependable structural performance. Excellent domain knowledge in infrastructure systems.'
    },
    {
      id: 'rev-5',
      name: 'Emma Watson',
      dept: 'Analytics',
      initials: 'EW',
      avatarColor: 'bg-cyan-600 text-white',
      kpiScore: '96%',
      okrScore: '94%',
      score: '4.8/5.0',
      status: 'Completed',
      gender: 'Female',
      competencies: { delivery: 4.9, teamwork: 4.7, leadership: 4.5, ownership: 4.9 },
      notes: 'Outstanding contribution to our algorithmic models pipeline. Always provides highly accurate dashboard configurations.'
    }
  ]);

  // Expand states
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedResultGroup, setSelectedResultGroup] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');

  // New review form modal modal
  const [newReviewModalOpen, setNewReviewModalOpen] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    name: '',
    dept: 'Engineering',
    kpiScore: '85%',
    okrScore: '85%',
    score: '4.2/5.0',
    gender: 'Male' as any,
    notes: '',
  });

  // Handle active status toggle
  const toggleStatus = (id: string, current: 'Completed' | 'In Progress') => {
    const nextStatus = current === 'Completed' ? 'In Progress' : 'Completed';
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r));
    showAlert(`Updated review status for employee to ${nextStatus}!`, 'success');
  };

  // Launch Gemini via standard Copilot callback to get a beautiful markdown draft
  const handleAiAction = (r: ReviewItem) => {
    const promptText = `Formulate a targeted 3-bullet core professional development and coaching strategy plan for ${r.name}, key contributor within the ${r.dept} department. Score metrics: Rating score ${r.score} (KPIs ${r.kpiScore}, OKRs ${r.okrScore}). Strengths & opportunities described by manager: "${r.notes}". Provide highly actionable, concise feedback.`;
    onDraftAiSuggestion(promptText);
  };

  // Handle adding new review
  const handleAddNewReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewForm.name) return;

    const initials = newReviewForm.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const deptsColors: { [key: string]: string } = {
      Engineering: 'bg-blue-600 text-white',
      Marketing: 'bg-indigo-600 text-white',
      Design: 'bg-purple-600 text-white',
      Analytics: 'bg-cyan-600 text-white',
      HR: 'bg-teal-600 text-white',
    };

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: newReviewForm.name,
      dept: newReviewForm.dept,
      initials,
      avatarColor: deptsColors[newReviewForm.dept] || 'bg-slate-600 text-white',
      kpiScore: newReviewForm.kpiScore,
      okrScore: newReviewForm.okrScore,
      score: newReviewForm.score,
      status: 'In Progress',
      gender: newReviewForm.gender,
      competencies: { delivery: 4.1, teamwork: 4.1, leadership: 3.8, ownership: 4.2 },
      notes: newReviewForm.notes || 'Awaiting supervisor full description.'
    };

    setReviews(prev => [newReview, ...prev]);
    setNewReviewForm({
      name: '',
      dept: 'Engineering',
      kpiScore: '85%',
      okrScore: '85%',
      score: '4.2/5.0',
      gender: 'Male',
      notes: '',
    });
    setNewReviewModalOpen(false);
    showAlert(`Created new evaluation file for ${newReview.name}!`, 'success');
  };

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || r.dept === selectedDept;
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
    const matchesGender = selectedGender === 'All' || r.gender === selectedGender;
    
    // Result group filtering by rating score values
    let matchesResult = true;
    if (selectedResultGroup !== 'All') {
      const numericVal = parseFloat(r.score);
      if (selectedResultGroup === 'high') {
        matchesResult = numericVal >= 4.5;
      } else if (selectedResultGroup === 'mid') {
        matchesResult = numericVal >= 3.5 && numericVal < 4.5;
      } else if (selectedResultGroup === 'low') {
        matchesResult = numericVal < 3.5;
      }
    }

    return matchesSearch && matchesDept && matchesStatus && matchesGender && matchesResult;
  });

  return (
    <div id="performance-review-panel" className="space-y-5">
      {/* Search and drop parameters filters bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-blue-100 focus:bg-white transition-all"
            />
          </div>

          <button
            onClick={() => setNewReviewModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create evaluation</span>
          </button>
        </div>

        {/* Dropdowns row filters list */}
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Department */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-1.5 pl-3 pr-8 text-[11px] font-bold text-slate-600 cursor-pointer focus:outline-none"
            >
              <option value="All">Department: All</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Analytics">Analytics</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-1.5 pl-3 pr-8 text-[11px] font-bold text-slate-600 cursor-pointer focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Gender */}
          <div className="relative">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-1.5 pl-3 pr-8 text-[11px] font-bold text-slate-600 cursor-pointer focus:outline-none"
            >
              <option value="All">Gender: All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Result Group (Rating scores filter) */}
          <div className="relative">
            <select
              value={selectedResultGroup}
              onChange={(e) => setSelectedResultGroup(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-1.5 pl-3 pr-8 text-[11px] font-bold text-slate-600 cursor-pointer focus:outline-none"
            >
              <option value="All">Result Group: All</option>
              <option value="high">Exceeds (&gt;= 4.5)</option>
              <option value="mid">Meets (3.5 - 4.4)</option>
              <option value="low">Needs Improvement (&lt; 3.5)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Reviews collection count */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-3xs space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100/60">
          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
            Performance Reviews ({filteredReviews.length})
          </span>
          <span className="text-[10px] font-semibold text-slate-400">Click to expand details & AI plans</span>
        </div>

        {/* List of elements */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <User className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-400 font-bold">No evaluation profiles found matching active criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((r) => {
              const isOpen = expandedId === r.id;
              return (
                <div
                  key={r.id}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isOpen ? 'border-blue-200 bg-blue-50/5/30 shadow-xs' : 'border-slate-100 hover:border-slate-250 hover:bg-slate-50/20'
                  }`}
                >
                  {/* Row Trigger */}
                  <div
                    onClick={() => setExpandedId(isOpen ? null : r.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-5 gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border border-white shadow-xs ${r.avatarColor}`}>
                        {r.initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{r.name}</h4>
                        <span className="text-[11px] font-semibold text-slate-400">{r.dept}</span>
                      </div>
                    </div>

                    {/* Stats scores row */}
                    <div className="flex flex-wrap items-center gap-5 sm:gap-8 text-right font-medium">
                      <div className="text-center sm:text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">KPI Score</span>
                        <span className="text-xs font-black text-slate-900">{r.kpiScore}</span>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">OKR Score</span>
                        <span className="text-xs font-black text-slate-950">{r.okrScore}</span>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Overall Score</span>
                        <span className="text-xs font-black text-blue-600">{r.score}</span>
                      </div>

                      {/* Status pill tag */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(r.id, r.status);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-24 justify-center shadow-2xs border ${
                          r.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r.status === 'Completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 animate-pulse text-amber-500" />
                            <span>In Progress</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expand panel body details */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-4">
                      {/* Detailed rating visualizer metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                        {Object.entries(r.competencies).map(([key, val]) => (
                          <div key={key} className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">{key}</span>
                            <div className="flex items-center gap-2">
                              {/* progress slider simulation */}
                              <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div style={{ width: `${((val as number) / 5) * 100}%` }} className="bg-blue-500 h-full" />
                              </div>
                              <span className="text-xs font-bold text-slate-800">{val as number}/5.0</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Manager evaluation remarks notes */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Manager Assessment Summary</span>
                        <p className="text-xs text-slate-750 bg-white p-3.5 rounded-xl border border-slate-100 leading-relaxed font-semibold">
                          {r.notes}
                        </p>
                      </div>

                      {/* AI Coaching guidelines draft generator */}
                      <div className="bg-blue-50/20 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="space-y-1">
                          <h5 className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5 leading-none">
                            <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600" />
                            <span>AI Performance Coaching Advisor</span>
                          </h5>
                          <span className="text-[10px] text-blue-950 block leading-tight font-semibold">
                            Generate targeted corrective milestones and strategic training metrics with Copilot based on this employee file.
                          </span>
                        </div>
                        <button
                          onClick={() => handleAiAction(r)}
                          className="bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer select-none"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Draft Coaching Plan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluation Creation Form Modal overlay */}
      {newReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setNewReviewModalOpen(false)} />

          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-lg space-y-5 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Plus className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-[13px] font-bold text-slate-900">New Performance Evaluation File</h4>
              </div>
              <button
                onClick={() => setNewReviewModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 hover:bg-slate-150 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewReview} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Employee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Neeson"
                    value={newReviewForm.name}
                    onChange={(e) => setNewReviewForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Department Unit</label>
                  <select
                    value={newReviewForm.dept}
                    onChange={(e) => setNewReviewForm(prev => ({ ...prev, dept: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="Analytics">Analytics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">KPI Rating (0-100%)</label>
                  <input
                    type="text"
                    value={newReviewForm.kpiScore}
                    onChange={(e) => setNewReviewForm(prev => ({ ...prev, kpiScore: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">OKR Target %</label>
                  <input
                    type="text"
                    value={newReviewForm.okrScore}
                    onChange={(e) => setNewReviewForm(prev => ({ ...prev, okrScore: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Overall score (1-5)</label>
                  <input
                    type="text"
                    value={newReviewForm.score}
                    onChange={(e) => setNewReviewForm(prev => ({ ...prev, score: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Gender</label>
                <div className="flex gap-4">
                  {['Male', 'Female', 'Other'].map(g => (
                    <label key={g} className="flex items-center gap-1.5 text-xs font-bold text-slate-650 cursor-pointer">
                      <input
                        type="radio"
                        name="genderRadio"
                        checked={newReviewForm.gender === g}
                        onChange={() => setNewReviewForm(prev => ({ ...prev, gender: g as any }))}
                        className="text-blue-600 focus:ring-0"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Manager Performance Review Remarks</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize this team member's strengths and areas of growth..."
                  value={newReviewForm.notes}
                  onChange={(e) => setNewReviewForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setNewReviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

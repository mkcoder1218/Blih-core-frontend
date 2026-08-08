import React, { useState, useEffect } from 'react';
import {
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  User as UserIcon,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Loader2,
  ListFilter
} from 'lucide-react';
import {
  StatCardGrid,
  StatCard,
  FilterBar,
  EmptyState,
  SectionCard,
  FormField,
  FormRow
} from '@/components/ui/blih';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import {
  getOkrObjectives,
  createOkrObjective,
  updateOkrObjective,
  deleteOkrObjective,
  logOkrCheckIn,
  refreshOkrMetrics,
  OkrObjective,
  OkrKeyResult,
  OkrMetricTemplate
} from '../../api/okr';

interface OkrTabProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function OkrsTab({ onDraftAiSuggestion, showAlert }: OkrTabProps) {
  // Lists & State
  const [objectives, setObjectives] = useState<OkrObjective[]>([]);
  const [metricTemplates, setMetricTemplates] = useState<OkrMetricTemplate[]>([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    avgCompletion: 0,
    onTrackCount: 0,
    atRiskCount: 0,
    offTrackCount: 0
  });

  // UX states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLifecycleStatus, setSelectedLifecycleStatus] = useState('ALL');
  const [selectedHealthStatus, setSelectedHealthStatus] = useState('ALL');
  const [selectedOwnerType, setSelectedOwnerType] = useState('ALL');
  const [periodStart, setPeriodStart] = useState('2026-01-01');
  const [periodEnd, setPeriodEnd] = useState('2026-12-31');

  // Lookups
  const { data: usersData } = useUsers({ size: 200 });
  const { data: deptsData } = useDepartments({ size: 100 });
  const employees = usersData?.rows || [];
  const departments = deptsData?.departments || [];

  // Form Modal/Drawer State
  const [formOpen, setFormOpen] = useState(false);
  const [editingOkr, setEditingOkr] = useState<OkrObjective | null>(null);
  const [formObjective, setFormObjective] = useState<Partial<OkrObjective>>({
    title: '',
    description: '',
    ownerType: 'EMPLOYEE',
    ownerId: '',
    periodStart: '2026-07-01',
    periodEnd: '2026-09-30',
    lifecycleStatus: 'ACTIVE',
    keyResults: [],
    keyImpacts: []
  });
  const [impactInput, setImpactInput] = useState('');

  // Check-In Modal State
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [selectedKr, setSelectedKr] = useState<OkrKeyResult | null>(null);
  const [checkInValue, setCheckInValue] = useState<number>(0);
  const [checkInNote, setCheckInNote] = useState('');

  // Load OKRs
  const loadOkrs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedLifecycleStatus !== 'ALL') params.lifecycleStatus = selectedLifecycleStatus;
      if (selectedHealthStatus !== 'ALL') params.healthStatus = selectedHealthStatus;
      if (selectedOwnerType !== 'ALL') params.ownerType = selectedOwnerType;
      if (periodStart) params.periodStart = periodStart;
      if (periodEnd) params.periodEnd = periodEnd;

      const data = await getOkrObjectives(params);
      setObjectives(data.objectives || []);
      setMetricTemplates(data.metricTemplates || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load OKR objectives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOkrs();
  }, [selectedLifecycleStatus, selectedHealthStatus, selectedOwnerType, periodStart, periodEnd]);

  // Sync metrics values
  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    try {
      await refreshOkrMetrics();
      showAlert('OKR metrics successfully refreshed.', 'success');
      await loadOkrs();
    } catch (err: any) {
      showAlert(err.message || 'Failed to refresh metrics.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Delete objective
  const handleDeleteObjective = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this OKR objective? This will remove all associated key results and check-ins.')) return;
    try {
      await deleteOkrObjective(id);
      showAlert('Objective successfully deleted.', 'success');
      loadOkrs();
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete objective.', 'error');
    }
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingOkr(null);
    setFormObjective({
      title: '',
      description: '',
      ownerType: 'EMPLOYEE',
      ownerId: '',
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lifecycleStatus: 'ACTIVE',
      keyResults: [],
      keyImpacts: []
    });
    setImpactInput('');
    setFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (okr: OkrObjective) => {
    setEditingOkr(okr);
    setFormObjective({
      ...okr,
      keyResults: okr.keyResults.map(kr => ({ ...kr })),
      keyImpacts: okr.keyImpacts.map(ki => ({ ...ki }))
    });
    setImpactInput('');
    setFormOpen(true);
  };

  // Handle Objective Form Submit
  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formObjective.title) return;

    try {
      if (editingOkr && editingOkr.id) {
        await updateOkrObjective(editingOkr.id, formObjective);
        showAlert('Objective successfully updated.', 'success');
      } else {
        await createOkrObjective(formObjective);
        showAlert('Strategic OKR Objective successfully created.', 'success');
      }
      setFormOpen(false);
      loadOkrs();
    } catch (err: any) {
      showAlert(err.message || 'Failed to save objective.', 'error');
    }
  };

  // Key Results lists management inside form
  const addKrRow = () => {
    const freshKr: OkrKeyResult = {
      title: '',
      trackingType: 'MANUAL',
      baselineValue: 0,
      targetValue: 100,
      currentValue: 0,
      weight: 1.0,
      status: 'ON_TRACK'
    };
    setFormObjective(prev => ({
      ...prev,
      keyResults: [...(prev.keyResults || []), freshKr]
    }));
  };

  const removeKrRow = (index: number) => {
    setFormObjective(prev => ({
      ...prev,
      keyResults: (prev.keyResults || []).filter((_, i) => i !== index)
    }));
  };

  const handleKrFieldChange = (index: number, field: keyof OkrKeyResult, value: any) => {
    setFormObjective(prev => {
      const copy = [...(prev.keyResults || [])];
      const target = { ...copy[index], [field]: value };

      // Autofill fields if trackingType is AUTOMATIC and metric changes
      if (field === 'metricSelector' || (field === 'trackingType' && value === 'AUTOMATIC')) {
        const metricKey = field === 'metricSelector' ? value : target.metricSelector;
        const moduleVal = target.moduleSelector;
        const matched = metricTemplates.find(t => t.module === moduleVal && t.metricKey === metricKey);
        if (matched) {
          target.unit = matched.unit;
          target.measurementType = matched.measurementType;
          target.direction = matched.direction;
        }
      }
      copy[index] = target;
      return { ...prev, keyResults: copy };
    });
  };

  // Key Impacts list management
  const addImpact = () => {
    if (!impactInput.trim()) return;
    setFormObjective(prev => ({
      ...prev,
      keyImpacts: [...(prev.keyImpacts || []), { text: impactInput.trim() }]
    }));
    setImpactInput('');
  };

  const removeImpact = (index: number) => {
    setFormObjective(prev => ({
      ...prev,
      keyImpacts: (prev.keyImpacts || []).filter((_, i) => i !== index)
    }));
  };

  // Manual Check-In Save
  const handleOpenCheckIn = (kr: OkrKeyResult) => {
    setSelectedKr(kr);
    setCheckInValue(kr.currentValue);
    setCheckInNote('');
    setCheckInOpen(true);
  };

  const handleSaveCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKr || !selectedKr.id) return;

    try {
      await logOkrCheckIn({
        keyResultId: selectedKr.id,
        currentValue: checkInValue,
        note: checkInNote
      });
      showAlert('Check-in successfully recorded.', 'success');
      setCheckInOpen(false);
      loadOkrs();
    } catch (err: any) {
      showAlert(err.message || 'Failed to check in.', 'error');
    }
  };

  // AI alignment summary triggers
  const triggerAiOkrReport = (okr: OkrObjective) => {
    const krSummary = okr.keyResults.map(kr => `"${kr.title}" is at ${kr.currentValue}/${kr.targetValue} ${kr.unit || ''}`).join(', ');
    const promptText = `Formulate an executive AI alignment summary for the OKR objective "${okr.title}". Metrics: Health Status: ${okr.healthStatus}, Weighted Score: ${okr.overallScore}%, Key Results progress: ${krSummary}. Propose 3 operational recommendations to keep this objective on track.`;
    onDraftAiSuggestion(promptText);
  };

  // Filtered objectives list
  const filteredObjectives = objectives.filter(obj => {
    const term = searchTerm.toLowerCase();
    const titleMatch = obj.title.toLowerCase().includes(term) || (obj.description || '').toLowerCase().includes(term);
    const ownerName = obj.ownerEmployee?.fullName || obj.ownerDepartment?.name || 'Company';
    const ownerMatch = ownerName.toLowerCase().includes(term);
    return titleMatch || ownerMatch;
  });

  return (
    <div id="okrs-tab-panel" className="space-y-5">
      {/* Stats Summary Grid */}
      <StatCardGrid cols={4}>
        <StatCard label="Total OKRs" value={summary.totalCount} icon={<Target className="w-4 h-4 stroke-[2]" />} tone="blue" />
        <StatCard label="Avg Completion" value={`${summary.avgCompletion}%`} icon={<TrendingUp className="w-4 h-4" />} tone="blue" />
        <StatCard label="On Track" value={summary.onTrackCount} icon={<Check className="w-4 h-4 stroke-[3]" />} tone="emerald" />
        <StatCard label="At Risk / Off Track" value={summary.atRiskCount + summary.offTrackCount} icon={<AlertCircle className="w-4 h-4" />} tone="rose" />
      </StatCardGrid>

      {/* Filter Row */}
      <SectionCard>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pb-2">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search objectives or owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
            <select
              value={selectedLifecycleStatus}
              onChange={(e) => setSelectedLifecycleStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Lifecycles</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={selectedHealthStatus}
              onChange={(e) => setSelectedHealthStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Health</option>
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk</option>
              <option value="OFF_TRACK">Off Track</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              value={selectedOwnerType}
              onChange={(e) => setSelectedOwnerType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Scopes</option>
              <option value="COMPANY">Company</option>
              <option value="DEPARTMENT">Department</option>
              <option value="TEAM">Team</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold">
              <span>Start:</span>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="bg-transparent border-none text-[11px] font-bold focus:outline-none" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold">
              <span>Due:</span>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="bg-transparent border-none text-[11px] font-bold focus:outline-none" />
            </div>
            <button
              onClick={handleRefreshMetrics}
              disabled={refreshing}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create OKR</span>
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Main List Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-500 font-bold">Retrieving strategic OKRs...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 bg-rose-50/20 border border-rose-100 rounded-3xl space-y-3 text-center px-6">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <span className="text-xs text-rose-700 font-bold">{error}</span>
          <button onClick={loadOkrs} className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">Retry</button>
        </div>
      ) : filteredObjectives.length === 0 ? (
        <EmptyState
          title="No OKR Objectives Found"
          description="Try broadening your search keywords or adjusting the filter selectors to discover registered targets."
        />
      ) : (
        <div className="space-y-4">
          {filteredObjectives.map((obj) => {
            const isOpen = expandedId === obj.id;
            const healthColor =
              obj.healthStatus === 'ON_TRACK'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : obj.healthStatus === 'AT_RISK'
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : obj.healthStatus === 'COMPLETED'
                ? 'bg-blue-50 text-blue-700 border-blue-100'
                : 'bg-rose-50 text-rose-700 border-rose-100';

            const lifecycleColor =
              obj.lifecycleStatus === 'ACTIVE'
                ? 'bg-blue-600 text-white'
                : obj.lifecycleStatus === 'DRAFT'
                ? 'bg-slate-400 text-white'
                : 'bg-slate-800 text-white';

            const ownerLabel =
              obj.ownerType === 'EMPLOYEE'
                ? obj.ownerEmployee?.fullName || 'Individual'
                : obj.ownerType === 'DEPARTMENT'
                ? `${obj.ownerDepartment?.name || 'Department'} (Dept)`
                : obj.ownerType === 'TEAM'
                ? `${obj.ownerDepartment?.name || 'Team'} (Team)`
                : 'Company Level';

            return (
              <div
                key={obj.id}
                className={`bg-white border rounded-3xl overflow-hidden transition-all duration-200 ${
                  isOpen ? 'border-blue-100/80 shadow-xs' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isOpen ? null : obj.id!)}
                  className="p-5 px-6 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide ${lifecycleColor}`}>
                          {obj.lifecycleStatus}
                        </span>
                        <span className={`border text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${healthColor}`}>
                          {obj.healthStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mt-1.5 tracking-tight truncate leading-tight">
                        {obj.title}
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold mt-1">
                        Owner: {ownerLabel} • Due: {obj.periodEnd}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold leading-none">Score</span>
                      <span className="text-base font-black text-blue-600 tracking-tight block mt-1.5">{obj.overallScore}%</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(obj);
                        }}
                        className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Edit OKR"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteObjective(obj.id!);
                        }}
                        className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-rose-500 hover:text-rose-700 transition-colors"
                        title="Delete OKR"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-1 px-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center gap-1 text-[10px] font-extrabold text-slate-600">
                      <span>{isOpen ? 'Less' : 'More'}</span>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible details pane */}
                {isOpen && (
                  <div className="border-t border-slate-100 p-6 pt-5 bg-slate-50/20 grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Key Results Column */}
                    <div className="lg:col-span-3 space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Results Metrics</h5>
                      <div className="space-y-3.5">
                        {obj.keyResults.map((kr) => {
                          const krProgress = Math.min(100, Math.max(0, Math.round(
                            kr.baselineValue === kr.targetValue
                              ? 100
                              : kr.direction === 'LOWER_IS_BETTER'
                              ? ((kr.baselineValue - kr.currentValue) / (kr.baselineValue - kr.targetValue)) * 100
                              : ((kr.currentValue - kr.baselineValue) / (kr.targetValue - kr.baselineValue)) * 100
                          )));

                          return (
                            <div key={kr.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs hover:border-slate-200 transition-all">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 min-w-0">
                                  <span className="text-xs font-extrabold text-slate-800 leading-snug block">{kr.title}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">
                                    {kr.trackingType} • {kr.currentValue} / {kr.targetValue} {kr.unit} (Baseline: {kr.baselineValue})
                                  </span>
                                </div>
                                <div className="flex flex-col items-end shrink-0 gap-1.5">
                                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg select-none">
                                    {krProgress}% Progress
                                  </span>
                                  {kr.trackingType === 'MANUAL' && (
                                    <button
                                      onClick={() => handleOpenCheckIn(kr)}
                                      className="text-[9px] font-black bg-slate-900 text-white hover:bg-slate-800 px-2 py-1 rounded-md transition-colors"
                                    >
                                      Check In
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="mt-3.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${krProgress}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* AI Summary card */}
                      <div className="bg-blue-50/20 border border-blue-50/50 p-4.5 rounded-2xl space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-blue-500 fill-blue-500" />
                            AI Strategy Summary
                          </span>
                          <button
                            onClick={() => triggerAiOkrReport(obj)}
                            className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 select-none cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Ask Copilot to analyze OKR</span>
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700 bg-white border border-slate-100/60 p-3.5 rounded-xl font-semibold">
                          {obj.description || 'Awaiting metrics check-in data to formulate automatic AI operational summaries.'}
                        </p>
                      </div>
                    </div>

                    {/* Key Impacts Column */}
                    <div className="lg:col-span-2 space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-600 stroke-[2.2]" />
                        Key Organizational Impacts
                      </h5>
                      <div className="flex flex-col gap-2.5">
                        {obj.keyImpacts.length === 0 ? (
                          <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-white">
                            <p className="text-[11px] text-slate-400 font-bold">No organizational impacts declared.</p>
                          </div>
                        ) : (
                          obj.keyImpacts.map((ki, i) => (
                            <div key={i} className="flex gap-2.5 bg-white p-3 px-3.5 rounded-2xl border border-slate-100 shadow-3xs hover:bg-slate-50/40 transition-colors">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-slate-650 leading-tight font-semibold">{ki.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit OKR Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs overflow-y-auto p-4 sm:p-6">
          <div className="absolute inset-0" onClick={() => setFormOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  {editingOkr ? 'Edit OKR Objective' : 'Define Strategic OKR Objective'}
                </h4>
              </div>
              <button onClick={() => setFormOpen(false)} className="text-xs text-slate-450 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveObjective} className="space-y-4">
              <FormField label="Objective Designation Title" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maximize API Ingress Performance SLA"
                  value={formObjective.title}
                  onChange={(e) => setFormObjective(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </FormField>

              <FormField label="Description / Focus Area">
                <textarea
                  placeholder="Summarize the core strategy, targets, and strategic priority alignment..."
                  value={formObjective.description || ''}
                  onChange={(e) => setFormObjective(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 h-20"
                />
              </FormField>

              <FormRow cols={3}>
                <FormField label="Owner Scope Type">
                  <select
                    value={formObjective.ownerType}
                    onChange={(e) => setFormObjective(prev => ({ ...prev, ownerType: e.target.value as any, ownerId: '' }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="COMPANY">Company Level</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="TEAM">Team</option>
                    <option value="EMPLOYEE">Individual Employee</option>
                  </select>
                </FormField>

                <FormField label="Select Owner">
                  {formObjective.ownerType === 'COMPANY' ? (
                    <input
                      type="text"
                      disabled
                      value="Entire Business"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500"
                    />
                  ) : formObjective.ownerType === 'DEPARTMENT' || formObjective.ownerType === 'TEAM' ? (
                    <select
                      value={formObjective.ownerId || ''}
                      onChange={(e) => setFormObjective(prev => ({ ...prev, ownerId: e.target.value }))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Unit...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={formObjective.ownerId || ''}
                      onChange={(e) => setFormObjective(prev => ({ ...prev, ownerId: e.target.value }))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Employee...</option>
                      {employees.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                      ))}
                    </select>
                  )}
                </FormField>

                <FormField label="Lifecycle Status">
                  <select
                    value={formObjective.lifecycleStatus}
                    onChange={(e) => setFormObjective(prev => ({ ...prev, lifecycleStatus: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </FormField>
              </FormRow>

              <FormRow cols={2}>
                <FormField label="OKR Period Start Date">
                  <input
                    type="date"
                    required
                    value={formObjective.periodStart}
                    onChange={(e) => setFormObjective(prev => ({ ...prev, periodStart: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none"
                  />
                </FormField>
                <FormField label="OKR Due Date (Period End)">
                  <input
                    type="date"
                    required
                    value={formObjective.periodEnd}
                    onChange={(e) => setFormObjective(prev => ({ ...prev, periodEnd: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none"
                  />
                </FormField>
              </FormRow>

              {/* Key Results Builder */}
              <div className="space-y-3 pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Key Results (KRs)</span>
                  <button
                    type="button"
                    onClick={addKrRow}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors select-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add KR</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(formObjective.keyResults || []).map((kr, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeKrRow(idx)}
                        className="absolute top-3.5 right-3.5 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <FormField label={`Key Result #${idx + 1} Title`} required>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Achieve 98% uptime SLA on user authentication endpoint"
                          value={kr.title}
                          onChange={(e) => handleKrFieldChange(idx, 'title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </FormField>

                      <FormRow cols={3}>
                        <FormField label="Tracking Mode">
                          <select
                            value={kr.trackingType}
                            onChange={(e) => handleKrFieldChange(idx, 'trackingType', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                          >
                            <option value="MANUAL">Manual Updates</option>
                            <option value="AUTOMATIC">Automatic Sync</option>
                          </select>
                        </FormField>

                        <FormField label="Target Value" required>
                          <input
                            type="number"
                            required
                            step="any"
                            value={kr.targetValue}
                            onChange={(e) => handleKrFieldChange(idx, 'targetValue', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </FormField>

                        <FormField label="Importance Weight">
                          <input
                            type="number"
                            required
                            step="0.1"
                            value={kr.weight}
                            onChange={(e) => handleKrFieldChange(idx, 'weight', parseFloat(e.target.value) || 1.0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </FormField>
                      </FormRow>

                      {kr.trackingType === 'AUTOMATIC' && (
                        <FormRow cols={2}>
                          <FormField label="Integration Module">
                            <select
                              value={kr.moduleSelector || ''}
                              required
                              onChange={(e) => handleKrFieldChange(idx, 'moduleSelector', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                            >
                              <option value="">Select Module...</option>
                              <option value="Attendance">Attendance</option>
                              <option value="Recruitment">Recruitment</option>
                              <option value="Projects">Projects</option>
                              <option value="Probation">Probation</option>
                              <option value="Leave">Leave</option>
                            </select>
                          </FormField>

                          <FormField label="Module Metric Selector">
                            <select
                              value={kr.metricSelector || ''}
                              required
                              onChange={(e) => handleKrFieldChange(idx, 'metricSelector', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                            >
                              <option value="">Select Metric...</option>
                              {metricTemplates
                                .filter(t => t.module === kr.moduleSelector)
                                .map(t => (
                                  <option key={t.id} value={t.metricKey}>{t.title}</option>
                                ))}
                            </select>
                          </FormField>
                        </FormRow>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Impacts Builder */}
              <div className="space-y-3 border-t border-slate-150 pt-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Strategic Impacts</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Describe a key impact, e.g. Reduced customer churn rate by 15%..."
                    value={impactInput}
                    onChange={(e) => setImpactInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addImpact}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors select-none"
                  >
                    Add Impact
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {(formObjective.keyImpacts || []).map((ki, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 px-3.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-700">{ki.text}</span>
                      <button
                        type="button"
                        onClick={() => removeImpact(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-150">
                <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border border-slate-250 rounded-xl text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer">Save OKR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual KR Check-In Modal */}
      {checkInOpen && selectedKr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setCheckInOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-md space-y-4 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Key Result Progress Check In</h4>
              <button onClick={() => setCheckInOpen(false)} className="text-xs text-slate-450 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveCheckIn} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Key Result Title</span>
                <span className="text-xs font-bold text-slate-800 leading-snug">{selectedKr.title}</span>
              </div>

              <FormField label={`Current Measured Value (${selectedKr.unit || ''})`} required>
                <input
                  type="number"
                  required
                  step="any"
                  value={checkInValue}
                  onChange={(e) => setCheckInValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </FormField>

              <FormField label="Check In Notes / Progress Comment">
                <textarea
                  placeholder="Outline any challenges, context, or reasons for this progress..."
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 h-20"
                />
              </FormField>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setCheckInOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-550 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer">Log Progress</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

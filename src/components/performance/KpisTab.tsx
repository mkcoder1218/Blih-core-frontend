import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  User as UserIcon,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Check
} from 'lucide-react';
import {
  StatCardGrid,
  StatCard,
  FilterBar,
  EmptyState,
  SectionCard,
  FormField,
  FormRow,
  StatusBadge
} from '@/components/ui/blih';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import {
  getKpis,
  createKpi,
  updateKpi,
  deleteKpi,
  logKpiManualValue,
  syncAutomaticKpis,
  getKpiTrend,
  getKpisDashboard,
  Kpi,
  KpiMetricTemplate,
  KpiValueHistory
} from '../../api/kpi';

interface KpisTabProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function KpisTab({ onDraftAiSuggestion, showAlert }: KpisTabProps) {
  // Lists & State
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [metricTemplates, setMetricTemplates] = useState<KpiMetricTemplate[]>([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    exceedingCount: 0,
    onTargetCount: 0,
    belowTargetCount: 0,
    avgScoreRate: 0
  });

  // UX states
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedOwnerType, setSelectedOwnerType] = useState('ALL');

  // Lookups
  const { data: usersData } = useUsers({ size: 200 });
  const { data: deptsData } = useDepartments({ size: 100 });
  const employees = usersData?.rows || [];
  const departments = deptsData?.departments || [];

  // Form Modal/Drawer State
  const [formOpen, setFormOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<Kpi | null>(null);
  const [formKpi, setFormKpi] = useState<Partial<Kpi>>({
    title: '',
    description: '',
    category: 'Sales',
    ownerType: 'EMPLOYEE',
    ownerId: '',
    measurementType: 'PERCENTAGE',
    unit: '%',
    direction: 'INCREASE',
    baselineValue: 0,
    currentValue: 0,
    targetValue: 100,
    updateFrequency: 'MONTHLY',
    trackingType: 'MANUAL',
    moduleSelector: '',
    metricSelector: ''
  });

  // Check-In Modal State
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [selectedKpiForCheckIn, setSelectedKpiForCheckIn] = useState<Kpi | null>(null);
  const [checkInValue, setCheckInValue] = useState<number>(0);
  const [checkInNote, setCheckInNote] = useState('');

  // Trend mapping state (stores id -> KpiValueHistory[])
  const [trends, setTrends] = useState<Record<string, KpiValueHistory[]>>({});

  // Load KPI data
  const loadKpis = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedOwnerType !== 'ALL') params.ownerType = selectedOwnerType;
      if (searchTerm) params.search = searchTerm;

      const data = await getKpis(params);
      setKpis(data.kpis || []);
      setMetricTemplates(data.metricTemplates || []);

      const dash = await getKpisDashboard();
      setSummary(dash);

      // Load trends for each KPI
      const trendMap: Record<string, KpiValueHistory[]> = {};
      for (const kpi of data.kpis) {
        if (kpi.id) {
          const hist = await getKpiTrend(kpi.id);
          trendMap[kpi.id] = hist || [];
        }
      }
      setTrends(trendMap);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve KPI values.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, [selectedCategory, selectedStatus, selectedOwnerType, searchTerm]);

  // Sync automatic metric values
  const handleSyncAutomatic = async () => {
    setSyncing(true);
    try {
      await syncAutomaticKpis();
      showAlert('All automatic KPIs synced successfully.', 'success');
      loadKpis();
    } catch (err: any) {
      showAlert(err.message || 'Failed to sync automatic KPIs.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Delete KPI
  const handleDeleteKpi = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this KPI target? This will clear its historical value logs.')) return;
    try {
      await deleteKpi(id);
      showAlert('KPI target deleted.', 'success');
      loadKpis();
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete KPI.', 'error');
    }
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingKpi(null);
    setFormKpi({
      title: '',
      description: '',
      category: 'Sales',
      ownerType: 'EMPLOYEE',
      ownerId: '',
      measurementType: 'PERCENTAGE',
      unit: '%',
      direction: 'INCREASE',
      baselineValue: 0,
      currentValue: 0,
      targetValue: 100,
      updateFrequency: 'MONTHLY',
      trackingType: 'MANUAL',
      moduleSelector: '',
      metricSelector: ''
    });
    setFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (kpi: Kpi) => {
    setEditingKpi(kpi);
    setFormKpi({ ...kpi });
    setFormOpen(true);
  };

  // Save Form Submit
  const handleSaveKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKpi.title) return;

    try {
      if (editingKpi && editingKpi.id) {
        await updateKpi(editingKpi.id, formKpi);
        showAlert('KPI successfully updated.', 'success');
      } else {
        await createKpi(formKpi);
        showAlert('New KPI target successfully established.', 'success');
      }
      setFormOpen(false);
      loadKpis();
    } catch (err: any) {
      showAlert(err.message || 'Failed to save KPI.', 'error');
    }
  };

  // Sync templates selection fields
  const handleTemplateChange = (metricKey: string) => {
    const matched = metricTemplates.find(t => t.metricKey === metricKey);
    if (matched) {
      setFormKpi(prev => ({
        ...prev,
        metricSelector: matched.metricKey,
        unit: matched.unit,
        measurementType: matched.measurementType as any,
        direction: matched.direction as any
      }));
    }
  };

  // Check In manual log submit
  const handleOpenCheckIn = (kpi: Kpi) => {
    setSelectedKpiForCheckIn(kpi);
    setCheckInValue(kpi.currentValue);
    setCheckInNote('');
    setCheckInOpen(true);
  };

  const handleSaveCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpiForCheckIn || !selectedKpiForCheckIn.id) return;

    try {
      await logKpiManualValue(selectedKpiForCheckIn.id, {
        value: checkInValue,
        note: checkInNote
      });
      showAlert('KPI manual value recorded.', 'success');
      setCheckInOpen(false);
      loadKpis();
    } catch (err: any) {
      showAlert(err.message || 'Failed to record KPI value.', 'error');
    }
  };

  // Score progression
  const getProgress = (kpi: Kpi) => {
    const { currentValue, baselineValue, targetValue, direction } = kpi;
    if (targetValue === baselineValue) return 100;
    if (direction === 'INCREASE') {
      return Math.round(((currentValue - baselineValue) / (targetValue - baselineValue)) * 100);
    } else {
      return Math.round(((baselineValue - currentValue) / (baselineValue - targetValue)) * 100);
    }
  };

  return (
    <div id="kpis-tab-panel" className="space-y-5">
      {/* Stats Dashboard Grid */}
      <StatCardGrid cols={4}>
        <StatCard label="Total KPIs" value={summary.totalCount} icon={<Target className="w-4 h-4 stroke-[2]" />} tone="blue" />
        <StatCard label="Avg Score Rate" value={`${summary.avgScoreRate}%`} icon={<TrendingUp className="w-4 h-4" />} tone="blue" />
        <StatCard label="On / Exceeding Target" value={summary.onTargetCount + summary.exceedingCount} icon={<Check className="w-4 h-4 stroke-[3]" />} tone="emerald" />
        <StatCard label="Below Target" value={summary.belowTargetCount} icon={<AlertCircle className="w-4 h-4" />} tone="rose" />
      </StatCardGrid>

      {/* Filter Row */}
      <SectionCard>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pb-2">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search KPIs by title or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Attendance">Attendance</option>
              <option value="Recruitment">Recruitment</option>
              <option value="Projects">Projects</option>
              <option value="Probation">Probation</option>
              <option value="Leave">Leave</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="EXCEEDING_TARGET">Exceeding Target</option>
              <option value="ON_TARGET">On Target</option>
              <option value="BELOW_TARGET">Below Target</option>
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

            <button
              onClick={handleSyncAutomatic}
              disabled={syncing}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create KPI</span>
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Main KPI Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-500 font-bold">Retrieving KPI indexes...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 bg-rose-50/20 border border-rose-100 rounded-3xl space-y-3 text-center px-6">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <span className="text-xs text-rose-700 font-bold">{error}</span>
          <button onClick={loadKpis} className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">Retry</button>
        </div>
      ) : kpis.length === 0 ? (
        <EmptyState
          title="No KPIs Registered"
          description="Click 'Create KPI' to set up custom targets or synchronize with active modules."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {kpis.map((kpi) => {
            const progress = getProgress(kpi);
            const statusColor =
              kpi.status === 'EXCEEDING_TARGET'
                ? 'emerald'
                : kpi.status === 'ON_TARGET'
                ? 'blue'
                : 'rose';

            const ownerLabel =
              kpi.ownerType === 'EMPLOYEE'
                ? kpi.ownerEmployee?.fullName || 'Individual'
                : kpi.ownerType === 'DEPARTMENT'
                ? `${kpi.ownerDepartment?.name || 'Department'} (Dept)`
                : kpi.ownerType === 'TEAM'
                ? `${kpi.ownerDepartment?.name || 'Team'} (Team)`
                : 'Company Level';

            // Fetch trend history bars (up to last 6 periods)
            const historyList = trends[kpi.id!] || [];
            const values = historyList.map(h => h.value);
            const maxVal = Math.max(...values, kpi.targetValue, 1);

            return (
              <div key={kpi.id} className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">{kpi.category}</span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge
                        label={kpi.status.replace('_', ' ')}
                        tone={statusColor}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEdit(kpi)}
                          className="p-1 rounded-md border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-700"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteKpi(kpi.id!)}
                          className="p-1 rounded-md border border-slate-100 hover:bg-slate-50 text-rose-400 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mt-2.5 leading-tight tracking-tight">{kpi.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium leading-snug mt-1 max-w-sm">{kpi.description}</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-none mt-2.5 uppercase tracking-wide">Owner: {ownerLabel} • Freq: {kpi.updateFrequency}</p>
                </div>

                {/* Progress card section */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 font-sans">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100/60">
                    <div className="flex items-center gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Current</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-slate-800">{kpi.currentValue} {kpi.unit}</span>
                          {kpi.trackingType === 'MANUAL' && (
                            <button onClick={() => handleOpenCheckIn(kpi)} className="p-0.5 bg-slate-900 text-white rounded text-[8px] font-bold px-1 hover:bg-slate-800 transition-colors">Check In</button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5 text-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Target</span>
                        <span className="text-xs font-black text-slate-800">{kpi.targetValue} {kpi.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Progress</span>
                      <span className="text-xs font-black text-blue-600">{progress}%</span>
                    </div>
                  </div>
                  {/* Cap visual bar width at 100% while score retains original value */}
                  <div className="mt-3 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} className="h-full bg-blue-600 rounded-full transition-all duration-300" />
                  </div>
                </div>

                {/* History Trend Columns */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">History Trend Logs</span>
                  <div className="flex items-end justify-between h-10 bg-slate-50 rounded-xl p-1.5 px-2.5 gap-1 border border-slate-100">
                    {historyList.slice(-6).map((hist, i) => {
                      const pct = Math.round((hist.value / maxVal) * 100);
                      return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-end group cursor-help relative">
                          <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-1 rounded pointer-events-none transition-all z-10">{hist.value}</span>
                          <div style={{ height: `${Math.max(pct, 15)}%` }} className="bg-blue-500 hover:bg-blue-600 rounded-xs transition-all w-full max-w-[12px] mx-auto" />
                        </div>
                      );
                    })}
                    {historyList.length === 0 && (
                      <span className="text-[9px] text-slate-400 font-bold block text-center w-full py-1">Awaiting value check-in history.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KPI Create / Edit Drawer/Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs overflow-y-auto p-4 sm:p-6">
          <div className="absolute inset-0" onClick={() => setFormOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  {editingKpi ? 'Edit KPI Config' : 'Define KPI Target'}
                </h4>
              </div>
              <button onClick={() => setFormOpen(false)} className="text-xs text-slate-450 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveKpi} className="space-y-4">
              <FormField label="KPI Title Designation" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Conversion SLA Goal"
                  value={formKpi.title}
                  onChange={(e) => setFormKpi(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  placeholder="Summarize the metric goal scope..."
                  value={formKpi.description || ''}
                  onChange={(e) => setFormKpi(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 h-16"
                />
              </FormField>

              <FormRow cols={3}>
                <FormField label="Category Category" required>
                  <select
                    value={formKpi.category}
                    onChange={(e) => setFormKpi(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Attendance">Attendance</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="Projects">Projects</option>
                    <option value="Probation">Probation</option>
                    <option value="Leave">Leave</option>
                  </select>
                </FormField>

                <FormField label="Update Frequency">
                  <select
                    value={formKpi.updateFrequency}
                    onChange={(e) => setFormKpi(prev => ({ ...prev, updateFrequency: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </FormField>

                <FormField label="Tracking Type">
                  <select
                    value={formKpi.trackingType}
                    onChange={(e) => setFormKpi(prev => ({ ...prev, trackingType: e.target.value as any, moduleSelector: '', metricSelector: '' }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="MANUAL">Manual Update</option>
                    <option value="AUTOMATIC">Automatic Sync</option>
                  </select>
                </FormField>
              </FormRow>

              <FormRow cols={2}>
                <FormField label="Owner Scope Type">
                  <select
                    value={formKpi.ownerType}
                    onChange={(e) => setFormKpi(prev => ({ ...prev, ownerType: e.target.value as any, ownerId: '' }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="COMPANY">Company Level</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="TEAM">Team</option>
                    <option value="EMPLOYEE">Individual Employee</option>
                  </select>
                </FormField>

                <FormField label="Owner Entity">
                  {formKpi.ownerType === 'COMPANY' ? (
                    <input
                      type="text"
                      disabled
                      value="Entire Business"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500"
                    />
                  ) : formKpi.ownerType === 'DEPARTMENT' || formKpi.ownerType === 'TEAM' ? (
                    <select
                      value={formKpi.ownerId || ''}
                      onChange={(e) => setFormKpi(prev => ({ ...prev, ownerId: e.target.value }))}
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
                      value={formKpi.ownerId || ''}
                      onChange={(e) => setFormKpi(prev => ({ ...prev, ownerId: e.target.value }))}
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
              </FormRow>

              {formKpi.trackingType === 'AUTOMATIC' && (
                <FormRow cols={2}>
                  <FormField label="Integration Module">
                    <select
                      value={formKpi.moduleSelector || ''}
                      required
                      onChange={(e) => setFormKpi(prev => ({ ...prev, moduleSelector: e.target.value, metricSelector: '' }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
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
                      value={formKpi.metricSelector || ''}
                      required
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Metric...</option>
                      {metricTemplates
                        .filter(t => t.module === formKpi.moduleSelector)
                        .map(t => (
                          <option key={t.id} value={t.metricKey}>{t.title}</option>
                        ))}
                    </select>
                  </FormField>
                </FormRow>
              )}

              <FormRow cols={4}>
                <FormField label="Unit unit" required>
                  <input
                    type="text"
                    required
                    disabled={formKpi.trackingType === 'AUTOMATIC'}
                    value={formKpi.unit}
                    onChange={(e) => setFormKpi(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none disabled:bg-slate-100"
                  />
                </FormField>

                <FormField label="Direction" required>
                  <select
                    value={formKpi.direction}
                    disabled={formKpi.trackingType === 'AUTOMATIC'}
                    onChange={(e) => setFormKpi(prev => ({ ...prev, direction: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-[11px] font-bold focus:outline-none disabled:bg-slate-100 cursor-pointer"
                  >
                    <option value="INCREASE">INCREASE</option>
                    <option value="DECREASE">DECREASE</option>
                  </select>
                </FormField>

                <FormField label="Baseline" required>
                  <input
                    type="number"
                    required
                    step="any"
                    disabled={formKpi.trackingType === 'AUTOMATIC'}
                    value={formKpi.baselineValue}
                    onChange={(e) => setFormKpi(prev => ({ ...prev, baselineValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none disabled:bg-slate-100"
                  />
                </FormField>

                <FormField label="Target Target" required>
                  <input
                    type="number"
                    required
                    step="any"
                    value={formKpi.targetValue}
                    onChange={(e) => setFormKpi(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                  />
                </FormField>
              </FormRow>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-150">
                <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border border-slate-250 rounded-xl text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer">Save KPI</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Check-in Dialog Modal */}
      {checkInOpen && selectedKpiForCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setCheckInOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-md space-y-4 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">KPI Value Check In</h4>
              <button onClick={() => setCheckInOpen(false)} className="text-xs text-slate-450 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveCheckIn} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">KPI Title</span>
                <span className="text-xs font-bold text-slate-800 leading-snug">{selectedKpiForCheckIn.title}</span>
              </div>

              <FormField label={`Current Measured Value (${selectedKpiForCheckIn.unit})`} required>
                <input
                  type="number"
                  required
                  step="any"
                  value={checkInValue}
                  onChange={(e) => setCheckInValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </FormField>

              <FormField label="Check In Notes / Context">
                <textarea
                  placeholder="Outline context for this metric update..."
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

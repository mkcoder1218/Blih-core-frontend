import React, { useState } from 'react';
import {
  Sparkles, Mail, FileText, CheckCircle, Clock, Calendar, TrendingUp,
  PlusCircle, Search, AlertCircle, Download, Check, Send, ClipboardList,
  FileSpreadsheet, X, FileSignature, Edit2, Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line,
} from 'recharts';
import OffboardingSubmitTab from './tabs/OffboardingSubmitTab';
import ResignationsTab from './tabs/ResignationsTab';
import { StatCard, StatCardGrid } from '@/components/ui/blih';
import { useMe } from '../../hooks/useMe';
import {
  useCompleteExitClearanceStep,
  useCompleteExitInterview,
  useCreateExitInterview,
  useDeleteExitForm,
  useExitAnalytics,
  useExitClearance,
  useExitDocuments,
  useExitInterviews,
  useExitForms,
  useExitTimeline,
  useExitRequests,
  useMyExitRequest,
  useSendExitInterviewReminder,
  useUpdateExitForm,
  useUpdateExitFinalPay,
  useUpdateExitInterview,
  useUpdateExitDocument,
  useUploadExitDocument,
  useVerifyExitDocument,
  useWaiveExitClearanceStep,
} from '../../hooks/useHrRecords';
import ExitTimeline from './ExitTimeline';

interface ExitOffboardingViewProps {
  currentTab: 'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms' | 'offboarding';
  onDraftAiSuggestion: (ctx: string) => void;
  showAlert: (msg: string, type: 'success' | 'error') => void;
}

export default function ExitOffboardingView({
  currentTab,
  onDraftAiSuggestion,
  showAlert,
}: ExitOffboardingViewProps) {
  const { data: meRes } = useMe();
  const me = meRes?.data;
  const isHrWriter = me?.permissions?.includes('hr.write') || me?.roles?.some((r: any) => ['BUSINESS_ADMIN', 'HR_MANAGER'].includes(typeof r === 'string' ? r : r.key));
  const activeTab = isHrWriter ? currentTab : 'offboarding';
  const { data: exitRequests = [], isLoading: loadingExitRequests } = useExitRequests({ enabled: Boolean(isHrWriter) });
  const { data: myExitRequest, isLoading: loadingMyExitRequest } = useMyExitRequest();
  const [selectedExitProcessId, setSelectedExitProcessId] = useState<string | null>(null);
  const selectedExitProcess = isHrWriter
    ? (exitRequests.find((item: any) => item.id === selectedExitProcessId) || exitRequests[0])
    : myExitRequest;
  const activeExitProcessId = selectedExitProcess?.id || null;
  const { data: clearanceProcess, isLoading: loadingClearance, isError: clearanceError } = useExitClearance(activeExitProcessId || undefined);
  const completeClearanceStep = useCompleteExitClearanceStep();
  const waiveClearanceStep = useWaiveExitClearanceStep();
  const [confirmStep, setConfirmStep] = useState<{ action: 'complete' | 'waive'; step: any } | null>(null);
  const { data: exitInterviews = [], isLoading: loadingInterviews } = useExitInterviews();
  const createExitInterview = useCreateExitInterview();
  const updateExitInterview = useUpdateExitInterview();
  const completeExitInterview = useCompleteExitInterview();
  const sendExitInterviewReminder = useSendExitInterviewReminder();
  const { data: exitDocumentsData, isLoading: loadingExitDocuments } = useExitDocuments(activeExitProcessId || undefined);
  const uploadExitDocument = useUploadExitDocument();
  const verifyExitDocument = useVerifyExitDocument();
  const updateExitDocument = useUpdateExitDocument();
  const { data: exitAnalytics = {}, isLoading: loadingExitAnalytics } = useExitAnalytics();
  const updateExitFinalPay = useUpdateExitFinalPay();
  const { data: exitForms = [], isLoading: loadingExitForms } = useExitForms();
  const deleteExitForm = useDeleteExitForm();
  const updateExitForm = useUpdateExitForm();
  const { data: activeTimeline = [], isLoading: loadingActiveTimeline } = useExitTimeline(activeExitProcessId || undefined);

  // ── Overview state ────────────────────────────────────────────────────────
  const warnings = exitAnalytics.activeNotifications || [];

  // ── Interviews state ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogInterviewModal, setShowLogInterviewModal] = useState(false);
  const [newInterview, setNewInterview] = useState({ name: '', role: '', dept: '', interviewer: '', rating: '5', recommend: 'Yes', remarks: '' });

  // ── Documents state ───────────────────────────────────────────────────────

  // ── Clearance state ───────────────────────────────────────────────────────

  // ── Chart data ────────────────────────────────────────────────────────────
  const exitReasonsData = (exitAnalytics.topExitReasonsLast12Months || []).map((item: any) => ({ name: item.reason, count: item.count }));
  const turnoverTrendData = (exitAnalytics.monthlyTurnoverTrend || []).map((item: any) => ({ month: item.month, Exits: item.exits, Hires: item.hires }));
  const departmentsData = (exitAnalytics.departmentAttritionAnalysis || []).map((item: any) => ({
    name: item.departmentName,
    employees: item.employeeCount,
    exits: item.exits,
    remaining: item.remaining,
    rate: item.attritionRate,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSendInterviewReminder = async (item: any) => {
    try {
      await sendExitInterviewReminder.mutateAsync(item.id);
      showAlert(`Graceful reminder email dispatched to ${item.name}!`, 'success');
    } catch (e: any) {
      showAlert(e.response?.data?.error || 'Failed to send reminder', 'error');
    }
  };

  const handleRescheduleInterview = async (item: any) => {
    try {
      const nextDate = new Date(item.raw.scheduledAt || Date.now());
      nextDate.setDate(nextDate.getDate() + 1);
      await updateExitInterview.mutateAsync({ interviewId: item.id, data: { scheduledAt: nextDate.toISOString() } });
      showAlert(`Reschedule invitation generated for ${item.name}.`, 'success');
    } catch (e: any) {
      showAlert(e.response?.data?.error || 'Failed to reschedule interview', 'error');
    }
  };

  const submitLoggedInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterview.name || !newInterview.role) { showAlert('Please enter employee name & role', 'error'); return; }
    const target = exitInterviews.find((item: any) => item.status === 'scheduled') || exitInterviews[0];
    if (!target && !activeExitProcessId) { showAlert('No exit process available for feedback.', 'error'); return; }
    const payload = {
      rating: parseFloat(newInterview.rating),
      wouldRecommendCompany: newInterview.recommend === 'Yes',
      remarks: newInterview.remarks || 'Standard departure. No grievances recorded.',
    };
    try {
      if (target) {
        await completeExitInterview.mutateAsync({ interviewId: target.id, data: payload });
      } else {
        const created = await createExitInterview.mutateAsync({
          exitProcessId: activeExitProcessId!,
          data: { scheduledAt: new Date().toISOString(), location: 'Recorded manually' },
        });
        await completeExitInterview.mutateAsync({ interviewId: created.data?.data?.id || created.data?.id, data: payload });
      }
      setShowLogInterviewModal(false);
      setNewInterview({ name: '', role: '', dept: '', interviewer: '', rating: '5', recommend: 'Yes', remarks: '' });
      showAlert('Exit interview logged safely!', 'success');
    } catch (err: any) {
      showAlert(err.response?.data?.error || 'Failed to log exit feedback', 'error');
    }
  };

  const toInterviewCard = (item: any) => {
    const employee = item.exitProcess?.employee;
    const profile = employee?.BusinessUserProfile;
    const name = employee?.fullName || employee?.email || 'Employee';
    const scheduled = item.scheduledAt ? new Date(item.scheduledAt) : null;
    return {
      id: item.id,
      raw: item,
      name,
      role: profile?.position?.title || '-',
      dept: profile?.department?.name || '-',
      initials: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      date: scheduled ? scheduled.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
      time: scheduled ? scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      interviewer: item.interviewer?.fullName || item.interviewer?.email || '-',
      location: item.meetingUrl || item.location || '-',
      status: item.status,
      rating: Number(item.rating || 0),
      recommend: item.wouldRecommendCompany === false ? 'No' : item.wouldRecommendCompany === true ? 'Yes' : '-',
      remarks: item.remarks || item.suggestions || item.reasonForLeaving || '-',
    };
  };

  const upcomingInterviews = exitInterviews.filter((item: any) => item.status === 'scheduled').map(toInterviewCard);
  const completedInterviewCards = exitInterviews.filter((item: any) => item.status === 'completed').map(toInterviewCard);
  const avgRating = completedInterviewCards.length
    ? (completedInterviewCards.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) / completedInterviewCards.length).toFixed(1)
    : '0.0';
  const filteredCompletedInterviewsLive = completedInterviewCards.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exitDocuments = exitDocumentsData?.documents || [];
  const documentEmployee = exitDocumentsData?.exitProcess?.employee || selectedExitProcess?.employee;
  const documentName = documentEmployee?.fullName || documentEmployee?.email || 'Employee';
  const documentProfile = documentEmployee?.BusinessUserProfile;
  const documentInitials = documentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const documentDoneCount = exitDocuments.filter((doc: any) => ['uploaded', 'verified', 'waived'].includes(doc.status)).length;
  const documentPercent = exitDocuments.length ? Math.round((documentDoneCount / exitDocuments.length) * 100) : 0;

  return (
    <div className="space-y-8 font-sans">

      {/* ── 1. OVERVIEW ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <StatCardGrid cols={4}>
            <StatCard label="Active Resignations"  value={loadingExitAnalytics ? '-' : String(exitAnalytics.activeResignations || 0)} icon={<Mail className="w-5 h-5" />}        tone="blue"    trend={`${warnings.length} notifications`}  trendPositive={false} />
            <StatCard label="Pending Interviews"   value={loadingExitAnalytics ? '-' : String(exitAnalytics.pendingInterviews || 0)} icon={<Calendar className="w-5 h-5" />}    tone="amber"   trend="scheduled"    trendPositive={true} />
            <StatCard label="Clearance Pending"    value={loadingExitAnalytics ? '-' : String(exitAnalytics.clearancePending || 0)} icon={<AlertCircle className="w-5 h-5" />} tone="rose"    trend="open tasks"       trendPositive={false} />
            <StatCard label="Completed This Month" value={loadingExitAnalytics ? '-' : String(exitAnalytics.completedThisMonth || 0)} icon={<CheckCircle className="w-5 h-5" />} tone="emerald" trend="settled exits"       trendPositive={true} />
          </StatCardGrid>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Active Resignation Notifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warnings.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest md:col-span-2">No active resignation notifications</div>
              ) : warnings.map((item: any) => (
                <div key={item.id} className={`bg-white p-4 rounded-2xl flex gap-4 transition-all hover:shadow-sm border ${item.priority === 'high' || item.priority === 'urgent' ? 'border-red-100 bg-red-50/5' : 'border-slate-100'}`}>
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{item.initials}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{item.name}</span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">{item.dept}</span>
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${item.priority === 'urgent' ? 'bg-red-500 text-white' : item.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.priority}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">{item.text}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                       <span className="flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5" />{item.date ? new Date(item.date).toLocaleDateString() : '-'}</span>
                      <span className="flex items-center gap-1.5 font-semibold text-blue-600"><Clock className="w-3.5 h-3.5" />{item.remaining}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Exit Reasons (Last 12 Months)</h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exitReasonsData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={100} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monthly Turnover Trend</h3>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={turnoverTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="Hires" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Exits" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-500 text-center">
                <span>Total Hires: {turnoverTrendData.reduce((sum: number, item: any) => sum + Number(item.Hires || 0), 0)}</span>
                <span className="text-red-500">Total Exits: {turnoverTrendData.reduce((sum: number, item: any) => sum + Number(item.Exits || 0), 0)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Department Attrition Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {departmentsData.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest md:col-span-2">No department attrition data yet</div>
              ) : departmentsData.map((dept: any) => (
                <div key={dept.name} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-slate-50/20 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{dept.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{dept.employees} employees</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 block">{dept.exits} {dept.exits === 1 ? 'exit' : 'exits'} this year</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">Attrition Rate</span>
                    <span className="text-2xl font-bold text-blue-600">{dept.rate}%</span>
                    <span className="text-[10px] text-slate-400 block font-bold mt-1">{dept.remaining} remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. RESIGN (live API) ─────────────────────────────────────────────── */}
      {activeTab === 'resign' && <ResignationsTab showAlert={showAlert} />}

      {/* ── 7. OFFBOARDING SUBMIT (live API) ────────────────────────────────── */}
      {activeTab === 'offboarding' && <OffboardingSubmitTab showAlert={showAlert} />}

      {/* ── 3. INTERVIEWS ───────────────────────────────────────────────────── */}
      {activeTab === 'interviews' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: 'Scheduled', value: loadingInterviews ? '-' : String(upcomingInterviews.length), icon: <Calendar className="w-5 h-5" /> },
              { label: 'Avg Rating', value: `${avgRating}/5.0`, icon: <TrendingUp className="w-5 h-5" /> },
              { label: 'Completed', value: loadingInterviews ? '-' : String(completedInterviewCards.length), icon: <FileText className="w-5 h-5" /> },
            ].map(s => (
              <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{s.label}</span>
                  <span className="text-3xl font-bold text-slate-800">{s.value}</span>
                </div>
                <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">{s.icon}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Upcoming Exit Interviews</h3>
              <button onClick={() => onDraftAiSuggestion('Exit Interview Questions & Strategic Guidance')} className="bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Draft Interview Checklist
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {loadingInterviews ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Loading interviews...</div>
              ) : upcomingInterviews.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No upcoming exit interviews</div>
              ) : upcomingInterviews.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{item.initials}</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.name}</h4>
                      <span className="text-xs text-slate-400 font-medium">{item.dept}</span>
                    </div>
                    <span className="ml-auto bg-blue-50 text-blue-600 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">{item.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                    <div><span className="block text-[9px] text-slate-400 font-bold uppercase">Date</span><span className="font-semibold text-slate-700">{item.date}</span></div>
                    <div><span className="block text-[9px] text-slate-400 font-bold uppercase">Time</span><span className="font-semibold text-slate-700">{item.time}</span></div>
                    <div><span className="block text-[9px] text-slate-400 font-bold uppercase">Interviewer</span><span className="font-semibold text-slate-700">{item.interviewer}</span></div>
                    <div><span className="block text-[9px] text-slate-400 font-bold uppercase">Location</span><span className="font-semibold text-slate-700">{item.location}</span></div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => handleSendInterviewReminder(item)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5" />Send Reminder</button>
                    <button onClick={() => handleRescheduleInterview(item)} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl transition-all">Reschedule</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-50 pb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Completed Exit Interviews</h3>
                <p className="text-xs text-slate-400">View and archive historic feedback logs and organizational insights.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 outline-none rounded-xl w-[200px] focus:bg-white focus:border-blue-400 transition-all font-medium text-slate-800" />
                </div>
                <button onClick={() => setShowLogInterviewModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"><PlusCircle className="w-3.5 h-3.5" />Log Exit Feedback</button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredCompletedInterviewsLive.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold border-2 border-dashed border-slate-100 rounded-xl">No completed interviews matching the search.</div>
              ) : filteredCompletedInterviewsLive.map(item => (
                <div key={item.id} className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">{item.initials}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 leading-tight">{item.name}</span>
                          <span className="bg-blue-50 text-blue-600 text-[9px] uppercase font-bold px-2 py-0.5 rounded">{item.dept}</span>
                        </div>
                        <span className="text-xs text-slate-400">{item.role}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-[11px] leading-relaxed">
                      <div><span className="block text-[9px] text-slate-400 font-bold uppercase">Interview Date</span><span className="font-semibold text-slate-700">{item.date}</span></div>
                      <div><span className="block text-[9px] text-slate-400 font-bold uppercase">Interviewer</span><span className="font-semibold text-slate-700">{item.interviewer}</span></div>
                      <div><span className="block text-[9px] text-slate-400 font-bold uppercase">Rating</span><span className="font-bold text-amber-500">{item.rating.toFixed(1)} / 5.0</span></div>
                    </div>
                    <div className="flex items-center gap-2 lg:ml-auto text-[11px]">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Would Recommend</span>
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded">{item.recommend}</span>
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Remarks</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.remarks}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. DOCUMENTS ────────────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[{ label: 'Total Employees', value: activeExitProcessId ? '1' : '0', icon: <FileText className="w-5 h-5" /> }, { label: 'Fully Cleared', value: documentPercent === 100 && exitDocuments.length ? '1' : '0', icon: <CheckCircle className="w-5 h-5" /> }, { label: 'In Progress', value: documentPercent > 0 && documentPercent < 100 ? '1' : '0', icon: <AlertCircle className="w-5 h-5" /> }].map(s => (
              <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="space-y-1"><span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{s.label}</span><span className="text-3xl font-bold text-slate-800">{s.value}</span></div>
                <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">{s.icon}</div>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {loadingExitDocuments ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Loading documents...</div>
            ) : !activeExitProcessId ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No active exit document checklist</div>
            ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-6">
                  <div className="flex-1 lg:max-w-xs space-y-3 border-r border-slate-50 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{documentInitials}</div>
                      <div>
                        <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] uppercase font-bold px-2 py-0.5 rounded block max-w-max">{documentProfile?.department?.name || '-'}</span>
                        <h4 className="text-sm font-bold text-slate-800 mt-1 leading-none">{documentName}</h4>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">Last Working Day: <span className="font-bold text-slate-700">{selectedExitProcess?.effectiveDate ? new Date(selectedExitProcess.effectiveDate).toLocaleDateString() : '-'}</span></div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Required Checklist Documents</span>
                    <div className="flex flex-wrap gap-2.5">
                      {exitDocuments.map((doc: any) => (
                        <button key={doc.id} onClick={() => doc.status === 'uploaded' && verifyExitDocument.mutate({ exitProcessId: activeExitProcessId!, documentId: doc.id })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${['uploaded', 'verified', 'waived'].includes(doc.status) ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          <Check className="w-3.5 h-3.5" />{doc.title} <span className="opacity-75">({doc.status})</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-4 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer">
                        Manage Documents
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            const target = exitDocuments.find((doc: any) => doc.status === 'missing') || exitDocuments[0];
                            if (!file || !target || !activeExitProcessId) return;
                            try {
                              await uploadExitDocument.mutateAsync({ exitProcessId: activeExitProcessId, documentId: target.id, file });
                              showAlert('Document uploaded.', 'success');
                            } catch (err: any) {
                              showAlert(err.response?.data?.error || 'Failed to upload document', 'error');
                            }
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <button onClick={() => window.open(`/api/v1/hr/exit/${activeExitProcessId}/documents/download-all`, '_blank')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold px-4 py-1.5 rounded-xl transition-all flex items-center gap-1"><Download className="w-3.5 h-3.5" />Download All</button>
                      {exitDocuments.find((doc: any) => doc.status === 'missing') && (
                        <button onClick={() => updateExitDocument.mutate({ exitProcessId: activeExitProcessId!, documentId: exitDocuments.find((doc: any) => doc.status === 'missing').id, data: { status: 'waived' } })} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold px-4 py-1.5 rounded-xl transition-all">Waive Missing</button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center xl:justify-center border-t xl:border-t-0 xl:border-l border-slate-100 pt-4 xl:pt-0 xl:pl-6">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Completion Bar</span>
                      <div className="w-16 h-16 rounded-full border-[3px] border-blue-600 flex items-center justify-center text-blue-600 font-extrabold text-sm mx-auto">{documentPercent}%</div>
                      <span className="text-[10px] text-slate-500 font-bold block pt-1">Overall Progress {documentDoneCount}/{exitDocuments.length} tasks</span>
                    </div>
                  </div>
                </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Document Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {loadingExitForms ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest md:col-span-3">Loading templates...</div>
              ) : exitForms.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest md:col-span-3">No document templates available</div>
              ) : exitForms.slice(0, 3).map((tmpl: any) => (
                <div key={tmpl.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform space-y-3">
                  <div className="space-y-1.5"><h4 className="text-xs font-bold text-slate-800 leading-normal">{tmpl.name}</h4><p className="text-[11px] text-slate-400 leading-relaxed">{tmpl.description || 'Exit workflow template'}</p></div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><FileText className="w-4 h-4" /></div>
                    <button onClick={() => window.open(`/api/v1/hr/forms/${tmpl.id}/download`, '_blank')} className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. CLEARANCE ────────────────────────────────────────────────────── */}
      {activeTab === 'clearance' && (
        <div className="space-y-8 animate-fadeIn">
          {(() => {
            const steps = (clearanceProcess?.clearanceSteps || []).slice().sort((a: any, b: any) => a.sortOrder - b.sortOrder);
            const actionableCount = steps.filter((step: any) => step.status === 'completed' || step.status === 'waived').length;
            const completedCount = steps.filter((step: any) => step.status === 'completed').length;
            const waivedCount = steps.filter((step: any) => step.status === 'waived').length;
            const pendingCount = steps.filter((step: any) => step.status === 'pending').length;
            const percent = steps.length ? Math.round((actionableCount / steps.length) * 100) : 0;
            const employee = clearanceProcess?.employee || selectedExitProcess?.employee;
            const profile = employee?.BusinessUserProfile;
            const employeeName = employee?.fullName || employee?.email || 'Employee';
            const initials = employeeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const dept = profile?.department?.name || '-';
            const role = profile?.position?.title || '-';
            const statusLabel = steps.length && pendingCount === 0 ? 'completed' : steps.length ? 'in progress' : 'pending';
            const isBusy = completeClearanceStep.isPending || waiveClearanceStep.isPending;
            const confirmAction = async () => {
              if (!confirmStep || !activeExitProcessId) return;
              try {
                if (confirmStep.action === 'complete') {
                  await completeClearanceStep.mutateAsync({ exitProcessId: activeExitProcessId, stepId: confirmStep.step.id });
                  showAlert('Clearance step completed.', 'success');
                } else {
                  await waiveClearanceStep.mutateAsync({ exitProcessId: activeExitProcessId, stepId: confirmStep.step.id });
                  showAlert('Clearance step waived.', 'success');
                }
                setConfirmStep(null);
              } catch (e: any) {
                showAlert(e.response?.data?.error || e.response?.data?.message || 'Failed to update clearance step', 'error');
              }
            };

            return (
              <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[{ label: 'Total Employees', value: clearanceProcess ? '1' : '0', icon: <FileText className="w-5 h-5" /> }, { label: 'Completed', value: String(completedCount), icon: <CheckCircle className="w-5 h-5" /> }, { label: 'Waived', value: String(waivedCount), icon: <AlertCircle className="w-5 h-5" /> }, { label: 'Pending', value: String(pendingCount), icon: <X className="w-5 h-5" /> }].map(s => (
              <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="space-y-1"><span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{s.label}</span><span className="text-3xl font-bold text-slate-800">{s.value}</span></div>
                <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">{s.icon}</div>
              </div>
            ))}
          </div>

          {isHrWriter && exitRequests.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</span>
              <select
                value={activeExitProcessId || ''}
                onChange={(e) => setSelectedExitProcessId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400"
              >
                {exitRequests.map((request: any) => (
                  <option key={request.id} value={request.id}>{request.employee?.fullName || request.employee?.email || 'Employee'}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-blue-100 bg-blue-50/5 shadow-sm space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5"><ClipboardList className="w-4 h-4" />Exit Clearance Checklist Template</span>
              <p className="text-xs text-slate-400">Standardized 6-stage operational tasks executed for every departing corporate employee.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {steps.map((step: any) => (
                <div key={step.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center flex-shrink-0">{step.sortOrder}</div>
                  <div className="space-y-0.5"><h4 className="text-xs font-bold text-slate-700 leading-normal">{step.title}</h4><p className="text-[10px] text-slate-400 leading-snug">{step.description}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Employee Clearance Progress</h3>
            {loadingExitRequests || loadingMyExitRequest || loadingClearance ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Loading clearance checklist...</div>
            ) : clearanceError ? (
              <div className="bg-white p-10 rounded-2xl border border-rose-100 text-center text-xs font-bold text-rose-500 uppercase tracking-widest">Unable to load clearance checklist</div>
            ) : !clearanceProcess ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No active exit clearance checklist</div>
            ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">{initials}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{employeeName}</h4>
                          <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{dept}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">{role}</span>
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${statusLabel === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{statusLabel}</span>
                    </div>
                    <span className="bg-slate-50 text-slate-500 text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-100">Progress: {percent}% completed</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {steps.map((step: any) => {
                      const isCompleted = step.status === 'completed';
                      const isWaived = step.status === 'waived';
                      const actioned = isCompleted || isWaived;
                      const actionDate = step.completedAt ? new Date(step.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                      const actionBy = step.completedBy?.fullName || step.completedBy?.email || 'HR';
                      return (
                        <div key={step.id} className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${isCompleted ? 'bg-emerald-50/10 border-emerald-100' : isWaived ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/30 border-slate-200/60 hover:bg-slate-50/60'}`}>
                          <div className="flex items-start gap-2.5">
                            {isCompleted ? <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white mt-0.5 flex-shrink-0"><Check className="w-3 h-3 stroke-[3]" /></div> : isWaived ? <div className="w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center text-white mt-0.5 flex-shrink-0"><X className="w-3 h-3 stroke-[3]" /></div> : <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-300 mt-0.5 flex-shrink-0 text-[10px]">{step.sortOrder}</div>}
                            <div className="space-y-0.5">
                              <span className={`text-xs font-bold block ${actioned ? 'text-slate-700' : 'text-slate-500'}`}>{step.title}</span>
                              {isCompleted && <span className="text-[9px] text-emerald-600 font-semibold block">Completed {actionDate} by {actionBy}</span>}
                              {isWaived && <span className="text-[9px] text-slate-500 font-semibold block">Waived {actionDate} by {actionBy}</span>}
                              {!actioned && <span className="text-[9px] text-amber-600 font-semibold block">Pending</span>}
                            </div>
                          </div>
                          {isHrWriter && !actioned && (
                            <div className="flex items-center gap-2">
                              <button disabled={isBusy} onClick={() => setConfirmStep({ action: 'complete', step })} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg transition-transform active:scale-95 flex-shrink-0 disabled:opacity-50">Mark Complete</button>
                              <button disabled={isBusy} onClick={() => setConfirmStep({ action: 'waive', step })} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50">Waive</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-6 pt-3 flex-wrap">
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Completion Bar</span>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} /></div>
                      <span className="text-[10px] text-slate-500 font-bold block pt-1">Overall Progress {actionableCount}/{steps.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => showAlert('Details overview populated.', 'success')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-4 rounded-xl transition-all">View Details</button>
                      <button onClick={() => showAlert(`Clearance Certificate for ${employeeName} dispatched!`, 'success')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm">Generate Clearance Certificate</button>
                    </div>
                  </div>
                </div>
            )}
          </div>

          <ExitTimeline events={activeTimeline} isLoading={loadingActiveTimeline} />

          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Quick Actions</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Bulk Update',      icon: <CheckCircle className="w-4 h-4 mx-auto text-blue-600" />,    msg: 'Bulk update completed!' },
                { label: 'Export Checklist', icon: <FileSpreadsheet className="w-4 h-4 mx-auto text-blue-600" />, msg: 'Checklist CSV exported!' },
                { label: 'Send Reminder',    icon: <Send className="w-4 h-4 mx-auto text-blue-600" />,           msg: 'Reminders fired to all incomplete stakeholders!' },
                { label: 'Generate Reports', icon: <ClipboardList className="w-4 h-4 mx-auto text-blue-600" />,  msg: 'Attrition statistical report compiled!' },
              ].map(a => (
                <button key={a.label} onClick={() => showAlert(a.msg, 'success')} className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center space-y-1 transition-all active:scale-95">
                  {a.icon}<span className="text-xs font-bold text-slate-700 block">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          {confirmStep && (
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 max-w-sm w-full space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Confirm Clearance Update</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {confirmStep.action === 'complete' ? 'Mark this clearance step as completed?' : 'Waive this clearance step?'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700">{confirmStep.step.title}</div>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setConfirmStep(null)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-all">Cancel</button>
                  <button onClick={confirmAction} disabled={isBusy} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm">
                    {isBusy ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── 6. FORMS ────────────────────────────────────────────────────────── */}
      {activeTab === 'forms' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[{ label: 'Exit Interview Form', value: String(exitForms.filter((f: any) => f.key?.includes('interview')).length) }, { label: 'Resignation Templates', value: String(exitForms.filter((f: any) => f.key?.includes('resignation')).length) }, { label: 'Satisfaction Surveys', value: String(exitForms.filter((f: any) => f.key?.includes('feedback')).length) }, { label: 'Letter Templates', value: String(exitForms.filter((f: any) => f.key?.includes('letter')).length) }].map(s => (
              <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="space-y-1"><span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{s.label}</span><span className="text-3xl font-bold text-slate-800">{s.value}</span></div>
                <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100"><FileText className="w-5 h-5" /></div>
              </div>
            ))}
          </div>

          <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div><h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Form Management</h3><p className="text-xs text-slate-400">Create and manage exit related forms, templates, and documents.</p></div>
            <div className="space-y-6">
              {loadingExitForms ? (
                <div className="border border-slate-100 rounded-2xl p-8 bg-slate-50/10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Loading forms...</div>
              ) : exitForms.length === 0 ? (
                <div className="border border-slate-100 rounded-2xl p-8 bg-slate-50/10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No exit forms available</div>
              ) : exitForms.map((form: any) => (
                <div key={form.id} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{form.name}</h4>
                          <span className="bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">{form.settings?.category || 'exit'}</span>
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded">v{form.version || form.settings?.version || 1}</span>
                        </div>
                        <p className="text-xs text-slate-500">{form.description || 'Exit workflow template'}</p>
                      </div>
                    </div>
                    <button onClick={() => window.open(`/api/v1/hr/forms/${form.id}/download`, '_blank')} className="sm:ml-auto border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"><Download className="w-3.5 h-3.5" />Download</button>
                  </div>
                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Template Preview</span>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed whitespace-pre-line">{form.settings?.preview || form.description || form.name}</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 text-xs pt-1">
                    <span>Updated: {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : '-'} | Used {form.usageCount || 0} times</span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={updateExitForm.isPending}
                        onClick={() => {
                          const name = window.prompt('Update form name', form.name);
                          if (!name || name === form.name) return;
                          updateExitForm.mutate(
                            { id: form.id, data: { name } },
                            { onSuccess: () => showAlert('Form updated.', 'success'), onError: (e: any) => showAlert(e.response?.data?.error || 'Failed to update form', 'error') },
                          );
                        }}
                        className="text-slate-500 hover:text-slate-700 font-bold py-1 px-2.5 rounded hover:bg-slate-100 flex items-center gap-1 disabled:opacity-50"
                      ><Edit2 className="w-3 h-3" />Edit</button>
                      <button disabled={deleteExitForm.isPending} onClick={() => { if (window.confirm(`Delete ${form.name}?`)) deleteExitForm.mutate(form.id, { onSuccess: () => showAlert('Form deleted.', 'success'), onError: (e: any) => showAlert(e.response?.data?.error || 'Failed to delete form', 'error') }); }} className="text-red-500 hover:text-red-700 font-bold py-1 px-2.5 rounded hover:bg-red-50 flex items-center gap-1 disabled:opacity-50"><Trash2 className="w-3 h-3" />Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Log Interview Modal ──────────────────────────────────────────────── */}
      {showLogInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowLogInterviewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg mx-4 p-6 space-y-5 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Log Exit Interview Feedback</h3>
              <button onClick={() => setShowLogInterviewModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitLoggedInterview} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Employee Name *</label>
                  <input type="text" required placeholder="Full Name" value={newInterview.name} onChange={e => setNewInterview({ ...newInterview, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Role / Position *</label>
                  <input type="text" required placeholder="e.g. Senior Engineer" value={newInterview.role} onChange={e => setNewInterview({ ...newInterview, role: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Department</label>
                  <input type="text" placeholder="Department" value={newInterview.dept} onChange={e => setNewInterview({ ...newInterview, dept: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Interviewer</label>
                  <input type="text" placeholder="Interviewer name" value={newInterview.interviewer} onChange={e => setNewInterview({ ...newInterview, interviewer: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Departure Rating (1-5)</label>
                  <select value={newInterview.rating} onChange={e => setNewInterview({ ...newInterview, rating: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium bg-white text-sm">
                    {[['5', '5.0 - Excellent'], ['4', '4.0 - Good'], ['3', '3.0 - Satisfactory'], ['2', '2.0 - Poor'], ['1', '1.0 - Highly Dissatisfactory']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Would Recommend</label>
                  <div className="flex gap-4 font-bold pt-1">
                    {['Yes', 'No'].map(val => (
                      <label key={val} className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input type="radio" name="recommend" value={val} checked={newInterview.recommend === val} onChange={() => setNewInterview({ ...newInterview, recommend: val })} className="accent-blue-600" />{val}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Feedback Summary / Remarks</label>
                <textarea rows={3} placeholder="Reasons for leaving, concerns, suggestions..." value={newInterview.remarks} onChange={e => setNewInterview({ ...newInterview, remarks: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium resize-none leading-relaxed text-sm" />
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                <button type="button" onClick={() => setShowLogInterviewModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl transition-all font-semibold text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl transition-all shadow-sm font-bold text-sm">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

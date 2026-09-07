/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  Users, 
  Globe, 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle, 
  Briefcase,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Check,
  Building,
  Clock3,
  Save,
  X
} from 'lucide-react';
import { useMe } from '../../hooks/useMe';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useCreateBusiness } from '../../hooks/useCreateBusiness';
import { useUpdateBusiness } from '../../hooks/useUpdateBusiness';
import { useDeleteBusiness } from '../../hooks/useDeleteBusiness';
import { useCreateBusinessAdmin } from '../../hooks/useCreateBusinessAdmin';
import { usePlans } from '../../hooks/usePlans';
import { useSectorFocuses } from '../../hooks/useSectorFocuses';
import { useAttendanceSettings } from '../../hooks/useAttendanceSettings';
import { useUpsertAttendanceSettings } from '../../hooks/useUpsertAttendanceSettings';
import type { Business as ApiBusiness } from '../../api/types';
import type { BusinessesTab } from '../../types';
import PlansTab from './PlansTab';
import SectorFocusTab from './SectorFocusTab';
import AuditLogsTab from './AuditLogsTab';
import NotificationsTab from './NotificationsTab';
import AttendanceSettingsForm from './attendance/AttendanceSettingsForm';
import type { BusinessAttendanceSettings } from '../../api/types';
import type { BusinessAttendanceSettingsDraft } from './attendance/attendanceSettings.types';
import { validateAttendanceSettings } from './attendance/attendanceSettings.schema';
import HolidayImportPanel from '../people/HolidayImportPanel';
import PublicRegistrationConfigPanel from './PublicRegistrationConfigPanel';
import { ConfirmDialog } from '@/components/ui/blih';
import TelegramAttendanceIntegrationsPanel from './TelegramAttendanceIntegrationsPanel';
import SmtpProvidersTab from './SmtpProvidersTab';
import { BusinessModulesModal } from './BusinessModulesModal';

type ViewBusiness = ApiBusiness & {
  legalName: string;
  sector: string;
  domain: string;
  location: string;
  statusLabel: 'Active' | 'Suspended';
  established: string;
  employeeCount: number;
};

function toViewBusiness(b: ApiBusiness): ViewBusiness {
  const createdAt = (b as any).createdAt ? new Date((b as any).createdAt) : null;
  const established = createdAt ? createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : 'â€”';
  return {
    ...b,
    legalName: b.name,
    sector: 'â€”',
    domain: b.slug,
    location: 'â€”',
    statusLabel: b.status === 'active' ? 'Active' : 'Suspended',
    established,
    employeeCount: 0,
  };
}

interface BusinessesViewProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentTab: BusinessesTab;
}

export default function BusinessesView({ onDraftAiSuggestion, showAlert, currentTab }: BusinessesViewProps) {
  const me = useMe();
  const isPlatformSuperAdmin = Boolean(me.data?.data?.user?.isPlatformSuperAdmin);
  const businessesQuery = useBusinesses();
  const createBiz = useCreateBusiness();
  const updateBiz = useUpdateBusiness();
  const deleteBiz = useDeleteBusiness();
  const upsertAttendance = useUpsertAttendanceSettings();
  const plansQuery = usePlans();
  const sectorFocusesQuery = useSectorFocuses();

  const plans = plansQuery.data?.data?.plans || [];
  const sectorFocuses = sectorFocusesQuery.data?.data?.sectorFocuses || [];
  const sectorMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const sf of sectorFocuses) m.set(sf.id, sf.name);
    return m;
  }, [sectorFocuses]);

  const businesses: ViewBusiness[] = (businessesQuery.data?.data?.businesses || [])
    .map(toViewBusiness)
    .map((b) => ({ ...b, sector: b.sectorFocusId ? (sectorMap.get(b.sectorFocusId) || 'Ã¢â‚¬â€') : 'Ã¢â‚¬â€' }));

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<ViewBusiness | null>(null);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminBusiness, setAdminBusiness] = useState<ViewBusiness | null>(null);
  const [modulesModalOpen, setModulesModalOpen] = useState(false);
  const [modulesBusiness, setModulesBusiness] = useState<ViewBusiness | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const createAdmin = useCreateBusinessAdmin(adminBusiness?.id || 'missing');

  // Business profile form state. Edit mode is hydrated from the selected business.
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Suspended'>('Active');
  const [formPlanId, setFormPlanId] = useState('');
  const [formSectorFocusId, setFormSectorFocusId] = useState('');
  const [businessModalSection, setBusinessModalSection] = useState<'business' | 'attendance'>('business');

  const defaultAttendanceDraft: BusinessAttendanceSettingsDraft = React.useMemo(
    () => ({
      attendanceEnabled: false,
      locationName: '',
      address: '',
      latitude: null,
      longitude: null,
      allowedRadiusMeters: 100,
      timezone: 'UTC',
      expectedDailyMinutes: 480,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      lateGracePeriodMinutes: 0,
      lateNoReasonPenaltyGraceMinutes: 0,
      lunchBreakEnabled: true,
      lunchMode: 'FLEXIBLE',
      fixedLunchStartTime: '12:00',
      fixedLunchEndTime: '13:00',
      allowMultipleLunchBreaks: false,
      saturdayWorkMode: 'PAID_DAY_OFF',
      sundayWorkMode: 'PAID_DAY_OFF',
    }),
    []
  );

  const [attendanceDraft, setAttendanceDraft] = useState<BusinessAttendanceSettingsDraft>(defaultAttendanceDraft);
  const [attendanceValid, setAttendanceValid] = useState(true);

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Inline error states for modals (toast is hidden behind modal backdrop)
  const [formError, setFormError] = useState('');
  const [adminError, setAdminError] = useState('');

  const openCreateModal = () => {
    if (!isPlatformSuperAdmin) return;
    setEditingBusiness(null);
    setFormName('');
    setFormEmail('');
    setFormDomain('');
    setFormPhone('');
    setFormStatus('Active');
    setFormPlanId('');
    setFormSectorFocusId('');
    setFormError('');
    setAttendanceDraft(defaultAttendanceDraft);
    setAttendanceValid(true);
    setBusinessModalSection('business');
    setIsModalOpen(true);
  };

  const openEditModal = (biz: ViewBusiness) => {
    if (!isPlatformSuperAdmin) return;
    setEditingBusiness(biz);
    setFormName(biz.name || '');
    setFormEmail(biz.email || '');
    setFormDomain(biz.slug || biz.domain || '');
    setFormPhone(biz.phone || '');
    setFormStatus(biz.statusLabel);
    setFormPlanId(biz.planId || '');
    setFormSectorFocusId(biz.sectorFocusId || '');
    setFormError('');
    setAttendanceDraft(defaultAttendanceDraft);
    setAttendanceValid(true);
    setBusinessModalSection('business');
    setIsModalOpen(true);
  };

  const attendanceSettingsQuery = useAttendanceSettings(editingBusiness?.id || null, isModalOpen && Boolean(editingBusiness));
  React.useEffect(() => {
    if (!editingBusiness) return;
    const s = attendanceSettingsQuery.data?.data?.attendanceSettings as BusinessAttendanceSettings | undefined;
    if (!s) return;
    setAttendanceDraft({
      attendanceEnabled: Boolean(s.attendanceEnabled),
      locationName: s.locationName || '',
      address: s.address || '',
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      allowedRadiusMeters: s.allowedRadiusMeters ?? 100,
      timezone: s.timezone || 'UTC',
      expectedDailyMinutes: s.expectedDailyMinutes ?? 480,
      defaultStartTime: s.defaultStartTime || '09:00',
      defaultEndTime: s.defaultEndTime || '17:00',
      lateGracePeriodMinutes: s.lateGracePeriodMinutes ?? 0,
      lateNoReasonPenaltyGraceMinutes: s.lateNoReasonPenaltyGraceMinutes ?? 0,
      lunchBreakEnabled: s.lunchBreakEnabled ?? true,
      lunchMode: (s.lunchMode as any) || 'FLEXIBLE',
      fixedLunchStartTime: s.fixedLunchStartTime || '12:00',
      fixedLunchEndTime: s.fixedLunchEndTime || '13:00',
      allowMultipleLunchBreaks: s.allowMultipleLunchBreaks ?? false,
      saturdayWorkMode: s.saturdayWorkMode || 'PAID_DAY_OFF',
      sundayWorkMode: s.sundayWorkMode || 'PAID_DAY_OFF',
    });
  }, [editingBusiness?.id, attendanceSettingsQuery.data?.data?.attendanceSettings?.id]);

  const openAdminModal = (biz: ViewBusiness) => {
    if (!isPlatformSuperAdmin) return;
    setAdminBusiness(biz);
    setAdminName('');
    setAdminEmail('');
    setAdminPhone('');
    setAdminPassword('');
    setAdminError('');
    setAdminModalOpen(true);
  };

  const openModulesModal = (biz: ViewBusiness) => {
    if (!isPlatformSuperAdmin) return;
    setModulesBusiness(biz);
    setModulesModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isPlatformSuperAdmin) return;
    try {
      await deleteBiz.mutateAsync(id);
      setDeleteTarget(null);
      showAlert(`Business "${name}" and all associated data permanently deleted.`, 'success');
    } catch (e: any) {
      showAlert(getMutationError(e) || 'Failed to delete business', 'error');
    }
  };

  const getMutationError = (err: any): string => {
    const res = err?.response?.data;
    if (res) {
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((e: any) => e.message).join(' â€¢ ');
      }
      if (res.message) return res.message;
    }
    return err?.message || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isPlatformSuperAdmin) return;
    if (!formName.trim() || !formEmail.trim() || !formDomain.trim()) {
      setBusinessModalSection('business');
      setFormError('Business name, email, and workspace slug are required.');
      return;
    }
    if (!editingBusiness && !formPlanId) {
      setBusinessModalSection('business');
      setFormError('Select a plan before creating the business.');
      return;
    }

    const shouldSaveAttendance = !editingBusiness || !attendanceSettingsQuery.isError;
    if (shouldSaveAttendance) {
      const attendanceErrors = validateAttendanceSettings(attendanceDraft);
      if (Object.keys(attendanceErrors).length > 0 || !attendanceValid) {
        setBusinessModalSection('attendance');
        setFormError('Please fix the attendance settings before saving.');
        return;
      }
    }

    const attendancePayload = {
      attendanceEnabled: attendanceDraft.attendanceEnabled,
      locationName: attendanceDraft.locationName || null,
      address: attendanceDraft.address || null,
      latitude: attendanceDraft.latitude,
      longitude: attendanceDraft.longitude,
      allowedRadiusMeters: attendanceDraft.allowedRadiusMeters ?? undefined,
      timezone: attendanceDraft.timezone,
      expectedDailyMinutes: attendanceDraft.expectedDailyMinutes ?? undefined,
      defaultStartTime: attendanceDraft.defaultStartTime,
      defaultEndTime: attendanceDraft.defaultEndTime,
      lateGracePeriodMinutes: attendanceDraft.lateGracePeriodMinutes ?? undefined,
      lateNoReasonPenaltyGraceMinutes: attendanceDraft.lateNoReasonPenaltyGraceMinutes ?? undefined,
      lunchBreakEnabled: attendanceDraft.lunchBreakEnabled,
      lunchMode: attendanceDraft.lunchMode,
      fixedLunchStartTime: attendanceDraft.lunchMode === "FIXED" ? attendanceDraft.fixedLunchStartTime : null,
      fixedLunchEndTime: attendanceDraft.lunchMode === "FIXED" ? attendanceDraft.fixedLunchEndTime : null,
      allowMultipleLunchBreaks: attendanceDraft.allowMultipleLunchBreaks,
      saturdayWorkMode: attendanceDraft.saturdayWorkMode || "PAID_DAY_OFF",
      sundayWorkMode: attendanceDraft.sundayWorkMode || "PAID_DAY_OFF",
    };

    try {
      if (editingBusiness) {
        await updateBiz.mutateAsync({
          businessId: editingBusiness.id,
          data: {
            name: formName,
            slug: formDomain,
            email: formEmail,
            phone: formPhone.trim() || null,
            ...(formPlanId ? { planId: formPlanId } : {}),
            sectorFocusId: formSectorFocusId || null,
            status: formStatus === 'Active' ? 'active' : 'inactive'
          }
        });
        if (!attendanceSettingsQuery.isError) {
          await upsertAttendance.mutateAsync({ businessId: editingBusiness.id, data: attendancePayload });
        }
        showAlert(`Successfully configured "${formName}" parameters!`, 'success');
      } else {
        const created = await createBiz.mutateAsync({
          name: formName,
          slug: formDomain,
          email: formEmail,
          phone: formPhone.trim() || 'n/a',
          planId: formPlanId,
          sectorFocusId: formSectorFocusId || null
        });
        const newBusinessId = (created as any)?.data?.business?.id as string | undefined;
        if (newBusinessId) {
          await upsertAttendance.mutateAsync({ businessId: newBusinessId, data: attendancePayload });
        }
        showAlert(`Registered new system-wide business tenant: ${formName}!`, 'success');
      }
      setIsModalOpen(false);
    } catch (e: any) {
      setFormError(getMutationError(e) || 'Save failed. Please try again.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!isPlatformSuperAdmin || !adminBusiness) return;
    try {
      await createAdmin.mutateAsync({ fullName: adminName, email: adminEmail, phone: adminPhone || null, password: adminPassword });
      showAlert(`Business Admin created for ${adminBusiness.name}`, 'success');
      setAdminModalOpen(false);
    } catch (e: any) {
      setAdminError(getMutationError(e) || 'Failed to create admin. Please try again.');
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSectorBadgeColor = (sector: string) => {
    const s = sector.toLowerCase();
    if (s.includes('tech') || s.includes('soft')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    if (s.includes('health') || s.includes('med')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s.includes('finance') || s.includes('bank')) return 'bg-sky-50 text-sky-600 border-sky-100';
    if (s.includes('logistics') || s.includes('ship')) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  if (currentTab === 'plans') return <PlansTab showAlert={showAlert} />;
  if (currentTab === 'sector_focus') return <SectorFocusTab showAlert={showAlert} />;
  if (currentTab === 'smtp_providers') return <SmtpProvidersTab showAlert={showAlert} />;
  if (currentTab === 'audit_logs') return <AuditLogsTab showAlert={showAlert} />;
  if (currentTab === 'notifications') return <NotificationsTab showAlert={showAlert} />;
  if (currentTab === 'integrations') return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-50 border border-blue-100 text-[#1a56db] text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">Integrations</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">External Integrations</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Configure third-party API connections used across the platform.</p>
      </div>
      <TelegramAttendanceIntegrationsPanel showAlert={showAlert} />
      <HolidayImportPanel showAlert={showAlert} />
    </div>
  );
  if (currentTab === 'security') return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1"><span className="bg-blue-50 border border-blue-100 text-[#1a56db] text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">Security & Access</span></div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Security Configuration</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Manage authentication, registration windows, and access controls.</p>
      </div>
      <PublicRegistrationConfigPanel showAlert={showAlert} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="bg-blue-50 border border-blue-100 text-[#1a56db] text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">Super Admin Control Plane</span></div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Businesses Directory</h1>
          <p className="text-xs text-slate-450 font-medium">Deploy, monitor, modify and audit corporate multi-tenant spaces within Blih CORE.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => onDraftAiSuggestion("Draft a multi-tenant business consolidation blueprint outlining access controls for super admins.")} className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100/70 text-blue-700 hover:text-blue-800 transition-colors px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"><Sparkles className="w-3.5 h-3.5" /><span>Generate Setup Guideline</span></button>
          <button onClick={openCreateModal} disabled={!isPlatformSuperAdmin} className="flex items-center gap-1.5 bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white transition-all hover:shadow-md px-4 py-2 rounded-xl text-xs cursor-pointer select-none"><Plus className="w-4 h-4" /><span>Register Business</span></button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registered Enterprises', val: businesses.length, desc: 'Across Blih Cluster', icon: Building2, color: 'text-blue-600' },
          { label: 'Active Domains', val: businesses.filter(b => b.statusLabel === 'Active').length, desc: 'SSO routing enabled', icon: Globe, color: 'text-emerald-650' },
          { label: 'Combined Workforce', val: businesses.reduce((acc, current) => acc + current.employeeCount, 0).toLocaleString(), desc: 'Employees consolidated', icon: Users, color: 'text-violet-650' },
          { label: 'Active Licensing', val: 'A Grade Cluster', desc: 'Secure cloud instance', icon: Layers, color: 'text-amber-600' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-[0_5px_15px_rgba(0,0,0,0.01)] hover:-translate-y-0.5 transition-transform"><div className="space-y-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span><div className="text-lg font-black text-slate-900 leading-none">{kpi.val}</div><span className="text-[10.5px] text-slate-400 font-medium block">{kpi.desc}</span></div><div className={`p-2 bg-slate-50 rounded-xl ${kpi.color}`}><kpi.icon className="w-5 h-5" /></div></div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_5px_22px_rgba(0,0,0,0.01)]">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Search by corporate name, legal register, sector or domain..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 hover:bg-slate-100/40 focus:bg-white px-9 py-2.5 border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all" /></div>
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><span>Displaying {filteredBusinesses.length} of {businesses.length} records</span></div>
        </div>

        {businessesQuery.isLoading ? (
          <div className="py-20 text-center space-y-3"><Building className="w-12 h-12 text-slate-300 mx-auto" /><h4 className="text-sm font-semibold text-slate-700">Loading businesses</h4><p className="text-xs text-slate-400 max-w-xs mx-auto">Fetching the latest tenants list.</p></div>
        ) : businessesQuery.isError ? (
          <div className="py-20 text-center space-y-3"><ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" /><h4 className="text-sm font-semibold text-slate-700">Failed to load businesses</h4><p className="text-xs text-slate-400 max-w-md mx-auto">{(businessesQuery.error as any)?.response?.data?.message || (businessesQuery.error as any)?.message || 'Request failed'}</p></div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="py-20 text-center space-y-3"><Building className="w-12 h-12 text-slate-300 mx-auto" /><h4 className="text-sm font-semibold text-slate-700">No Enterprise tenants found</h4><p className="text-xs text-slate-400 max-w-xs mx-auto">None of the configured companies match your search parameters. Try adjusting filters.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 select-none"><th className="py-3 px-6">Company / Legal Entity</th><th className="py-3 px-4">Cluster Sector</th><th className="py-3 px-4">Infrastructure Domain</th><th className="py-3 px-4 text-center">Workforce Scale</th><th className="py-3 px-4">Plan</th><th className="py-3 px-4">Gateway Status</th><th className="py-3 px-6 text-right">Administrative Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredBusinesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4.5 px-6"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100 flex-shrink-0 shadow-inner">{biz.name.slice(0, 2).toUpperCase()}</div><div><span className="font-extrabold text-slate-900 block tracking-tight leading-snug">{biz.name}</span><span className="text-[10.5px] text-slate-450 block font-medium mt-0.5">{biz.legalName}</span></div></div></td>
                    <td className="py-4.5 px-4 font-semibold"><span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${getSectorBadgeColor(biz.sector)}`}>{biz.sector}</span></td>
                    <td className="py-4.5 px-4 font-mono font-bold text-slate-500"><div className="flex items-center gap-1 hover:text-[#1a56db] transition-all"><Globe className="w-3.5 h-3.5 text-slate-400" /><span>{biz.domain}</span></div></td>
                    <td className="py-4.5 px-4 text-center font-bold text-slate-700"><span>{biz.employeeCount} active</span></td>
                    <td className="py-4.5 px-4"><div className="space-y-0.5"><span className="font-bold block text-[11px] text-slate-800">{biz.planId ? (plans.find((p) => p.id === biz.planId)?.name || 'Ã¢â‚¬â€') : 'Ã¢â‚¬â€'}</span><span className="text-[10px] text-slate-400 font-medium block">Since {biz.established}</span></div></td>
                    <td className="py-4.5 px-4"><div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${biz.statusLabel === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} /><span className={`font-bold uppercase tracking-wider text-[10px] ${biz.statusLabel === 'Active' ? 'text-emerald-700' : 'text-red-650'}`}>{biz.statusLabel}</span></div></td>
                    <td className="py-4.5 px-6 text-right"><div className="flex items-center gap-1.5 justify-end"><button onClick={() => openModulesModal(biz)} disabled={!isPlatformSuperAdmin} title="Manage Active Modules (Brain, Policy, HR, CRM, etc.)" className="p-1 px-2.5 hover:bg-emerald-50 disabled:hover:bg-transparent disabled:text-slate-300 text-slate-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"><Layers className="w-3.5 h-3.5" /></button><button onClick={() => openAdminModal(biz)} disabled={!isPlatformSuperAdmin} title="Create Business Admin" className="p-1 px-2.5 hover:bg-blue-50 disabled:hover:bg-transparent disabled:text-slate-300 text-slate-500 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"><Users className="w-3.5 h-3.5" /></button><button onClick={() => openEditModal(biz)} title="Modify Configurations" disabled={!isPlatformSuperAdmin} className="p-1 px-2.5 hover:bg-slate-100 disabled:hover:bg-transparent disabled:text-slate-300 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => setDeleteTarget({ id: biz.id, name: biz.name })} title="Terminate Instance" disabled={!isPlatformSuperAdmin} className="p-1 px-2.5 hover:bg-rose-50 disabled:hover:bg-transparent disabled:text-slate-300 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} className="relative z-20 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
                <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Building2 className="h-5 w-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">{editingBusiness ? 'Update Business Profile' : 'Create Business Profile'}</h2>{editingBusiness && <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">Current values loaded</span>}</div><p className="mt-1 text-xs font-medium text-slate-500">{editingBusiness ? 'Review and update the saved business and attendance settings.' : 'Configure the business account and attendance defaults.'}</p></div></div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700" aria-label="Close business profile modal"><X className="h-5 w-5" /></button>
              </header>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                  <aside className="border-b border-slate-100 bg-slate-50/60 p-4 md:w-60 md:shrink-0 md:border-b-0 md:border-r md:p-5">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                      <button type="button" onClick={() => setBusinessModalSection('business')} className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${businessModalSection === 'business' ? 'border-blue-200 bg-white text-blue-700 shadow-sm' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${businessModalSection === 'business' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><Building2 className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-black">Business</span><span className="mt-0.5 hidden text-[10px] font-medium text-slate-400 md:block">Identity, contact and plan</span></span></button>
                      <button type="button" onClick={() => setBusinessModalSection('attendance')} className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${businessModalSection === 'attendance' ? 'border-blue-200 bg-white text-blue-700 shadow-sm' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${businessModalSection === 'attendance' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><Clock3 className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-black">Attendance</span><span className="mt-0.5 hidden text-[10px] font-medium text-slate-400 md:block">Schedule and location rules</span></span></button>
                    </div>
                  </aside>

                  <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 sm:p-6 md:p-8">
                    {formError && <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-red-700"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span className="text-xs font-semibold leading-5">{formError}</span></div>}
                    {businessModalSection === 'business' ? (
                      <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-3"><h3 className="text-sm font-semibold text-slate-900">Business information</h3><p className="mt-1 text-xs text-slate-500">Only fields stored by the business API are shown here.</p></div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Business name</span><input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Apex Biotech" className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10" /></label>
                          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Workspace slug</span><input type="text" required value={formDomain} onChange={(e) => setFormDomain(e.target.value)} placeholder="e.g. apex-biotech" className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10" /></label>
                          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contact email</span><input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="billing@company.com" className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10" /></label>
                          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contact phone</span><input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+251 ..." className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10" /></label>
                          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Plan</span><select required={!editingBusiness} value={formPlanId} onChange={(e) => setFormPlanId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"><option value="">{editingBusiness ? 'No plan assigned' : 'Select plan...'}</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.key})</option>)}</select></label>
                          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sector focus</span><select value={formSectorFocusId} onChange={(e) => setFormSectorFocusId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"><option value="">None</option>{sectorFocuses.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></label>
                          {editingBusiness && <label className="space-y-1.5 sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Business status</span><select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Suspended')} className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 sm:max-w-xs"><option value="Active">Active</option><option value="Suspended">Suspended</option></select></label>}
                        </div>
                        {editingBusiness && <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4"><p className="text-xs font-black text-blue-900">Editing saved business data</p><p className="mt-1 text-[11px] leading-5 text-blue-700/80">Name, slug, email, phone, plan, sector and status were loaded from the selected business. Attendance values are loaded from its saved attendance settings.</p></div>}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3"><h3 className="text-sm font-semibold text-slate-900">Attendance configuration</h3><p className="mt-1 text-xs text-slate-500">Location, schedule, lunch and weekend rules for this business.</p></div>
                        {editingBusiness && attendanceSettingsQuery.isLoading ? <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center"><div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" /><p className="mt-3 text-xs font-semibold text-slate-500">Loading saved attendance settings...</p></div> : editingBusiness && attendanceSettingsQuery.isError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black text-amber-900">Attendance settings could not be loaded</p><p className="mt-1 text-[11px] leading-5 text-amber-700">Business details can still be updated. Attendance settings will be left unchanged.</p></div> : <AttendanceSettingsForm value={attendanceDraft} onChange={setAttendanceDraft} onValidityChange={setAttendanceValid} />}
                      </div>
                    )}
                  </main>
                </div>
                <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-[10px] font-medium text-slate-400">{editingBusiness ? `Editing ${editingBusiness.name}` : 'New business configuration'}</div><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-200">Cancel</button><button type="submit" disabled={createBiz.isPending || updateBiz.isPending || upsertAttendance.isPending || (businessModalSection === 'attendance' && !attendanceValid)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{createBiz.isPending || updateBiz.isPending || upsertAttendance.isPending ? 'Saving...' : editingBusiness ? 'Save Changes' : 'Create Business'}</button></div></footer>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adminModalOpen && adminBusiness && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="absolute inset-0" onClick={() => setAdminModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-15 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100"><div><h4 className="text-[13px] font-bold text-slate-900">Create Business Admin</h4><div className="text-[10.5px] text-slate-500 font-medium mt-0.5">{adminBusiness.name} ({adminBusiness.slug})</div></div><button onClick={() => setAdminModalOpen(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer"><ChevronRight className="w-4 h-4 rotate-90" /></button></div>
              {!isPlatformSuperAdmin ? <div className="text-xs text-slate-600">Not authorized.</div> : (
                <form onSubmit={handleCreateAdmin} className="space-y-3">
                  {adminError && <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5"><svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span className="text-xs font-semibold leading-snug">{adminError}</span></div>}
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label><input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label><input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all" /></div></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone (optional)</label><input value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label><input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all" /></div></div>
                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-100"><button type="button" onClick={() => setAdminModalOpen(false)} className="px-4 text-slate-500 font-bold hover:bg-slate-50 leading-none py-2.5 rounded-xl text-xs cursor-pointer">Cancel</button><button type="submit" disabled={createAdmin.isPending} className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white shadow-sm leading-none py-2.5 px-5 rounded-xl text-xs cursor-pointer select-none">{createAdmin.isPending ? 'Creating...' : 'Create Admin'}</button></div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && handleDelete(deleteTarget.id, deleteTarget.name)} title="Permanently Delete Business" description={deleteTarget ? `You are about to permanently delete "${deleteTarget.name}" and all associated users, HR records, recruitment, finance, files, notifications, and audit logs. This action is irreversible.` : undefined} confirmLabel="Delete Permanently" variant="destructive" loading={deleteBiz.isPending} />
      <BusinessModulesModal business={modulesBusiness} isOpen={modulesModalOpen} onClose={() => setModulesModalOpen(false)} showAlert={showAlert} />
    </div>
  );
}

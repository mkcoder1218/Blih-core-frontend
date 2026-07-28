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
  Building
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

  // Form states
  const [formName, setFormName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Suspended'>('Active');
  const [formEmployeeCount, setFormEmployeeCount] = useState(1);
  const [formPlanId, setFormPlanId] = useState('');
  const [formSectorFocusId, setFormSectorFocusId] = useState('');
  const [modalStep, setModalStep] = useState<0 | 1 | 2>(0);

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
    setFormLegalName('');
    setFormEmail('');
    setFormDomain('');
    setFormLocation('');
    setFormStatus('Active');
    setFormEmployeeCount(10);
    setFormPlanId('');
    setFormSectorFocusId('');
    setFormError('');
    setAttendanceDraft(defaultAttendanceDraft);
    setAttendanceValid(true);
    setModalStep(0);
    setIsModalOpen(true);
  };

  const openEditModal = (biz: ViewBusiness) => {
    if (!isPlatformSuperAdmin) return;
    setEditingBusiness(biz);
    setFormName(biz.name);
    setFormLegalName(biz.legalName);
    setFormEmail(biz.email || '');
    setFormDomain(biz.domain);
    setFormLocation(biz.location);
    setFormStatus(biz.statusLabel);
    setFormEmployeeCount(biz.employeeCount);
    setFormPlanId(biz.planId || '');
    setFormSectorFocusId(biz.sectorFocusId || '');
    setFormError('');
    setAttendanceDraft(defaultAttendanceDraft);
    setAttendanceValid(true);
    setModalStep(0);
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
      // If data is an array of validation errors, join them
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
    if (!formName || !formEmail || !formDomain || !formPlanId) {
      setFormError('Please fill in all required fields: name, email, domain/slug, and plan.');
      return;
    }

    const attendanceErrors = validateAttendanceSettings(attendanceDraft);
    if (Object.keys(attendanceErrors).length > 0 || !attendanceValid) {
      setFormError('Please fix the Attendance Configuration section before saving.');
      return;
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
            phone: formLocation || editingBusiness.phone || null,
            planId: formPlanId,
            sectorFocusId: formSectorFocusId || null,
            status: formStatus === 'Active' ? 'active' : 'inactive'
          }
        });
        await upsertAttendance.mutateAsync({ businessId: editingBusiness.id, data: attendancePayload });
        showAlert(`Successfully configured "${formName}" parameters!`, 'success');
      } else {
        const created = await createBiz.mutateAsync({
          name: formName,
          slug: formDomain,
          email: formEmail,
          phone: formLocation || 'n/a',
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
          <span className="bg-blue-50 border border-blue-100 text-[#1a56db] text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
            Integrations
          </span>
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
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-50 border border-blue-100 text-[#1a56db] text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
            Security & Access
          </span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Security Configuration</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Manage authentication, registration windows, and access controls.</p>
      </div>
      <PublicRegistrationConfigPanel showAlert={showAlert} />
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Block with Statistics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 border border-blue-100 text-[#1a56db] text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
              Super Admin Control Plane
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">
            Businesses Directory
          </h1>
          <p className="text-xs text-slate-450 font-medium">
            Deploy, monitor, modify and audit corporate multi-tenant spaces within Blih CORE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => onDraftAiSuggestion("Draft a multi-tenant business consolidation blueprint outlining access controls for super admins.")}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100/70 text-blue-700 hover:text-blue-800 transition-colors px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Setup Guideline</span>
          </button>
          
          <button 
            onClick={openCreateModal}
            disabled={!isPlatformSuperAdmin}
            className="flex items-center gap-1.5 bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white transition-all hover:shadow-md px-4 py-2 rounded-xl text-xs cursor-pointer select-none"
          >
            <Plus className="w-4 h-4" />
            <span>Register Business</span>
          </button>
        </div>
      </div>

      {/* Grid of Micro KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registered Enterprises', val: businesses.length, desc: 'Across Blih Cluster', icon: Building2, color: 'text-blue-600' },
          { label: 'Active Domains', val: businesses.filter(b => b.statusLabel === 'Active').length, desc: 'SSO routing enabled', icon: Globe, color: 'text-emerald-650' },
          { label: 'Combined Workforce', val: businesses.reduce((acc, current) => acc + current.employeeCount, 0).toLocaleString(), desc: 'Employees consolidated', icon: Users, color: 'text-violet-650' },
          { label: 'Active Licensing', val: 'A Grade Cluster', desc: 'Secure cloud instance', icon: Layers, color: 'text-amber-600' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-[0_5px_15px_rgba(0,0,0,0.01)] hover:-translate-y-0.5 transition-transform">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <div className="text-lg font-black text-slate-900 leading-none">{kpi.val}</div>
              <span className="text-[10.5px] text-slate-400 font-medium block">{kpi.desc}</span>
            </div>
            <div className={`p-2 bg-slate-50 rounded-xl ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Tenant List panel */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_5px_22px_rgba(0,0,0,0.01)]">
        
        {/* Sub-header controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by corporate name, legal register, sector or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/40 focus:bg-white px-9 py-2.5 border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all"
            />
          </div>

          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <span>Displaying {filteredBusinesses.length} of {businesses.length} records</span>
          </div>
        </div>

        {/* List View Table */}
        {businessesQuery.isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Building className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">Loading businesses</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Fetching the latest tenants list.</p>
          </div>
        ) : businessesQuery.isError ? (
          <div className="py-20 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">Failed to load businesses</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {(businessesQuery.error as any)?.response?.data?.message || (businessesQuery.error as any)?.message || 'Request failed'}
            </p>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Building className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">No Enterprise tenants found</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">None of the configured companies match your search parameters. Try adjusting filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 select-none">
                  <th className="py-3 px-6">Company / Legal Entity</th>
                  <th className="py-3 px-4">Cluster Sector</th>
                  <th className="py-3 px-4">Infrastructure Domain</th>
                  <th className="py-3 px-4 text-center">Workforce Scale</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Gateway Status</th>
                  <th className="py-3 px-6 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredBusinesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100 flex-shrink-0 shadow-inner">
                          {biz.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block tracking-tight leading-snug">{biz.name}</span>
                          <span className="text-[10.5px] text-slate-450 block font-medium mt-0.5">{biz.legalName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-4 font-semibold">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${getSectorBadgeColor(biz.sector)}`}>
                        {biz.sector}
                      </span>
                    </td>

                    <td className="py-4.5 px-4 font-mono font-bold text-slate-500">
                      <div className="flex items-center gap-1 hover:text-[#1a56db] transition-all">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{biz.domain}</span>
                      </div>
                    </td>

                    <td className="py-4.5 px-4 text-center font-bold text-slate-700">
                      <span>{biz.employeeCount} active</span>
                    </td>

                    <td className="py-4.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold block text-[11px] text-slate-800">
                          {biz.planId ? (plans.find((p) => p.id === biz.planId)?.name || 'Ã¢â‚¬â€') : 'Ã¢â‚¬â€'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">Since {biz.established}</span>
                      </div>
                    </td>

                    <td className="py-4.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          biz.statusLabel === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'
                        }`} />
                        <span className={`font-bold uppercase tracking-wider text-[10px] ${
                          biz.statusLabel === 'Active' ? 'text-emerald-700' : 'text-red-650'
                        }`}>
                          {biz.statusLabel}
                        </span>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openModulesModal(biz)}
                          disabled={!isPlatformSuperAdmin}
                          title="Manage Active Modules (Brain, Policy, HR, CRM, etc.)"
                          className="p-1 px-2.5 hover:bg-emerald-50 disabled:hover:bg-transparent disabled:text-slate-300 text-slate-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openAdminModal(biz)}
                          disabled={!isPlatformSuperAdmin}
                          title="Create Business Admin"
                          className="p-1 px-2.5 hover:bg-blue-50 disabled:hover:bg-transparent disabled:text-slate-300 text-slate-500 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(biz)}
                          title="Modify Configurations"
                          disabled={!isPlatformSuperAdmin}
                          className="p-1 px-2.5 hover:bg-slate-100 disabled:hover:bg-transparent disabled:text-slate-300 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: biz.id, name: biz.name })}
                          title="Terminate Instance"
                          disabled={!isPlatformSuperAdmin}
                          className="p-1 px-2.5 hover:bg-rose-50 disabled:hover:bg-transparent disabled:text-slate-300 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- BUSINESS PARAMETERS MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/50 z-20 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-secondary-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1a56db] flex items-center justify-center">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-black text-slate-900 leading-tight">
                      {editingBusiness ? 'Customize Business Configurations' : 'Register New Tenancy Instance'}
                    </h4>
                    <span className="text-[10px] text-slate-450 block font-medium mt-0.5">Parameters map cleanly to secure routing layers</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Inline error banner */}
                {formError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="text-xs font-semibold leading-snug">{formError}</span>
                  </div>
                )}

                {/* Stepper */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setModalStep(step as 0 | 1 | 2)}
                        className={[
                          "h-7 px-2.5 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer",
                          modalStep === step ? "bg-blue-50 border-blue-200 text-[#1a56db]" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {step === 0 ? "Business" : step === 1 ? "Attendance" : "Review"}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500">Step {modalStep + 1} of 3</div>
                </div>

                {/* Panels (kept mounted so required inputs still validate on final submit) */}
                <div className="max-h-[62vh] overflow-y-auto pr-1 space-y-4">
                  <div className={modalStep === 0 ? "space-y-4" : "hidden space-y-4"}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commercial Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Apex Biotech"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Legal Registered Entity</label>
                    <input
                      type="text"
                      required
                      value={formLegalName}
                      onChange={(e) => setFormLegalName(e.target.value)}
                      placeholder="e.g. Apex Biotech Solutions LLC"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commercial Domain</label>
                    <input
                      type="text"
                      required
                      value={formDomain}
                      onChange={(e) => setFormDomain(e.target.value)}
                      placeholder="e.g. apex-biotech.com"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Principal Workspace Contact</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. billing@apex-biotech.com"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Headquarters / Location (optional)</label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Tokyo, JP"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plan</label>
                    <select
                      required
                      value={formPlanId}
                      onChange={(e) => setFormPlanId(e.target.value)}
                      className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] font-semibold text-xs text-slate-700 cursor-pointer"
                    >
                      <option value="">Select plan...</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.key})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sector Focus (optional)</label>
                    <select
                      value={formSectorFocusId}
                      onChange={(e) => setFormSectorFocusId(e.target.value)}
                      className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] font-semibold text-xs text-slate-700 cursor-pointer"
                    >
                      <option value="">None</option>
                      {sectorFocuses.map((sf) => (
                        <option key={sf.id} value={sf.id}>
                          {sf.name} ({sf.key})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                  </div>

                  <div className={modalStep === 1 ? "space-y-4" : "hidden space-y-4"}>
                {editingBusiness && attendanceSettingsQuery.isLoading ? (
                  <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-800">Attendance configuration</div>
                    <div className="text-[11px] text-slate-600 mt-1">Loading current settings…</div>
                  </div>
                ) : editingBusiness && attendanceSettingsQuery.isError ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-red-800">Attendance configuration</div>
                    <div className="text-[11px] text-red-700 mt-1">Failed to load attendance settings. You can still update business details.</div>
                  </div>
                ) : (
                  <AttendanceSettingsForm value={attendanceDraft} onChange={setAttendanceDraft} onValidityChange={setAttendanceValid} />
                )}

                  </div>

                  <div className={modalStep === 2 ? "space-y-4" : "hidden space-y-4"}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Routing Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] font-semibold text-xs text-slate-700 cursor-pointer"
                    >
                      <option value="Active">Active Route</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starting Directory Scale</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10000}
                      value={formEmployeeCount}
                      onChange={(e) => setFormEmployeeCount(Number(e.target.value))}
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all"
                    />
                  </div>
                </div>

                  <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-800">Review</div>
                    <div className="text-[11px] text-slate-600 mt-1">Confirm details, then save.</div>
                  </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 text-slate-500 font-bold hover:bg-slate-50 leading-none py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Discard Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1 | 2)))}
                    disabled={modalStep === 0}
                    className="px-4 text-slate-500 font-bold hover:bg-slate-50 disabled:hover:bg-transparent disabled:text-slate-300 leading-none py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Back
                  </button>

                  {modalStep < 2 ? (
                    <button
                      type="button"
                      onClick={() => setModalStep((s) => (s === 2 ? 2 : ((s + 1) as 0 | 1 | 2)))}
                      disabled={modalStep === 1 && !attendanceValid}
                      className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-500 font-bold text-white shadow-sm leading-none py-2.5 px-5 rounded-xl text-xs cursor-pointer select-none"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-[#1a56db] hover:bg-[#124bbf] font-bold text-white shadow-sm leading-none py-2.5 px-5 rounded-xl text-xs cursor-pointer select-none"
                    >
                      {editingBusiness ? 'Apply Config Parameters' : 'Deploy Tenant Instance'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BUSINESS ADMIN USER MODAL --- */}
      <AnimatePresence>
        {adminModalOpen && adminBusiness && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="absolute inset-0" onClick={() => setAdminModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-15 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900">Create Business Admin</h4>
                  <div className="text-[10.5px] text-slate-500 font-medium mt-0.5">{adminBusiness.name} ({adminBusiness.slug})</div>
                </div>
                <button onClick={() => setAdminModalOpen(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
              </div>

              {!isPlatformSuperAdmin ? (
                <div className="text-xs text-slate-600">Not authorized.</div>
              ) : (
                <form onSubmit={handleCreateAdmin} className="space-y-3">
                  {/* Inline error banner */}
                  {adminError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span className="text-xs font-semibold leading-snug">{adminError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                      <input
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone (optional)</label>
                      <input
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAdminModalOpen(false)}
                      className="px-4 text-slate-500 font-bold hover:bg-slate-50 leading-none py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createAdmin.isPending}
                      className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white shadow-sm leading-none py-2.5 px-5 rounded-xl text-xs cursor-pointer select-none"
                    >
                      {createAdmin.isPending ? 'Creating...' : 'Create Admin'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id, deleteTarget.name)}
        title="Permanently Delete Business"
        description={deleteTarget ? `You are about to permanently delete "${deleteTarget.name}" and all associated users, HR records, recruitment, finance, files, notifications, and audit logs. This action is irreversible.` : undefined}
        confirmLabel="Delete Permanently"
        variant="destructive"
        loading={deleteBiz.isPending}
      />

      <BusinessModulesModal
        business={modulesBusiness}
        isOpen={modulesModalOpen}
        onClose={() => setModulesModalOpen(false)}
        showAlert={showAlert}
      />
    </div>
  );
}

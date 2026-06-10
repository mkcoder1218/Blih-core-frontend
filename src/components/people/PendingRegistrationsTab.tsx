/**
 * PendingRegistrationsTab
 * Shown inside the Profiles module for HR to review, approve, or reject
 * self-registered users.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Eye, RefreshCw, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, User, Briefcase, MapPin, CreditCard,
  HeartPulse, Search, Filter, ChevronDown, FileImage, ZoomIn,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  pendingRegistrationsApi,
  REJECTION_TEMPLATES,
  type PendingRegistrant,
} from '../../api/pendingRegistrations';
import {
  PageHeader, StatusBadge, UserAvatar, DataTable, SectionCard,
  ConfirmDialog, FilterBar, InfoAlert, LoadingSpinner, EmptyState,
} from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAge = (dob: string | null) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

// Backend base URL for serving uploaded files
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// ── ID Doc image viewer ───────────────────────────────────────────────────────
function IdDocImage({ url, label }: { url: string; label: string }) {
  const [lightbox, setLightbox] = useState(false);
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  return (
    <>
      <div className="space-y-1.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <div
          className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer"
          style={{ height: 110 }}
          onClick={() => setLightbox(true)}
        >
          <img
            src={fullUrl}
            alt={label}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="w-5 h-5 text-white drop-shadow" />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setLightbox(false)}
        >
          <motion.img
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            src={fullUrl}
            alt={label}
            className="max-w-full max-h-full rounded-2xl shadow-2xl cursor-zoom-out"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-lg font-bold transition-colors"
          >×</button>
        </div>
      )}
    </>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function DetailSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-slate-700 leading-snug">{value || '—'}</p>
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({
  open, onClose, onConfirm, loading, applicantName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, templateMsg: string) => void;
  loading: boolean;
  applicantName: string;
}) {
  const [reason, setReason] = useState('');
  const [templateId, setTemplateId] = useState('');

  const selected = REJECTION_TEMPLATES.find(t => t.id === templateId);

  const handleTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = REJECTION_TEMPLATES.find(t => t.id === id);
    if (tpl) setReason(tpl.message);
  };

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim(), selected?.message || '');
  };

  useEffect(() => {
    if (!open) { setReason(''); setTemplateId(''); }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Reject Registration</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{applicantName}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Use a template</p>
          <Select value={templateId} onValueChange={handleTemplate}>
            <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200">
              <SelectValue placeholder="Select a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              {REJECTION_TEMPLATES.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reason message <span className="text-rose-400">*</span>
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
            placeholder="Explain why this application is being rejected. This message will be sent to the applicant with a link to resubmit."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-400"
          />
          <p className="text-[9px] text-slate-400">The applicant will receive this message via email along with a link to update and resubmit their application.</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="h-8 text-xs px-4 rounded-lg">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
            className="h-8 text-xs px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm shadow-rose-600/20"
          >
            {loading ? 'Sending…' : 'Reject & Notify'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Detail drawer panel ───────────────────────────────────────────────────────
function RegistrantDrawer({
  registrant, onClose, onApprove, onReject, approving, rejecting,
}: {
  registrant: PendingRegistrant;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const p = registrant.personal;
  const age = fmtAge(p.dateOfBirth);

  // Fetch full detail (EmployeeRecord metadata has the ID doc URLs)
  const [detail, setDetail] = useState<any>(null);
  useEffect(() => {
    pendingRegistrationsApi.getOne(registrant.id)
      .then(r => setDetail((r.data as any)?.data?.user ?? (r.data as any)?.user ?? null))
      .catch(() => null);
  }, [registrant.id]);

  const empMeta  = detail?.EmployeeRecord?.metadata ?? detail?.EmployeeRecords?.[0]?.metadata ?? {};
  const frontUrl = empMeta.idDocumentFrontUrl ?? empMeta.idDocumentUrl ?? null;
  const backUrl  = empMeta.idDocumentBackUrl  ?? null;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-none">{registrant.fullName}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{registrant.email}</p>
          </div>
        </div>
        <StatusBadge status={registrant.status} />
      </div>

      {/* Rejection reason banner */}
      {registrant.status === 'rejected' && registrant.rejectionReason && (
        <div className="mx-4 mt-3 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1">Rejection Reason</p>
          <p className="text-xs text-rose-700 leading-relaxed">{registrant.rejectionReason}</p>
          {registrant.rejectedAt && (
            <p className="text-[9px] text-rose-400 mt-1">Rejected on {fmt(registrant.rejectedAt)}</p>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <DetailSection title="Account" icon={User}>
          <DetailRow label="Full Name"  value={registrant.fullName} />
          <DetailRow label="Email"      value={registrant.email} />
          <DetailRow label="Phone"      value={registrant.phone} />
          <DetailRow label="Applied on" value={fmt(registrant.createdAt)} />
        </DetailSection>

        <DetailSection title="Personal" icon={User}>
          <DetailRow label="Date of Birth" value={p.dateOfBirth ? `${fmt(p.dateOfBirth)}${age ? ` (${age}y)` : ''}` : null} />
          <DetailRow label="Gender"        value={p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : null} />
          <DetailRow label="Marital Status" value={p.maritalStatus} />
          <DetailRow label="Nationality"   value={p.nationality} />
        </DetailSection>

        <DetailSection title="Address" icon={MapPin}>
          <DetailRow label="Address"    value={p.address} />
          <DetailRow label="City"       value={p.city} />
          <DetailRow label="Country"    value={p.country} />
          <DetailRow label="Zip / Postal" value={p.zipCode} />
        </DetailSection>

        <DetailSection title="Work" icon={Briefcase}>
          <DetailRow label="Requested Role"   value={registrant.requestedRoleKey?.replace(/_/g, ' ')} />
          <DetailRow label="Employment Type"  value={registrant.employmentType?.replace(/_/g, ' ')} />
          <DetailRow label="Start Date"       value={fmt(registrant.hireDate)} />
          <DetailRow label="Department"       value={registrant.department?.name} />
          <DetailRow label="Position"         value={registrant.position?.title} />
        </DetailSection>

        {/* National ID documents */}
        {(frontUrl || backUrl) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <FileImage className="w-3.5 h-3.5 text-blue-600" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">National ID (Fayda)</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {frontUrl && <IdDocImage url={frontUrl} label="Front side" />}
              {backUrl  && <IdDocImage url={backUrl}  label="Back side" />}
            </div>
          </div>
        )}

        {/* No ID docs uploaded yet */}
        {!frontUrl && !backUrl && detail && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-amber-700">No National ID documents uploaded.</p>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
        <Button
          onClick={onReject}
          disabled={approving || rejecting}
          variant="outline"
          className="flex-1 h-9 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl font-bold"
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" />
          {rejecting ? 'Rejecting…' : 'Reject'}
        </Button>
        <Button
          onClick={onApprove}
          disabled={approving || rejecting}
          className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm shadow-emerald-600/20"
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          {approving ? 'Approving…' : 'Approve'}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PendingRegistrationsTab({ showAlert }: { showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'rejected'>('pending');
  const [search, setSearch]             = useState('');
  const [items, setItems]               = useState<PendingRegistrant[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [loading, setLoading]           = useState(false);
  const [selected, setSelected]         = useState<PendingRegistrant | null>(null);
  const [approveConfirm, setApproveConfirm] = useState(false);
  const [rejectOpen, setRejectOpen]     = useState(false);
  const [approving, setApproving]       = useState(false);
  const [rejecting, setRejecting]       = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await pendingRegistrationsApi.list(statusFilter, p);
      const d = (res.data as any)?.data ?? (res.data as any);
      setItems(d.items ?? []);
      setTotal(d.total ?? 0);
      setPages(d.pages ?? 1);
      setPage(p);
    } catch {
      showAlert('Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(1); }, [load]);

  const filtered = search.trim()
    ? items.filter(i =>
        i.fullName.toLowerCase().includes(search.toLowerCase()) ||
        i.email.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  // Keep a snapshot of the selected item so dialogs don't lose their title
  // when selected is cleared after approve/reject
  const [snapshot, setSnapshot] = useState<PendingRegistrant | null>(null);

  const openDrawer = (row: PendingRegistrant) => {
    setSelected(row);
    setSnapshot(row);
  };

  const handleApprove = async () => {
    if (!snapshot) return;
    setApproving(true);
    try {
      await pendingRegistrationsApi.approve(snapshot.id);
      showAlert(`${snapshot.fullName} has been approved`, 'success');
      setApproveConfirm(false);
      setSelected(null);
      load(page);
    } catch {
      showAlert('Failed to approve', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (reason: string, templateMessage: string) => {
    if (!snapshot) return;
    setRejecting(true);
    try {
      await pendingRegistrationsApi.reject(snapshot.id, reason, templateMessage);
      showAlert(`${snapshot.fullName} has been rejected and notified`, 'success');
      setRejectOpen(false);
      setSelected(null);
      load(page);
    } catch {
      showAlert('Failed to reject', 'error');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="People"
        title="Pending Registrations"
        description="Review self-registered applicants and approve or reject their account requests."
        actions={
          <Button
            variant="outline"
            onClick={() => load(page)}
            className="h-8 text-xs rounded-xl border-slate-200 gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
        filters={[{
          value: statusFilter,
          onChange: v => { setStatusFilter(v as any); setPage(1); },
          placeholder: 'Status',
          options: [
            { value: 'pending',  label: 'Pending Review' },
            { value: 'rejected', label: 'Rejected' },
          ],
        }]}
      />

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-slate-400 font-medium">
          {total} {statusFilter === 'pending' ? 'pending' : 'rejected'} applicant{total !== 1 ? 's' : ''}
        </span>
        {pages > 1 && (
          <span className="text-slate-300">·</span>
        )}
        {pages > 1 && (
          <span className="text-slate-400 font-medium">Page {page} of {pages}</span>
        )}
      </div>

      <DataTable
        columns={['Applicant', 'Role Requested', 'Department', 'Applied On', 'Status', '']}
        rows={filtered}
        loading={loading}
        emptyMessage={
          statusFilter === 'pending'
            ? 'No pending registrations — all caught up!'
            : 'No rejected applications found.'
        }
        renderRow={(row) => (
          <tr
            key={row.id}
            className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors"
            onClick={() => openDrawer(row)}
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={row.fullName} size="sm" />
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-none">{row.fullName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{row.email}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="text-[11px] font-semibold text-slate-600">
                {row.requestedRoleKey?.replace(/_/g, ' ') || '—'}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="text-[11px] text-slate-500">{row.department?.name || '—'}</span>
            </td>
            <td className="px-4 py-3">
              <span className="text-[11px] text-slate-500">{fmt(row.createdAt)}</span>
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={row.status} />
            </td>
            <td className="px-4 py-3 text-right">
              <button
                onClick={e => { e.stopPropagation(); openDrawer(row); }}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 flex items-center justify-center transition-colors ml-auto"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
              </button>
            </td>
          </tr>
        )}
      />

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => load(page - 1)} disabled={page <= 1 || loading} className="h-7 w-7 p-0 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold text-slate-500 px-2">{page} / {pages}</span>
          <Button variant="ghost" size="sm" onClick={() => load(page + 1)} disabled={page >= pages || loading} className="h-7 w-7 p-0 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setSelected(null)}
            />
            <RegistrantDrawer
              registrant={selected}
              onClose={() => setSelected(null)}
              onApprove={() => setApproveConfirm(true)}
              onReject={() => setRejectOpen(true)}
              approving={approving}
              rejecting={rejecting}
            />
          </>
        )}
      </AnimatePresence>

      {/* Approve confirm dialog */}
      <ConfirmDialog
        open={approveConfirm}
        onClose={() => setApproveConfirm(false)}
        onConfirm={handleApprove}
        title={`Approve ${snapshot?.fullName ?? ''}?`}
        description="This will activate their account and assign their requested role. They will receive an email notification."
        confirmLabel="Approve"
        variant="success"
        loading={approving}
      />

      {/* Reject modal */}
      <AnimatePresence>
        <RejectModal
          open={rejectOpen}
          onClose={() => setRejectOpen(false)}
          onConfirm={handleReject}
          loading={rejecting}
          applicantName={snapshot?.fullName || ''}
        />
      </AnimatePresence>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  MoreHorizontal,
  PenLine,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEmployees } from '../../../hooks/useHrRecords';
import { useGenerateOfferLetterPdf, useSendOfferLetter } from '../../../hooks/useOfferLetters';
import type { EmployeeRecord } from '../../../api/types';
import CreateEmployeeModal from '../../people/CreateEmployeeModal';
import OfferLetterCreateModal from '../../offer-letters/OfferLetterCreateModal';
import { getOfferLetters, terminateOfferLetter } from '../../../api/offerLetters';
import { api } from '../../../api/client';

type ContractStatus = 'Draft' | 'Pending Signature' | 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated' | 'Renewed';
type SignatureStatus = 'Not Sent' | 'Sent' | 'Viewed' | 'Signed' | 'Declined';
type ProbationStatus = 'Not Started' | 'In Progress' | 'Review Due' | 'Completed' | 'Extended' | '—';
type AttentionFilter = 'all' | 'expiring' | 'probation-review' | 'unsigned' | 'missing-documents';

type ContractRecord = {
  id: string;
  source: 'employee' | 'offer';
  employeeId?: string;
  offerId?: string;
  employeeName: string;
  employeeEmail?: string;
  position: string;
  department: string;
  contractType: string;
  employmentType: string;
  startDate?: string | null;
  endDate?: string | null;
  probationEndDate?: string | null;
  probationStatus: ProbationStatus;
  salary: string;
  workLocation?: string | null;
  workingHours?: string | null;
  allowances?: string | null;
  benefits?: string | null;
  roleSummary?: string | null;
  responsibilities?: string[];
  terms?: string | null;
  contractStatus: ContractStatus;
  signatureStatus: SignatureStatus;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastActivity?: string | null;
  rawOffer?: any;
  rawEmployee?: EmployeeRecord;
};

interface OnboardingContractTabProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const statusStyle: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  'Pending Signature': 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Expiring Soon': 'bg-orange-50 text-orange-700 border-orange-200',
  Expired: 'bg-rose-50 text-rose-700 border-rose-200',
  Terminated: 'bg-slate-200 text-slate-600 border-slate-300',
  Renewed: 'bg-blue-50 text-blue-700 border-blue-200',
  'Not Sent': 'bg-slate-100 text-slate-600 border-slate-200',
  Sent: 'bg-blue-50 text-blue-700 border-blue-200',
  Viewed: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Signed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Declined: 'bg-rose-50 text-rose-700 border-rose-200',
  'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Review Due': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Extended: 'bg-purple-50 text-purple-700 border-purple-200',
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const daysFromNow = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

const titleCase = (value?: string | null) => {
  if (!value) return '—';
  return String(value)
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
};

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();

const money = (value?: string | number | null, currency = 'ETB') => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''));
  if (Number.isFinite(numeric)) return `${currency} ${numeric.toLocaleString()}`;
  return String(value);
};

const nowDateTimeParts = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return {
    date: local.toISOString().slice(0, 10),
    time: local.toISOString().slice(11, 16),
  };
};

const getEmployeeName = (employee: EmployeeRecord) => employee.user?.fullName || employee.metadata?.fullName || employee.employeeCode || 'Unnamed Employee';

const employeeHasContractData = (employee: EmployeeRecord) =>
  Boolean(
    employee.contractStartDate ||
    employee.contractEndDate ||
    employee.probationEndDate ||
    employee.salaryInfo?.baseSalary ||
    employee.employmentType
  );

const getEmployeeContractStatus = (employee: EmployeeRecord): ContractStatus => {
  const employmentStatus = normalize(employee.employmentStatus);
  const endDays = daysFromNow(employee.contractEndDate);
  if (employmentStatus === 'terminated' || employmentStatus === 'inactive') return 'Terminated';
  if (endDays !== null && endDays < 0) return 'Expired';
  if (endDays !== null && endDays <= 30) return 'Expiring Soon';
  return 'Active';
};

const getProbationStatus = (startDate?: string | null, probationEndDate?: string | null): ProbationStatus => {
  const startDays = daysFromNow(startDate);
  const probationDays = daysFromNow(probationEndDate);
  if (!probationEndDate) return '—';
  if (startDays !== null && startDays > 0) return 'Not Started';
  if (probationDays !== null && probationDays < -14) return 'Completed';
  if (probationDays !== null && probationDays <= 14) return 'Review Due';
  return 'In Progress';
};

const getOfferContractStatus = (offer: any): ContractStatus => {
  const status = normalize(offer.status);
  if (status === 'draft') return 'Draft';
  if (status === 'sent') return 'Pending Signature';
  if (status === 'accepted') return 'Active';
  if (status === 'rejected') return 'Terminated';
  return 'Draft';
};

const getOfferSignatureStatus = (offer: any): SignatureStatus => {
  const status = normalize(offer.status);
  if (status === 'draft') return 'Not Sent';
  if (status === 'sent') return 'Sent';
  if (status === 'accepted') return 'Signed';
  if (status === 'rejected') return 'Declined';
  return 'Not Sent';
};

function Badge({ children }: { children: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${statusStyle[children] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[84px] rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30 ${
        active ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-blue-600">{icon}</div>
      </div>
    </button>
  );
}

function EmptyState({ onCreate, onDraft }: { onCreate: () => void; onDraft: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-black text-slate-900">No employment contracts yet</h3>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold text-slate-500">
        Create a contract for an employee or generate a draft using AI.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={onCreate} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-700">
          Create Contract
        </button>
        <button onClick={onDraft} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
          Draft with AI
        </button>
      </div>
    </div>
  );
}

function DetailsDrawer({ contract, onClose }: { contract: ContractRecord; onClose: () => void }) {
  const details = [
    ['Employee', contract.employeeName],
    ['Position', contract.position],
    ['Department', contract.department],
    ['Employment Type', contract.employmentType],
    ['Contract Type', contract.contractType],
    ['Start Date', formatDate(contract.startDate)],
    ['End Date', formatDate(contract.endDate)],
    ['Probation End', formatDate(contract.probationEndDate)],
    ['Working Hours', contract.workingHours || '—'],
    ['Salary', contract.salary],
    ['Allowances', contract.allowances || '—'],
    ['Benefits', contract.benefits || '—'],
    ['Contract Status', contract.contractStatus],
    ['Signature Status', contract.signatureStatus],
    ['Created By', contract.createdBy || '—'],
    ['Created Date', formatDate(contract.createdAt)],
    ['Last Updated', formatDate(contract.updatedAt)],
  ];

  const timeline = [
    contract.createdAt && { label: 'Contract created', date: contract.createdAt },
    contract.rawOffer?.sentAt && { label: 'Sent for signature', date: contract.rawOffer.sentAt },
    contract.rawOffer?.acceptedAt && { label: 'Signed', date: contract.rawOffer.acceptedAt },
    contract.startDate && { label: 'Probation started', date: contract.startDate },
    contract.contractStatus === 'Terminated' && { label: 'Contract terminated', date: contract.updatedAt },
  ].filter(Boolean) as Array<{ label: string; date?: string | null }>;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close drawer" onClick={onClose} className="absolute inset-0 bg-slate-900/30" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-slate-950">{contract.employeeName}</h2>
            <p className="text-xs font-semibold text-slate-500">{contract.position} · {contract.department}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-xs font-black text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {(contract.roleSummary || contract.responsibilities?.length || contract.terms) && (
            <div className="mt-5 space-y-3">
              {contract.roleSummary && (
                <section>
                  <h3 className="text-xs font-black text-slate-900">Role Summary</h3>
                  <p className="mt-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold leading-5 text-slate-600">{contract.roleSummary}</p>
                </section>
              )}
              {contract.responsibilities?.length ? (
                <section>
                  <h3 className="text-xs font-black text-slate-900">Responsibilities</h3>
                  <ul className="mt-2 space-y-2">
                    {contract.responsibilities.map(item => (
                      <li key={item} className="rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-600">{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {contract.terms && (
                <section>
                  <h3 className="text-xs font-black text-slate-900">Terms</h3>
                  <p className="mt-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold leading-5 text-slate-600">{contract.terms}</p>
                </section>
              )}
            </div>
          )}

          <section className="mt-5">
            <h3 className="text-xs font-black text-slate-900">Activity Timeline</h3>
            <div className="mt-2 space-y-2">
              {timeline.length ? timeline.map(item => (
                <div key={`${item.label}-${item.date}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs">
                  <span className="font-bold text-slate-700">{item.label}</span>
                  <span className="font-semibold text-slate-400">{formatDate(item.date)}</span>
                </div>
              )) : (
                <p className="rounded-lg border border-slate-200 px-3 py-3 text-xs font-semibold text-slate-500">No contract activity has been recorded yet.</p>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default function OnboardingContractTab({ onDraftAiSuggestion, showAlert }: OnboardingContractTabProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [probationFilter, setProbationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [attentionFilter, setAttentionFilter] = useState<AttentionFilter>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [editingEmployeeUserId, setEditingEmployeeUserId] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [terminationNotice, setTerminationNotice] = useState<string | null>(null);
  const [terminationTarget, setTerminationTarget] = useState<ContractRecord | null>(null);
  const [returnTarget, setReturnTarget] = useState<ContractRecord | null>(null);
  const [terminationDate, setTerminationDate] = useState(() => nowDateTimeParts().date);
  const [terminationTime, setTerminationTime] = useState(() => nowDateTimeParts().time);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const sourcePageSize = pageSize / 2;
  const offset = (page - 1) * sourcePageSize;
  const explicitTerminatedFilter = statusFilter === 'Terminated';
  const employeeStatusParam = explicitTerminatedFilter ? 'terminated' : undefined;
  const offerStatusParam = explicitTerminatedFilter ? 'REJECTED' : undefined;

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => closeMenu();
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [openMenuId]);

  const { data: employeeData, isLoading: loadingEmployees } = useEmployees({ limit: sourcePageSize, offset, employmentStatus: employeeStatusParam });
  const {
    data: offerPage = { offers: [], total: 0 },
    isLoading: loadingOffers,
    refetch: refetchOffers,
  } = useQuery({
    queryKey: ['offer-letters', 'contracts-page', sourcePageSize, offset, offerStatusParam, !explicitTerminatedFilter],
    queryFn: async () => {
      const response = await getOfferLetters({
        limit: sourcePageSize,
        offset,
        status: offerStatusParam,
        excludeRejected: !explicitTerminatedFilter,
      });
      return {
        offers: (response.data?.data as any[]) ?? [],
        total: response.data?.meta?.total ?? 0,
      };
    },
  });
  const sendOfferLetter = useSendOfferLetter();
  const generatePdf = useGenerateOfferLetterPdf();

  const employees = employeeData?.employees ?? [];
  const offerLetters = offerPage.offers;
  const totalBackendRecords = (employeeData?.total ?? 0) + (offerPage.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalBackendRecords / pageSize));

  useEffect(() => {
    setPage(1);
  }, [dateFilter, departmentFilter, probationFilter, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const contracts = useMemo<ContractRecord[]>(() => {
    const offerByEmail = new Map<string, any>();
    offerLetters.forEach((offer: any) => {
      const email = normalize(offer.candidateEmail);
      if (!email) return;
      const current = offerByEmail.get(email);
      if (!current || new Date(offer.updatedAt || offer.createdAt || 0) > new Date(current.updatedAt || current.createdAt || 0)) {
        offerByEmail.set(email, offer);
      }
    });

    const employeeEmails = new Set<string>();
    const employeeContracts = employees
      .filter(employeeHasContractData)
      .map((employee: EmployeeRecord) => {
        const email = normalize(employee.user?.email);
        if (email) employeeEmails.add(email);
        const relatedOffer = email ? offerByEmail.get(email) : null;
        const metadata = employee.metadata || {};
        const responsibilities = Array.isArray(metadata.responsibilities) ? metadata.responsibilities.filter(Boolean) : undefined;
        return {
          id: `employee-${employee.id}`,
          source: 'employee' as const,
          employeeId: employee.userId,
          offerId: relatedOffer?.id,
          employeeName: getEmployeeName(employee),
          employeeEmail: employee.user?.email,
          position: employee.position?.title || metadata.positionTitle || '—',
          department: employee.department?.name || metadata.departmentName || '—',
          contractType: titleCase(metadata.contractType || employee.employmentType || 'Employment'),
          employmentType: titleCase(employee.employmentType || metadata.employmentType),
          startDate: employee.contractStartDate || employee.hireDate,
          endDate: employee.contractEndDate,
          probationEndDate: employee.probationEndDate,
          probationStatus: getProbationStatus(employee.contractStartDate || employee.hireDate, employee.probationEndDate),
          salary: money(employee.salaryInfo?.baseSalary, employee.salaryInfo?.currency || 'ETB'),
          workLocation: metadata.workLocation,
          workingHours: metadata.workingHours,
          allowances: metadata.allowances,
          benefits: metadata.benefits,
          roleSummary: metadata.roleSummary,
          responsibilities,
          terms: metadata.contractTerms,
          contractStatus: getEmployeeContractStatus(employee),
          signatureStatus: relatedOffer ? getOfferSignatureStatus(relatedOffer) : 'Signed',
          createdBy: relatedOffer?.Creator?.fullName || metadata.createdBy,
          createdAt: relatedOffer?.createdAt || employee.hireDate,
          updatedAt: relatedOffer?.updatedAt || metadata.updatedAt || employee.hireDate,
          lastActivity: relatedOffer?.acceptedAt || relatedOffer?.sentAt || relatedOffer?.updatedAt || employee.contractStartDate || employee.hireDate,
          rawOffer: relatedOffer,
          rawEmployee: employee,
        };
      });

    const offerContracts = offerLetters
      .filter((offer: any) => {
        const email = normalize(offer.candidateEmail);
        return !employeeEmails.has(email) || ['DRAFT', 'SENT', 'REJECTED'].includes(String(offer.status || '').toUpperCase());
      })
      .map((offer: any) => ({
        id: `offer-${offer.id}`,
        source: 'offer' as const,
        offerId: offer.id,
        employeeName: offer.candidateName || 'Unnamed Candidate',
        employeeEmail: offer.candidateEmail,
        position: offer.Position?.title || offer.positionTitle || offer.roleName || '—',
        department: offer.Department?.name || offer.departmentName || '—',
        contractType: titleCase(offer.contractType || offer.employmentType || 'Offer'),
        employmentType: titleCase(offer.employmentType),
        startDate: offer.startDate,
        endDate: offer.endDate,
        probationEndDate: offer.probationEndDate,
        probationStatus: getProbationStatus(offer.startDate, offer.probationEndDate),
        salary: money(offer.salary, offer.salaryCurrency || 'ETB'),
        workLocation: offer.workLocation,
        workingHours: offer.workingHours,
        allowances: offer.allowances,
        benefits: offer.benefits,
        roleSummary: offer.roleSummary,
        responsibilities: Array.isArray(offer.responsibilities) ? offer.responsibilities.filter(Boolean) : undefined,
        terms: offer.terms,
        contractStatus: getOfferContractStatus(offer),
        signatureStatus: getOfferSignatureStatus(offer),
        createdBy: offer.Creator?.fullName,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
        lastActivity: offer.acceptedAt || offer.sentAt || offer.updatedAt || offer.createdAt,
        rawOffer: offer,
      }));

    return [...offerContracts, ...employeeContracts].sort((a, b) => {
      const aTime = new Date(a.lastActivity || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastActivity || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [employees, offerLetters]);

  const metrics = useMemo(() => ({
    active: contracts.filter(c => c.contractStatus === 'Active').length,
    expiring: contracts.filter(c => c.contractStatus === 'Expiring Soon').length,
    probation: contracts.filter(c => c.probationStatus === 'In Progress' || c.probationStatus === 'Review Due').length,
    pendingSignature: contracts.filter(c => c.contractStatus === 'Pending Signature' || c.signatureStatus === 'Sent' || c.signatureStatus === 'Viewed').length,
    drafts: contracts.filter(c => c.contractStatus === 'Draft').length,
    terminated: contracts.filter(c => c.contractStatus === 'Terminated').length,
  }), [contracts]);

  const departments = useMemo(() => Array.from(new Set(contracts.map(c => c.department).filter(Boolean))).sort(), [contracts]);
  const contractTypes = useMemo(() => Array.from(new Set(contracts.map(c => c.contractType).filter(Boolean))).sort(), [contracts]);

  const filtered = useMemo(() => contracts.filter(contract => {
    const query = normalize(searchQuery);
    const matchesSearch = !query || [
      contract.employeeName,
      contract.employeeEmail,
      contract.position,
      contract.department,
    ].some(value => normalize(value).includes(query));
    const matchesDepartment = departmentFilter === 'all' || contract.department === departmentFilter;
    const matchesType = typeFilter === 'all' || contract.contractType === typeFilter;
    const matchesStatus = statusFilter === 'all' || contract.contractStatus === statusFilter;
    const matchesProbation = probationFilter === 'all' || contract.probationStatus === probationFilter;
    const startDays = daysFromNow(contract.startDate);
    const endDays = daysFromNow(contract.endDate);
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'starts-30' && startDays !== null && startDays >= 0 && startDays <= 30) ||
      (dateFilter === 'expires-30' && endDays !== null && endDays >= 0 && endDays <= 30);
    const matchesAttention =
      attentionFilter === 'all' ||
      (attentionFilter === 'expiring' && endDays !== null && endDays >= 0 && endDays <= 30) ||
      (attentionFilter === 'probation-review' && contract.probationStatus === 'Review Due') ||
      (attentionFilter === 'unsigned' && (contract.contractStatus === 'Pending Signature' || contract.signatureStatus === 'Sent' || contract.signatureStatus === 'Viewed' || contract.signatureStatus === 'Not Sent')) ||
      (attentionFilter === 'missing-documents' && !contract.rawOffer?.pdfUrl && !contract.rawOffer?.renderedHtml);
    return matchesSearch && matchesDepartment && matchesType && matchesStatus && matchesProbation && matchesDate && matchesAttention;
  }), [attentionFilter, contracts, dateFilter, departmentFilter, probationFilter, searchQuery, statusFilter, typeFilter]);

  const attentionItems = useMemo(() => [
    { key: 'expiring' as const, label: 'Contracts expiring within 30 days', value: contracts.filter(c => {
      const endDays = daysFromNow(c.endDate);
      return endDays !== null && endDays >= 0 && endDays <= 30;
    }).length },
    { key: 'probation-review' as const, label: 'Probation reviews due', value: contracts.filter(c => c.probationStatus === 'Review Due').length },
    { key: 'unsigned' as const, label: 'Unsigned contracts', value: contracts.filter(c => c.contractStatus === 'Pending Signature' || c.signatureStatus === 'Sent' || c.signatureStatus === 'Viewed' || c.signatureStatus === 'Not Sent').length },
    { key: 'missing-documents' as const, label: 'Missing contract documents', value: contracts.filter(c => !c.rawOffer?.pdfUrl && !c.rawOffer?.renderedHtml).length },
  ], [contracts]);

  const isLoading = loadingEmployees || loadingOffers;

  const resetFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setProbationFilter('all');
    setDateFilter('all');
    setAttentionFilter('all');
  };

  const draftWithAi = () => onDraftAiSuggestion('Draft a compliant employment contract using the selected employee role, compensation, probation, benefits, and signature terms.');

  const handleCreateContract = () => {
    setCreateOfferOpen(true);
  };

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hr-records'] }),
      queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
      refetchOffers(),
    ]);
  };

  const handleDownload = async (contract: ContractRecord) => {
    if (!contract.offerId) {
      showAlert('No contract document is attached to this employee record yet.', 'info');
      return;
    }
    setBusyAction(`download-${contract.id}`);
    try {
      const response = await generatePdf.mutateAsync(contract.offerId);
      const url = response.data?.data?.pdfUrl || contract.rawOffer?.pdfUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      showAlert('Contract document prepared', 'success');
      await refreshData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Unable to download this contract document.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendForSignature = async (contract: ContractRecord) => {
    if (!contract.rawOffer || !contract.offerId) {
      showAlert('This record has no offer letter draft to send for signature.', 'info');
      return;
    }
    setBusyAction(`send-${contract.id}`);
    try {
      const offer = contract.rawOffer;
      await sendOfferLetter.mutateAsync({
        id: contract.offerId,
        data: {
          candidateName: offer.candidateName,
          candidateEmail: offer.candidateEmail,
          candidatePhone: offer.candidatePhone || '',
          departmentName: offer.Department?.name || '',
          positionName: offer.Position?.title || '',
          roleName: offer.Role?.name || '',
          salary: offer.salary || '',
          startDate: offer.startDate || '',
          employmentType: offer.employmentType || '',
          workLocation: offer.workLocation || '',
          reportingManager: offer.reportingManager || '',
          companyName: offer.companyName || 'Blih',
          name: offer.candidateName,
          positionTitle: offer.Position?.title || '',
        },
      });
      showAlert(`Contract sent to ${contract.employeeName}`, 'success');
      await refreshData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Unable to send this contract for signature.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const rolePrefix = location.pathname.startsWith('/super-admin') ? '/super-admin' :
                     location.pathname.startsWith('/hr-manager') ? '/hr-manager' :
                     location.pathname.startsWith('/business-admin') ? '/business-admin' : '/employee';

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const toggleMenu = (contractId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === contractId) {
      closeMenu();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 208;
    const menuHeight = 330;
    const left = Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8);
    const top = rect.bottom + menuHeight > window.innerHeight - 8
      ? Math.max(8, rect.top - menuHeight - 6)
      : rect.bottom + 6;
    setMenuPosition({ top, left });
    setOpenMenuId(contractId);
  };

  const openEditableRecord = (contract: ContractRecord) => {
    closeMenu();
    if (contract.rawEmployee?.userId || contract.employeeId) {
      setEditingEmployeeUserId(contract.rawEmployee?.userId || contract.employeeId || null);
      return;
    }
    if (contract.rawOffer) {
      setEditingOffer(contract.rawOffer);
      return;
    }
    showAlert('This contract record has no editable employee or offer source.', 'info');
  };

  const openEmployeeProfile = (contract: ContractRecord) => {
    closeMenu();
    if (!contract.rawEmployee) {
      showAlert('No employee profile exists for this draft offer yet.', 'info');
      return;
    }
    navigate(`${rolePrefix}/profiles/employee`, {
      state: { employee: contract.rawEmployee, fromTab: 'directory' },
    });
  };

  const handleTerminate = async (contract: ContractRecord) => {
    closeMenu();
    const now = nowDateTimeParts();
    setTerminationDate(now.date);
    setTerminationTime(now.time);
    setTerminationTarget(contract);
  };

  const handleReturnEmployee = (contract: ContractRecord) => {
    closeMenu();
    if (!contract.rawEmployee?.userId && !contract.employeeId) {
      showAlert('This terminated contract has no employee account to return.', 'info');
      return;
    }
    setReturnTarget(contract);
  };

  const confirmReturnEmployee = async () => {
    const contract = returnTarget;
    if (!contract) return;
    const employeeUserId = contract.rawEmployee?.userId || contract.employeeId;
    if (!employeeUserId) return;
    setBusyAction(`return-${contract.id}`);
    try {
      await api.post(`/api/v1/hr/records/${employeeUserId}/return-contract`, {
        reason: 'Employee returned from Contracts page',
      });
      setReturnTarget(null);
      showAlert(`${contract.employeeName} was returned and the account was reactivated`, 'success');
      setStatusFilter('all');
      await refreshData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Unable to return this employee.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const confirmTermination = async () => {
    const contract = terminationTarget;
    if (!contract) return;
    const effectiveDate = terminationDate || nowDateTimeParts().date;
    const effectiveTime = terminationTime || "00:00";
    const effectiveAt = `${effectiveDate}T${effectiveTime}:00`;
    if (contract.rawOffer && contract.offerId && contract.source === 'offer') {
      setBusyAction(`terminate-${contract.id}`);
      try {
        await terminateOfferLetter(contract.offerId, { effectiveAt });
        setTerminationNotice(`${contract.employeeName}'s contract was terminated`);
        setTerminationTarget(null);
        showAlert(`Contract draft for ${contract.employeeName} was terminated`, 'success');
        await refreshData();
        window.setTimeout(() => setTerminationNotice(null), 2400);
      } catch (error: any) {
        showAlert(error.response?.data?.message || 'Unable to terminate this contract draft.', 'error');
      } finally {
        setBusyAction(null);
      }
      return;
    }
    if (contract.rawEmployee?.userId || contract.employeeId) {
      const employeeUserId = contract.rawEmployee?.userId || contract.employeeId;
      setBusyAction(`terminate-${contract.id}`);
      try {
        await api.post(`/api/v1/hr/records/${employeeUserId}/terminate-contract`, {
          effectiveDate,
          effectiveAt,
          reason: 'Contract terminated from Contracts page',
        });
        setTerminationNotice(`${contract.employeeName}'s contract was terminated`);
        setTerminationTarget(null);
        showAlert(`${contract.employeeName}'s contract was terminated and the account was disabled`, 'success');
        await refreshData();
        window.setTimeout(() => setTerminationNotice(null), 2400);
      } catch (error: any) {
        showAlert(error.response?.data?.message || 'Unable to terminate this employee contract.', 'error');
      } finally {
        setBusyAction(null);
      }
      return;
    }
    showAlert('This contract has no editable source record to terminate.', 'info');
  };

  return (
    <div id="tab-contract-pane" className="w-full space-y-5 px-0 pb-8 font-sans">
      {terminationTarget && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">Terminate contract?</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
                  This will terminate {terminationTarget.employeeName}'s contract, disable the account, and remove the employee from standard exports unless Terminated is explicitly filtered.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-black text-slate-600">
                Termination date
                <input
                  type="date"
                  value={terminationDate}
                  onChange={(event) => setTerminationDate(event.currentTarget.value)}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="grid gap-1 text-xs font-black text-slate-600">
                Termination time
                <input
                  type="time"
                  value={terminationTime}
                  onChange={(event) => setTerminationTime(event.currentTarget.value)}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              Are you sure? This action immediately changes the employment status to terminated.
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTerminationTarget(null)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyAction === `terminate-${terminationTarget.id}` || !terminationDate || !terminationTime}
                onClick={confirmTermination}
                className="h-10 rounded-lg bg-rose-600 px-4 text-xs font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyAction === `terminate-${terminationTarget.id}` ? 'Terminating...' : 'Yes, terminate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {returnTarget && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">Return terminated employee?</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
                  This will reactivate {returnTarget.employeeName}'s account, restore the employee to active status, and include the employee in standard lists and exports again.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              Are you sure this terminated employee should be returned?
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnTarget(null)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyAction === `return-${returnTarget.id}`}
                onClick={confirmReturnEmployee}
                className="h-10 rounded-lg bg-emerald-600 px-4 text-xs font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyAction === `return-${returnTarget.id}` ? 'Returning...' : 'Yes, return employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {terminationNotice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-6 text-center shadow-2xl">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <span className="absolute h-20 w-20 animate-ping rounded-full bg-rose-100" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <X className="h-8 w-8" />
              </span>
            </div>
            <h3 className="mt-4 text-base font-black text-slate-950">Contract terminated</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{terminationNotice}</p>
            <p className="mt-3 text-xs font-medium text-slate-400">
              Hidden from standard lists and exports unless Terminated is explicitly filtered.
            </p>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-950">Employment Contracts</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Manage employee contracts, probation periods, signatures, and renewals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCreateContract} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700">
            <FileText className="h-4 w-4" />
            Create Contract
          </button>
          <button onClick={draftWithAi} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Draft Contract with AI
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Active Contracts" value={metrics.active} icon={<CheckCircle2 className="h-4 w-4" />} active={statusFilter === 'Active'} onClick={() => setStatusFilter('Active')} />
        <MetricCard label="Expiring Soon" value={metrics.expiring} icon={<AlertTriangle className="h-4 w-4" />} active={statusFilter === 'Expiring Soon'} onClick={() => setStatusFilter('Expiring Soon')} />
        <MetricCard label="On Probation" value={metrics.probation} icon={<Clock className="h-4 w-4" />} active={probationFilter !== 'all'} onClick={() => setProbationFilter('In Progress')} />
        <MetricCard label="Pending Signature" value={metrics.pendingSignature} icon={<FileSignature className="h-4 w-4" />} active={statusFilter === 'Pending Signature'} onClick={() => setStatusFilter('Pending Signature')} />
        <MetricCard label="Draft Contracts" value={metrics.drafts} icon={<PenLine className="h-4 w-4" />} active={statusFilter === 'Draft'} onClick={() => setStatusFilter('Draft')} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(220px,1.2fr)_repeat(5,minmax(130px,1fr))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search employee or position"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>
          <select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            <option value="all">All departments</option>
            {departments.map(department => <option key={department} value={department}>{department}</option>)}
          </select>
          <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            <option value="all">All contract types</option>
            {contractTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            <option value="all">All statuses</option>
            {['Draft', 'Pending Signature', 'Active', 'Expiring Soon', 'Expired', 'Terminated', 'Renewed'].map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={probationFilter} onChange={event => setProbationFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            <option value="all">All probation</option>
            {['Not Started', 'In Progress', 'Review Due', 'Completed', 'Extended'].map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={dateFilter} onChange={event => setDateFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            <option value="all">All dates</option>
            <option value="starts-30">Starts in 30 days</option>
            <option value="expires-30">Expires in 30 days</option>
          </select>
          <button onClick={resetFilters} className="h-10 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-600 hover:bg-slate-50">Reset</button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
          <span>{filtered.length} records on this page · {totalBackendRecords} total backend records</span>
          <span>Page {page} of {totalPages}</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-black text-slate-950">Contract Records</h2>
              <p className="text-xs font-semibold text-slate-500">Real employee contract and offer signature records.</p>
            </div>
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
          </div>

          {!isLoading && contracts.length === 0 ? (
            <div className="p-4">
              <EmptyState onCreate={handleCreateContract} onDraft={draftWithAi} />
            </div>
          ) : (
            <>
              <div className="block max-w-full overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[1120px] text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Contract Type</th>
                      <th className="px-4 py-3">Start Date</th>
                      <th className="px-4 py-3">End Date</th>
                      <th className="px-4 py-3">Probation End</th>
                      <th className="px-4 py-3">Salary</th>
                      <th className="px-4 py-3">Contract Status</th>
                      <th className="px-4 py-3">Signature</th>
                      <th className="sticky right-0 z-10 bg-slate-50 px-4 py-3 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(contract => (
                      <tr key={contract.id} className="h-[68px] hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                              {contract.employeeName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{contract.employeeName}</p>
                              <p className="max-w-[180px] truncate text-[11px] font-semibold text-slate-400">{contract.employeeEmail || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{contract.position}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">{contract.department}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">{contract.contractType}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">{formatDate(contract.startDate)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">{formatDate(contract.endDate)}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-600">{formatDate(contract.probationEndDate)}</p>
                            {contract.probationStatus !== '—' && <Badge>{contract.probationStatus}</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{contract.salary}</td>
                        <td className="px-4 py-3"><Badge>{contract.contractStatus}</Badge></td>
                        <td className="px-4 py-3"><Badge>{contract.signatureStatus}</Badge></td>
                        <td className={`sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)] ${openMenuId === contract.id ? 'z-30' : 'z-10'}`}>
                          <div className="relative flex items-center justify-end gap-2">
                            <button onClick={() => setSelectedContract(contract)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-blue-700">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            <button onClick={(event) => toggleMenu(contract.id, event)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openMenuId === contract.id && menuPosition && (
                              <div
                                className="fixed z-[80] max-h-[min(330px,calc(100vh-16px))] w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                                style={{ top: menuPosition.top, left: menuPosition.left }}
                              >
                                <button onClick={() => { setSelectedContract(contract); closeMenu(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">
                                  <Eye className="h-3.5 w-3.5" /> View Contract
                                </button>
                                <button onClick={() => openEditableRecord(contract)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">
                                  <PenLine className="h-3.5 w-3.5" /> Edit Contract
                                </button>
                                <button disabled={busyAction === `download-${contract.id}`} onClick={() => handleDownload(contract)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                  <Download className="h-3.5 w-3.5" /> Download Contract
                                </button>
                                <button disabled={busyAction === `send-${contract.id}`} onClick={() => handleSendForSignature(contract)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                  <Send className="h-3.5 w-3.5" /> Send for Signature
                                </button>
                                <button onClick={() => openEditableRecord(contract)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">
                                  <RefreshCw className="h-3.5 w-3.5" /> Renew Contract
                                </button>
                                <button onClick={() => openEditableRecord(contract)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">
                                  <Clock className="h-3.5 w-3.5" /> Extend Probation
                                </button>
                                {contract.contractStatus === 'Terminated' && contract.source === 'employee' ? (
                                  <button disabled={busyAction === `return-${contract.id}`} onClick={() => handleReturnEmployee(contract)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                                    <RefreshCw className="h-3.5 w-3.5" /> Return Employee
                                  </button>
                                ) : (
                                  <button disabled={busyAction === `terminate-${contract.id}`} onClick={() => handleTerminate(contract)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                                    <X className="h-3.5 w-3.5" /> Terminate Contract
                                  </button>
                                )}
                                <button onClick={() => openEmployeeProfile(contract)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">
                                  <UserRound className="h-3.5 w-3.5" /> View Employee Profile
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="hidden">
                {filtered.map(contract => (
                  <div key={contract.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{contract.employeeName}</p>
                        <p className="text-xs font-semibold text-slate-500">{contract.position} · {contract.department}</p>
                      </div>
                      <Badge>{contract.contractStatus}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                      <span>Start: {formatDate(contract.startDate)}</span>
                      <span>End: {formatDate(contract.endDate)}</span>
                      <span>Probation: {contract.probationStatus}</span>
                      <span>{contract.salary}</span>
                    </div>
                    <button onClick={() => setSelectedContract(contract)} className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white">View Contract</button>
                  </div>
                ))}
              </div>

              {!isLoading && filtered.length === 0 && contracts.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-8 text-center text-xs font-semibold text-slate-500">
                  No contracts match the current filters.
                </div>
              )}

              {totalBackendRecords > pageSize && (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-bold text-slate-500">
                    Showing backend page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || isLoading}
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                      {page}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages || isLoading}
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">Attention Required</h2>
            <div className="mt-3 space-y-2">
              {attentionItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => setAttentionFilter(prev => prev === item.key ? 'all' : item.key)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                    attentionFilter === item.key
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black ${
                    attentionFilter === item.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>{item.value}</span>
                </button>
              ))}
            </div>
            {attentionFilter !== 'all' && (
              <button onClick={() => setAttentionFilter('all')} className="mt-3 text-xs font-black text-blue-600 hover:text-blue-700">
                Clear attention filter
              </button>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">Contract Sources</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                <p className="mt-2 text-xl font-black text-slate-950">{contracts.filter(c => c.source === 'employee').length}</p>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Employee Records</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <FileSignature className="h-4 w-4 text-blue-600" />
                <p className="mt-2 text-xl font-black text-slate-950">{contracts.filter(c => c.source === 'offer').length}</p>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Offer Drafts</p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      {selectedContract && <DetailsDrawer contract={selectedContract} onClose={() => setSelectedContract(null)} />}
      <CreateEmployeeModal
        isOpen={Boolean(editingEmployeeUserId)}
        onClose={() => setEditingEmployeeUserId(null)}
        showAlert={showAlert}
        mode="update"
        targetUserId={editingEmployeeUserId || undefined}
        onSuccess={() => {
          setEditingEmployeeUserId(null);
          refreshData();
        }}
      />
      <OfferLetterCreateModal
        isOpen={createOfferOpen || Boolean(editingOffer)}
        onClose={() => {
          setCreateOfferOpen(false);
          setEditingOffer(null);
        }}
        showAlert={showAlert}
        initialData={editingOffer || undefined}
        onSuccess={() => {
          setCreateOfferOpen(false);
          setEditingOffer(null);
          refreshData();
        }}
      />
    </div>
  );
}

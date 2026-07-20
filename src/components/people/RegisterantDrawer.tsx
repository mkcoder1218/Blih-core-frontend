import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DetailRow, DetailSection } from "./Details";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileImage,
  HeartPulse,
  Landmark,
  MapPin,
  User,
  XCircle,
} from "lucide-react";
import { FinancialField } from "./FinantealField";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  pendingRegistrationsApi,
  type ApprovalFinancialInfo,
  type PendingRegistrant,
} from "../../api/pendingRegistrations";
import { StatusBadge } from "@/components/ui/blih";
import {
  ApproveConfirmationModal,
  calculateEthiopianPreview,
  createInitialFinancialForm,
  financialNumber,
  IdDocImage,
  money,
  resolveEthiopianPreviewFromNet,
  toApprovalFinancialInfo,
  type FinancialFormState,
} from "./registerantFinancial";

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const fmtAge = (dob: string | null) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};


export function RegistrantDrawer({
  registrant, onClose, onApprove, onReject, approving, rejecting,
}: {
  registrant: PendingRegistrant;
  onClose: () => void;
  onApprove: (financialInfo: ApprovalFinancialInfo) => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const p = registrant.personal;
  const age = fmtAge(p.dateOfBirth);
  const [drawerStep, setDrawerStep] = useState<'review' | 'financial'>('review');
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [financialForm, setFinancialForm] = useState<FinancialFormState>(() => createInitialFinancialForm({
    salaryInputMode: registrant.financial?.salaryInputMode === 'net' ? 'net' : 'base',
    baseSalary: registrant.financial?.baseSalary ? String(registrant.financial.baseSalary) : '',
    netSalary: registrant.financial?.netSalary ? String(registrant.financial.netSalary) : '',
    transportAllowance: registrant.financial?.transportAllowance != null ? String(registrant.financial.transportAllowance) : '0',
    perDiemAllowance: registrant.financial?.perDiemAllowance != null ? String(registrant.financial.perDiemAllowance) : '0',
    perDiemDays: registrant.financial?.perDiemDays != null ? String(registrant.financial.perDiemDays) : '0',
    medicalBenefit: registrant.financial?.medicalBenefit != null ? String(registrant.financial.medicalBenefit) : '0',
    telecomAllowance: registrant.financial?.telecomAllowance != null ? String(registrant.financial.telecomAllowance) : '0',
    housingAllowance: registrant.financial?.housingAllowance != null ? String(registrant.financial.housingAllowance) : '0',
    mealAllowance: registrant.financial?.mealAllowance != null ? String(registrant.financial.mealAllowance) : '0',
    otherAllowance: registrant.financial?.otherAllowance != null ? String(registrant.financial.otherAllowance) : '0',
    employeePensionRate: registrant.financial?.employeePensionRate != null ? String(registrant.financial.employeePensionRate) : '7',
    employerPensionRate: registrant.financial?.employerPensionRate != null ? String(registrant.financial.employerPensionRate) : '11',
    bankAccount: registrant.financial?.bankAccount || '',
    tin: registrant.financial?.tin || '',
    remarks: registrant.financial?.remarks || '',
  }));

  // Fetch full detail (EmployeeRecord metadata has the ID doc URLs)
  const [detail, setDetail] = useState<any>(null);
  useEffect(() => {
    pendingRegistrationsApi.getOne(registrant.id)
      .then(r => setDetail((r.data as any)?.data?.user ?? (r.data as any)?.user ?? null))
      .catch(() => null);
  }, [registrant.id]);

  const empRecord = detail?.EmployeeRecord ?? detail?.EmployeeRecords?.[0] ?? null;
  const empMeta  = empRecord?.metadata ?? {};
  const empSalaryInfo = empRecord?.salaryInfo ?? {};
  const frontUrl = empMeta.idDocumentFrontUrl ?? empMeta.idDocumentUrl ?? null;
  const backUrl  = empMeta.idDocumentBackUrl  ?? null;

  // Emergency contact — from EmployeeRecord
  const ec = detail?.EmployeeRecord?.emergencyContact ?? null;
  const emergencyName = ec ? [ec.firstName, ec.lastName].filter(Boolean).join(' ') : null;
  const emergencyPhone = ec?.phone ?? null;
  const emergencyRelationship = ec?.relationship ?? null;

  // Bank details — from metadata.bankDetails array
  const bankDetails = empMeta.bankDetails ?? [];
  const primaryBank = bankDetails[0] ?? null;
  const bankName    = primaryBank?.bankName ?? registrant.financial?.bankName ?? null;
  const bankAccount = primaryBank?.accountNumber ?? empMeta.bankAccountNumber ?? empSalaryInfo.bankAccount ?? registrant.financial?.bankAccount ?? null;
  const tin = empMeta.tin ?? empMeta.taxIdentificationNumber ?? empSalaryInfo.tin ?? registrant.financial?.tin ?? null;

  useEffect(() => {
    setFinancialForm(prev => ({
      ...prev,
      bankAccount: prev.bankAccount || bankAccount || '',
      tin: prev.tin || tin || '',
      salaryInputMode: prev.salaryInputMode || (registrant.financial?.salaryInputMode === 'net' ? 'net' : 'base'),
      baseSalary: prev.baseSalary || (registrant.financial?.baseSalary ? String(registrant.financial.baseSalary) : ''),
      netSalary: prev.netSalary || (registrant.financial?.netSalary ? String(registrant.financial.netSalary) : ''),
    }));
  }, [bankAccount, tin, registrant.financial?.baseSalary, registrant.financial?.netSalary, registrant.financial?.salaryInputMode]);

  const setFinancialValue = (key: keyof FinancialFormState) => (value: string) => {
    setFinancialForm(prev => ({ ...prev, [key]: value }));
  };
  const financialInfo = toApprovalFinancialInfo(financialForm);
  const isFinancialStep = drawerStep === 'financial';
  const calculationPreview = financialForm.salaryInputMode === 'net'
    ? resolveEthiopianPreviewFromNet(financialNumber(financialForm.netSalary), financialForm)
    : calculateEthiopianPreview(financialNumber(financialForm.baseSalary), financialForm);
  const canApprove = (
    financialForm.salaryInputMode === 'net'
      ? Number(financialForm.netSalary) > 0
      : Number(financialForm.baseSalary) > 0
  ) && !approving && !rejecting;
  const submitApproval = () => {
    if (!canApprove) return;
    setApproveConfirmOpen(true);
  };

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

      <div className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1 border border-slate-100">
          <button
            type="button"
            onClick={() => setDrawerStep('review')}
            className={cn(
              'h-9 rounded-xl text-[11px] font-black transition-colors',
              !isFinancialStep ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            1. Review
          </button>
          <button
            type="button"
            onClick={() => setDrawerStep('financial')}
            className={cn(
              'h-9 rounded-xl text-[11px] font-black transition-colors',
              isFinancialStep ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            2. Financial
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {!isFinancialStep && (
          <>
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

          </>
        )}

        {isFinancialStep && (
          <DetailSection title="Financial Information" icon={Landmark}>
            <div className="col-span-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">Income tax mode</p>
              <p className="text-xs font-bold text-emerald-900 mt-0.5">Ethiopian statutory PAYE with pension defaults</p>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-1">
              {(['net','base'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFinancialValue('salaryInputMode')(mode)}
                  className={cn(
                    'h-8 rounded-lg text-[11px] font-black transition-colors',
                    financialForm.salaryInputMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {mode === 'base' ? 'Base Salary' : 'Net Salary'}
                </button>
              ))}
            </div>
            {financialForm.salaryInputMode === 'net' ? (
              <FinancialField label="Net salary" value={financialForm.netSalary} onChange={setFinancialValue('netSalary')} placeholder="15140" />
            ) : (
              <FinancialField label="Basic salary" value={financialForm.baseSalary} onChange={setFinancialValue('baseSalary')} placeholder="15000" />
            )}
            <FinancialField label="Pensionable salary" value={financialForm.pensionableSalary} onChange={setFinancialValue('pensionableSalary')} placeholder="Uses basic salary" />
            <FinancialField label="Transport allowance" value={financialForm.transportAllowance} onChange={setFinancialValue('transportAllowance')} placeholder="2200" />
            <FinancialField label="Per diem allowance" value={financialForm.perDiemAllowance} onChange={setFinancialValue('perDiemAllowance')} placeholder="0" />
            <FinancialField label="Per diem travel days" value={financialForm.perDiemDays} onChange={setFinancialValue('perDiemDays')} placeholder="0" />
            <FinancialField label="Medical benefit / insurance" value={financialForm.medicalBenefit} onChange={setFinancialValue('medicalBenefit')} placeholder="0" />
            <FinancialField label="Telecom / phone / data" value={financialForm.telecomAllowance} onChange={setFinancialValue('telecomAllowance')} placeholder="0" />
            <FinancialField label="Housing allowance" value={financialForm.housingAllowance} onChange={setFinancialValue('housingAllowance')} placeholder="0" />
            <FinancialField label="Meal allowance" value={financialForm.mealAllowance} onChange={setFinancialValue('mealAllowance')} placeholder="0" />
            <FinancialField label="Other allowances" value={financialForm.otherAllowance} onChange={setFinancialValue('otherAllowance')} placeholder="0" />
            <FinancialField label="Employee pension %" value={financialForm.employeePensionRate} onChange={setFinancialValue('employeePensionRate')} placeholder="7" />
            <FinancialField label="Employer pension %" value={financialForm.employerPensionRate} onChange={setFinancialValue('employerPensionRate')} placeholder="11" />
            {calculationPreview && calculationPreview.baseSalary > 0 && (
              <div className="col-span-2 rounded-xl border border-blue-100 bg-blue-50/60 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-blue-100 bg-white/70">
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-700">Live payroll calculation</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {financialForm.salaryInputMode === 'net'
                      ? `${money(financialNumber(financialForm.netSalary))} target net derives ${money(calculationPreview.baseSalary)} base salary`
                      : `${money(calculationPreview.baseSalary)} base salary produces ${money(calculationPreview.netPay)} net pay`}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-px bg-blue-100 text-xs">
                  {[
                    ['Base', calculationPreview.baseSalary],
                    ['Gross', calculationPreview.grossPay],
                    ['Taxable', calculationPreview.taxableIncome],
                    ['PAYE', calculationPreview.incomeTax],
                    ['Transport Exempt', calculationPreview.transportExempt],
                    ['Transport Taxable', calculationPreview.transportTaxable],
                    ['Per Diem Exempt', calculationPreview.perDiemExempt],
                    ['Per Diem Taxable', calculationPreview.perDiemTaxable],
                    ['Medical Exempt', calculationPreview.medicalExempt],
                    ['Fringe Tax', calculationPreview.fringeTax],
                    ['Employee Pension', calculationPreview.employeePension],
                    ['Deductions', calculationPreview.totalDeductions],
                    ['Net Pay', calculationPreview.netPay],
                    ['Employer Pension', calculationPreview.employerPension],
                    ['Company Cost', calculationPreview.totalCostToCompany],
                  ].map(([label, value]) => (
                    <div key={label as string} className="bg-white/85 px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{money(value as number)}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-px bg-blue-100 border-t border-blue-100 text-xs">
                  {[
                    ['Basic salary', 'Fully taxable', 'No exempt cap'],
                    ['Transportation allowance', 'Partially exempt', 'Exempt up to ETB 2,200/month or 25% of salary, lower amount applies'],
                    ['Per diem (official travel)', 'Partially exempt', 'Exempt up to ETB 225/day or 4% of salary per day, with ETB 2,200/month and 25% salary caps'],
                    ['Medical treatment / insurance', 'Generally exempt', 'Actual cost is treated as exempt in this preview'],
                    ['Housing and meal allowances', 'Fully taxable', 'Included in PAYE taxable income'],
                    ['Telecom and other allowances', 'Fringe benefit', 'Tax on combined fringe benefits capped at 10% of salary'],
                  ].map(([benefit, treatment, cap]) => (
                    <div key={benefit} className="grid grid-cols-[1fr_0.8fr_1.4fr] gap-2 bg-white/85 px-3 py-2">
                      <p className="text-[10px] font-black text-slate-700">{benefit}</p>
                      <p className="text-[10px] font-bold text-blue-700">{treatment}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{cap}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <FinancialField label="TIN" value={financialForm.tin} onChange={setFinancialValue('tin')} placeholder="Tax ID" inputMode="text" />
            <FinancialField label="Bank account" value={financialForm.bankAccount} onChange={setFinancialValue('bankAccount')} placeholder="Account number" inputMode="text" />
            <label className="col-span-2 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Remarks / notes</span>
              <textarea
                value={financialForm.remarks}
                onChange={event => setFinancialValue('remarks')(event.currentTarget.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white resize-none"
              />
            </label>
          </DetailSection>
        )}

        {!isFinancialStep && (
          <>
        {/* Emergency Contact */}
        {(emergencyName || emergencyPhone || emergencyRelationship) && (
          <DetailSection title="Emergency Contact" icon={HeartPulse}>
            <DetailRow label="Name"         value={emergencyName} />
            <DetailRow label="Relationship" value={emergencyRelationship} />
            <DetailRow label="Phone"        value={emergencyPhone} />
          </DetailSection>
        )}

        {/* Bank Information */}
        {(bankName || bankAccount) && (
          <DetailSection title="Bank Information" icon={Landmark}>
            <DetailRow label="Bank Name"       value={bankName} />
            <DetailRow label="Account Number"  value={bankAccount} />
          </DetailSection>
        )}

        {/* Fallback when both emergency and bank are missing — only show once detail has loaded */}
        {detail && !emergencyName && !emergencyPhone && !bankName && !bankAccount && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-slate-500">No emergency contact or bank details provided.</p>
          </div>
        )}

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
          </>
        )}
      </div>

      {/* Action footer */}
      <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
        <Button
          onClick={isFinancialStep ? () => setDrawerStep('review') : onReject}
          disabled={approving || rejecting}
          variant="outline"
          className={cn(
            'flex-1 h-9 text-xs rounded-xl font-bold',
            isFinancialStep
              ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
              : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300',
          )}
        >
          {isFinancialStep ? (
            <ChevronLeft className="w-3.5 h-3.5 mr-1.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
          )}
          {isFinancialStep ? 'Back' : (rejecting ? 'Rejecting…' : 'Reject')}
        </Button>
        <Button
          onClick={isFinancialStep ? submitApproval : () => setDrawerStep('financial')}
          disabled={isFinancialStep ? !canApprove : approving || rejecting}
          className={cn(
            'flex-1 h-9 text-xs text-white rounded-xl font-bold shadow-sm',
            isFinancialStep
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
          )}
        >
          {isFinancialStep ? (
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          ) : null}
          {isFinancialStep ? (approving ? 'Approving…' : 'Approve') : 'Next'}
          {!isFinancialStep ? <ChevronRight className="w-3.5 h-3.5 ml-1.5" /> : null}
        </Button>
      </div>

      <AnimatePresence>
        <ApproveConfirmationModal
          open={approveConfirmOpen}
          applicantName={registrant.fullName}
          loading={approving}
          onClose={() => setApproveConfirmOpen(false)}
          onConfirm={() => onApprove(financialInfo)}
        />
      </AnimatePresence>
    </motion.div>
  );
}

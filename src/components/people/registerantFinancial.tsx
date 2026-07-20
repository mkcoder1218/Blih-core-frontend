import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApprovalFinancialInfo } from "../../api/pendingRegistrations";

const API_BASE = import.meta.env.VITE_API_Prod_URL || 'http://localhost:4000';

export type FinancialFormState = {
  salaryInputMode: 'base' | 'net';
  baseSalary: string;
  netSalary: string;
  pensionableSalary: string;
  transportAllowance: string;
  perDiemAllowance: string;
  perDiemDays: string;
  medicalBenefit: string;
  telecomAllowance: string;
  housingAllowance: string;
  mealAllowance: string;
  otherAllowance: string;
  employeePensionRate: string;
  employerPensionRate: string;
  bankAccount: string;
  tin: string;
  remarks: string;
};

export const createInitialFinancialForm = (prefill?: Partial<FinancialFormState>): FinancialFormState => ({
  salaryInputMode: 'base',
  baseSalary: '',
  netSalary: '',
  pensionableSalary: '',
  transportAllowance: '0',
  perDiemAllowance: '0',
  perDiemDays: '0',
  medicalBenefit: '0',
  telecomAllowance: '0',
  housingAllowance: '0',
  mealAllowance: '0',
  otherAllowance: '0',
  employeePensionRate: '7',
  employerPensionRate: '11',
  bankAccount: '',
  tin: '',
  remarks: '',
  ...prefill,
});

export const financialNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const money = (value?: number | null) => `ETB ${Math.round(Number(value || 0)).toLocaleString('en-US')}`;

function incomeTaxBracket(taxableIncome: number) {
  if (taxableIncome >= 2001 && taxableIncome <= 4000) return { rate: 0.15, deduction: 300 };
  if (taxableIncome >= 4001 && taxableIncome <= 7000) return { rate: 0.20, deduction: 500 };
  if (taxableIncome >= 7001 && taxableIncome <= 10000) return { rate: 0.25, deduction: 850 };
  if (taxableIncome >= 10001 && taxableIncome <= 14000) return { rate: 0.30, deduction: 1350 };
  if (taxableIncome > 14000) return { rate: 0.35, deduction: 2050 };
  return { rate: 0, deduction: 0 };
}

export function calculateEthiopianPreview(baseSalary: number, form: FinancialFormState) {
  const transportAllowance = financialNumber(form.transportAllowance);
  const perDiemAllowance = financialNumber(form.perDiemAllowance);
  const perDiemDays = financialNumber(form.perDiemDays);
  const medicalBenefit = financialNumber(form.medicalBenefit);
  const telecomAllowance = financialNumber(form.telecomAllowance);
  const housingAllowance = financialNumber(form.housingAllowance);
  const mealAllowance = financialNumber(form.mealAllowance);
  const otherAllowance = financialNumber(form.otherAllowance);
  const grossPay = baseSalary + transportAllowance + perDiemAllowance + medicalBenefit + telecomAllowance + housingAllowance + mealAllowance + otherAllowance;
  const salaryPctCap = baseSalary * 0.25;
  const transportCap = Math.min(2200, salaryPctCap);
  const perDiemDailyCap = Math.max(225, baseSalary * 0.04) * Math.max(perDiemDays, 0);
  const perDiemCap = Math.min(2200, salaryPctCap, perDiemDays > 0 ? perDiemDailyCap : 2200);
  const taxableTransport = Math.max(transportAllowance - Math.min(2200, salaryPctCap), 0);
  const taxablePerDiem = Math.max(perDiemAllowance - perDiemCap, 0);
  const taxableIncomeBeforeFringe = baseSalary + housingAllowance + mealAllowance + taxableTransport + taxablePerDiem;
  const taxableFringeBenefits = telecomAllowance + otherAllowance;
  const taxableIncome = taxableIncomeBeforeFringe + taxableFringeBenefits;
  const baseTaxBracket = incomeTaxBracket(taxableIncomeBeforeFringe);
  const fullTaxBracket = incomeTaxBracket(taxableIncome);
  const incomeTaxBeforeFringe = Math.max(taxableIncomeBeforeFringe * baseTaxBracket.rate - baseTaxBracket.deduction, 0);
  const fullIncomeTax = Math.max(taxableIncome * fullTaxBracket.rate - fullTaxBracket.deduction, 0);
  const fringeTax = Math.min(Math.max(fullIncomeTax - incomeTaxBeforeFringe, 0), baseSalary * 0.1);
  const incomeTax = incomeTaxBeforeFringe + fringeTax;
  const pensionableSalary = form.pensionableSalary ? financialNumber(form.pensionableSalary) : baseSalary;
  const employeePension = pensionableSalary * (financialNumber(form.employeePensionRate, 7) / 100);
  const employerPension = pensionableSalary * (financialNumber(form.employerPensionRate, 11) / 100);
  const totalDeductions = incomeTax + employeePension;
  const netPay = Math.max(grossPay - totalDeductions, 0);

  return {
    baseSalary,
    grossPay,
    taxableIncome,
    taxableIncomeBeforeFringe,
    transportExempt: Math.min(transportAllowance, transportCap),
    transportTaxable: taxableTransport,
    perDiemExempt: Math.min(perDiemAllowance, perDiemCap),
    perDiemTaxable: taxablePerDiem,
    medicalExempt: medicalBenefit,
    fringeTaxable: taxableFringeBenefits,
    fringeTax,
    fringeTaxCap: baseSalary * 0.1,
    incomeTax,
    employeePension,
    employerPension,
    totalDeductions,
    netPay,
    totalCostToCompany: grossPay + employerPension,
  };
}

export function resolveEthiopianPreviewFromNet(targetNetSalary: number, form: FinancialFormState) {
  if (!Number.isFinite(targetNetSalary) || targetNetSalary <= 0) return null;
  const baseOnlyForm: FinancialFormState = {
    ...form,
    transportAllowance: '0',
    perDiemAllowance: '0',
    perDiemDays: '0',
    medicalBenefit: '0',
    telecomAllowance: '0',
    housingAllowance: '0',
    mealAllowance: '0',
    otherAllowance: '0',
  };
  let lower = 0;
  let upper = Math.max(targetNetSalary * 2, 1000);
  while (calculateEthiopianPreview(upper, baseOnlyForm).netPay < targetNetSalary && upper < 1_000_000_000) upper *= 2;
  for (let i = 0; i < 70; i += 1) {
    const mid = (lower + upper) / 2;
    if (calculateEthiopianPreview(mid, baseOnlyForm).netPay < targetNetSalary) lower = mid;
    else upper = mid;
  }
  return calculateEthiopianPreview(Math.round(upper * 100) / 100, form);
}

export const toApprovalFinancialInfo = (form: FinancialFormState): ApprovalFinancialInfo => {
  const baseSalary = financialNumber(form.baseSalary);
  const netSalary = financialNumber(form.netSalary);
  return {
    salaryInputMode: form.salaryInputMode,
    ...(form.salaryInputMode === 'net' ? { netSalary } : { baseSalary }),
    ...(form.pensionableSalary ? { pensionableSalary: financialNumber(form.pensionableSalary, baseSalary) } : {}),
    currency: 'ETB',
    transportAllowance: financialNumber(form.transportAllowance),
    perDiemAllowance: financialNumber(form.perDiemAllowance),
    perDiemDays: financialNumber(form.perDiemDays),
    medicalBenefit: financialNumber(form.medicalBenefit),
    telecomAllowance: financialNumber(form.telecomAllowance),
    housingAllowance: financialNumber(form.housingAllowance),
    mealAllowance: financialNumber(form.mealAllowance),
    otherAllowance: financialNumber(form.otherAllowance),
    employeePensionRate: financialNumber(form.employeePensionRate, 7),
    employerPensionRate: financialNumber(form.employerPensionRate, 11),
    bankAccount: form.bankAccount.trim(),
    tin: form.tin.trim(),
    paymentStatus: 'Pending',
    remarks: form.remarks.trim(),
  };
};

export function IdDocImage({ url, label }: { url: string; label: string }) {
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
          >x</button>
        </div>
      )}
    </>
  );
}

export function ApproveConfirmationModal({
  open, applicantName, loading, onClose, onConfirm,
}: {
  open: boolean;
  applicantName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Confirm Financial Information</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Are you sure you added the correct financial information for {applicantName}?
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="h-8 text-xs px-4 rounded-lg">
            Review
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="h-8 text-xs px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shadow-emerald-600/20"
          >
            {loading ? 'Approving...' : 'Confirm approve'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}




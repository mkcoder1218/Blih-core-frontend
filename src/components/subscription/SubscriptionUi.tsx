import React from "react";
import { Download, FileText, X } from "lucide-react";
import { motion } from "motion/react";
import type { Invoice } from "../../api/subscriptions";

export const control = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500";
export const ACCESS_OPTIONS = [
  { value: "full", label: "Full access" },
  { value: "read_only", label: "Read only" },
  { value: "business_admin_only", label: "Business admin only" },
  { value: "billing_only", label: "Billing only" },
  { value: "locked", label: "Completely locked" },
];
const tone: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100", trialing: "bg-blue-50 text-blue-700 border-blue-100",
  pending_payment: "bg-amber-50 text-amber-700 border-amber-100", paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  issued: "bg-amber-50 text-amber-700 border-amber-100", past_due: "bg-rose-50 text-rose-700 border-rose-100",
  suspended: "bg-rose-50 text-rose-700 border-rose-100", failed: "bg-rose-50 text-rose-700 border-rose-100",
  expired: "bg-slate-100 text-slate-600 border-slate-200", canceled: "bg-slate-100 text-slate-600 border-slate-200",
};

export const money = (value?: string | number, currency = "ETB") => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
export const date = (value?: string | null) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "—";

export function Heading({ eyebrow, title, description, right }: { eyebrow: string; title: string; description: string; right?: React.ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_5px_22px_rgba(0,0,0,.015)] sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9.5px] font-black uppercase tracking-[.18em] text-blue-600">{eyebrow}</p><h1 className="mt-1 text-xl font-black tracking-tight text-slate-950">{title}</h1><p className="mt-1 text-xs font-medium text-slate-500">{description}</p></div>{right}</div>;
}
export function Status({ status, compact }: { status: string; compact?: boolean }) { return <span className={`inline-flex rounded-full border font-black uppercase ${compact ? "px-2 py-0.5 text-[8.5px]" : "px-2.5 py-1 text-[9px]"} ${tone[status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>{status.replace(/_/g, " ")}</span>; }
export function Metric({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: React.ReactNode; hint?: string }) { return <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_5px_16px_rgba(0,0,0,.012)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-lg font-black text-slate-950">{value}</p>{hint && <p className="mt-1 text-[9.5px] text-slate-400">{hint}</p>}</div><span className="rounded-xl bg-blue-50 p-2 text-blue-600"><Icon className="h-4 w-4" /></span></div></div>; }
export function Card({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_5px_18px_rgba(0,0,0,.012)]"><h2 className="mb-3 text-sm font-black text-slate-950">{title}</h2>{children}</section>; }
export function Empty({ title, description }: { title: string; description?: string }) { return <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center"><FileText className="mx-auto h-6 w-6 text-slate-400" /><h2 className="mt-3 text-sm font-black text-slate-900">{title}</h2>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div>; }
export function Loading({ text = "Loading…" }: { text?: string }) { return <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-xs font-bold text-slate-500">{text}</div>; }
export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</span>{children}</label>; }
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="absolute inset-0" onClick={onClose} /><motion.div initial={{ opacity: 0, y: 8, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}><div className="mb-5 flex items-center justify-between"><h3 className="text-sm font-black text-slate-950">{title}</h3><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button></div>{children}</motion.div></div>; }
export function Actions({ onClose, onSave, busy, label }: { onClose: () => void; onSave: () => void; busy: boolean; label: string }) { return <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button><button onClick={onSave} disabled={busy} className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white disabled:opacity-50">{label}</button></div>; }
export function InvoiceRow({ invoice, onDownload }: { invoice: Invoice; onDownload: () => void }) { return <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="text-xs font-black text-slate-800">{invoice.invoiceNumber}</p><Status status={invoice.status} compact /></div><p className="mt-1 text-[10px] text-slate-500">Due {date(invoice.dueDate)} · {date(invoice.periodStart)} — {date(invoice.periodEnd)}</p></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-xs font-black text-slate-900">{money(invoice.totalAmount, invoice.currency)}</p>{Number(invoice.outstandingAmount || 0) > 0 && <p className="text-[9px] font-bold text-rose-600">{money(invoice.outstandingAmount, invoice.currency)} due</p>}</div><button onClick={onDownload} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-blue-700"><Download className="h-3.5 w-3.5" /></button></div></div>; }
export function ErrorText({ error }: { error: any }) { return <p className="rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700">{error?.response?.data?.message || error?.message || "Action failed."}</p>; }

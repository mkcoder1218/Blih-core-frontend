import React from "react";
import { Layers3 } from "lucide-react";
import type { SubscriptionPolicyInput } from "../../../api/types";
import type { CatalogFeature, CatalogModule, DraftFeature, PlanDraft } from "./types";

const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500";
const accessOptions = [
  { value: "full", label: "Full access" },
  { value: "read_only", label: "Read only" },
  { value: "business_admin_only", label: "Business admin only" },
  { value: "billing_only", label: "Billing only" },
  { value: "locked", label: "Completely locked" },
];

export function GeneralPanel({ draft, setDraft }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Field label="Plan name"><input value={draft.name} onChange={(e) => patch(setDraft, { name: e.target.value })} className={input} placeholder="Business Pro" /></Field>
      <Field label="Key"><input value={draft.key} onChange={(e) => patch(setDraft, { key: e.target.value })} className={input} placeholder="business-pro" /></Field>
      <Field label="Description" wide><textarea value={draft.description} onChange={(e) => patch(setDraft, { description: e.target.value })} className={`${input} min-h-24 resize-none`} placeholder="Who this plan is for and what it unlocks." /></Field>
      <NumberField label="Sort order" value={draft.sortOrder} onChange={(v) => patch(setDraft, { sortOrder: Math.round(v) })} />
      <Field label="Status">
        <button type="button" onClick={() => patch(setDraft, { isActive: !draft.isActive })} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold ${draft.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
          <span>{draft.isActive ? "Active and selectable" : "Inactive"}</span><Toggle on={draft.isActive} />
        </button>
      </Field>
    </div>
  );
}

export function PricingPanel({ draft, setDraft }: Props) {
  const saving = Math.max(0, draft.priceMonthly * 12 - draft.priceYearly);
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <NumberField label="Monthly price" value={draft.priceMonthly} suffix={draft.currency} onChange={(v) => patch(setDraft, { priceMonthly: v })} />
        <NumberField label="Yearly price" value={draft.priceYearly} suffix={draft.currency} onChange={(v) => patch(setDraft, { priceYearly: v })} />
        <NumberField label="Included seats" value={draft.includedSeats} onChange={(v) => patch(setDraft, { includedSeats: Math.max(0, Math.round(v)) })} />
        <NumberField label="Extra seat price" value={draft.extraSeatPrice} suffix={draft.currency} onChange={(v) => patch(setDraft, { extraSeatPrice: v })} />
      </div>
      <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div><p className="text-xs font-black text-slate-900">Yearly pricing is admin-controlled</p><p className="mt-1 text-[11px] leading-5 text-slate-500">No hardcoded discount. Set any annual amount that matches the commercial agreement.</p></div>
        <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Implied saving</p><p className="mt-1 text-lg font-black text-slate-900">{saving.toLocaleString()} {draft.currency}</p></div>
      </div>
      <div className="max-w-xs"><Field label="Currency"><input maxLength={3} value={draft.currency} onChange={(e) => patch(setDraft, { currency: e.target.value.toUpperCase() })} className={input} /></Field></div>
    </div>
  );
}

export function EntitlementsPanel({ draft, setDraft, modules, features }: Props & { modules: CatalogModule[]; features: CatalogFeature[] }) {
  return (
    <div className="space-y-7">
      <section>
        <h3 className="text-sm font-black text-slate-900">ERP modules</h3>
        <p className="mt-1 text-[11px] text-slate-500">Enabled plan modules are synchronized into each business runtime entitlement.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const row = draft.modules.find((m) => m.moduleKey === module.moduleKey);
            const enabled = Boolean(row?.isEnabled);
            return (
              <button key={module.moduleKey} type="button" onClick={() => setDraft((d) => ({ ...d, modules: d.modules.map((m) => m.moduleKey === module.moduleKey ? { ...m, isEnabled: !m.isEnabled } : m) }))} className={`rounded-2xl border p-4 text-left transition ${enabled ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <div className="flex items-center justify-between"><span className={`rounded-xl p-2 ${enabled ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}><Layers3 className="h-4 w-4" /></span><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${enabled ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{enabled ? "Enabled" : "Off"}</span></div>
                <p className="mt-3 text-xs font-black text-slate-900">{module.moduleName}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{module.description || module.moduleKey}</p>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-black text-slate-900">Features & limits</h3>
        <p className="mt-1 text-[11px] text-slate-500">Use the slider for speed, exact input for precision, or Unlimited when the plan has no cap.</p>
        <div className="mt-3 space-y-3">{features.map((feature) => {
          const value = draft.features.find((f) => f.featureId === feature.id);
          if (!value) return null;
          return <FeatureLimit key={feature.id} feature={feature} value={value} onChange={(next) => setDraft((d) => ({ ...d, features: d.features.map((f) => f.featureId === feature.id ? next : f) }))} />;
        })}</div>
      </section>
    </div>
  );
}

function FeatureLimit({ feature, value, onChange }: React.Attributes & { feature: CatalogFeature; value: DraftFeature; onChange: (v: DraftFeature) => void }) {
  const unlimited = value.limitValue == null;
  const max = feature.key === "employee_limit" ? 1000 : feature.key === "storage" ? 5000 : 100000;
  return (
    <div className={`rounded-2xl border p-4 ${value.isEnabled ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/60"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0"><div className="flex items-center gap-2"><button type="button" onClick={() => onChange({ ...value, isEnabled: !value.isEnabled })} className={`h-5 w-9 rounded-full p-0.5 ${value.isEnabled ? "bg-blue-600" : "bg-slate-300"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${value.isEnabled ? "translate-x-4" : ""}`} /></button><p className="text-xs font-black text-slate-900">{feature.name}</p>{feature.isMetered && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-700">Metered</span>}</div><p className="mt-1 text-[10px] text-slate-500">{feature.description || feature.key}</p></div>
        {value.isEnabled && <div className="flex flex-1 flex-col gap-3 lg:max-w-2xl"><div className="flex items-center gap-3"><input type="range" min={0} max={max} disabled={unlimited} value={Math.min(max, Number(value.limitValue || 0))} onChange={(e) => onChange({ ...value, limitValue: Number(e.target.value) })} className="w-full accent-blue-600" /><input type="number" min={0} disabled={unlimited} value={unlimited ? "" : value.limitValue ?? 0} onChange={(e) => onChange({ ...value, limitValue: Number(e.target.value) })} className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-blue-500" placeholder="∞" /><button type="button" onClick={() => onChange({ ...value, limitValue: unlimited ? 100 : null })} className={`rounded-xl border px-3 py-2 text-[10px] font-bold ${unlimited ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}>Unlimited</button></div><div className="flex flex-wrap gap-2"><select value={value.limitPeriod || "lifetime"} onChange={(e) => onChange({ ...value, limitPeriod: e.target.value as DraftFeature["limitPeriod"] })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-600"><option value="daily">Daily</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="lifetime">Lifetime</option></select>{feature.isMetered && <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5"><span className="text-[10px] font-semibold text-slate-500">Overage / {feature.unitName || "unit"}</span><input type="number" min={0} step="0.01" value={value.overageUnitPrice} onChange={(e) => onChange({ ...value, overageUnitPrice: Number(e.target.value) })} className="w-20 bg-transparent text-xs font-bold outline-none" /></label>}</div></div>}
      </div>
    </div>
  );
}

export function PolicyPanel({ draft, setDraft }: Props) {
  const policy = draft.policy;
  const update = (p: Partial<SubscriptionPolicyInput>) => setDraft((d) => ({ ...d, policy: { ...d.policy, ...p } }));
  return <div className="grid gap-5 lg:grid-cols-2"><NumberField label="Grace period days" value={Number(policy.gracePeriodDays ?? 7)} onChange={(v) => update({ gracePeriodDays: Math.max(0, Math.round(v)) })} /><Select label="Grace access" value={String(policy.graceAccessMode || "read_only")} options={accessOptions} onChange={(v) => update({ graceAccessMode: v as any })} /><Select label="After expiry / cancellation" value={String(policy.expiredAccessMode || "billing_only")} options={accessOptions} onChange={(v) => update({ expiredAccessMode: v as any })} /><NumberField label="Data retention days" value={Number(policy.retentionDays ?? 90)} onChange={(v) => update({ retentionDays: Math.max(0, Math.round(v)) })} /><Select label="Downgrade over-limit behavior" value={String(policy.downgradePolicy || "block")} options={[{ value: "block", label: "Block downgrade" }, { value: "allow_with_warning", label: "Allow with warning" }, { value: "restrict_new", label: "Allow, restrict new usage" }]} onChange={(v) => update({ downgradePolicy: v as any })} /><Field label="Automatic renewal"><button type="button" onClick={() => update({ autoRenew: !policy.autoRenew })} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold ${policy.autoRenew ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}><span>{policy.autoRenew ? "Enabled" : "Disabled while payments are manual"}</span><Toggle on={Boolean(policy.autoRenew)} /></button></Field></div>;
}

type Props = { draft: PlanDraft; setDraft: React.Dispatch<React.SetStateAction<PlanDraft>> };
function patch(setDraft: Props["setDraft"], value: Partial<PlanDraft>) { setDraft((d) => ({ ...d, ...value })); }
function Toggle({ on }: { on: boolean }) { return <span className={`h-5 w-9 rounded-full p-0.5 ${on ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${on ? "translate-x-4" : ""}`} /></span>; }
function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={`space-y-1.5 ${wide ? "lg:col-span-2" : ""}`}><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>{children}</label>; }
function NumberField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) { return <Field label={label}><div className="relative"><input type="number" min={0} step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))} className={`${input} ${suffix ? "pr-14" : ""}`} />{suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{suffix}</span>}</div></Field>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void }) { return <Field label={label}><select value={value} onChange={(e) => onChange(e.target.value)} className={input}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>; }

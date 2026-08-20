import { useMemo, useState } from "react";
import { ChevronRight, CreditCard, Layers3, Pencil, Plus, Settings2, SlidersHorizontal, Sparkles, Trash2, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/client";
import type { Plan, PlanFeatureConfig } from "../../../api/types";
import { usePlans } from "../../../hooks/usePlans";
import { useCreatePlan } from "../../../hooks/useCreatePlan";
import { useUpdatePlan } from "../../../hooks/useUpdatePlan";
import { useDeletePlan } from "../../../hooks/useDeletePlan";
import { ConfirmDialog } from "@/components/ui/blih";
import { EntitlementsPanel, GeneralPanel, PolicyPanel, PricingPanel } from "./Panels";
import { DEFAULT_POLICY, emptyDraft, normalizeFeatures, normalizeModules, type CatalogFeature, type CatalogModule, type PlanDraft } from "./types";

type Tab = "general" | "pricing" | "entitlements" | "policy";
type Alert = (msg: string, type?: "success" | "info" | "error") => void;
const money = (value: number | string, currency = "ETB") => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));

export default function PlanBuilder({ showAlert }: { showAlert: Alert }) {
  const plansQuery = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const catalog = useQuery({
    queryKey: ["plan-catalog"],
    queryFn: async () => (await api.get("/api/v1/plans/catalog")).data?.data as { modules: CatalogModule[]; features: CatalogFeature[] },
  });
  const plans: Plan[] = plansQuery.data?.data?.plans || [];
  const modules = catalog.data?.modules || [];
  const features = catalog.data?.features || [];
  const sorted = useMemo(() => [...plans].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || a.name.localeCompare(b.name)), [plans]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("general");
  const [editing, setEditing] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<PlanDraft>(emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const hydrate = (plan?: Plan | null): PlanDraft => ({
    ...emptyDraft(),
    name: plan?.name || "",
    key: plan?.key || "",
    description: plan?.description || "",
    priceMonthly: Number(plan?.priceMonthly || plan?.basePrice || 0),
    priceYearly: Number(plan?.priceYearly || 0),
    includedSeats: Number(plan?.includedSeats || 0),
    extraSeatPrice: Number(plan?.extraSeatPrice || 0),
    currency: plan?.currency || "ETB",
    isActive: Boolean(plan ? (plan.isActive ?? plan.status === "active") : true),
    sortOrder: Number(plan?.sortOrder || 0),
    modules: normalizeModules(modules, plan?.modules),
    features: normalizeFeatures(features, plan?.features),
    policy: { ...DEFAULT_POLICY, ...(plan?.subscriptionPolicy || {}) },
  });

  const showBuilder = (plan?: Plan | null) => {
    setEditing(plan || null); setDraft(hydrate(plan)); setTab("general"); setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.key.trim()) return showAlert("Plan name and key are required.", "error");
    const payload = {
      name: draft.name.trim(), key: draft.key.trim().toLowerCase().replace(/\s+/g, "-"), description: draft.description.trim() || null,
      basePrice: draft.priceMonthly, priceMonthly: draft.priceMonthly, priceYearly: draft.priceYearly, billingCycle: "monthly" as const,
      includedSeats: draft.includedSeats, extraSeatPrice: draft.extraSeatPrice, currency: draft.currency.toUpperCase(), isActive: draft.isActive,
      status: draft.isActive ? "active" as const : "inactive" as const, sortOrder: draft.sortOrder, userLimit: draft.includedSeats,
      modules: draft.modules,
      features: draft.features.map((f) => ({ ...f })) as PlanFeatureConfig[],
      policy: draft.policy,
    };
    try {
      if (editing) await updatePlan.mutateAsync({ id: editing.id, data: payload }); else await createPlan.mutateAsync(payload);
      showAlert(editing ? "Plan updated." : "Plan created.", "success"); setOpen(false);
    } catch (error: any) { showAlert(error?.response?.data?.message || error?.message || "Failed to save plan.", "error"); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try { await deletePlan.mutateAsync(deleteTarget.id); showAlert("Plan deleted.", "success"); setDeleteTarget(null); }
    catch (error: any) { showAlert(error?.response?.data?.message || error?.message || "Failed to delete plan.", "error"); }
  };

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_5px_22px_rgba(0,0,0,.015)] md:flex-row md:items-end md:justify-between">
      <div><span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9.5px] font-black uppercase tracking-widest text-blue-700">Subscription catalog</span><h1 className="mt-3 text-xl font-black tracking-tight text-slate-950">Plans & Entitlements</h1><p className="mt-1 text-xs font-medium text-slate-500">Pricing, seats, ERP modules, feature limits and lifecycle policy in one builder.</p></div>
      <button onClick={() => showBuilder()} disabled={catalog.isLoading} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"><Plus className="h-4 w-4" />Create Plan</button>
    </header>
    <div className="grid gap-4 xl:grid-cols-3">{sorted.map((plan) => {
      const enabledModules = (plan.modules || []).filter((m) => m.isEnabled).length;
      const enabledFeatures = (plan.features || []).filter((f) => f.isEnabled).length;
      return <article key={plan.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_5px_18px_rgba(0,0,0,.015)]">
        <div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><h2 className="text-base font-black text-slate-950">{plan.name}</h2><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${plan.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{plan.isActive ? "Active" : "Inactive"}</span></div><p className="mt-1 min-h-8 text-[10px] leading-4 text-slate-500">{plan.description || "No description"}</p></div><div className="flex gap-1"><button onClick={() => showBuilder(plan)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-800"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => setDeleteTarget(plan)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button></div></div>
        <div className="mt-5 flex items-end gap-2"><strong className="text-3xl font-black tracking-tight text-slate-950">{money(plan.priceMonthly || plan.basePrice, plan.currency)}</strong><span className="pb-1 text-[10px] font-semibold text-slate-400">/ month</span></div><p className="mt-1 text-[10px] text-slate-400">{money(plan.priceYearly || 0, plan.currency)} / year</p>
        <div className="mt-5 grid grid-cols-3 gap-2"><Metric icon={Users} label="Seats" value={String(plan.includedSeats)} /><Metric icon={Layers3} label="Modules" value={String(enabledModules)} /><Metric icon={Sparkles} label="Features" value={String(enabledFeatures)} /></div>
        <button onClick={() => showBuilder(plan)} className="mt-5 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700"><span>Configure plan</span><ChevronRight className="h-4 w-4" /></button>
      </article>;
    })}</div>
    {!plansQuery.isLoading && !sorted.length && <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs font-semibold text-slate-400">No plans yet. Create the first commercial plan.</div>}

    <AnimatePresence>{open && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="absolute inset-0" onClick={() => setOpen(false)} /><motion.div initial={{ opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .985 }} className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600">Plan builder</p><h2 className="mt-1 text-lg font-black text-slate-950">{editing ? `Edit ${editing.name}` : "Create subscription plan"}</h2></div><button onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button></div>
      <nav className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-3">{([ ["general","General",Settings2],["pricing","Pricing",CreditCard],["entitlements","Modules & limits",SlidersHorizontal],["policy","Lifecycle",Sparkles] ] as const).map(([key,label,Icon]) => <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black ${tab === key ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</nav>
      <div className="flex-1 overflow-y-auto p-6">{tab === "general" && <GeneralPanel draft={draft} setDraft={setDraft} />}{tab === "pricing" && <PricingPanel draft={draft} setDraft={setDraft} />}{tab === "entitlements" && <EntitlementsPanel draft={draft} setDraft={setDraft} modules={modules} features={features} />}{tab === "policy" && <PolicyPanel draft={draft} setDraft={setDraft} />}</div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4"><p className="text-[10px] font-semibold text-slate-500">{draft.modules.filter((m) => m.isEnabled).length} modules · {draft.features.filter((f) => f.isEnabled).length} features</p><div className="flex gap-2"><button onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-white">Cancel</button><button onClick={save} disabled={createPlan.isPending || updatePlan.isPending} className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50">{editing ? "Save changes" : "Create plan"}</button></div></div>
    </motion.div></div>}</AnimatePresence>
    <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} title="Delete Plan" description={deleteTarget ? `Delete plan “${deleteTarget.name}”? Active subscriptions must be moved first.` : undefined} confirmLabel="Delete" variant="destructive" loading={deletePlan.isPending} />
  </div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><Icon className="h-3.5 w-3.5 text-blue-600" /><p className="mt-2 text-sm font-black text-slate-900">{value}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p></div>; }

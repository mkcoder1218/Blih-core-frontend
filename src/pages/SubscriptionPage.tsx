import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, CreditCard, Gauge, ReceiptText, Sparkles, Users, X } from "lucide-react";
import { subscriptionApi, type Plan } from "../api/subscriptions";
import { useMe } from "../hooks/useMe";

const money = (value: string | number, currency = "ETB") => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value?: string) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "—";
const statusTone: Record<string, string> = { active: "bg-emerald-50 text-emerald-700", trialing: "bg-blue-50 text-blue-700", paid: "bg-emerald-50 text-emerald-700", issued: "bg-amber-50 text-amber-700", past_due: "bg-rose-50 text-rose-700" };

export default function SubscriptionPage() {
  const qc = useQueryClient();
  const me = useMe();
  const isPlatformAdmin = Boolean(me.data?.data?.user?.isPlatformSuperAdmin);
  const [message, setMessage] = useState("");
  const current = useQuery({ queryKey: ["subscription-current"], queryFn: subscriptionApi.current, enabled: !isPlatformAdmin });
  const plans = useQuery({ queryKey: ["subscription-plans"], queryFn: subscriptionApi.plans });
  const features = useQuery({ queryKey: ["subscription-features"], queryFn: subscriptionApi.features, enabled: !isPlatformAdmin });
  const usage = useQuery({ queryKey: ["subscription-usage"], queryFn: subscriptionApi.usage, enabled: !isPlatformAdmin });
  const invoices = useQuery({ queryKey: ["subscription-invoices"], queryFn: subscriptionApi.invoices, enabled: !isPlatformAdmin });
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ["subscription"] }); await Promise.all(["current","plans","features","usage","invoices"].map(k => qc.invalidateQueries({ queryKey: [`subscription-${k}`] }))); };
  const action = useMutation({
    mutationFn: ({ type, planId }: { type: "change" | "cancel" | "reactivate"; planId?: string }) =>
      type === "change" ? subscriptionApi.changePlan(planId!) : type === "cancel" ? subscriptionApi.cancel() : subscriptionApi.reactivate(),
    onSuccess: async (_data, vars) => { setMessage(vars.type === "change" ? "Your plan change has been saved." : vars.type === "cancel" ? "Cancellation is scheduled for period end." : "Subscription reactivated."); await refresh(); },
    onError: (e: any) => setMessage(e?.response?.data?.message || "We couldn't complete that action.")
  });
  const sub = current.data;
  const activePlan = sub?.Plan || plans.data?.find(p => p.id === sub?.planId);
  const enabled = features.data?.filter(f => f.isEnabled) || [];
  const usageTotal = useMemo(() => (usage.data || []).reduce((sum, row) => sum + Number(row.totalPrice || 0), 0), [usage.data]);

  if (!isPlatformAdmin && current.isLoading) return <div className="p-12 text-center text-sm text-slate-500">Loading subscription…</div>;
  if (isPlatformAdmin) return <PlatformPlanCatalog plans={plans.data || []} loading={plans.isLoading} />;
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Billing & access</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Subscription</h1><p className="mt-1 text-sm text-slate-500">Manage your plan, feature access, usage and invoices.</p></div>
        {sub && <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${statusTone[sub.status] || "bg-slate-100 text-slate-700"}`}>{sub.status.replace("_", " ")}</span>}
      </div>
      {message && <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800"><span>{message}</span><button onClick={() => setMessage("")}><X className="h-4 w-4" /></button></div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1.35fr_.65fr]">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-600 p-2.5 text-white"><Sparkles className="h-5 w-5" /></div><div><p className="text-xs font-semibold text-slate-500">Current plan</p><h2 className="text-xl font-bold text-slate-950">{activePlan?.name || "No active plan"}</h2></div></div>
            {activePlan && <div className="mt-7 flex items-end gap-2"><span className="text-4xl font-bold tracking-tight text-slate-950">{money(activePlan.basePrice, activePlan.currency)}</span><span className="pb-1 text-sm text-slate-500">/ {activePlan.billingCycle === "monthly" ? "month" : "year"}</span></div>}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric icon={Users} label="Included seats" value={String(activePlan?.includedSeats ?? 0)} />
              <Metric icon={CreditCard} label="Extra seat" value={activePlan ? money(activePlan.extraSeatPrice, activePlan.currency) : "—"} />
              <Metric icon={Gauge} label="Usage this period" value={money(usageTotal, activePlan?.currency)} />
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/70 p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Billing period</p>
            <p className="mt-3 text-sm font-semibold text-slate-900">{date(sub?.currentPeriodStart)} — {date(sub?.currentPeriodEnd)}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{sub?.cancelAtPeriodEnd ? "Your subscription will end at the close of this period." : "Your subscription renews automatically at period end."}</p>
            <button disabled={action.isPending} onClick={() => action.mutate({ type: sub?.cancelAtPeriodEnd ? "reactivate" : "cancel" })} className="mt-5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-slate-400 disabled:opacity-50">{sub?.cancelAtPeriodEnd ? "Reactivate subscription" : "Cancel at period end"}</button>
          </div>
        </div>
      </section>

      <section><div className="mb-3"><h2 className="text-base font-bold text-slate-950">Available plans</h2><p className="text-xs text-slate-500">Upgrades apply immediately. Downgrades take effect after your billing period.</p></div>
        <div className="grid gap-4 lg:grid-cols-3">{(plans.data || []).map(plan => <PlanCard key={plan.id} plan={plan} current={plan.id === sub?.planId} pending={plan.id === sub?.pendingPlanId} busy={action.isPending} onChoose={() => action.mutate({ type: "change", planId: plan.id })} />)}</div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-base font-bold text-slate-950">Included features</h2><div className="mt-4 divide-y divide-slate-100">{enabled.map(item => <div key={item.id} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><span className="rounded-full bg-emerald-50 p-1 text-emerald-600"><Check className="h-3.5 w-3.5" /></span><span className="text-sm font-medium text-slate-800">{item.feature.name}</span></div><span className="text-xs font-semibold text-slate-500">{item.limitValue == null ? "Unlimited" : `${Number(item.limitValue)}${item.limitPeriod ? ` / ${item.limitPeriod}` : ""}`}</span></div>)}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-950">Recent invoices</h2><ReceiptText className="h-5 w-5 text-slate-400" /></div><div className="mt-4 divide-y divide-slate-100">{(invoices.data || []).slice(0, 5).map(invoice => <div key={invoice.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold text-slate-800">{invoice.invoiceNumber}</p><p className="text-xs text-slate-500">Due {date(invoice.dueDate)}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{money(invoice.totalAmount, invoice.currency)}</p><span className={`text-[10px] font-bold uppercase ${statusTone[invoice.status]?.split(" ").at(-1) || "text-slate-500"}`}>{invoice.status}</span></div></div>)}{!invoices.data?.length && <p className="py-8 text-center text-sm text-slate-400">No invoices yet.</p>}</div></section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: any) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><Icon className="h-4 w-4 text-blue-600" /><p className="mt-3 text-lg font-bold text-slate-900">{value}</p><p className="text-[11px] font-medium text-slate-500">{label}</p></div>; }
function PlanCard({ plan, current, pending, busy, onChoose }: { key?: string; plan: Plan; current: boolean; pending: boolean; busy: boolean; onChoose: () => void }) {
  const visible = (plan.features || []).filter(f => f.isEnabled).slice(0, 5);
  return <article className={`relative rounded-2xl border bg-white p-6 shadow-sm transition ${current ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md"}`}>{current && <span className="absolute right-4 top-4 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">Current</span>}<h3 className="text-lg font-bold text-slate-950">{plan.name}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{plan.description}</p><p className="mt-5 text-2xl font-bold text-slate-950">{money(plan.basePrice, plan.currency)} <span className="text-xs font-medium text-slate-400">/ {plan.billingCycle}</span></p><div className="mt-5 space-y-2">{visible.map(f => <div key={f.id} className="flex items-center gap-2 text-xs text-slate-600"><Check className="h-3.5 w-3.5 text-emerald-500" />{f.feature.name}</div>)}</div><button disabled={current || busy} onClick={onChoose} className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${current ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700"} disabled:cursor-not-allowed`}>{pending ? "Scheduled" : current ? "Current plan" : "Choose plan"}{!current && <ChevronRight className="h-4 w-4" />}</button></article>;
}

function PlatformPlanCatalog({ plans, loading }: { plans: Plan[]; loading: boolean }) {
  return <div className="mx-auto max-w-7xl space-y-6 pb-10">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Platform billing</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Subscription catalog</h1><p className="mt-1 text-sm text-slate-500">A clear view of the plans and entitlements available to businesses.</p></div>
    <div className="grid gap-4 md:grid-cols-3">{loading ? <p className="text-sm text-slate-500">Loading plans…</p> : plans.map(plan => <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-slate-950">{plan.name}</h2><p className="mt-1 text-xs text-slate-500">{plan.description}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">Active</span></div><p className="mt-6 text-3xl font-bold text-slate-950">{money(plan.basePrice, plan.currency)} <span className="text-xs font-medium text-slate-400">/ {plan.billingCycle}</span></p><div className="mt-5 grid grid-cols-2 gap-3"><Metric icon={Users} label="Included seats" value={String(plan.includedSeats)} /><Metric icon={CreditCard} label="Extra seat" value={money(plan.extraSeatPrice, plan.currency)} /></div><div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Entitlements</p><div className="space-y-2">{(plan.features || []).filter(f => f.isEnabled).map(f => <div key={f.id} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-700"><Check className="h-3.5 w-3.5 text-emerald-500" />{f.feature.name}</span><span className="font-semibold text-slate-400">{f.limitValue == null ? "Unlimited" : Number(f.limitValue)}</span></div>)}</div></div></article>)}</div>
  </div>;
}

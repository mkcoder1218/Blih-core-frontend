import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, CreditCard, Download, Gauge, ReceiptText, ShieldCheck, Sparkles, Users, WalletCards } from "lucide-react";
import { subscriptionApi, type Plan } from "../../api/subscriptions";
import { Card, Empty, Heading, InvoiceRow, Loading, Metric, Status, date, money } from "./SubscriptionUi";

export default function BusinessSubscriptionView() {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const current = useQuery({ queryKey: ["subscription-current"], queryFn: subscriptionApi.current });
  const plans = useQuery({ queryKey: ["subscription-plans"], queryFn: subscriptionApi.plans });
  const features = useQuery({ queryKey: ["subscription-features"], queryFn: subscriptionApi.features });
  const usage = useQuery({ queryKey: ["subscription-usage"], queryFn: subscriptionApi.usage });
  const invoices = useQuery({ queryKey: ["subscription-invoices"], queryFn: subscriptionApi.invoices });
  const payments = useQuery({ queryKey: ["subscription-payments"], queryFn: subscriptionApi.payments });
  const sub = current.data?.subscription;
  const policy = current.data?.policy?.effective;
  const activePlan = sub?.Plan || plans.data?.find((p) => p.id === sub?.planId);
  const usageTotal = useMemo(() => (usage.data || []).reduce((sum, row) => sum + Number(row.totalPrice || 0), 0), [usage.data]);

  const refresh = async () => Promise.all([
    qc.invalidateQueries({ queryKey: ["subscription-current"] }), qc.invalidateQueries({ queryKey: ["subscription-plans"] }),
    qc.invalidateQueries({ queryKey: ["subscription-features"] }), qc.invalidateQueries({ queryKey: ["subscription-usage"] }),
    qc.invalidateQueries({ queryKey: ["subscription-invoices"] }), qc.invalidateQueries({ queryKey: ["subscription-payments"] }),
  ]);

  const action = useMutation({
    mutationFn: ({ type, planId }: { type: "change" | "cancel" | "reactivate"; planId?: string }) => type === "change" ? subscriptionApi.changePlan(planId!) : type === "cancel" ? subscriptionApi.cancel() : subscriptionApi.reactivate(),
    onSuccess: async (data: any, vars) => {
      const invoice = data?.adjustment?.type === "invoice" ? ` Prorated invoice: ${money(data.adjustment.amount, activePlan?.currency)}.` : "";
      setMessage(vars.type === "change" ? `Plan change saved.${invoice}` : vars.type === "cancel" ? "Cancellation is scheduled for the end of the paid period." : "Subscription reactivated.");
      await refresh();
    },
    onError: (error: any) => setMessage(error?.response?.data?.message || error?.message || "Action failed."),
  });

  if (current.isLoading) return <Loading text="Loading subscription…" />;
  if (!sub) return <Empty title="No subscription assigned" description="Ask the Platform Admin to assign a plan to this business." />;
  const price = sub.billingCycle === "yearly" ? Number(activePlan?.priceYearly || 0) : Number(activePlan?.priceMonthly || activePlan?.basePrice || 0);
  const enabled = (features.data || []).filter((f) => f.isEnabled);

  return <div className="space-y-5 pb-10">
    <Heading eyebrow="Billing & access" title="Subscription" description="Plan, limits, usage, invoices and payment receipts." right={<Status status={sub.status} />} />
    {message && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-800">{message}<button onClick={() => setMessage("")} className="float-right">×</button></div>}
    {!["active", "trialing"].includes(sub.status) && <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" /><div><p className="text-xs font-black text-amber-900">Access is {sub.status.replace(/_/g, " ")}</p><p className="mt-1 text-[11px] text-amber-700">Policy mode: {String(policy?.graceAccessMode || policy?.expiredAccessMode || "billing_only").replace(/_/g, " ")}. Billing remains available so access can be restored.</p></div></div>}

    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_5px_22px_rgba(0,0,0,.015)]"><div className="grid xl:grid-cols-[1.35fr_.65fr]"><div className="p-6 sm:p-7"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-600 p-2.5 text-white"><Sparkles className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current plan</p><h2 className="text-xl font-black text-slate-950">{activePlan?.name || "Plan"}</h2></div></div><div className="mt-6 flex items-end gap-2"><span className="text-4xl font-black tracking-tight text-slate-950">{money(price, activePlan?.currency)}</span><span className="pb-1 text-xs font-semibold text-slate-400">/ {sub.billingCycle === "yearly" ? "year" : "month"}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><Metric icon={Users} label="Included seats" value={String(activePlan?.includedSeats ?? 0)} /><Metric icon={CreditCard} label="Extra seat" value={activePlan ? money(activePlan.extraSeatPrice, activePlan.currency) : "—"} /><Metric icon={Gauge} label="Usage" value={money(usageTotal, activePlan?.currency)} /><Metric icon={WalletCards} label="Credit" value={money(sub.creditBalance, activePlan?.currency)} /></div></div><div className="border-t border-slate-100 bg-slate-50/70 p-6 xl:border-l xl:border-t-0"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Billing period</p><p className="mt-3 text-sm font-black text-slate-900">{date(sub.currentPeriodStart)} — {date(sub.currentPeriodEnd)}</p>{sub.trialEndsAt && <p className="mt-2 text-[11px] text-blue-700">Trial ends {date(sub.trialEndsAt)}</p>}<p className="mt-3 text-[11px] leading-5 text-slate-500">{sub.cancelAtPeriodEnd ? "Cancellation is scheduled at period end." : "Manual renewal is active; renewal invoices are confirmed by Platform Admin."}</p><button disabled={action.isPending} onClick={() => action.mutate({ type: sub.cancelAtPeriodEnd ? "reactivate" : "cancel" })} className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black text-slate-700 disabled:opacity-50">{sub.cancelAtPeriodEnd ? "Keep subscription" : "Cancel at period end"}</button></div></div></section>

    <section><div className="mb-3"><h2 className="text-sm font-black text-slate-950">Available plans</h2><p className="mt-1 text-[10px] text-slate-500">Upgrades are prorated and activate after payment. Downgrades follow the configured limit policy.</p></div><div className="grid gap-4 lg:grid-cols-3">{(plans.data || []).map((plan) => <PlanCard key={plan.id} plan={plan} current={plan.id === sub.planId} pending={plan.id === sub.pendingPlanId} busy={action.isPending} onChoose={() => action.mutate({ type: "change", planId: plan.id })} />)}</div></section>

    <div className="grid gap-5 xl:grid-cols-2"><Card title="Included features">{enabled.length ? <div className="divide-y divide-slate-100">{enabled.map((item) => <div key={item.featureId} className="flex items-center justify-between gap-3 py-3"><div className="flex items-center gap-2.5"><span className="rounded-full bg-emerald-50 p-1 text-emerald-600"><Check className="h-3.5 w-3.5" /></span><span className="text-xs font-bold text-slate-800">{item.feature.name}</span></div><span className="text-[10px] font-bold text-slate-400">{item.limitValue == null ? "Unlimited" : `${Number(item.limitValue).toLocaleString()}${item.limitPeriod ? ` / ${item.limitPeriod}` : ""}`}</span></div>)}</div> : <p className="py-6 text-center text-xs text-slate-400">No feature entitlements configured.</p>}</Card><Card title="Recent invoices">{(invoices.data || []).length ? <div className="divide-y divide-slate-100">{(invoices.data || []).slice(0, 6).map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} onDownload={() => subscriptionApi.downloadInvoice(invoice.id)} />)}</div> : <p className="py-6 text-center text-xs text-slate-400">No invoices yet.</p>}</Card></div>
    <Card title="Payment receipts">{(payments.data || []).length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(payments.data || []).slice(0, 9).map((payment) => <div key={payment.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-black text-slate-900">{money(payment.amount, payment.currency)}</p><p className="mt-1 text-[10px] text-slate-500">{payment.providerReference || "Manual payment"} · {date(payment.paidAt)}</p></div><Status status={payment.status} compact /></div><button onClick={() => subscriptionApi.downloadPaymentReceipt(payment.id)} className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-blue-700"><Download className="h-3.5 w-3.5" />Download receipt</button></div>)}</div> : <p className="py-6 text-center text-xs text-slate-400">No payments recorded yet.</p>}</Card>
  </div>;
}

function PlanCard({ plan, current, pending, busy, onChoose }: { plan: Plan; current: boolean; pending: boolean; busy: boolean; onChoose: () => void }) {
  return <article className={`relative rounded-3xl border bg-white p-5 shadow-sm ${current ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-100"}`}>{current && <span className="absolute right-4 top-4 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase text-blue-700">Current</span>}<h3 className="text-base font-black text-slate-950">{plan.name}</h3><p className="mt-1 min-h-8 text-[10px] leading-4 text-slate-500">{plan.description}</p><p className="mt-4 text-2xl font-black text-slate-950">{money(plan.priceMonthly || plan.basePrice, plan.currency)} <span className="text-[10px] font-semibold text-slate-400">/ month</span></p><p className="mt-1 text-[10px] text-slate-400">{money(plan.priceYearly, plan.currency)} / year</p><button disabled={current || busy || pending} onClick={onChoose} className={`mt-5 w-full rounded-xl px-4 py-2.5 text-[11px] font-black ${current ? "bg-slate-100 text-slate-400" : pending ? "bg-amber-50 text-amber-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}>{pending ? "Awaiting payment" : current ? "Current plan" : "Choose plan"}</button></article>;
}

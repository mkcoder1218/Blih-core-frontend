import React from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  RefreshCw,
} from "lucide-react";
import { PageHeader, StatCard, StatCardGrid } from "@/components/ui/blih";
import { useMyPermissions } from "../../hooks/usePermissions";
import {
  useEmployeeProbation,
  useEmployeeProbations,
  useSubmitProbationFinalDecision,
  useSubmitProbationHrReview,
  useSubmitProbationManagerReview,
} from "../../hooks/useEmployeeProbation";
import type {
  EmployeeProbationRecord,
  EmployeeProbationStatus,
  ProbationFinalDecisionPayload,
  ProbationReviewPayload,
} from "../../api/employeeProbation";
import { ProbationDetailsDialog } from "./components/ProbationDetailsDialog";
import { ProbationReviewDialog } from "./components/ProbationReviewDialog";
import { ProbationDecisionDialog } from "./components/ProbationDecisionDialog";
import { MyProbationPanel } from "./MyProbationPanel";


const statuses: Array<{ value: EmployeeProbationStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "MANAGER_REVIEW_PENDING", label: "Manager review pending" },
  { value: "HR_REVIEW_PENDING", label: "HR review pending" },
  { value: "FINAL_APPROVAL_PENDING", label: "Final approval pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "EXTENDED", label: "Extended" },
  { value: "TERMINATED", label: "Terminated" },
];

function daysRemaining(value: string) {
  return Math.ceil((new Date(`${value}T00:00:00`).getTime() - Date.now()) / 86400000);
}

function errorMessage(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate?.response?.data?.message || candidate?.message || "The probation action failed.";
}

export function ProbationDashboard() {
  const permissions = useMyPermissions();
  const canManage = permissions.hasAny("performance.manage", "hr.write");
  const canRead = permissions.hasAny("performance.read", "performance.manage", "onboarding.read", "onboarding.manage", "hr.read", "hr.write");
  const [mode, setMode] = React.useState<"admin" | "mine">(canRead ? "admin" : "mine");
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<EmployeeProbationStatus | "">("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [reviewMode, setReviewMode] = React.useState<"manager" | "hr" | null>(null);
  const [decisionOpen, setDecisionOpen] = React.useState(false);
  const [actionError, setActionError] = React.useState("");

  const list = useEmployeeProbations({ page, size: 10, search: search.trim() || undefined, status: status || undefined });
  const detail = useEmployeeProbation(selectedId || undefined);
  const managerReview = useSubmitProbationManagerReview();
  const hrReview = useSubmitProbationHrReview();
  const finalDecision = useSubmitProbationFinalDecision();

  const rows = list.data?.rows || [];
  const summary = React.useMemo(() => {
    const active = rows.filter((row) => ["ACTIVE", "REVIEW_DUE", "MANAGER_REVIEW_PENDING", "HR_REVIEW_PENDING", "FINAL_APPROVAL_PENDING"].includes(row.status)).length;
    const ending = rows.filter((row) => {
      const days = daysRemaining(row.expectedEndDate);
      return days >= 0 && days <= 7;
    }).length;
    const completed = rows.filter((row) => ["CONFIRMED", "EXTENDED", "TERMINATED"].includes(row.status)).length;
    const pending = rows.filter((row) => ["HR_REVIEW_PENDING", "FINAL_APPROVAL_PENDING"].includes(row.status)).length;
    return { active, ending, completed, pending };
  }, [rows]);

  const openDetails = (row: EmployeeProbationRecord) => {
    setSelectedId(row.id);
    setActionError("");
  };

  const submitReview = async (payload: ProbationReviewPayload) => {
    if (!selectedId || !reviewMode) return;
    setActionError("");
    try {
      if (reviewMode === "manager") {
        await managerReview.mutateAsync({ probationId: selectedId, payload });
      } else {
        await hrReview.mutateAsync({ probationId: selectedId, payload });
      }
      setReviewMode(null);
    } catch (error) {
      setActionError(errorMessage(error));
    }
  };

  const submitDecision = async (payload: ProbationFinalDecisionPayload) => {
    if (!selectedId) return;
    setActionError("");
    try {
      await finalDecision.mutateAsync({ probationId: selectedId, payload });
      setDecisionOpen(false);
    } catch (error) {
      setActionError(errorMessage(error));
    }
  };

  return (
    <div id="tab-probation-pane" className="space-y-4 pb-8 font-sans">
      <PageHeader
        eyebrow="Onboarding"
        title="Performance and probation"
        description="Track probation, complete competency reviews, approve decisions, and monitor deadlines."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setMode("mine")} className={`rounded-xl px-3 py-2 text-xs font-black ${mode === "mine" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>My probation</button>
            {canRead ? <button onClick={() => setMode("admin")} className={`rounded-xl px-3 py-2 text-xs font-black ${mode === "admin" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>Team dashboard</button> : null}
          </div>
        }
      />

      {mode === "mine" ? <MyProbationPanel /> : (
        <>
          <StatCardGrid cols={4}>
            <StatCard label="Active probation" value={summary.active} icon={<Clock3 className="h-4 w-4" />} tone="blue" />
            <StatCard label="Ending within 7 days" value={summary.ending} icon={<AlertTriangle className="h-4 w-4" />} tone="amber" />
            <StatCard label="Completed on page" value={summary.completed} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
            <StatCard label="Pending HR action" value={summary.pending} icon={<CalendarDays className="h-4 w-4" />} tone="rose" />
          </StatCardGrid>

          <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search employee or email..." className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500" />
            <select value={status} onChange={(event) => { setStatus(event.target.value as EmployeeProbationStatus | ""); setPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-500">
              {statuses.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}
            </select>
            <button onClick={() => list.refetch()} disabled={list.isFetching} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-600 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${list.isFetching ? "animate-spin" : ""}`} />Refresh</button>
          </div>

          {actionError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{actionError}</div> : null}
          {list.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{errorMessage(list.error)}</div> : null}

          <div className="overflow-visible rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Department / Position</th><th className="px-4 py-3">Manager</th><th className="px-4 py-3">End date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Score</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.isLoading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-xs font-bold text-slate-400">Loading probation records...</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-xs font-bold text-slate-400">No probation records found.</td></tr> : rows.map((row) => {
                  const days = daysRemaining(row.expectedEndDate);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3"><p className="font-black text-slate-900">{row.employee?.fullName || "Employee"}</p><p className="mt-0.5 text-[10px] text-slate-400">{row.employee?.email || ""}</p></td>
                      <td className="px-4 py-3"><p className="font-bold text-slate-700">{row.department?.name || "—"}</p><p className="mt-0.5 text-[10px] text-slate-400">{row.position?.title || "—"}</p></td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{row.manager?.fullName || "—"}</td>
                      <td className="px-4 py-3"><p className="font-bold text-slate-700">{new Date(`${row.expectedEndDate}T00:00:00`).toLocaleDateString()}</p><p className={`mt-0.5 text-[10px] font-bold ${days < 0 ? "text-rose-600" : days <= 7 ? "text-amber-600" : "text-slate-400"}`}>{days < 0 ? `${Math.abs(days)} days overdue` : `${days} days remaining`}</p></td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-700">{row.status.replaceAll("_", " ")}</span></td>
                      <td className="px-4 py-3 font-black text-slate-900">{row.finalScore == null ? "—" : `${Number(row.finalScore).toFixed(2)}%`}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button onClick={() => openDetails(row)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-600"><Eye className="h-3 w-3" />View</button>
                          {canManage && ["ACTIVE", "REVIEW_DUE", "MANAGER_REVIEW_PENDING"].includes(row.status) ? <button onClick={() => { openDetails(row); setReviewMode("manager"); }} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700">Manager review</button> : null}
                          {canManage && row.status === "HR_REVIEW_PENDING" ? <button onClick={() => { openDetails(row); setReviewMode("hr"); }} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-700">HR review</button> : null}
                          {canManage && row.status === "FINAL_APPROVAL_PENDING" ? <button onClick={() => { openDetails(row); setDecisionOpen(true); }} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700">Final decision</button> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-500">{list.data?.total || 0} total records</p>
            <div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><span className="text-xs font-black text-slate-600">{page} / {list.data?.totalPages || 1}</span><button disabled={page >= (list.data?.totalPages || 1)} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div>
          </div>
        </>
      )}

      <ProbationDetailsDialog probation={detail.data || null} onClose={() => setSelectedId(null)} />
      <ProbationReviewDialog open={Boolean(reviewMode)} mode={reviewMode || "manager"} probation={detail.data || null} loading={managerReview.isPending || hrReview.isPending} onClose={() => setReviewMode(null)} onSubmit={submitReview} />
      <ProbationDecisionDialog open={decisionOpen} probation={detail.data || null} loading={finalDecision.isPending} onClose={() => setDecisionOpen(false)} onSubmit={submitDecision} />
    </div>
  );
}

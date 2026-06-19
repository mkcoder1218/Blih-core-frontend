import React from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import { PageHeader, SectionCard, InfoAlert, LoadingSpinner } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { useMyAttendanceToday } from "../../hooks/useMyAttendanceToday";
import { useAttendanceRequests, useSubmitAttendanceRequest } from "../../hooks/useAttendanceRequests";

const ADDIS_ABABA_TZ = "Africa/Addis_Ababa";

function localYmd(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ADDIS_ABABA_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function localHm(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: ADDIS_ABABA_TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function beforeDeadline(date: Date) {
  const [hour, minute] = localHm(date).split(":").map(Number);
  return hour * 60 + minute < 8 * 60 + 30;
}

function statusTone(status: string) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";
  if (status === "rejected" || status === "invalid" || status === "expired") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

export default function MyLatenessReasonPage() {
  const today = useMyAttendanceToday();
  const submit = useSubmitAttendanceRequest();
  const history = useAttendanceRequests({ requestType: "lateness_notice", mine: true, size: 50 });
  const balances: any[] = (today.data?.data as any)?.latenessReasonBalances || [];
  const options = balances.filter((item) => item.enabled);
  const now = new Date();
  const canSubmitNow = beforeDeadline(now);
  const [reasonCode, setReasonCode] = React.useState("");
  const [reasonText, setReasonText] = React.useState("");
  const [error, setError] = React.useState("");

  const selected = options.find((item) => item.reasonCode === reasonCode) || null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Attendance"
        title="My Lateness Reason"
        description="Submit lateness requests before 08:30 and track your reason credit."
      />

      {!canSubmitNow ? (
        <InfoAlert
          variant="warning"
          message="Late reason requests are only allowed before 08:30 AM Addis Ababa time."
        />
      ) : null}

      <SectionCard title="Submit Late Reason">
        {error ? <InfoAlert variant="error" message={error} className="mb-3" /> : null}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason</span>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={!canSubmitNow || submit.isPending}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700"
            >
              <option value="">Select reason</option>
              {options.map((item) => (
                <option key={item.reasonCode} value={item.reasonCode} disabled={!item.canUse}>
                  {item.label} ({item.remainingThisMonth}/{item.monthlyLimit} left)
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 lg:col-span-2">
            {selected ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <span>Used: {selected.usedThisMonth}</span>
                <span>Remaining: {selected.remainingThisMonth}</span>
                <span>Limit: {selected.monthlyLimit}/month</span>
                <span>Covers: {selected.coversMinutes} min</span>
              </div>
            ) : (
              <span>Select a reason to see credit.</span>
            )}
          </div>
        </div>
        {selected?.blockedReason ? (
          <div className="mt-2 text-[11px] font-bold text-rose-700">Blocked: {selected.blockedReason}</div>
        ) : null}
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={4}
          disabled={!canSubmitNow || submit.isPending}
          className="mt-3 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700"
          placeholder="Write the exact reason you want HR to review..."
        />
        <Button
          disabled={!canSubmitNow || submit.isPending}
          onClick={async () => {
            setError("");
            if (!reasonCode) return setError("Select a reason.");
            if (!reasonText.trim()) return setError("Write your exact reason.");
            if (selected && !selected.canUse) return setError(selected.blockedReason || "This reason cannot be used.");
            try {
              const ymd = localYmd(new Date());
              await submit.mutateAsync({
                requestType: "lateness_notice",
                category: reasonCode,
                reasonCategory: reasonCode,
                title: `Late reason - ${selected?.label || reasonCode}`,
                reason: reasonText.trim(),
                reasonText: reasonText.trim(),
                fromAt: `${ymd}T08:00`,
              });
              setReasonCode("");
              setReasonText("");
              await today.refetch();
            } catch (e: any) {
              setError(e?.response?.data?.message || e?.message || "Failed to submit late reason.");
            }
          }}
          className="mt-4 bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white text-xs h-9 rounded-xl"
        >
          {submit.isPending ? "Submitting..." : "Submit Late Reason"}
        </Button>
      </SectionCard>

      <SectionCard title="Reason Credit">
        {today.isLoading ? <LoadingSpinner label="Loading..." /> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {balances.map((item) => (
            <div key={item.reasonCode} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-slate-900">{item.label}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">{item.reasonCode}</div>
                </div>
                {!item.canUse ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : null}
              </div>
              <div className="mt-3 text-[11px] font-bold text-slate-600 space-y-1">
                <div>Used this month: {item.usedThisMonth}</div>
                <div>Remaining: {item.remainingThisMonth}</div>
                <div>Covers: {item.coversMinutes} minutes</div>
                {item.blockedReason ? <div className="text-rose-700">Blocked: {item.blockedReason}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="My Reason History">
        {history.isLoading ? <LoadingSpinner label="Loading..." /> : null}
        {history.isError ? <InfoAlert variant="error" message="Failed to load lateness reason history." /> : null}
        <div className="divide-y divide-slate-100">
          {(history.data?.rows || []).map((row) => (
            <div key={row.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-black text-slate-900">{row.reasonCategory || row.category || "Reason"}</div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusTone(row.status)}`}>{row.status}</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-700 whitespace-pre-wrap">{row.reasonText || row.reason}</div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />Submitted {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : new Date(row.createdAt).toLocaleString()}</span>
                {row.deadlineAt ? <span>Deadline {new Date(row.deadlineAt).toLocaleString()}</span> : null}
                {row.validityStatus ? <span>Validity: {row.validityStatus}</span> : null}
              </div>
            </div>
          ))}
          {!history.isLoading && !(history.data?.rows || []).length ? (
            <div className="py-6 text-xs font-semibold text-slate-500">No lateness reasons submitted yet.</div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}

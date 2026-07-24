import React from "react";
import { Clock3, Send } from "lucide-react";
import {
  InfoAlert,
  LoadingSpinner,
  PageHeader,
} from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { useMyAttendanceToday } from "../../hooks/useMyAttendanceToday";
import {
  useAttendanceRequests,
  useSubmitAttendanceRequest,
} from "../../hooks/useAttendanceRequests";
import {
  LATENESS_CONTROL_CLASS,
  LATENESS_TEXTAREA_CLASS,
  LatenessEmptyState,
  LatenessField,
  LatenessMetric,
  LatenessNotice,
  LatenessPanel,
  LatenessStatusBadge,
  LatenessTable,
} from "./lateness/LatenessUi";

const ADDIS_ABABA_TZ = "Africa/Addis_Ababa";

function localYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADDIS_ABABA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localHm(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ADDIS_ABABA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function beforeDeadline(date: Date): boolean {
  const [hour, minute] = localHm(date).split(":").map(Number);
  return hour * 60 + minute < 8 * 60 + 30;
}

function formatSubmittedAt(row: any): string {
  const value = row.submittedAt || row.createdAt;
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export default function MyLatenessReasonPage() {
  const today = useMyAttendanceToday();
  const submit = useSubmitAttendanceRequest();
  const history = useAttendanceRequests({
    requestType: "lateness_notice",
    mine: true,
    size: 50,
  });

  const balances: any[] =
    (today.data?.data as any)?.latenessReasonBalances || [];

  const options = balances.filter((item) => item.enabled);
  const canSubmitNow = beforeDeadline(new Date());

  const [reasonCode, setReasonCode] = React.useState("");
  const [reasonText, setReasonText] = React.useState("");
  const [error, setError] = React.useState("");

  const selected =
    options.find((item) => item.reasonCode === reasonCode) || null;

  const historyRows = history.data?.rows || [];
  const totalRemaining = balances.reduce(
    (sum, item) => sum + Number(item.remainingThisMonth || 0),
    0,
  );
  const totalUsed = balances.reduce(
    (sum, item) => sum + Number(item.usedThisMonth || 0),
    0,
  );

  const handleSubmit = async () => {
    setError("");

    if (!reasonCode) {
      setError("Select a reason.");
      return;
    }

    if (!reasonText.trim()) {
      setError("Write your exact reason.");
      return;
    }

    if (selected && !selected.canUse) {
      setError(
        selected.blockedReason || "This reason cannot be used.",
      );
      return;
    }

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
      await Promise.all([today.refetch(), history.refetch()]);
    } catch (caught: any) {
      setError(
        caught?.response?.data?.message ||
          caught?.message ||
          "Failed to submit late reason.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Attendance"
        title="My Lateness Reason"
        description="Submit a reason before the daily deadline and track your available lateness credit."
      />

      {!canSubmitNow ? (
        <LatenessNotice
          tone="warning"
          title="Submission window closed"
          description="Lateness reasons are accepted only before 08:30 AM Addis Ababa time. Your credit remains visible below."
        />
      ) : (
        <LatenessNotice
          tone="info"
          title="Submit before 08:30 AM"
          description="Choose the correct category and write a clear explanation for HR."
        />
      )}

      <LatenessPanel
        title="Submit lateness reason"
        description={
          canSubmitNow
            ? "Your request uses the credit attached to the selected reason."
            : "The form is disabled because today's submission deadline has passed."
        }
      >
        {error ? (
          <InfoAlert variant="error" message={error} className="mb-4" />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <LatenessField label="Reason category" required>
              <select
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value)}
                disabled={!canSubmitNow || submit.isPending}
                className={LATENESS_CONTROL_CLASS}
              >
                <option value="">Select a reason</option>
                {options.map((item) => (
                  <option
                    key={item.reasonCode}
                    value={item.reasonCode}
                    disabled={!item.canUse}
                  >
                    {item.label}
                    {item.canUse
                      ? ` · ${item.remainingThisMonth} remaining`
                      : " · unavailable"}
                  </option>
                ))}
              </select>
            </LatenessField>

            <LatenessField
              label="Explanation"
              required
              hint="Write the exact situation in one or two clear sentences."
            >
              <textarea
                value={reasonText}
                onChange={(event) => setReasonText(event.target.value)}
                rows={4}
                disabled={!canSubmitNow || submit.isPending}
                className={LATENESS_TEXTAREA_CLASS}
                placeholder="Describe why you expect to be late..."
              />
            </LatenessField>

            {selected?.blockedReason ? (
              <LatenessNotice
                tone="error"
                title="This reason cannot currently be used"
                description={selected.blockedReason}
              />
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                disabled={
                  !canSubmitNow ||
                  submit.isPending ||
                  !reasonCode ||
                  !reasonText.trim() ||
                  Boolean(selected && !selected.canUse)
                }
                onClick={handleSubmit}
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Send className="mr-2 h-4 w-4" />
                {submit.isPending ? "Submitting..." : "Submit reason"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-800">
              Selected credit
            </p>

            {selected ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <LatenessMetric
                  label="Remaining"
                  value={selected.remainingThisMonth}
                  tone={selected.canUse ? "green" : "red"}
                />
                <LatenessMetric
                  label="Used"
                  value={selected.usedThisMonth}
                />
                <LatenessMetric
                  label="Monthly limit"
                  value={selected.monthlyLimit}
                />
                <LatenessMetric
                  label="Covers"
                  value={`${selected.coversMinutes} min`}
                  tone="blue"
                />
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Select a reason to see its monthly limit, remaining credit,
                and covered minutes.
              </p>
            )}
          </div>
        </div>
      </LatenessPanel>

      <LatenessPanel
        title="Reason credit"
        description="A compact view of all enabled lateness categories for the current month."
      >
        {today.isLoading ? (
          <LoadingSpinner label="Loading reason credit..." />
        ) : balances.length ? (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <LatenessMetric
                label="Available categories"
                value={balances.length}
              />
              <LatenessMetric
                label="Credits used"
                value={totalUsed}
                tone="amber"
              />
              <LatenessMetric
                label="Credits remaining"
                value={totalRemaining}
                tone="green"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {balances.map((item) => (
                <button
                  key={item.reasonCode}
                  type="button"
                  onClick={() =>
                    item.enabled && item.canUse
                      ? setReasonCode(item.reasonCode)
                      : undefined
                  }
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {item.reasonCode}
                      </p>
                    </div>
                    <LatenessStatusBadge
                      value={item.canUse ? "active" : "invalid"}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-base font-semibold text-slate-950">
                        {item.remainingThisMonth}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500">
                        Remaining
                      </p>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-950">
                        {item.usedThisMonth}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500">
                        Used
                      </p>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-950">
                        {item.coversMinutes}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500">
                        Minutes
                      </p>
                    </div>
                  </div>

                  {item.blockedReason ? (
                    <p className="mt-3 text-[11px] font-medium leading-4 text-rose-600">
                      {item.blockedReason}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </>
        ) : (
          <LatenessEmptyState
            title="No lateness credits configured"
            description="Ask HR to configure at least one active lateness reason."
          />
        )}
      </LatenessPanel>

      <LatenessPanel
        title="Reason history"
        description="Your submitted lateness reasons and their current status."
      >
        {history.isLoading ? (
          <LoadingSpinner label="Loading reason history..." />
        ) : null}

        {history.isError ? (
          <InfoAlert
            variant="error"
            message="Failed to load lateness reason history."
            className="mb-4"
          />
        ) : null}

        {!history.isLoading && historyRows.length ? (
          <LatenessTable
            columns={[
              "Reason",
              "Explanation",
              "Submitted",
              "Validity",
              "Status",
            ]}
          >
            {historyRows.map((row: any) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                  {row.reasonCategory || row.category || "Reason"}
                </td>
                <td className="max-w-md px-4 py-3 text-xs leading-5 text-slate-600">
                  {row.reasonText || row.reason || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatSubmittedAt(row)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <LatenessStatusBadge value={row.validityStatus || "unknown"} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <LatenessStatusBadge value={row.status} />
                </td>
              </tr>
            ))}
          </LatenessTable>
        ) : !history.isLoading ? (
          <LatenessEmptyState
            title="No lateness reasons submitted"
            description="Your submitted reasons will appear here with their approval and validity status."
          />
        ) : null}
      </LatenessPanel>
    </div>
  );
}

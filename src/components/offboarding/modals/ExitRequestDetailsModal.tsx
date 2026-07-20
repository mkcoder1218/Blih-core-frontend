import {
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    X,
    XCircle,
} from "lucide-react";

import {
    useApproveExitRequest,
    useRejectExitRequest,
} from "../../../hooks/useOffboarding";

import {
    formatExitDate,
    getExitModeLabel,
    getExitStatusClasses,
    getExitStatusLabel,
} from "../exit.utils";

interface ExitRequestDetailsModalProps {
  request: any | null;

  onClose: () => void;

  showAlert: (
    message: string,
    type?:
      | "success"
      | "error"
      | "info",
  ) => void;
}

function getErrorMessage(
  error: unknown,
): string {
  const candidate = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };

    message?: string;
  };

  return (
    candidate?.response?.data
      ?.message ||
    candidate?.response?.data
      ?.error ||
    candidate?.message ||
    "Failed to update exit request."
  );
}

export default function ExitRequestDetailsModal({
  request,
  onClose,
  showAlert,
}: ExitRequestDetailsModalProps) {
  const approve =
    useApproveExitRequest();

  const reject =
    useRejectExitRequest();

  const [
    effectiveDate,
    setEffectiveDate,
  ] = useState("");

  const [
    approvalNote,
    setApprovalNote,
  ] = useState("");

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    action,
    setAction,
  ] = useState<
    "approve" | "reject" | null
  >(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setEffectiveDate(
      request?.effectiveDate
        ? String(
            request.effectiveDate,
          ).slice(0, 10)
        : "",
    );

    setApprovalNote(
      request?.approvalNote || "",
    );

    setRejectionReason("");
    setAction(null);
    setError("");
  }, [request]);

  if (!request) {
    return null;
  }

  const employeeName =
    request.employee?.fullName ||
    request.employee?.email ||
    "Employee";

  const isPending =
    request.status === "pending";

  const isUpdating =
    approve.isPending ||
    reject.isPending;

  const handleApprove =
    async () => {
      setError("");

      try {
        await approve.mutateAsync({
          id: request.id,

          data: {
            effectiveDate,
            approvalNote:
              approvalNote.trim() ||
              undefined,
          },
        });

        showAlert(
          "Exit request approved and moved to clearance.",
          "success",
        );

        onClose();
      } catch (caughtError) {
        const message =
          getErrorMessage(
            caughtError,
          );

        setError(message);

        showAlert(
          message,
          "error",
        );
      }
    };

  const handleReject =
    async () => {
      setError("");

      if (
        rejectionReason.trim()
          .length < 3
      ) {
        setError(
          "A rejection reason is required.",
        );

        return;
      }

      try {
        await reject.mutateAsync({
          id: request.id,
          rejectionReason:
            rejectionReason.trim(),
        });

        showAlert(
          "Exit request rejected.",
          "success",
        );

        onClose();
      } catch (caughtError) {
        const message =
          getErrorMessage(
            caughtError,
          );

        setError(message);

        showAlert(
          message,
          "error",
        );
      }
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Exit request
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {employeeName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">
                Exit type
              </p>

              <p className="mt-1 text-sm font-black text-slate-900">
                {getExitModeLabel(
                  request.exitMode,
                )}
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getExitStatusClasses(
                request.status,
              )}`}
            >
              {getExitStatusLabel(
                request.status,
              )}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[9px] font-black uppercase text-slate-400">
                Initiated by
              </p>

              <p className="mt-1 text-xs font-bold capitalize text-slate-800">
                {request.initiatedByType ||
                  "employee"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[9px] font-black uppercase text-slate-400">
                Notice
              </p>

              <p className="mt-1 text-xs font-bold text-slate-800">
                {request.noticePeriodDays ??
                  30}{" "}
                days
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[9px] font-black uppercase text-slate-400">
                Final day
              </p>

              <p className="mt-1 text-xs font-bold text-slate-800">
                {formatExitDate(
                  request.effectiveDate,
                )}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">
              Exit reason
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {request.exitReasonNameSnapshot ||
                request.reason ||
                "-"}
            </p>

            {request.exitReasonNameSnapshot &&
              request.reason && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {request.reason}
                </p>
              )}
          </div>

          {request.letterHtml && (
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">
                Exit letter
              </p>

              <div
                className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                dangerouslySetInnerHTML={{
                  __html:
                    request.letterHtml,
                }}
              />
            </div>
          )}

          {isPending && (
            <>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                  Confirm final working date
                </label>

                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(event) =>
                    setEffectiveDate(
                      event
                        .currentTarget
                        .value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                  Approval note
                </label>

                <textarea
                  rows={3}
                  value={approvalNote}
                  onChange={(event) =>
                    setApprovalNote(
                      event
                        .currentTarget
                        .value,
                    )
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {action === "reject" && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase text-rose-600">
                    Rejection reason
                  </label>

                  <textarea
                    rows={3}
                    value={
                      rejectionReason
                    }
                    onChange={(event) =>
                      setRejectionReason(
                        event
                          .currentTarget
                          .value,
                      )
                    }
                    className="w-full resize-none rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm outline-none focus:border-rose-400"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-rose-600" />

              <p className="text-xs font-semibold text-rose-700">
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>

            {isPending &&
              action !==
                "reject" && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setAction(
                        "reject",
                      )
                    }
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleApprove
                    }
                    disabled={
                      isUpdating ||
                      !effectiveDate
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {approve.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    Approve
                  </button>
                </>
              )}

            {isPending &&
              action ===
                "reject" && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setAction(null)
                    }
                    disabled={isUpdating}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleReject
                    }
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {reject.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}

                    Confirm rejection
                  </button>
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
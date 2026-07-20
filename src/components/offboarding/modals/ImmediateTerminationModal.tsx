import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    AlertCircle,
    Loader2,
    ShieldAlert,
    X,
} from "lucide-react";

import {
    useCreateExitProcess,
} from "../../../hooks/useOffboarding";

import {
    useExitReasons,
} from "../../../hooks/useExitReasons";

import ExitRichTextEditor from "../components/ExitRichTextEditor";

interface ImmediateTerminationModalProps {
  isOpen: boolean;
  employee: any | null;

  onClose: () => void;

  showAlert: (
    message: string,
    type?: "success" | "error" | "info",
  ) => void;
}

function getEmployeeUserId(employee: any): string {
  return String(
    employee?.userId ||
      employee?.user?.id ||
      employee?.id ||
      "",
  );
}

function getEmployeeName(employee: any): string {
  return (
    employee?.user?.fullName ||
    employee?.fullName ||
    employee?.user?.email ||
    "Employee"
  );
}

function today(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
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
    candidate?.response?.data?.message ||
    candidate?.response?.data?.error ||
    candidate?.message ||
    "Failed to initiate immediate termination."
  );
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export default function ImmediateTerminationModal({
  isOpen,
  employee,
  onClose,
  showAlert,
}: ImmediateTerminationModalProps) {
  const reasonsQuery = useExitReasons({
    initiator: "employer",
    enabled: isOpen,
  });

  const createExit = useCreateExitProcess();

  const [exitReasonId, setExitReasonId] =
    useState("");

  const [explanation, setExplanation] =
    useState("");

  const [effectiveDate, setEffectiveDate] =
    useState(today());

  const [letterHtml, setLetterHtml] =
    useState("");

  const [confirmation, setConfirmation] =
    useState("");

  const [submitError, setSubmitError] =
    useState("");

  const reasons = reasonsQuery.data ?? [];

  const selectedReason = reasons.find(
    (reason) =>
      reason.id === exitReasonId,
  );

  const employeeName =
    getEmployeeName(employee);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (
      !exitReasonId &&
      reasons.length > 0
    ) {
      setExitReasonId(reasons[0].id);
    }
  }, [
    exitReasonId,
    isOpen,
    reasons,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLetterHtml(
      [
        `<p>Dear ${employeeName},</p>`,

        "<p>This letter confirms the immediate termination of your employment.</p>",

        `<p>The effective termination date is <strong>${effectiveDate}</strong>.</p>`,

        selectedReason
          ? `<p>Reason: <strong>${selectedReason.name}</strong>.</p>`
          : "",

        explanation.trim()
          ? `<p>Additional explanation: ${explanation.trim()}</p>`
          : "",

        "<p>You are required to complete resource return, project handover, final payment settlement, and all other clearance obligations.</p>",
      ].join(""),
    );
  }, [
    effectiveDate,
    employeeName,
    explanation,
    isOpen,
    selectedReason?.name,
  ]);

  const reset = () => {
    setExitReasonId("");
    setExplanation("");
    setEffectiveDate(today());
    setLetterHtml("");
    setConfirmation("");
    setSubmitError("");
  };

  const close = () => {
    if (createExit.isPending) {
      return;
    }

    reset();
    onClose();
  };

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setSubmitError("");

    const employeeUserId =
      getEmployeeUserId(employee);

    if (!employeeUserId) {
      setSubmitError(
        "Employee user ID is missing.",
      );
      return;
    }

    if (!exitReasonId) {
      setSubmitError(
        "Please select a termination reason.",
      );
      return;
    }

    if (
      selectedReason?.requiresExplanation &&
      explanation.trim().length < 3
    ) {
      setSubmitError(
        "An explanation is required for the selected reason.",
      );
      return;
    }

    if (stripHtml(letterHtml).length < 10) {
      setSubmitError(
        "A valid termination letter is required.",
      );
      return;
    }

    if (confirmation.trim() !== employeeName) {
      setSubmitError(
        `Type "${employeeName}" to confirm immediate termination.`,
      );
      return;
    }

    try {
      await createExit.mutateAsync({
        employeeUserId,
        exitType: "termination",
        exitMode: "immediate",
        noticePeriodDays: 0,
        effectiveDate,
        exitReasonId,
        reason:
          explanation.trim() || undefined,
        letterHtml,
      });

      showAlert(
        "Immediate termination process started successfully.",
        "success",
      );

      reset();
      onClose();
    } catch (error) {
      const message = getErrorMessage(error);

      setSubmitError(message);
      showAlert(message, "error");
    }
  };

  if (!isOpen || !employee) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-rose-100 bg-white px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Immediate Contract Termination
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {employeeName} · No notice period
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            disabled={createExit.isPending}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

            <p className="text-xs font-semibold leading-5 text-rose-700">
              This starts an immediate employer-initiated termination with zero notice days. The employee must still complete clearance, payment settlement, resource return, and project handover.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                Termination reason
              </label>

              <select
                value={exitReasonId}
                onChange={(event) =>
                  setExitReasonId(
                    event.currentTarget.value,
                  )
                }
                disabled={reasonsQuery.isLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400"
              >
                {reasonsQuery.isLoading && (
                  <option value="">
                    Loading reasons...
                  </option>
                )}

                {!reasonsQuery.isLoading &&
                  reasons.length === 0 && (
                    <option value="">
                      No employer reasons available
                    </option>
                  )}

                {reasons.map((reason) => (
                  <option
                    key={reason.id}
                    value={reason.id}
                  >
                    {reason.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                Effective date
              </label>

              <input
                type="date"
                value={effectiveDate}
                min={today()}
                onChange={(event) =>
                  setEffectiveDate(
                    event.currentTarget.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
              Explanation
              {selectedReason?.requiresExplanation
                ? " *"
                : ""}
            </label>

            <textarea
              rows={3}
              value={explanation}
              onChange={(event) =>
                setExplanation(
                  event.currentTarget.value,
                )
              }
              placeholder="Provide the reason and supporting details"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
              Termination letter
            </label>

            <ExitRichTextEditor
              value={letterHtml}
              onChange={setLetterHtml}
              disabled={createExit.isPending}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-rose-600">
              Type employee name to confirm
            </label>

            <input
              type="text"
              value={confirmation}
              onChange={(event) =>
                setConfirmation(
                  event.currentTarget.value,
                )
              }
              placeholder={employeeName}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-rose-400"
            />
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

              <p className="text-xs font-semibold text-rose-700">
                {submitError}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={close}
              disabled={createExit.isPending}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                createExit.isPending ||
                reasons.length === 0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {createExit.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              Start termination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
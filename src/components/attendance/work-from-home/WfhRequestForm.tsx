import { Loader2, Send, X } from "lucide-react";
import {
    type FormEvent,
    useEffect,
    useState,
} from "react";
import { createPortal } from "react-dom";

import { useSubmitAttendanceRequest } from "../../../hooks/useAttendanceRequests";
import type {
    AlertProps,
    WfhFormValues,
} from "./wfh.types";
import {
    buildWfhDateRange,
    buildWfhReason,
    calculateDurationMinutes,
    INITIAL_WFH_FORM,
} from "./wfh.utils";

interface WfhRequestFormProps extends AlertProps {
  open: boolean;
  onClose: () => void;
}

export default function WfhRequestForm({
  open,
  onClose,
  showAlert,
}: WfhRequestFormProps) {
  const [form, setForm] =
    useState<WfhFormValues>(INITIAL_WFH_FORM);
const [submitError, setSubmitError] = useState("");
  const submitRequest =
    useSubmitAttendanceRequest();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !submitRequest.isPending
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open, onClose, submitRequest.isPending]);

  if (
    !open ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const updateField = <K extends keyof WfhFormValues>(
    field: K,
    value: WfhFormValues[K],
  ) => {
      setSubmitError("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!form.fromDate) {
      return "Select a start date.";
    }

    if (!form.toDate) {
      return "Select an end date.";
    }

    if (form.reason.trim().length < 5) {
      return "Enter a clear reason.";
    }

    if (
      form.workType === "partial_day" &&
      (!form.startTime || !form.endTime)
    ) {
      return "Select the start and end time.";
    }

    return null;
  };

  const handleClose = () => {
    if (submitRequest.isPending) {
      return;
    }
setSubmitError("");
    setForm(INITIAL_WFH_FORM);
    onClose();
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      showAlert(validationError, "error");
      return;
    }

    const { fromAt, toAt } =
      buildWfhDateRange(form);

    if (
      Number.isNaN(fromAt.getTime()) ||
      Number.isNaN(toAt.getTime())
    ) {
      showAlert("Invalid date or time.", "error");
      return;
    }

    if (toAt <= fromAt) {
      showAlert(
        "The end date must be after the start date.",
        "error",
      );
      return;
    }

    try {
      await submitRequest.mutateAsync({
        requestType: "work_from_home",
        category:
          form.workType === "full_day"
            ? "Full Day"
            : "Partial Day",
        title: "Work From Home Request",
        reason: buildWfhReason(form),
        fromAt: fromAt.toISOString(),
        toAt: toAt.toISOString(),
        durationMinutes:
          calculateDurationMinutes(fromAt, toAt),
      });

      setForm(INITIAL_WFH_FORM);
      onClose();

      showAlert(
        "Work-from-home request submitted.",
        "success",
      );
   } catch (error: any) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Failed to submit the request.";

  setSubmitError(message);
  showAlert(message, "error");
}
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitRequest.isPending
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {submitError && (
  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
    <p className="text-xs font-semibold text-rose-700">
      {submitError}
    </p>
  </div>
)}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-sm font-black text-slate-950">
              Request Work From Home
            </h2>

            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Submit a full-day or partial-day request.
            </p>
          </div>

          <button
            type="button"
            disabled={submitRequest.isPending}
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-82px)] space-y-5 overflow-y-auto p-6"
        >
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1.5">
            <button
              type="button"
              onClick={() =>
                updateField("workType", "full_day")
              }
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                form.workType === "full_day"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Full Day
            </button>

            <button
              type="button"
              onClick={() =>
                updateField(
                  "workType",
                  "partial_day",
                )
              }
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                form.workType === "partial_day"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Partial Day
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500">
                From date
              </span>

              <input
                type="date"
                required
                value={form.fromDate}
                onChange={(event) =>
                  updateField(
                    "fromDate",
                    event.currentTarget.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500">
                To date
              </span>

              <input
                type="date"
                required
                value={form.toDate}
                min={form.fromDate || undefined}
                onChange={(event) =>
                  updateField(
                    "toDate",
                    event.currentTarget.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
              />
            </label>
          </div>

          {form.workType === "partial_day" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  Start time
                </span>

                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(event) =>
                    updateField(
                      "startTime",
                      event.currentTarget.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  End time
                </span>

                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(event) =>
                    updateField(
                      "endTime",
                      event.currentTarget.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </label>
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500">
              Work location
            </span>

            <input
              type="text"
              value={form.workLocation}
              onChange={(event) =>
                updateField(
                  "workLocation",
                  event.currentTarget.value,
                )
              }
              placeholder="Home, another city, etc."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500">
              Reason
            </span>

            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(event) =>
                updateField(
                  "reason",
                  event.currentTarget.value,
                )
              }
              placeholder="Why do you need to work from home?"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500">
              Planned tasks
            </span>

            <textarea
              rows={3}
              value={form.plannedTasks}
              onChange={(event) =>
                updateField(
                  "plannedTasks",
                  event.currentTarget.value,
                )
              }
              placeholder="What will you work on?"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={submitRequest.isPending}
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitRequest.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitRequest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

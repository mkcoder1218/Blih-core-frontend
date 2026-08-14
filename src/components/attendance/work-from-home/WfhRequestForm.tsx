import { Loader2, Save, Send, X } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  type AttendanceRequest,
  useSubmitAttendanceRequest,
  useUpdateAttendanceRequest,
} from "../../../hooks/useAttendanceRequests";
import type {
  AlertProps,
  WfhFormValues,
} from "./wfh.types";
import {
  buildWfhDateRange,
  buildWfhReason,
  calculateDurationMinutes,
  INITIAL_WFH_FORM,
  wfhFormFromRequest,
} from "./wfh.utils";

interface WfhRequestFormProps extends AlertProps {
  open: boolean;
  onClose: () => void;
  editingRequest?: AttendanceRequest | null;
}

export default function WfhRequestForm({
  open,
  onClose,
  showAlert,
  editingRequest = null,
}: WfhRequestFormProps) {
  const [form, setForm] =
    useState<WfhFormValues>(INITIAL_WFH_FORM);
  const [submitError, setSubmitError] = useState("");
  const submitRequest = useSubmitAttendanceRequest();
  const updateRequest = useUpdateAttendanceRequest();
  const isEditing = Boolean(editingRequest);
  const isPending = submitRequest.isPending || updateRequest.isPending;

  useEffect(() => {
    if (!open) return;

    setSubmitError("");
    setForm(
      editingRequest
        ? wfhFormFromRequest(editingRequest)
        : INITIAL_WFH_FORM,
    );
  }, [open, editingRequest]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, isPending]);

  if (!open || typeof document === "undefined") {
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
    if (isPending) {
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

    if (editingRequest && editingRequest.status !== "pending") {
      const message =
        "This request has already been actioned and can no longer be edited.";
      setSubmitError(message);
      showAlert(message, "error");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      showAlert(validationError, "error");
      return;
    }

    const { fromAt, toAt } = buildWfhDateRange(form);

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

    const category =
      form.workType === "full_day"
        ? "Full Day"
        : "Partial Day";
    const reason = buildWfhReason(form);
    const durationMinutes = calculateDurationMinutes(fromAt, toAt);

    try {
      if (editingRequest) {
        await updateRequest.mutateAsync({
          id: editingRequest.id,
          data: {
            category,
            reason,
            fromAt: fromAt.toISOString(),
            toAt: toAt.toISOString(),
            durationMinutes,
            reasonCategory: category,
          },
        });

        showAlert(
          "Work-from-home request updated.",
          "success",
        );
      } else {
        await submitRequest.mutateAsync({
          requestType: "work_from_home",
          category,
          title: "Work From Home Request",
          reason,
          fromAt: fromAt.toISOString(),
          toAt: toAt.toISOString(),
          durationMinutes,
        });

        showAlert(
          "Work-from-home request submitted.",
          "success",
        );
      }

      setForm(INITIAL_WFH_FORM);
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (isEditing
          ? "Failed to update the request."
          : "Failed to submit the request.");

      setSubmitError(message);
      showAlert(message, "error");
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground outline-none transition-colors focus:border-blue-500 disabled:opacity-60 dark:[color-scheme:dark]";

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isPending
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-background text-foreground shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {submitError ? (
          <div className="m-4 mb-0 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3">
            <p className="text-xs font-semibold text-destructive">
              {submitError}
            </p>
          </div>
        ) : null}

        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-sm font-black text-foreground">
              {isEditing
                ? "Edit Work From Home Request"
                : "Request Work From Home"}
            </h2>

            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
              {isEditing
                ? "You can update this request while it is still pending approval."
                : "Submit a full-day or partial-day request."}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleClose}
            aria-label="Close work-from-home form"
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-82px)] space-y-5 overflow-y-auto p-6"
        >
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/70 p-1.5">
            <button
              type="button"
              onClick={() => updateField("workType", "full_day")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                form.workType === "full_day"
                  ? "bg-background text-blue-700 shadow-sm dark:text-blue-400"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              }`}
            >
              Full Day
            </button>

            <button
              type="button"
              onClick={() => updateField("workType", "partial_day")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                form.workType === "partial_day"
                  ? "bg-background text-blue-700 shadow-sm dark:text-blue-400"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              }`}
            >
              Partial Day
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-muted-foreground">
                From date
              </span>

              <input
                type="date"
                required
                value={form.fromDate}
                onChange={(event) =>
                  updateField("fromDate", event.currentTarget.value)
                }
                className={inputClassName}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-muted-foreground">
                To date
              </span>

              <input
                type="date"
                required
                value={form.toDate}
                min={form.fromDate || undefined}
                onChange={(event) =>
                  updateField("toDate", event.currentTarget.value)
                }
                className={inputClassName}
              />
            </label>
          </div>

          {form.workType === "partial_day" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-muted-foreground">
                  Start time
                </span>

                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(event) =>
                    updateField("startTime", event.currentTarget.value)
                  }
                  className={inputClassName}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-muted-foreground">
                  End time
                </span>

                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(event) =>
                    updateField("endTime", event.currentTarget.value)
                  }
                  className={inputClassName}
                />
              </label>
            </div>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-muted-foreground">
              Work location
            </span>

            <input
              type="text"
              value={form.workLocation}
              onChange={(event) =>
                updateField("workLocation", event.currentTarget.value)
              }
              placeholder="Home, another city, etc."
              className={inputClassName}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-muted-foreground">
              Reason
            </span>

            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(event) =>
                updateField("reason", event.currentTarget.value)
              }
              placeholder="Why do you need to work from home?"
              className={`${inputClassName} resize-none`}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-muted-foreground">
              Planned tasks
            </span>

            <textarea
              rows={3}
              value={form.plannedTasks}
              onChange={(event) =>
                updateField("plannedTasks", event.currentTarget.value)
              }
              placeholder="What will you work on?"
              className={`${inputClassName} resize-none`}
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={handleClose}
              className="rounded-xl border border-border px-5 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                <Save className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {isEditing ? "Update Request" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

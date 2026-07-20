import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";

import {
  useCreateExitReason,
  useUpdateExitReason,
} from "../../../hooks/useExitReasons";

import type {
  ExitReason,
  ExitReasonInitiator,
} from "../exit.types";

interface ExitReasonModalProps {
  isOpen: boolean;
  reason?: ExitReason | null;
  nextSortOrder: number;

  onClose: () => void;

  showAlert: (
    message: string,
    type?: "success" | "error" | "info",
  ) => void;
}

interface FormState {
  name: string;
  description: string;
  allowedInitiator: ExitReasonInitiator;
  requiresExplanation: boolean;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  allowedInitiator: "both",
  requiresExplanation: true,
  isActive: true,
};

function getErrorMessage(
  error: unknown,
  fallback: string,
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
    fallback
  );
}

export default function ExitReasonModal({
  isOpen,
  reason,
  nextSortOrder,
  onClose,
  showAlert,
}: ExitReasonModalProps) {
  const createReason = useCreateExitReason();
  const updateReason = useUpdateExitReason();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState("");

  const isEditing = Boolean(reason?.id);
  const isSubmitting =
    createReason.isPending || updateReason.isPending;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (reason) {
      setForm({
        name: reason.name || "",
        description: reason.description || "",
        allowedInitiator:
          reason.allowedInitiator || "both",
        requiresExplanation:
          reason.requiresExplanation !== false,
        isActive: reason.isActive !== false,
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setSubmitError("");
  }, [isOpen, reason]);

  const close = () => {
    if (isSubmitting) {
      return;
    }

    setForm(EMPTY_FORM);
    setSubmitError("");
    onClose();
  };

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSubmitError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const name = form.name.trim();

    if (name.length < 2) {
      setSubmitError(
        "Exit reason name must contain at least 2 characters.",
      );
      return;
    }

    try {
      if (reason?.id) {
        await updateReason.mutateAsync({
          id: reason.id,
          data: {
            name,
            description: form.description.trim() || null,
            allowedInitiator: form.allowedInitiator,
            requiresExplanation: form.requiresExplanation,
            isActive: form.isActive,
          },
        });

        showAlert(
          "Exit reason updated successfully.",
          "success",
        );
      } else {
        await createReason.mutateAsync({
          name,
          description: form.description.trim() || null,
          allowedInitiator: form.allowedInitiator,
          requiresExplanation: form.requiresExplanation,
          isActive: form.isActive,
          sortOrder: nextSortOrder,
        });

        showAlert(
          "Exit reason created successfully.",
          "success",
        );
      }

      close();
    } catch (error) {
      const message = getErrorMessage(
        error,
        isEditing
          ? "Failed to update exit reason."
          : "Failed to create exit reason.",
      );

      setSubmitError(message);
      showAlert(message, "error");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isEditing
                ? "Update Exit Reason"
                : "Add Exit Reason"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Configure when this reason can be selected.
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
              Reason name
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.currentTarget.value,
                )
              }
              placeholder="Example: Better opportunity"
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
              Description
            </label>

            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.currentTarget.value,
                )
              }
              placeholder="Describe when this reason should be used"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
              Available for
            </label>

            <select
              value={form.allowedInitiator}
              onChange={(event) =>
                updateField(
                  "allowedInitiator",
                  event.currentTarget
                    .value as ExitReasonInitiator,
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="employee">
                Employee initiated only
              </option>

              <option value="employer">
                Employer initiated only
              </option>

              <option value="both">
                Employee and employer
              </option>
            </select>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={form.requiresExplanation}
              onChange={(event) =>
                updateField(
                  "requiresExplanation",
                  event.currentTarget.checked,
                )
              }
              className="mt-0.5 accent-blue-600"
            />

            <div>
              <p className="text-xs font-black text-slate-800">
                Require additional explanation
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                The requester must provide more details.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField(
                  "isActive",
                  event.currentTarget.checked,
                )
              }
              className="mt-0.5 accent-blue-600"
            />

            <div>
              <p className="text-xs font-black text-slate-800">
                Active reason
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                Disabled reasons remain in historical records.
              </p>
            </div>
          </label>

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
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {isEditing
                ? "Save changes"
                : "Add reason"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
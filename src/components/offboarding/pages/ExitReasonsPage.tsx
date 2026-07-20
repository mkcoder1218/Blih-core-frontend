import {
  Edit3,
  Loader2,
  Plus,
  Power,
  PowerOff,
} from "lucide-react";
import { useState } from "react";

import {
  useExitReasons,
  useUpdateExitReason,
} from "../../../hooks/useExitReasons";

import ExitReasonModal from "../modals/ExitReasonModal";

import type { ExitReason } from "../exit.types";

interface ExitReasonsPageProps {
  showAlert: (
    message: string,
    type?: "success" | "error" | "info",
  ) => void;
}

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

export default function ExitReasonsPage({
  showAlert,
}: ExitReasonsPageProps) {
  const reasonsQuery = useExitReasons({
    includeInactive: true,
  });

  const updateReason = useUpdateExitReason();

  const [isModalOpen, setModalOpen] =
    useState(false);

  const [selectedReason, setSelectedReason] =
    useState<ExitReason | null>(null);

  const reasons = reasonsQuery.data ?? [];

  const openCreateModal = () => {
    setSelectedReason(null);
    setModalOpen(true);
  };

  const openEditModal = (reason: ExitReason) => {
    setSelectedReason(reason);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedReason(null);
    setModalOpen(false);
  };

  const handleToggle = async (
    reason: ExitReason,
  ) => {
    try {
      await updateReason.mutateAsync({
        id: reason.id,
        data: {
          isActive: !reason.isActive,
        },
      });

      showAlert(
        reason.isActive
          ? "Exit reason disabled."
          : "Exit reason enabled.",
        "success",
      );
    } catch (error) {
      showAlert(
        getErrorMessage(
          error,
          "Failed to update exit reason.",
        ),
        "error",
      );
    }
  };

  const nextSortOrder =
    reasons.length === 0
      ? 10
      : Math.max(
          ...reasons.map((reason) =>
            Number(reason.sortOrder || 0),
          ),
        ) + 10;

  return (
    <>
      <div className="space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              Exit Reasons
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configure the reasons available for employee and employer exits.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add reason
          </button>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {reasonsQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : reasonsQuery.isError ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-bold text-rose-600">
                {getErrorMessage(
                  reasonsQuery.error,
                  "Failed to load exit reasons.",
                )}
              </p>

              <button
                type="button"
                onClick={() =>
                  reasonsQuery.refetch()
                }
                className="mt-3 text-xs font-black text-blue-600"
              >
                Try again
              </button>
            </div>
          ) : reasons.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-bold text-slate-700">
                No exit reasons configured
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Add the first reason employees or HR can select.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white"
              >
                <Plus className="h-4 w-4" />
                Add first reason
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reasons.map((reason) => (
                <div
                  key={reason.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {reason.name}
                      </p>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500">
                        {reason.allowedInitiator}
                      </span>

                      <span
                        className={
                          reason.isActive
                            ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700"
                            : "rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500"
                        }
                      >
                        {reason.isActive
                          ? "Active"
                          : "Disabled"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {reason.description ||
                        "No description provided."}
                    </p>

                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      {reason.requiresExplanation
                        ? "Explanation required"
                        : "Explanation optional"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(reason)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-black uppercase text-slate-600 transition hover:bg-slate-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggle(reason)
                      }
                      disabled={
                        updateReason.isPending
                      }
                      className={
                        reason.isActive
                          ? "inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-[10px] font-black uppercase text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          : "inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-[10px] font-black uppercase text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      }
                    >
                      {reason.isActive ? (
                        <PowerOff className="h-3.5 w-3.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}

                      {reason.isActive
                        ? "Disable"
                        : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ExitReasonModal
        isOpen={isModalOpen}
        reason={selectedReason}
        nextSortOrder={nextSortOrder}
        onClose={closeModal}
        showAlert={showAlert}
      />
    </>
  );
}
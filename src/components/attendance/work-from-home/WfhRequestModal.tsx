import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { UserAvatar } from "@/components/ui/blih";

import type { WfhRequestCardData } from "./wfh.types";
import {
    getWfhStatusClasses,
    getWfhStatusLabel,
} from "./wfh.utils";

interface WfhRequestModalProps {
  request: WfhRequestCardData | null;
  open: boolean;
  showManagerActions?: boolean;
  isActionPending?: boolean;
  onClose: () => void;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (
    id: string,
    reason: string,
  ) => Promise<void>;
}

export default function WfhRequestModal({
  request,
  open,
  showManagerActions = false,
  isActionPending = false,
  onClose,
  onApprove,
  onReject,
}: WfhRequestModalProps) {
  const [showRejectForm, setShowRejectForm] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isActionPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open, isActionPending, onClose]);

  useEffect(() => {
    if (!open) {
      setShowRejectForm(false);
      setRejectionReason("");
      setError("");
    }
  }, [open]);

  if (
    !open ||
    !request ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const handleReject = async () => {
    const reason = rejectionReason.trim();

    if (reason.length < 3) {
      setError("Enter a rejection reason.");
      return;
    }

    if (!onReject) {
      return;
    }

    await onReject(request.id, reason);
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wfh-modal-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isActionPending
        ) {
          onClose();
        }
      }}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="wfh-modal-title"
              className="text-sm font-black text-slate-950"
            >
              Work From Home Request
            </h2>

            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Review the complete request details.
            </p>
          </div>

          <button
            type="button"
            disabled={isActionPending}
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[calc(90vh-150px)] space-y-5 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                name={request.employee}
                size="md"
                color="blue"
              />

              <div className="min-w-0">
                <h3 className="truncate text-sm font-black text-slate-900">
                  {request.employee}
                </h3>

                <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                  {request.role}
                  {request.department !== "-"
                    ? ` • ${request.department}`
                    : ""}
                </p>

                <p className="mt-1 truncate text-[10px] text-slate-400">
                  {request.email}
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase ${getWfhStatusClasses(
                request.status,
              )}`}
            >
              {getWfhStatusLabel(request.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <InfoItem
              label="Request type"
              value={request.category}
            />

            <InfoItem
              label="Duration"
              value={request.duration}
              highlight
            />

            <InfoItem
              label="From"
              value={request.from}
            />

            <InfoItem
              label="To"
              value={request.to}
            />

            <InfoItem
              label="Submitted"
              value={request.submitted}
            />

            <InfoItem
              label="Actioned by"
              value={request.approvedBy}
            />
          </div>

          <section>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Request details
            </span>

            <p className="mt-2 whitespace-pre-line rounded-2xl border border-slate-100 p-4 text-sm font-medium leading-relaxed text-slate-700">
              {request.reason}
            </p>
          </section>

          {request.actionNote && (
            <section>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Decision note
              </span>

              <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700">
                {request.actionNote}
              </p>
            </section>
          )}

          {showRejectForm && (
            <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  Rejection reason
                </span>

                <textarea
                  autoFocus
                  rows={4}
                  value={rejectionReason}
                  onChange={(event) => {
                    setRejectionReason(
                      event.currentTarget.value,
                    );
                    setError("");
                  }}
                  placeholder="Enter why this request is being rejected..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-rose-400"
                />
              </label>

              {error && (
                <p className="mt-2 text-[11px] font-semibold text-rose-600">
                  {error}
                </p>
              )}

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason("");
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={handleReject}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {isActionPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Confirm Reject
                </button>
              </div>
            </section>
          )}
        </div>

        {showManagerActions &&
          request.status === "pending" &&
          !showRejectForm && (
            <footer className="flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => setShowRejectForm(true)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Reject
              </button>

              <button
                type="button"
                disabled={isActionPending}
                onClick={() =>
                  onApprove?.(request.id)
                }
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isActionPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Approve
              </button>
            </footer>
          )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

interface InfoItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function InfoItem({
  label,
  value,
  highlight = false,
}: InfoItemProps) {
  return (
    <div>
      <span className="block text-[9px] font-black uppercase text-slate-400">
        {label}
      </span>

      <span
        className={`mt-1 block text-xs font-bold ${
          highlight
            ? "text-blue-600"
            : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
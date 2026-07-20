import {
    useState,
} from "react";

import {
    CalendarDays,
    FileText,
    Loader2,
    Plus,
} from "lucide-react";

import {
    useMyExitRequest,
} from "../../../hooks/useOffboarding";

import RequestExitModal from "../modals/RequestExitModal";

import {
    formatExitDate,
    getExitModeLabel,
    getExitStatusClasses,
    getExitStatusLabel,
} from "../exit.utils";

interface MyExitPageProps {
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
    "Failed to load exit request."
  );
}

export default function MyExitPage({
  showAlert,
}: MyExitPageProps) {
  const [isModalOpen, setModalOpen] =
    useState(false);

  const requestQuery =
    useMyExitRequest();

  const request =
    requestQuery.data;

  if (requestQuery.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />

        <span className="text-xs font-bold">
          Loading exit request...
        </span>
      </div>
    );
  }

  if (requestQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-10 text-center">
        <p className="text-sm font-bold text-rose-600">
          {getErrorMessage(
            requestQuery.error,
          )}
        </p>
      </div>
    );
  }

  const canCreate =
    !request ||
    [
      "rejected",
      "cancelled",
      "completed",
      "account_disabled",
    ].includes(request.status);

  return (
    <>
      <div className="space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              My Exit
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Submit and track your permanent employment exit request.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() =>
                setModalOpen(true)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Request Exit
            </button>
          )}
        </header>

        {!request ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-sm font-black text-slate-900">
              No active exit request
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
              Submit an exit request when you intend to permanently leave the company.
            </p>

            <button
              type="button"
              onClick={() =>
                setModalOpen(true)
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Request Exit
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Current request
                </p>

                <h2 className="mt-1 text-base font-black text-slate-900">
                  {getExitModeLabel(
                    request.exitMode,
                  )}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {request.exitReasonNameSnapshot ||
                    request.reason ||
                    "No reason provided."}
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

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase text-slate-400">
                  Final working date
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" />

                  <p className="text-xs font-bold text-slate-800">
                    {formatExitDate(
                      request.effectiveDate,
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase text-slate-400">
                  Notice period
                </p>

                <p className="mt-1 text-xs font-bold text-slate-800">
                  {request.noticePeriodDays ??
                    0}{" "}
                  days
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase text-slate-400">
                  Submitted
                </p>

                <p className="mt-1 text-xs font-bold text-slate-800">
                  {formatExitDate(
                    request.createdAt,
                  )}
                </p>
              </div>
            </div>

            {request.rejectionReason && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase text-rose-600">
                  Rejection reason
                </p>

                <p className="mt-1 text-xs font-semibold text-rose-700">
                  {
                    request.rejectionReason
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <RequestExitModal
        isOpen={isModalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        showAlert={showAlert}
      />
    </>
  );
}
import {
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useExitRequests,
} from "../../../hooks/useOffboarding";

import ExitClearanceDetailsModal from "../modals/ExitClearanceDetailsModal";
import ExitClearanceTable from "../tables/ExitClearanceTable";

interface ExitClearancePageProps {
  showAlert: (
    message: string,
    type?: "success" | "error" | "info",
  ) => void;
}

const CLEARANCE_STATUSES = new Set([
  "in_progress",
  "clearance_pending",
  "interview_scheduled",
  "interview_completed",
  "completed",
  "account_disabled",
]);

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
    "Failed to load exit clearances."
  );
}

export default function ExitClearancePage({
  showAlert,
}: ExitClearancePageProps) {
  const [
    selectedExit,
    setSelectedExit,
  ] = useState<any | null>(null);

  const requestsQuery =
    useExitRequests();

  const exits = useMemo(
    () =>
      (
        requestsQuery.data ?? []
      ).filter((item: any) =>
        CLEARANCE_STATUSES.has(
          String(item.status),
        ),
      ),
    [requestsQuery.data],
  );

  if (
    requestsQuery.isLoading &&
    exits.length === 0
  ) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />

        <span className="text-xs font-bold">
          Loading exit clearances...
        </span>
      </div>
    );
  }

  if (requestsQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-10 text-center">
        <p className="text-sm font-bold text-rose-600">
          {getErrorMessage(
            requestsQuery.error,
          )}
        </p>

        <button
          type="button"
          onClick={() =>
            requestsQuery.refetch()
          }
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              Exit Clearance
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and complete employee exit clearance.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              requestsQuery.refetch()
            }
            disabled={
              requestsQuery.isFetching
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                requestsQuery.isFetching
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </header>

        <ExitClearanceTable
          exits={exits}
          onView={setSelectedExit}
        />
      </div>

      <ExitClearanceDetailsModal
        exitProcess={selectedExit}
        onClose={() =>
          setSelectedExit(null)
        }
        showAlert={showAlert}
      />
    </>
  );
}
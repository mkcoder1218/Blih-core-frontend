import {
  useState,
} from "react";

import {
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useExitRequests,
} from "../../../hooks/useOffboarding";

import ExitRequestDetailsModal from "../modals/ExitRequestDetailsModal";
import ExitRequestsTable from "../tables/ExitRequestsTable";

interface ExitRequestsPageProps {
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
    "Failed to load exit requests."
  );
}

export default function ExitRequestsPage({
  showAlert,
}: ExitRequestsPageProps) {
  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<any | null>(
    null,
  );

  const requestsQuery =
    useExitRequests();

  const requests =
    requestsQuery.data ?? [];

  if (
    requestsQuery.isLoading &&
    requests.length === 0
  ) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />

        <span className="text-xs font-bold">
          Loading exit requests...
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
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700"
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
              Exit Requests
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review employee and employer-initiated exits.
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
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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

        <ExitRequestsTable
          requests={requests}
          onView={
            setSelectedRequest
          }
        />
      </div>

      <ExitRequestDetailsModal
        request={selectedRequest}
        onClose={() =>
          setSelectedRequest(null)
        }
        showAlert={showAlert}
      />
    </>
  );
}
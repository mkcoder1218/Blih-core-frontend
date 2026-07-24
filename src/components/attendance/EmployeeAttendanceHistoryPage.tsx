import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  InfoAlert,
  LoadingSpinner,
  PageHeader,
} from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { useMyAttendanceHistory } from "../../hooks/useMyAttendanceHistory";

type HistorySortBy =
  | "date"
  | "workedMinutes"
  | "status";

type HistorySortOrder = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const CONTROL_CLASS =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatMinutes(minutes: number): string {
  const safeMinutes = Math.max(
    0,
    Number(minutes || 0),
  );

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatTime(
  value: string | null | undefined,
  timezone?: string,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(status?: string | null): string {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function statusBadgeClass(
  status?: string | null,
): string {
  const normalized = String(
    status || "",
  ).toUpperCase();

  if (
    normalized === "COMPLETED" ||
    normalized === "REMOTE"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "IN_PROGRESS" ||
    normalized === "ON_BREAK"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "LATE") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    normalized === "MISSED" ||
    normalized === "NOT_STARTED"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): number[] {
  if (totalPages <= 5) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(
    totalPages,
    start + 4,
  );

  if (end - start < 4) {
    start = Math.max(1, end - 4);
  }

  return Array.from(
    { length: end - start + 1 },
    (_, index) => start + index,
  );
}

export default function EmployeeAttendanceHistoryPage() {
  const [startDate, setStartDate] =
    React.useState("");

  const [endDate, setEndDate] =
    React.useState("");

  const [status, setStatus] =
    React.useState("");

  const [sortBy, setSortBy] =
    React.useState<HistorySortBy>("date");

  const [sortOrder, setSortOrder] =
    React.useState<HistorySortOrder>("desc");

  const [page, setPage] =
    React.useState(1);

  const [pageSize, setPageSize] =
    React.useState(20);

  const history = useMyAttendanceHistory({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
    page,
    size: pageSize,
  });

  const responseData =
    history.data?.data;

  const rows =
    responseData?.rows || [];

  const totalRecords =
    Number(responseData?.count || 0);

  const currentPage =
    Number(responseData?.page || page);

  const returnedPageSize =
    Number(responseData?.size || pageSize);

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalRecords / returnedPageSize,
    ),
  );

  const firstRecord =
    totalRecords === 0
      ? 0
      : (currentPage - 1) *
          returnedPageSize +
        1;

  const lastRecord = Math.min(
    currentPage * returnedPageSize,
    totalRecords,
  );

  const timezone =
    (responseData as any)?.timezone ||
    undefined;

  const visiblePages = getVisiblePages(
    currentPage,
    totalPages,
  );

  React.useEffect(() => {
    setPage(1);
  }, [
    startDate,
    endDate,
    status,
    sortBy,
    sortOrder,
    pageSize,
  ]);

  React.useEffect(() => {
    if (
      totalRecords > 0 &&
      page > totalPages
    ) {
      setPage(totalPages);
    }
  }, [
    page,
    totalPages,
    totalRecords,
  ]);

  const handleStartDateChange = (
    value: string,
  ) => {
    setStartDate(value);

    if (
      endDate &&
      value &&
      value > endDate
    ) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (
    value: string,
  ) => {
    setEndDate(value);

    if (
      startDate &&
      value &&
      value < startDate
    ) {
      setStartDate(value);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Attendance"
        title="History"
        description="Review your daily attendance totals, missing time, overtime, and attendance status."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Start date
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                handleStartDateChange(
                  event.target.value,
                )
              }
              className={CONTROL_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              End date
            </span>

            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                handleEndDateChange(
                  event.target.value,
                )
              }
              className={CONTROL_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className={CONTROL_CLASS}
            >
              <option value="">
                All statuses
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="IN_PROGRESS">
                In progress
              </option>

              <option value="ON_BREAK">
                On break
              </option>

              <option value="REMOTE">
                Remote
              </option>

              <option value="LATE">
                Late
              </option>

              <option value="MISSED">
                Missed
              </option>

              <option value="NOT_STARTED">
                Not started
              </option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Sort by
            </span>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target
                    .value as HistorySortBy,
                )
              }
              className={CONTROL_CLASS}
            >
              <option value="date">
                Date
              </option>

              <option value="workedMinutes">
                Worked time
              </option>

              <option value="status">
                Status
              </option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Sort order
            </span>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target
                    .value as HistorySortOrder,
                )
              }
              className={CONTROL_CLASS}
            >
              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Daily records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {totalRecords > 0
                ? `Showing ${firstRecord}–${lastRecord} of ${totalRecords} records`
                : "No attendance records"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              Rows

              <select
                value={pageSize}
                onChange={(event) =>
                  setPageSize(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {PAGE_SIZE_OPTIONS.map(
                  (size) => (
                    <option
                      key={size}
                      value={size}
                    >
                      {size}
                    </option>
                  ),
                )}
              </select>
            </label>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                history.refetch()
              }
              disabled={
                history.isFetching
              }
              className="h-9 rounded-lg border-slate-200 px-3 text-xs font-semibold"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${
                  history.isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </Button>
          </div>
        </div>

        {history.isError ? (
          <div className="p-5">
            <InfoAlert
              variant="error"
              message="Failed to load attendance history."
            />
          </div>
        ) : null}

        {history.isLoading ? (
          <div className="p-6">
            <LoadingSpinner label="Loading attendance history..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No attendance history found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Try changing the date range or
              status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-4 py-3">
                    Check-in
                  </th>

                  <th className="px-4 py-3">
                    Lunch out
                  </th>

                  <th className="px-4 py-3">
                    Lunch in
                  </th>

                  <th className="px-4 py-3">
                    Check-out
                  </th>

                  <th className="px-4 py-3">
                    Worked
                  </th>

                  <th className="px-4 py-3">
                    Break
                  </th>

                  <th className="px-4 py-3">
                    Expected
                  </th>

                  <th className="px-4 py-3">
                    Overtime
                  </th>

                  <th className="px-4 py-3">
                    Missing
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row: any) => {
                  const calculation =
                    row.calculation || {};

                  const currentStatus =
                    calculation.currentStatus ||
                    "UNKNOWN";

                  return (
                    <tr
                      key={row.date}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                        {row.date || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatTime(
                          row.events
                            ?.checkInAtUtc,
                          timezone,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatTime(
                          row.events
                            ?.lunchOutAtUtc,
                          timezone,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatTime(
                          row.events
                            ?.lunchInAtUtc,
                          timezone,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatTime(
                          row.events
                            ?.checkOutAtUtc,
                          timezone,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">
                        {formatMinutes(
                          calculation.totalWorkedMinutes,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatMinutes(
                          calculation.totalBreakMinutes,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatMinutes(
                          calculation.expectedMinutes,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatMinutes(
                          calculation.overtimeMinutes,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatMinutes(
                          calculation.missingMinutes,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(
                            currentStatus,
                          )}`}
                        >
                          {formatStatus(
                            currentStatus,
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">
            Page {currentPage} of{" "}
            {totalPages}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1),
                )
              }
              disabled={
                currentPage <= 1 ||
                history.isFetching
              }
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {visiblePages[0] > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  className="h-9 min-w-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  1
                </button>

                {visiblePages[0] > 2 ? (
                  <span className="px-1 text-xs text-slate-400">
                    …
                  </span>
                ) : null}
              </>
            ) : null}

            {visiblePages.map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() =>
                    setPage(pageNumber)
                  }
                  disabled={
                    history.isFetching
                  }
                  className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-semibold transition ${
                    currentPage ===
                    pageNumber
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}

            {visiblePages[
              visiblePages.length - 1
            ] < totalPages ? (
              <>
                {visiblePages[
                  visiblePages.length - 1
                ] <
                totalPages - 1 ? (
                  <span className="px-1 text-xs text-slate-400">
                    …
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    setPage(totalPages)
                  }
                  className="h-9 min-w-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {totalPages}
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1,
                  ),
                )
              }
              disabled={
                currentPage >=
                  totalPages ||
                history.isFetching
              }
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

import React from "react";
import { useMyAttendanceHistory } from "../../hooks/useMyAttendanceHistory";

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export default function EmployeeAttendanceHistoryPage() {
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<string>("date");
  const [sortOrder, setSortOrder] = React.useState<string>("desc");
  const [page, setPage] = React.useState<number>(1);

  const history = useMyAttendanceHistory({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
    page,
    size: 30,
  });

  const rows = (history.data as any)?.data?.rows || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance</div>
        <div className="text-[18px] font-black text-slate-900 tracking-tight mt-1">History</div>
        <div className="text-[12px] text-slate-600 font-semibold mt-1">Review your daily attendance totals and status.</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700">
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_BREAK">On Break</option>
              <option value="LATE">Late</option>
              <option value="MISSED">Missed</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="date">Sort: Date</option>
            <option value="workedMinutes">Sort: Worked</option>
            <option value="status">Sort: Status</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
            <option value="desc">Order: Desc</option>
            <option value="asc">Order: Asc</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[12px] font-extrabold text-slate-900">Daily records</div>
            <div className="text-[11px] text-slate-600 font-semibold mt-0.5">Page {page}</div>
          </div>
          <button
            onClick={() => history.refetch()}
            disabled={history.isFetching}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl"
          >
            {history.isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {history.isLoading ? (
          <div className="px-5 py-6 text-[12px] text-slate-600 font-semibold">Loading…</div>
        ) : history.isError ? (
          <div className="px-5 py-6 text-[12px] text-red-700 font-semibold">Failed to load history.</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-6 text-[12px] text-slate-600 font-semibold">No history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Check-in</th>
                  <th className="px-4 py-3">Lunch out</th>
                  <th className="px-4 py-3">Lunch in</th>
                  <th className="px-4 py-3">Check-out</th>
                  <th className="px-4 py-3">Worked</th>
                  <th className="px-4 py-3">Break</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Overtime</th>
                  <th className="px-4 py-3">Missing</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.date} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-[12px] font-extrabold text-slate-900">{r.date || todayYmd()}</td>
                    <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{fmt(r.events?.checkInAtUtc)}</td>
                    <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{fmt(r.events?.lunchOutAtUtc)}</td>
                    <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{fmt(r.events?.lunchInAtUtc)}</td>
                    <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{fmt(r.events?.checkOutAtUtc)}</td>
                    <td className="px-4 py-3 text-[12px] font-extrabold text-slate-700">{formatMinutes(r.calculation?.totalWorkedMinutes || 0)}</td>
                    <td className="px-4 py-3 text-[12px] font-extrabold text-slate-700">{formatMinutes(r.calculation?.totalBreakMinutes || 0)}</td>
                    <td className="px-4 py-3 text-[12px] font-extrabold text-slate-700">{formatMinutes(r.calculation?.expectedMinutes || 0)}</td>
                    <td className="px-4 py-3 text-[12px] font-extrabold text-slate-700">{formatMinutes(r.calculation?.overtimeMinutes || 0)}</td>
                    <td className="px-4 py-3 text-[12px] font-extrabold text-slate-700">{formatMinutes(r.calculation?.missingMinutes || 0)}</td>
                    <td className="px-4 py-3 text-[12px] font-extrabold text-slate-700">{r.calculation?.currentStatus || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function fmt(v: any) {
  if (!v) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(v));
}
function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

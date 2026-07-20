import React, { useState, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Globe,
  User,
  Building2,
  Clock,
  Hash,
  X,
} from "lucide-react";
import { useAuditLogs, type AuditCategory, type AuditLogEntry } from "../../hooks/useAuditLogs";
import { useBusinesses } from "../../hooks/useBusinesses";

// Section

import { AuditRow, CATEGORY_CONFIG } from './AuditLogParts';
interface AuditLogsTabProps {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
}

export default function AuditLogsTab({ showAlert }: AuditLogsTabProps) {
  const businessesQuery = useBusinesses();
  const businesses = businessesQuery.data?.data?.businesses || [];

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterBusinessId, setFilterBusinessId] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterCategory, setFilterCategory] = useState<AuditCategory | "">("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useAuditLogs({
    page,
    size: 20,
    search: search || undefined,
    businessId: filterBusinessId || undefined,
    action: filterAction || undefined,
    entityType: filterEntityType || undefined,
    category: filterCategory || undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setFilterBusinessId("");
    setFilterAction("");
    setFilterEntityType("");
    setFilterCategory("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const activeFilterCount = [filterBusinessId, filterAction, filterEntityType, filterCategory, filterDateFrom, filterDateTo].filter(Boolean).length;

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // KPI summary from current page
  const catCounts = logs.reduce(
    (acc, l) => { acc[l.category] = (acc[l.category] ?? 0) + 1; return acc; },
    { success: 0, warning: 0, error: 0 } as Record<AuditCategory, number>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div className="space-y-1">
          <span className="bg-violet-50 border border-violet-100 text-violet-700 text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
            Platform Audit Trail
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Audit Logs</h1>
          <p className="text-xs text-slate-400 font-medium">
            Complete record of every create, update and delete action across all tenants.
          </p>
        </div>
        <button
          onClick={() => { refetch(); showAlert("Audit logs refreshed", "success"); }}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["success", "warning", "error"] as AuditCategory[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const Icon = cfg.icon;
          return (
            <button
              key={cat}
              onClick={() => { setFilterCategory(filterCategory === cat ? "" : cat); setPage(1); }}
              className={`bg-white p-4 rounded-2xl border transition-all text-left hover:-translate-y-0.5 ${
                filterCategory === cat ? `${cfg.border} ring-2 ring-offset-1 ${cfg.bg}` : "border-slate-100"
              } shadow-[0_5px_15px_rgba(0,0,0,0.01)]`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
                <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.text}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{catCounts[cat]}</div>
              <div className="text-[10px] text-slate-400 font-medium">on this page</div>
            </button>
          );
        })}
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-[0_5px_15px_rgba(0,0,0,0.01)]">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by entity, action, IP, device..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {(search || activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
            {/* Business */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business</label>
              <select
                value={filterBusinessId}
                onChange={(e) => { setFilterBusinessId(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">All businesses</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Action */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action</label>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">All actions</option>
                {["CREATE", "UPDATE", "DELETE"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value as AuditCategory | ""); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">All categories</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Entity type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entity Type</label>
              <input
                type="text"
                placeholder="e.g. user, employee"
                value={filterEntityType}
                onChange={(e) => { setFilterEntityType(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Date from */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Date to */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_5px_22px_rgba(0,0,0,0.01)]">
        {/* Sub-header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <span className="text-[11px] font-bold text-slate-400">
            {isLoading ? "Loading…" : `${total.toLocaleString()} total entries`}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Page {page} of {totalPages}
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-10 h-10 text-slate-300 mx-auto animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Loading audit logs…</p>
          </div>
        ) : isError ? (
          <div className="py-20 text-center space-y-3">
            <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Failed to load audit logs</p>
            <p className="text-xs text-slate-400">
              {(error as any)?.response?.data?.message || (error as any)?.message || "Request failed"}
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No audit logs match your filters</p>
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline font-semibold">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 select-none">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Device / IP</th>
                  <th className="py-3 px-4 text-right">Time</th>
                  <th className="py-3 px-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

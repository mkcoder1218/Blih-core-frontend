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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const CATEGORY_CONFIG: Record<
  AuditCategory,
  { label: string; bg: string; text: string; border: string; icon: React.FC<any> }
> = {
  success: {
    label: "Success",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  warning: {
    label: "Warning",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  error: {
    label: "Error",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
  },
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-blue-50 text-blue-700 border-blue-200",
  UPDATE: "bg-violet-50 text-violet-700 border-violet-200",
  DELETE: "bg-rose-50 text-rose-700 border-rose-200",
};

function DeviceIcon({ info }: { info: string | null }) {
  if (!info) return <Monitor className="w-3.5 h-3.5 text-slate-400" />;
  const lower = info.toLowerCase();
  if (lower.includes("mobile") || lower.includes("iphone") || lower.includes("android"))
    return <Smartphone className="w-3.5 h-3.5 text-slate-500" />;
  return <Monitor className="w-3.5 h-3.5 text-slate-500" />;
}

// Section
function DiffViewer({ before, after }: { before: any; after: any }) {
  const allKeys = Array.from(
    new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  );
  if (allKeys.length === 0) return <p className="text-xs text-slate-400">No data recorded.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <th className="py-2 px-3 text-left border border-slate-200 w-1/4">Field</th>
            <th className="py-2 px-3 text-left border border-slate-200 w-[37.5%]">Before</th>
            <th className="py-2 px-3 text-left border border-slate-200 w-[37.5%]">After</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key) => {
            const bVal = JSON.stringify((before || {})[key] ?? "—");
            const aVal = JSON.stringify((after || {})[key] ?? "—");
            const changed = bVal !== aVal;
            return (
              <tr key={key} className={changed ? "bg-amber-50/50" : ""}>
                <td className="py-1.5 px-3 border border-slate-200 font-semibold text-slate-700 break-words">{key}</td>
                <td className={`py-1.5 px-3 border border-slate-200 font-mono break-words ${changed ? "text-red-600" : "text-slate-500"}`}>
                  {bVal}
                </td>
                <td className={`py-1.5 px-3 border border-slate-200 font-mono break-words ${changed ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                  {aVal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Section
export function AuditRow({ log }: { key?: React.Key; log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[log.category] ?? CATEGORY_CONFIG.success;
  const CatIcon = cat.icon;
  const actionCls = ACTION_COLORS[log.action?.toUpperCase()] ?? "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <>
      <tr
        className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Category badge */}
        <td className="py-3.5 px-4 whitespace-nowrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cat.bg} ${cat.text} ${cat.border}`}>
            <CatIcon className="w-3 h-3" />
            {cat.label}
          </span>
        </td>

        {/* Action */}
        <td className="py-3.5 px-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${actionCls}`}>
            {log.action}
          </span>
        </td>

        {/* Entity */}
        <td className="py-3.5 px-4">
          <div className="font-semibold text-[11px] text-slate-800 leading-tight">{log.entityType}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[180px] truncate">{log.entityId}</div>
        </td>

        {/* User */}
        <td className="py-3.5 px-4">
          {log.User ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 border border-blue-100">
                {log.User.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-800 leading-tight">{log.User.fullName}</div>
                <div className="text-[10px] text-slate-400">{log.User.email}</div>
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">System</span>
          )}
        </td>

        {/* Business */}
        <td className="py-3.5 px-4">
          {log.Business ? (
            <div>
              <div className="text-[11px] font-semibold text-slate-800">{log.Business.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{log.Business.slug}</div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Platform</span>
          )}
        </td>

        {/* Device + IP */}
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-1.5">
            <DeviceIcon info={log.deviceInfo} />
            <span className="text-[11px] text-slate-600 font-medium">{log.deviceInfo ?? "—"}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Globe className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-mono">{log.ipAddress ?? "—"}</span>
          </div>
        </td>

        {/* Time */}
        <td className="py-3.5 px-4 whitespace-nowrap text-right">
          <div className="text-[11px] font-semibold text-slate-700">{timeAgo(log.createdAt)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(log.createdAt)}</div>
        </td>

        {/* Expand toggle */}
        <td className="py-3.5 px-3 text-slate-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-slate-50/70 border-b border-slate-200">
          <td colSpan={8} className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Details</div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5">
                  {[
                    { icon: Hash, label: "Log ID", val: log.id },
                    { icon: User, label: "User ID", val: log.userId ?? "—" },
                    { icon: Building2, label: "Business ID", val: log.businessId ?? "—" },
                    { icon: Globe, label: "IP Address", val: log.ipAddress ?? "—" },
                    { icon: Monitor, label: "Device", val: log.deviceInfo ?? "—" },
                    { icon: Clock, label: "Timestamp", val: formatDate(log.createdAt) },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-start gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[10px] text-slate-500 font-semibold w-24 flex-shrink-0">{label}</span>
                      <span className="text-[10px] text-slate-700 font-mono break-all">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User-Agent */}
              {log.userAgent && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Agent</div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] text-slate-600 font-mono break-all leading-relaxed">{log.userAgent}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Diff */}
            {(log.beforeData || log.afterData) && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Changes</div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <DiffViewer before={log.beforeData} after={log.afterData} />
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// Section

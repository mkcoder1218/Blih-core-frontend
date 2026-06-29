import React, { useState } from "react";
import {
  Bell,
  BellOff,
  RefreshCw,
  Mail,
  MessageSquare,
  MonitorSmartphone,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllRead, timeAgo } from "../../hooks/useNotifications";
import { useBusinesses } from "../../hooks/useBusinesses";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

/* ─── types ─────────────────────────────────────────────────────────────── */
interface NotifPreference {
  id: string;
  channel: "in_app" | "email" | "sms";
  moduleKey: string | null;
  type: string | null;
  isEnabled: boolean;
}

const MODULE_KEYS = [
  "attendance",
  "recruitment",
  "onboarding",
  "finance",
  "performance",
  "hr",
  "exit",
  "approvals",
  "system",
];

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
  in_app: { label: "In-App", icon: MonitorSmartphone, color: "text-blue-600" },
  email: { label: "Email", icon: Mail, color: "text-violet-600" },
  sms: { label: "SMS", icon: MessageSquare, color: "text-emerald-600" },
};

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: "bg-red-50", text: "text-red-700", label: "Urgent" },
  high: { bg: "bg-amber-50", text: "text-amber-700", label: "High" },
  normal: { bg: "bg-blue-50", text: "text-blue-700", label: "Normal" },
  low: { bg: "bg-slate-100", text: "text-slate-500", label: "Low" },
};

/* ─── hooks ─────────────────────────────────────────────────────────────── */

/** Fetch platform-level notification preferences (super admin only) */
function usePlatformPreferences(businessId?: string) {
  return useQuery<NotifPreference[]>({
    queryKey: ["notification-preferences", businessId],
    queryFn: async () => {
      const res = await api.get("/api/v1/notification-preferences");
      const payload = res.data;
      return payload?.preferences ?? payload?.data?.preferences ?? [];
    },
    staleTime: 60_000,
  });
}

function useUpdatePreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { channel: string; moduleKey?: string; type?: string; isEnabled: boolean }) => {
      await api.post("/api/v1/notification-preferences", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}

/* ─── preference toggle row ─────────────────────────────────────────────── */
function PreferenceRow({
  moduleKey,
  preferences,
  onToggle,
  isUpdating,
}: {
  key?: React.Key;
  moduleKey: string;
  preferences: NotifPreference[];
  onToggle: (channel: string, moduleKey: string, enabled: boolean) => void | Promise<void>;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const getEnabled = (channel: string): boolean => {
    const pref = preferences.find(
      (p) => p.channel === channel && p.moduleKey === moduleKey
    );
    return pref ? pref.isEnabled : true; // default enabled
  };

  const channels = ["in_app", "email", "sms"] as const;
  const allEnabled = channels.every((c) => getEnabled(c));

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${allEnabled ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="text-xs font-bold text-slate-800 capitalize">{moduleKey.replace(/_/g, " ")}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {channels.map((ch) => {
              const cfg = CHANNEL_CONFIG[ch];
              const Icon = cfg.icon;
              const enabled = getEnabled(ch);
              return (
                <div key={ch} className={`flex items-center gap-1 ${enabled ? cfg.color : "text-slate-300"}`} title={cfg.label}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              );
            })}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-2">
          {channels.map((ch) => {
            const cfg = CHANNEL_CONFIG[ch];
            const Icon = cfg.icon;
            const enabled = getEnabled(ch);
            return (
              <div key={ch} className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-700">{cfg.label} notifications</span>
                </div>
                <button
                  disabled={isUpdating}
                  onClick={() => onToggle(ch, moduleKey, !enabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    enabled ? "bg-blue-600" : "bg-slate-300"
                  }`}
                  aria-label={enabled ? "Disable" : "Enable"}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */
interface NotificationsTabProps {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
}

export default function NotificationsTab({ showAlert }: NotificationsTabProps) {
  const [activeSection, setActiveSection] = useState<"feed" | "preferences">("feed");
  const [filterStatus, setFilterStatus] = useState<"" | "unread" | "read" | "archived">("");
  const [filterPriority, setFilterPriority] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const prefsQuery = usePlatformPreferences();
  const updatePref = useUpdatePreference();

  const allNotifications = notificationsQuery.data ?? [];
  const filtered = allNotifications.filter((n) => {
    if (filterStatus && n.status !== filterStatus) return false;
    if (filterPriority && n.priority !== filterPriority) return false;
    if (searchInput) {
      const q = searchInput.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const unreadCount = allNotifications.filter((n) => n.status === "unread").length;

  const handleToggle = async (channel: string, moduleKey: string, enabled: boolean) => {
    try {
      await updatePref.mutateAsync({ channel, moduleKey, isEnabled: enabled });
      showAlert(
        `${CHANNEL_CONFIG[channel]?.label ?? channel} notifications for ${moduleKey} ${enabled ? "enabled" : "disabled"}`,
        "success"
      );
    } catch {
      showAlert("Failed to update preference", "error");
    }
  };

  const preferences: NotifPreference[] = prefsQuery.data ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div className="space-y-1">
          <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
            Platform Notifications
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Notifications</h1>
          <p className="text-xs text-slate-400 font-medium">
            Monitor platform-wide notifications and manage channel preferences per module.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate(undefined, { onSuccess: () => showAlert("All marked as read", "success") })}
              disabled={markAllRead.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={() => notificationsQuery.refetch()}
            disabled={notificationsQuery.isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${notificationsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", val: allNotifications.length, icon: Bell, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Unread", val: unreadCount, icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Read", val: allNotifications.filter((n) => n.status === "read").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Archived", val: allNotifications.filter((n) => n.status === "archived").length, icon: BellOff, color: "text-slate-400", bg: "bg-slate-100" },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-[0_5px_15px_rgba(0,0,0,0.01)]">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{val}</div>
            </div>
            <div className={`p-2 rounded-xl ${bg} ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["feed", "preferences"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeSection === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {s === "feed" ? "Notification Feed" : "Channel Preferences"}
          </button>
        ))}
      </div>

      {/* ── Feed section ─────────────────────────────────────────────────────── */}
      {activeSection === "feed" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3 shadow-[0_5px_15px_rgba(0,0,0,0.01)]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notifications…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All statuses</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Feed list */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_5px_22px_rgba(0,0,0,0.01)]">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">
                {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {notificationsQuery.isLoading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
                <p className="text-sm text-slate-500 mt-3 font-semibold">Loading notifications…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <BellOff className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-500 mt-3">No notifications found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((n) => {
                  const pCfg = PRIORITY_CONFIG[n.priority] ?? PRIORITY_CONFIG.normal;
                  return (
                    <div
                      key={n.id}
                      className={`px-5 py-4 flex items-start gap-4 transition-colors hover:bg-slate-50/40 ${
                        n.status === "unread" ? "bg-blue-50/20 border-l-2 border-blue-500" : ""
                      }`}
                    >
                      {/* Priority dot */}
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        n.priority === "urgent" ? "bg-red-500" :
                        n.priority === "high" ? "bg-amber-500" :
                        n.priority === "normal" ? "bg-blue-500" : "bg-slate-300"
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold leading-snug ${n.status === "unread" ? "text-slate-900" : "text-slate-700"}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal line-clamp-2">{n.message}</p>
                          </div>
                          <div className="flex-shrink-0 text-right space-y-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${pCfg.bg} ${pCfg.text}`}>
                              {pCfg.label}
                            </span>
                            <p className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{n.moduleKey}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400">{n.type}</span>
                          {n.status === "unread" && (
                            <button
                              onClick={() =>
                                markRead.mutate(n.id, {
                                  onSuccess: () => showAlert("Marked as read", "success"),
                                })
                              }
                              className="text-[10px] text-blue-600 font-bold hover:underline ml-1"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Preferences section ──────────────────────────────────────────────── */}
      {activeSection === "preferences" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_5px_15px_rgba(0,0,0,0.01)]">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Channel Preferences</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Toggle notification channels per module. These preferences apply to your super admin account.
                  Disabling a channel prevents those notifications from being delivered via that channel.
                </p>
              </div>
            </div>

            {/* Channel legend */}
            <div className="flex flex-wrap gap-4 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cfg.label}</span>
                  </div>
                );
              })}
            </div>

            {prefsQuery.isLoading ? (
              <div className="py-10 text-center">
                <RefreshCw className="w-7 h-7 text-slate-300 mx-auto animate-spin" />
                <p className="text-xs text-slate-400 mt-2">Loading preferences…</p>
              </div>
            ) : (
              <div className="space-y-2">
                {MODULE_KEYS.map((moduleKey) => (
                  <PreferenceRow
                    key={moduleKey}
                    moduleKey={moduleKey}
                    preferences={preferences}
                    onToggle={handleToggle}
                    isUpdating={updatePref.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

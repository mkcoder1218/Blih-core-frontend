import React from "react";
import { Bot, Clock, MessageSquare, Send } from "lucide-react";
import { useBusinesses } from "../../hooks/useBusinesses";
import { useAttendanceTelegramSettings, useSendAttendanceTelegramTest, useUpsertAttendanceTelegramSetting } from "../../hooks/useAttendanceTelegramSettings";
import type { TelegramBotType, TelegramSetting } from "../../api/attendanceTelegram";

type Props = {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
};

const BOT_LABELS: Record<TelegramBotType, { title: string; icon: any; time: boolean; copy: string }> = {
  ATTENDANCE_SUMMARY: {
    title: "Attendance Summary Bot",
    icon: Send,
    time: true,
    copy: "Daily CSV delivery with worked hours, check-in/out, late status, and remote or office mode."
  },
  LATE_REASON: {
    title: "Late Reason Notification Bot",
    icon: MessageSquare,
    time: false,
    copy: "Instant Telegram message when an employee submits a late check-in reason."
  },
  PERSONAL_SUMMARY: {
    title: "Personal Attendance Summary Bot",
    icon: Bot,
    time: false,
    copy: "Employees link using a one-time ERP code and request /today, /week, /month, or /unlink."
  }
};

function normalizeTimeInput(value: string) {
  const raw = String(value || "").trim();
  const twentyFourHour = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHour) return `${twentyFourHour[1].padStart(2, "0")}:${twentyFourHour[2]}`;

  const twelveHour = raw.match(/^(\d{1,2}):([0-5]\d)\s*([AP]M)$/i);
  if (!twelveHour) return raw || "20:00";
  let hour = Number(twelveHour[1]);
  const minute = twelveHour[2];
  const suffix = twelveHour[3].toUpperCase();
  if (suffix === "PM" && hour !== 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function formatSavedTime(value?: string | null) {
  if (!value) return "Not scheduled";
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(d);
}

function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function zonedWallTimeToDate(dateYmd: string, hhmm: string, timeZone: string) {
  const [year, month, day] = dateYmd.split("-").map(Number);
  const [hour, minute] = normalizeTimeInput(hhmm).split(":").map(Number);
  const approxUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(approxUtc);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = asUtc - approxUtc.getTime();
  return new Date(approxUtc.getTime() - offsetMs);
}

function nextSendText(sendTime: string, timezone: string) {
  const normalized = normalizeTimeInput(sendTime);
  const now = new Date();
  const todayInZone = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const nowParts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const sendDay = toMinutes(nowParts) >= toMinutes(normalized) ? "tomorrow" : "today";
  const sendDateYmd =
    sendDay === "today"
      ? todayInZone
      : (() => {
          const tomorrow = new Date(zonedWallTimeToDate(todayInZone, "12:00", timezone));
          tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
          return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(tomorrow);
        })();
  const sendAt = zonedWallTimeToDate(sendDateYmd, normalized, timezone);
  const localText = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(sendAt);
  return `Next automatic send: ${sendDay} at ${normalized} (${timezone}). Your local time: ${localText}.`;
}

function BotForm({
  setting,
  onSave,
  onTest,
  saving,
  testing
}: {
  setting: TelegramSetting;
  onSave: (data: any) => void;
  onTest: () => void;
  saving: boolean;
  testing: boolean;
}) {
  const meta = BOT_LABELS[setting.botType];
  const Icon = meta.icon;
  const localTz = browserTimezone();
  const [draft, setDraft] = React.useState({
    enabled: Boolean(setting.enabled),
    botToken: "",
    chatId: setting.chatId || "",
    sendTime: setting.sendTime || "20:00",
    timezone: setting.timezone || browserTimezone()
  });

  React.useEffect(() => {
    setDraft({
      enabled: Boolean(setting.enabled),
      botToken: "",
      chatId: setting.chatId || "",
      sendTime: setting.sendTime || "20:00",
      timezone: setting.timezone || browserTimezone()
    });
  }, [setting.id, setting.botType, setting.chatId, setting.sendTime, setting.timezone, setting.enabled]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-[#1a56db]">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">{meta.title}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 max-w-xl">{meta.copy}</div>
          </div>
        </div>
        <label className="flex items-center gap-2 select-none">
          <span className="text-[11px] font-bold text-slate-600">Enabled</span>
          <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} className="h-4 w-4 accent-[#1a56db]" />
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bot Token</label>
          <input
            type="password"
            value={draft.botToken}
            onChange={(e) => setDraft({ ...draft, botToken: e.target.value })}
            placeholder={setting.botTokenMasked ? `Current: ${setting.botTokenMasked}` : "Paste Telegram bot token"}
            className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chat ID or Group ID</label>
          <input
            value={draft.chatId}
            onChange={(e) => setDraft({ ...draft, chatId: e.target.value })}
            className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {meta.time ? (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Report Send Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input type="time" value={normalizeTimeInput(draft.sendTime)} onChange={(e) => setDraft({ ...draft, sendTime: normalizeTimeInput(e.target.value) })} className="w-full bg-slate-50 focus:bg-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700" />
            </div>
            <div className="text-[10px] font-semibold text-slate-400">
              Saved as {normalizeTimeInput(draft.sendTime)} ({formatSavedTime(normalizeTimeInput(draft.sendTime))})
            </div>
            <div className="text-[10px] font-semibold text-amber-600">
              {nextSendText(draft.sendTime, draft.timezone || browserTimezone())}
            </div>
          </div>
        ) : null}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timezone</label>
          <div className="flex gap-2">
            <input value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })} className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700" />
            <button
              type="button"
              onClick={() => setDraft({ ...draft, timezone: browserTimezone() })}
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-50"
            >
              Local
            </button>
          </div>
          <div className="text-[10px] font-semibold text-slate-400">Your browser timezone is {localTz}.</div>
          {draft.timezone && draft.timezone !== localTz ? (
            <div className="text-[10px] font-bold text-red-600">
              This bot is scheduled in {draft.timezone}, not your local timezone. Click Local to schedule by your clock.
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={testing || saving}
          onClick={onTest}
          className="border border-slate-200 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 font-bold text-slate-700 leading-none py-2.5 px-4 rounded-xl text-xs cursor-pointer"
        >
          {testing ? "Sending..." : "Send Test"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave({ ...draft, sendTime: normalizeTimeInput(draft.sendTime), chatId: draft.chatId || null, botToken: draft.botToken || undefined })}
          className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white shadow-sm leading-none py-2.5 px-4 rounded-xl text-xs cursor-pointer"
        >
          {saving ? "Saving..." : "Save Bot"}
        </button>
      </div>
    </div>
  );
}

export default function TelegramAttendanceIntegrationsPanel({ showAlert }: Props) {
  const businessesQuery = useBusinesses();
  const businesses = businessesQuery.data?.data?.businesses || [];
  const [businessId, setBusinessId] = React.useState("");
  const settingsQuery = useAttendanceTelegramSettings(businessId || null);
  const upsert = useUpsertAttendanceTelegramSetting(businessId || null);
  const sendTest = useSendAttendanceTelegramTest(businessId || null);

  React.useEffect(() => {
    if (!businessId && businesses[0]?.id) setBusinessId(businesses[0].id);
  }, [businesses, businessId]);

  const settings = settingsQuery.data?.data?.telegramSettings || [];

  return (
    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="text-xs font-black text-slate-900">Telegram Attendance Bots</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Configure tenant-specific Telegram bots for attendance reports, late reasons, and employee self-service.</div>
        </div>
        <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="bg-white px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] font-semibold text-xs text-slate-700 cursor-pointer">
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {settingsQuery.isLoading ? <div className="text-xs text-slate-500">Loading Telegram settings...</div> : null}
      <div className="space-y-3">
        {settings.map((setting) => (
          <BotForm
            key={setting.botType}
            setting={setting}
            saving={upsert.isPending}
            testing={sendTest.isPending}
            onSave={async (data) => {
              try {
                await upsert.mutateAsync({ botType: setting.botType, data });
                showAlert("Telegram bot settings saved.", "success");
              } catch (e: any) {
                showAlert(e?.response?.data?.message || "Failed to save Telegram settings.", "error");
              }
            }}
            onTest={async () => {
              try {
                await sendTest.mutateAsync({ botType: setting.botType });
                showAlert("Telegram test sent.", "success");
              } catch (e: any) {
                showAlert(e?.response?.data?.message || "Failed to send Telegram test.", "error");
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

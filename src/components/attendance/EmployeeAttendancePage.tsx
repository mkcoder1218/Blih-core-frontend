import React from "react";
import {
  MapPin,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock3,
  Coffee,
  LogIn,
  LogOut,
  UtensilsCrossed,
  AlertTriangle,
  Undo2,
  Link2,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useMyAttendanceToday } from "../../hooks/useMyAttendanceToday";
import { useCreateMyAttendanceEvent } from "../../hooks/useCreateMyAttendanceEvent";
import { useRevertMyAttendanceEvent } from "../../hooks/useRevertMyAttendanceEvent";
import type { AttendanceEventType, BusinessAttendanceSettings } from "../../api/types";
import { useGenerateTelegramLinkCode, useUnlinkMyTelegram } from "../../hooks/useTelegramLinkCode";
import { ConfirmDialog } from "@/components/ui/blih";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type GeoState =
  | { status: "idle" }
  | { status: "prompt" }
  | { status: "granted" }
  | { status: "denied" }
  | { status: "error"; message: string };

type Coords = { latitude: number; longitude: number } | null;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EmployeeAttendancePage({ onSpecialRequest }: { onSpecialRequest?: () => void }) {
  const today = useMyAttendanceToday();
  const createEvent = useCreateMyAttendanceEvent();
  const revertEvent = useRevertMyAttendanceEvent();
  const generateTelegramCode = useGenerateTelegramLinkCode();
  const unlinkTelegram = useUnlinkMyTelegram();
  const [telegramCode, setTelegramCode] = React.useState<{ code: string; expiresAt: string } | null>(null);
  const [telegramCodeCopied, setTelegramCodeCopied] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  // ── Data from backend ──────────────────────────────────────────────────
  const data = today.data?.data as any;
  const settings = data?.settings as BusinessAttendanceSettings | null | undefined;
  const timeline: any[] = data?.timeline || [];
  const nextAllowed: AttendanceEventType[] = data?.nextAllowed || [];
  const disabledReason: string | null = data?.disabledReason || null;
  const calculation: any = data?.calculation;
  const lunch: any = data?.lunch;
  const day: any = data?.day;
  const cooldown: any = data?.cooldown || null;
  const serverNowUtc: string | undefined = data?.serverNowUtc;

  const tz = settings?.timezone || "UTC";
  const currentStatus: string = calculation?.currentStatus || "NOT_STARTED";
  const backendWorkedMins: number = calculation?.totalWorkedMinutes || 0;
  const backendRawWorkedMins: number = calculation?.rawWorkedMinutes ?? backendWorkedMins;
  const backendBreakMins: number = calculation?.totalBreakMinutes || 0;
  const penaltyMins: number = calculation?.penaltyMinutes || 0;
  const penaltyReason: string | null = calculation?.penaltyReason || null;
  const expectedMins: number = settings?.expectedDailyMinutes || 480;

  // Day is complete when nextAllowed is empty, there is no disabled reason,
  // and at least one event has been recorded today.
  const isDayComplete = nextAllowed.length === 0 && !disabledReason && !cooldown?.active && timeline.length > 0;

  // ── Live clock (seconds) ───────────────────────────────────────────────
  const [nowTs, setNowTs] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const serverClockOffsetMs = React.useMemo(() => {
    if (!serverNowUtc) return 0;
    const serverTs = new Date(serverNowUtc).getTime();
    if (Number.isNaN(serverTs)) return 0;
    return serverTs - Date.now();
  }, [serverNowUtc]);
  const serverNowDate = React.useMemo(() => new Date(nowTs + serverClockOffsetMs), [nowTs, serverClockOffsetMs]);
  const isSaturdayTrackingOnly = React.useMemo(
    () => new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(serverNowDate) === "Sat",
    [serverNowDate, tz]
  );

  // ── Live worked-time ticker ────────────────────────────────────────────
  // Backend is authoritative. Between 30-second refetches we locally
  // increment the worked-minutes display only while IN_PROGRESS.
  const lastFetchedAt = React.useRef<number>(Date.now());
  const [localWorkedMins, setLocalWorkedMins] = React.useState(backendWorkedMins);

  // Sync when a fresh backend value arrives
  React.useEffect(() => {
    setLocalWorkedMins(backendWorkedMins);
    lastFetchedAt.current = Date.now();
  }, [backendWorkedMins]);

  // Increment display every 30 s while actively working
  React.useEffect(() => {
    if (currentStatus !== "IN_PROGRESS") return;
    const id = setInterval(() => {
      setLocalWorkedMins(
        backendWorkedMins + Math.floor((Date.now() - lastFetchedAt.current) / 60_000)
      );
    }, 30_000);
    return () => clearInterval(id);
  }, [currentStatus, backendWorkedMins]);

  // ── Geolocation ────────────────────────────────────────────────────────
  const [geo, setGeo] = React.useState<GeoState>({ status: "idle" });
  const [coords, setCoords] = React.useState<Coords>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!navigator?.geolocation) {
        if (!cancelled) setGeo({ status: "error", message: "Geolocation not supported in this browser." });
        return;
      }
      try {
        const permApi: any = (navigator as any).permissions;
        if (!permApi?.query) {
          if (!cancelled) setGeo({ status: "prompt" });
          return;
        }
        const res = await permApi.query({ name: "geolocation" });
        if (cancelled) return;
        const applyState = (s: string) => {
          if (s === "granted") setGeo({ status: "granted" });
          else if (s === "denied") setGeo({ status: "denied" });
          else setGeo({ status: "prompt" });
        };
        applyState(res.state);
        res.onchange = () => applyState(res.state);
      } catch {
        if (!cancelled) setGeo({ status: "prompt" });
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const requestLocation = React.useCallback(() => {
    if (!navigator?.geolocation) {
      setGeo({ status: "error", message: "Geolocation not supported in this browser." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGeo({ status: "granted" });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGeo({ status: "denied" });
        else setGeo({ status: "error", message: "Unable to retrieve current location." });
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 10_000 }
    );
  }, []);

  // ── Workplace + distance ───────────────────────────────────────────────
  const office =
    settings && settings.latitude != null && settings.longitude != null
      ? {
          lat: Number(settings.latitude),
          lon: Number(settings.longitude),
          radius: Number(settings.allowedRadiusMeters),
        }
      : null;

  const distanceMeters =
    office && coords
      ? haversineDistanceMeters(coords.latitude, coords.longitude, office.lat, office.lon)
      : null;

  const withinRadius =
    office && distanceMeters !== null ? distanceMeters <= office.radius : null;

  // ── Fixed lunch window check ───────────────────────────────────────────
  // Re-evaluated every second (nowTs) so the window open/closed badge is live.
  const isLunchWindowActive: boolean | null = React.useMemo(() => {
    if (
      lunch?.lunchMode !== "FIXED" ||
      !lunch?.fixedLunchStartTime ||
      !lunch?.fixedLunchEndTime
    )
      return null;
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(serverNowDate);
      const get = (k: string) => Number(parts.find((p) => p.type === k)?.value ?? 0);
      const nowMins = get("hour") * 60 + get("minute");
      const toMins = (hhmm: string) =>
        Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
      return (
        nowMins >= toMins(lunch.fixedLunchStartTime) &&
        nowMins <= toMins(lunch.fixedLunchEndTime)
      );
    } catch {
      return null;
    }
  }, [serverNowDate, tz, lunch]);

  // ── Base disabled reason (applies to all buttons unless overridden) ────
  const baseDisabledReason: string | null = (() => {
    if (today.isLoading) return "Loading…";
    if (disabledReason) return disabledReason;
    if (!settings?.attendanceEnabled) return "Attendance is disabled";
    if (isSaturdayTrackingOnly) return createEvent.isPending ? "Processing..." : null;
    if (!office) return "Attendance location is not configured";
    if (geo.status === "denied") return "Location access denied";
    if (geo.status === "error") return (geo as any).message;
    if (!coords) return "Location permission required";
    if (withinRadius === false) return "Outside allowed location";
    if (createEvent.isPending) return "Processing…";
    return null;
  })();

  // ── Late check-in modal ────────────────────────────────────────────────
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [confirmRevertOpen, setConfirmRevertOpen] = React.useState(false);

  // Compute how many minutes late a check-in right now would be, using the
  // same logic as the backend (defaultStartTime + lateGracePeriodMinutes vs current local time).
  const computeLateByMinutes = React.useCallback((): number => {
    if (!settings?.defaultStartTime) return 0;
    const grace = Number(settings.lateGracePeriodMinutes ?? 0);
    const toMins = (hhmm: string) =>
      Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
    const expectedM = toMins(settings.defaultStartTime) + grace;
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(serverNowDate);
      const get = (k: string) => Number(parts.find((p) => p.type === k)?.value ?? 0);
      const nowM = get("hour") * 60 + get("minute");
      return Math.max(0, nowM - expectedM);
    } catch {
      return 0;
    }
  }, [settings, tz, serverNowDate]);

  const handleAction = async (type: AttendanceEventType) => {
    if (!coords && !isSaturdayTrackingOnly) return;
    setSubmitError(null);
    try {
      await createEvent.mutateAsync({
        type,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
    } catch (e: any) {
      setSubmitError(
        e?.response?.data?.message || e?.message || "Failed to record event"
      );
    }
  };

  const handleRevertLast = async () => {
    setSubmitError(null);
    try {
      await revertEvent.mutateAsync();
      setConfirmRevertOpen(false);
    } catch (e: any) {
      setSubmitError(e?.response?.data?.message || e?.message || "Failed to revert last action");
      setConfirmRevertOpen(false);
    }
  };

  // ── Display helpers ────────────────────────────────────────────────────
  const remainingMins = Math.max(0, expectedMins - localWorkedMins);
  const progressPct = Math.min(100, Math.round((localWorkedMins / expectedMins) * 100));
  const nowDisplay = new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(serverNowDate);
  const dateDisplay = new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(serverNowDate);
  const cooldownAvailableAt = cooldown?.untilUtc
    ? new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(cooldown.untilUtc))
    : null;
  const cooldownActionLabel =
    cooldown?.action === "LUNCH_IN" ? "Return from lunch" : "Check in";
  const cooldownRequiredMinutes = Number(cooldown?.requiredMinutes || 60);
  const cooldownTitle = cooldown?.action === "LUNCH_IN"
    ? `${cooldownRequiredMinutes} minute break required`
    : "1 hour break required";
  const checkedInTime = day?.checkInAtUtc ? formatTime(new Date(day.checkInAtUtc), tz) : null;
  const telegramLinked = Boolean(
    data?.telegramLinked ||
    data?.telegramAccountLinked ||
    data?.telegram?.linked ||
    data?.telegramAccount?.isActive
  );
  const showAttendanceWarning = Boolean(penaltyReason || penaltyMins > 0 || currentStatus === "ON_BREAK");
  const cleanPage = (
    <div className="mx-auto w-full max-w-5xl space-y-3">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs sm:p-5">
        <div className="mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance</div>
          <div className="mt-1 text-[18px] font-black tracking-tight text-slate-900">Self Check-In</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-slate-600">
            <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{dateDisplay}</span>
            <span className="text-slate-300">-</span>
            <span className="font-mono tabular-nums">{nowDisplay}</span>
            <span className="text-slate-300">-</span>
            <span className="text-[11px] text-slate-500">{tz}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current status</div>
              <div className="mt-1 text-xl font-black text-slate-950">
                {isSaturdayTrackingOnly ? "Saturday tracking only" : humanStatus(currentStatus, disabledReason, office, geo, coords, withinRadius)}
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">
                  {office ? settings?.locationName || "Primary workplace" : "Workplace location not configured"}
                </span>
                {office ? <span className="shrink-0 text-slate-300">- {office.radius} m radius</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {withinRadius === true ? (
                <Badge tone="good" icon={<CheckCircle2 className="h-4 w-4" />} text="Inside workplace" />
              ) : withinRadius === false ? (
                <Badge tone="bad" icon={<XCircle className="h-4 w-4" />} text="Outside workplace" />
              ) : (
                <Badge tone="neutral" icon={<ShieldAlert className="h-4 w-4" />} text="Location unavailable" />
              )}
              <button
                onClick={requestLocation}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-600 hover:bg-slate-50"
              >
                Refresh location
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat label="Worked today" value={fmtMins(localWorkedMins)} highlight={currentStatus === "IN_PROGRESS"} />
            <MiniStat label="Remaining" value={remainingMins > 0 ? fmtMins(remainingMins) : "Done"} />
            <MiniStat label="Break" value={fmtMins(backendBreakMins)} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] font-semibold text-slate-500 sm:grid-cols-3">
            <div>Checked in: <span className="font-black text-slate-800">{checkedInTime || "Not yet"}</span></div>
            <div>Worked: <span className="font-black text-slate-800">{fmtMins(localWorkedMins)}</span></div>
            <div>Remaining: <span className="font-black text-slate-800">{remainingMins > 0 ? fmtMins(remainingMins) : "Done"}</span></div>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-400">
              <span>Daily progress</span>
              <span>{progressPct}% of {fmtMins(expectedMins)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? "bg-emerald-500" : "bg-[#1a56db]"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {lunch?.lunchBreakEnabled && lunch?.lunchMode === "FIXED" && lunch?.fixedLunchStartTime && lunch?.fixedLunchEndTime ? (
            <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold ${isLunchWindowActive ? "text-emerald-700" : "text-slate-500"}`}>
              <Coffee className="h-3.5 w-3.5 shrink-0" />
              <span>Fixed lunch: {lunch.fixedLunchStartTime} - {lunch.fixedLunchEndTime}</span>
              <span className={isLunchWindowActive ? "font-bold text-emerald-600" : "text-slate-400"}>
                {isLunchWindowActive === true ? "Open" : "Not yet open"}
              </span>
            </div>
          ) : null}

          {showAttendanceWarning ? (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800 sm:flex-row sm:items-center">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">
                Lunch checkout issue detected. Request approval if needed.
                {penaltyReason ? <span className="block text-amber-900">Applied penalty: {penaltyReason}</span> : null}
              </span>
              {onSpecialRequest ? (
                <button
                  type="button"
                  onClick={onSpecialRequest}
                  className="inline-flex items-center gap-1.5 self-start rounded-lg border border-amber-300 bg-white/80 px-2.5 py-1.5 text-[11px] font-black text-amber-900 hover:bg-white sm:self-auto"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Request approval
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4">
            {isDayComplete ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Day complete
              </div>
            ) : disabledReason ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                {disabledReason}
              </div>
            ) : cooldown?.active ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900">{cooldownTitle}</div>
                    <div className="mt-0.5 text-[11px] font-semibold leading-relaxed text-amber-800">
                      {cooldownActionLabel} will be available
                      {cooldownAvailableAt ? ` at ${cooldownAvailableAt}` : " after the break"}
                      {cooldown?.remainingMinutes ? ` (${cooldown.remainingMinutes} min remaining).` : "."}
                    </div>
                  </div>
                </div>
                <button
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-extrabold tracking-wide text-slate-400"
                >
                  <Clock3 className="h-4 w-4" />
                  {cooldownActionLabel}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {nextAllowed.length === 0 ? (
                  <div className="text-[12px] font-semibold text-slate-500">No attendance action available right now.</div>
                ) : null}

                {nextAllowed.includes("CHECK_IN") && computeLateByMinutes() > 0 ? (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>You are <span className="font-black">{computeLateByMinutes()} min late</span>. Submit your reason separately in My Lateness Reason before 08:30 AM.</span>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  {nextAllowed.map((type, index) => {
                    const isLunchOutFixed = type === "LUNCH_OUT" && lunch?.lunchMode === "FIXED";
                    const lunchWindowClosed = isLunchOutFixed && isLunchWindowActive === false;
                    const btnDisabled = Boolean(baseDisabledReason) || lunchWindowClosed;
                    const disabledTitle = lunchWindowClosed
                      ? `Lunch window: ${lunch?.fixedLunchStartTime} - ${lunch?.fixedLunchEndTime}`
                      : baseDisabledReason ?? undefined;

                    return (
                      <button
                        key={type}
                        disabled={btnDisabled}
                        onClick={() => handleAction(type)}
                        title={btnDisabled && disabledTitle ? disabledTitle : undefined}
                        className={[
                          "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold tracking-wide transition-all",
                          index === 0 ? "flex-1" : "sm:w-auto",
                          btnDisabled
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : index === 0
                              ? actionBtnClass(type)
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {createEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : actionIcon(type)}
                        {createEvent.isPending ? "Processing..." : toActionLabel(type)}
                      </button>
                    );
                  })}
                </div>

                {geo.status === "prompt" && !coords && !isSaturdayTrackingOnly ? (
                  <button
                    onClick={requestLocation}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-[11px] font-bold text-white hover:bg-slate-800"
                  >
                    Allow location access
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {submitError ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {submitError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className="mt-3 text-left text-[11px] font-black text-slate-500 hover:text-slate-800"
          >
            {detailsOpen ? "Hide details" : "View details"}
          </button>

          {detailsOpen ? (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <MiniStat label="Credited time" value={fmtMins(localWorkedMins)} />
                <MiniStat label="Full worked" value={fmtMins(backendRawWorkedMins)} />
                <MiniStat label="Penalty" value={penaltyMins > 0 ? fmtMins(penaltyMins) : "0m"} />
                <MiniStat label="Distance" value={distanceMeters !== null ? `${Math.round(distanceMeters)} m` : "-"} />
                <MiniStat label="Workplace radius" value={office ? `${office.radius} m` : "-"} />
                <MiniStat label="Location" value={withinRadius === true ? "Inside" : withinRadius === false ? "Outside" : geoBadgeText(geo, coords)} />
              </div>
              <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-950 p-3 text-[10px] leading-relaxed text-slate-100">
                {JSON.stringify(calculation || {}, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      </div>

      {!telegramLinked || telegramCode ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs sm:p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="text-[12px] font-extrabold text-slate-900">Link Telegram to use the attendance bot.</div>
              {telegramCode ? (
                <div className="mt-1 text-[11px] font-semibold text-slate-500">
                  Send <span className="font-mono text-slate-800">/link {telegramCode.code}</span> to the company attendance bot.
                  <span className="ml-1">Expires at {new Date(telegramCode.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {telegramCode ? (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(telegramCode.code);
                    setTelegramCodeCopied(true);
                    window.setTimeout(() => setTelegramCodeCopied(false), 1800);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 hover:bg-slate-50"
                >
                  {telegramCodeCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {telegramCodeCopied ? "Copied" : "Copy code"}
                </button>
              ) : null}
              <button
                onClick={async () => {
                  const res = await generateTelegramCode.mutateAsync();
                  setTelegramCode(res.data.telegramLinkCode);
                  setTelegramCodeCopied(false);
                }}
                disabled={generateTelegramCode.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a56db] px-3 py-2 text-[11px] font-black text-white disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Link2 className="h-3.5 w-3.5" />
                {generateTelegramCode.isPending ? "Generating..." : "Link Telegram"}
              </button>
              {telegramLinked ? (
                <button
                  onClick={async () => {
                    await unlinkTelegram.mutateAsync();
                    setTelegramCode(null);
                  }}
                  disabled={unlinkTelegram.isPending}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-600 disabled:opacity-50"
                >
                  Unlink
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today</div>
            <div className="mt-0.5 text-[14px] font-extrabold text-slate-900">Attendance timeline</div>
          </div>
          <div className="flex items-center gap-2">
            {timeline.length > 0 ? (
              <button
                onClick={() => setConfirmRevertOpen(true)}
                disabled={revertEvent.isPending || createEvent.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Revert last
              </button>
            ) : null}
            <button
              onClick={() => today.refetch()}
              disabled={today.isFetching}
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 disabled:bg-slate-100"
            >
              {today.isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {today.isError ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <span>Failed to load attendance data.</span>
            <button onClick={() => today.refetch()} className="ml-2 font-bold underline">
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-3 divide-y divide-slate-100">
          {timeline.length === 0 ? (
            <div className="text-[12px] font-semibold text-slate-600">No attendance events recorded yet today.</div>
          ) : (
            timeline.map((e: any) => (
              <div key={e.id} className="grid grid-cols-[72px_1fr_auto_auto] items-center gap-3 py-2.5">
                <div className="font-mono text-[11px] font-black tabular-nums text-slate-700">
                  {formatTime(new Date(e.timestampUtc), tz)}
                </div>
                <div className="min-w-0 text-[12px] font-extrabold text-slate-900">{e.label}</div>
                <div className="text-right text-[11px] font-bold text-slate-500">
                  {e.withinAllowedRadius ? "Inside workplace" : `${Math.round(e.distanceMeters)} m away`}
                </div>
                {e.withinAllowedRadius ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {confirmRevertOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div>
              <h3 className="text-sm font-black text-slate-950">Revert last action?</h3>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                This removes your latest attendance event today. Use it only if you clicked accidentally.
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              Last action: {timeline[timeline.length - 1]?.label || "Attendance action"}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmRevertOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600">Cancel</button>
              <button
                onClick={handleRevertLast}
                disabled={revertEvent.isPending}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                {revertEvent.isPending ? "Reverting..." : "Revert"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return cleanPage;
}

// ---------------------------------------------------------------------------
// Pure helpers (no hooks)
// ---------------------------------------------------------------------------

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toActionLabel(type: AttendanceEventType): string {
  if (type === "CHECK_IN") return "Check In";
  if (type === "LUNCH_OUT") return "Check Out for Lunch";
  if (type === "LUNCH_IN") return "Return from Lunch";
  return "Check Out for the Day";
}

function actionBtnClass(type: AttendanceEventType): string {
  if (type === "CHECK_OUT") return "bg-slate-800 hover:bg-slate-700 text-white shadow-sm";
  if (type === "LUNCH_OUT") return "bg-amber-500 hover:bg-amber-600 text-white shadow-sm";
  if (type === "LUNCH_IN") return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm";
  return "bg-[#1a56db] hover:bg-[#124bbf] text-white shadow-sm hover:shadow-md";
}

function actionIcon(type: AttendanceEventType) {
  if (type === "CHECK_IN") return <LogIn className="w-4 h-4" />;
  if (type === "LUNCH_OUT") return <Coffee className="w-4 h-4" />;
  if (type === "LUNCH_IN") return <UtensilsCrossed className="w-4 h-4" />;
  return <LogOut className="w-4 h-4" />;
}

function timelineIconBg(type: string): string {
  if (type === "CHECK_IN") return "bg-blue-50 text-blue-600";
  if (type === "LUNCH_OUT") return "bg-amber-50 text-amber-600";
  if (type === "LUNCH_IN") return "bg-emerald-50 text-emerald-600";
  return "bg-slate-100 text-slate-600";
}

function timelineIconEl(type: string) {
  if (type === "CHECK_IN") return <LogIn className="w-4 h-4" />;
  if (type === "LUNCH_OUT") return <Coffee className="w-4 h-4" />;
  if (type === "LUNCH_IN") return <UtensilsCrossed className="w-4 h-4" />;
  return <LogOut className="w-4 h-4" />;
}

function humanStatus(
  status: string,
  disabledReason: string | null,
  office: any,
  geo: GeoState,
  coords: Coords,
  withinRadius: boolean | null
): string {
  if (disabledReason) return disabledReason;
  if (!office) return "Attendance location is not configured";
  if (geo.status === "denied") return "Location access denied";
  if (geo.status === "error") return (geo as any).message;
  if (!coords) return "Waiting for location…";
  if (withinRadius === false) return "Outside allowed location";
  if (status === "IN_PROGRESS") return "Working";
  if (status === "ON_BREAK") return "On lunch break";
  if (status === "COMPLETED") return "Checked out";
  if (status === "LATE") return "Working (late arrival)";
  if (status === "MISSED") return "Missed";
  return "Not checked in yet";
}

function geoBadgeText(geo: GeoState, coords: Coords): string {
  if (geo.status === "denied") return "Access denied";
  if (geo.status === "error") return "Location error";
  if (coords) return "Location ready";
  if (geo.status === "prompt") return "Permission required";
  return "Location pending";
}

function Badge({
  tone,
  icon,
  text,
}: {
  tone: "good" | "bad" | "neutral";
  icon: React.ReactNode;
  text: string;
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "bad"
        ? "bg-rose-50 text-rose-700 border-rose-100"
        : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl border ${cls} shrink-0`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div
        className={`text-[12px] font-extrabold mt-0.5 ${
          highlight ? "text-[#1a56db]" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

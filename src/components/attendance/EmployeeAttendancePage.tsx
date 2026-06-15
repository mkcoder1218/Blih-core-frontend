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
} from "lucide-react";
import { useMyAttendanceToday } from "../../hooks/useMyAttendanceToday";
import { useCreateMyAttendanceEvent } from "../../hooks/useCreateMyAttendanceEvent";
import { useRevertMyAttendanceEvent } from "../../hooks/useRevertMyAttendanceEvent";
import type { AttendanceEventType, BusinessAttendanceSettings } from "../../api/types";
import LateCheckInModal from "./LateCheckInModal";

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

export default function EmployeeAttendancePage() {
  const today = useMyAttendanceToday();
  const createEvent = useCreateMyAttendanceEvent();
  const revertEvent = useRevertMyAttendanceEvent();

  // ── Data from backend ──────────────────────────────────────────────────
  const data = today.data?.data as any;
  const settings = data?.settings as BusinessAttendanceSettings | null | undefined;
  const timeline: any[] = data?.timeline || [];
  const nextAllowed: AttendanceEventType[] = data?.nextAllowed || [];
  const disabledReason: string | null = data?.disabledReason || null;
  const calculation: any = data?.calculation;
  const lunch: any = data?.lunch;

  const tz = settings?.timezone || "UTC";
  const currentStatus: string = calculation?.currentStatus || "NOT_STARTED";
  const backendWorkedMins: number = calculation?.totalWorkedMinutes || 0;
  const backendBreakMins: number = calculation?.totalBreakMinutes || 0;
  const expectedMins: number = settings?.expectedDailyMinutes || 480;

  // Day is complete when nextAllowed is empty, there is no disabled reason,
  // and at least one event has been recorded today.
  const isDayComplete = nextAllowed.length === 0 && !disabledReason && timeline.length > 0;

  // ── Live clock (seconds) ───────────────────────────────────────────────
  const [nowTs, setNowTs] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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
      }).formatToParts(new Date(nowTs));
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
  }, [nowTs, tz, lunch]);

  // ── Base disabled reason (applies to all buttons unless overridden) ────
  const baseDisabledReason: string | null = (() => {
    if (today.isLoading) return "Loading…";
    if (disabledReason) return disabledReason;
    if (!settings?.attendanceEnabled) return "Attendance is disabled";
    if (!office) return "Attendance location is not configured";
    if (geo.status === "denied") return "Location access denied";
    if (geo.status === "error") return (geo as any).message;
    if (!coords) return "Location permission required";
    if (withinRadius === false) return "Outside allowed location";
    if (createEvent.isPending) return "Processing…";
    return null;
  })();

  // ── Late check-in modal ────────────────────────────────────────────────
  const [lateModalOpen, setLateModalOpen] = React.useState(false);
  const [lateByMinutes, setLateByMinutes] = React.useState(0);
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
      }).formatToParts(new Date());
      const get = (k: string) => Number(parts.find((p) => p.type === k)?.value ?? 0);
      const nowM = get("hour") * 60 + get("minute");
      return Math.max(0, nowM - expectedM);
    } catch {
      return 0;
    }
  }, [settings, tz]);

  const handleAction = async (type: AttendanceEventType) => {
    if (!coords) return;
    setSubmitError(null);
    if (type === "CHECK_IN") {
      const late = computeLateByMinutes();
      if (late > 0) {
        setLateByMinutes(late);
        setLateModalOpen(true);
        return;
      }
    }
    try {
      await createEvent.mutateAsync({
        type,
        latitude: coords.latitude,
        longitude: coords.longitude,
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
  }).format(new Date(nowTs));
  const dateDisplay = new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(nowTs));

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance</div>
            <div className="text-[16px] sm:text-[18px] font-black text-slate-900 tracking-tight mt-1">
              Self Check-In
            </div>
            <div className="text-[12px] text-slate-600 font-semibold mt-1 flex items-center gap-2 flex-wrap">
              <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{dateDisplay}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono tabular-nums">{nowDisplay}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-[11px]">{tz}</span>
            </div>
          </div>

          <button
            onClick={requestLocation}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl shrink-0"
          >
            Refresh location
          </button>
        </div>

        {/* ── Status + Action grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-5">

          {/* Status panel */}
          <div className="lg:col-span-7 bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current status
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-1">
                  {humanStatus(currentStatus, disabledReason, office, geo, coords, withinRadius)}
                </div>
                <div className="text-[11px] text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {office ? settings?.locationName || "Primary workplace" : "Workplace location not configured"}
                  </span>
                  {office ? (
                    <span className="text-slate-300 shrink-0">• {office.radius} m radius</span>
                  ) : null}
                </div>
              </div>

              {withinRadius === true ? (
                <Badge tone="good" icon={<CheckCircle2 className="w-4 h-4" />} text="Inside location" />
              ) : withinRadius === false ? (
                <Badge tone="bad" icon={<XCircle className="w-4 h-4" />} text="Outside location" />
              ) : (
                <Badge tone="neutral" icon={<ShieldAlert className="w-4 h-4" />} text={geoBadgeText(geo, coords)} />
              )}
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <MiniStat
                label="Worked"
                value={fmtMins(localWorkedMins)}
                highlight={currentStatus === "IN_PROGRESS"}
              />
              <MiniStat label="Break" value={fmtMins(backendBreakMins)} />
              <MiniStat
                label="Remaining"
                value={remainingMins > 0 ? fmtMins(remainingMins) : "—"}
              />
              <MiniStat
                label="Your distance"
                value={distanceMeters !== null ? `${Math.round(distanceMeters)} m` : "—"}
              />
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>Daily progress</span>
                <span>
                  {progressPct}% of {fmtMins(expectedMins)}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPct >= 100 ? "bg-emerald-500" : "bg-[#1a56db]"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Fixed lunch window indicator */}
            {lunch?.lunchBreakEnabled &&
             lunch?.lunchMode === "FIXED" &&
             lunch?.fixedLunchStartTime &&
             lunch?.fixedLunchEndTime ? (
              <div
                className={`mt-3 text-[11px] font-semibold flex items-center gap-1.5 ${
                  isLunchWindowActive ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                <Coffee className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Fixed lunch: {lunch.fixedLunchStartTime} – {lunch.fixedLunchEndTime}
                </span>
                {isLunchWindowActive === true ? (
                  <span className="ml-1 text-emerald-600 font-bold">• Open</span>
                ) : (
                  <span className="ml-1 text-slate-400">• Not yet open</span>
                )}
              </div>
            ) : null}
          </div>

          {/* Action panel */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Actions
            </div>

            {/* ── Completed-day banner (no action buttons) ── */}
            {isDayComplete ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-slate-900">Day complete</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">
                    You've checked out for the day.
                  </div>
                </div>
              </div>

            ) : disabledReason ? (
              /* ── Attendance unavailable banner ── */
              <div className="flex-1 flex flex-col items-center justify-center py-6 gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <div className="text-center">
                  <div className="text-sm font-extrabold text-slate-900">Unavailable</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">{disabledReason}</div>
                </div>
              </div>

            ) : (
              /* ── Context-aware action buttons (one per nextAllowed entry) ── */
              <div className="flex-1 flex flex-col gap-2">
                {nextAllowed.length === 0 ? (
                  <div className="text-[12px] text-slate-500 font-semibold mt-2">
                    No attendance action available right now.
                  </div>
                ) : null}

                {/* Late check-in notice */}
                {nextAllowed.includes("CHECK_IN") && computeLateByMinutes() > 0 ? (
                  <div className="flex items-start gap-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      You are <span className="font-black">{computeLateByMinutes()} min late</span> — you'll be asked to provide a reason before checking in.
                    </span>
                  </div>
                ) : null}

                {nextAllowed.map((type) => {
                  // Per-button disabled logic
                  const isLunchOutFixed =
                    type === "LUNCH_OUT" && lunch?.lunchMode === "FIXED";
                  const lunchWindowClosed = isLunchOutFixed && isLunchWindowActive === false;
                  const btnDisabled = Boolean(baseDisabledReason) || lunchWindowClosed;

                  const disabledTitle = lunchWindowClosed
                    ? `Lunch window: ${lunch?.fixedLunchStartTime} – ${lunch?.fixedLunchEndTime}`
                    : baseDisabledReason ?? undefined;

                  return (
                    <button
                      key={type}
                      disabled={btnDisabled}
                      onClick={() => handleAction(type)}
                      title={btnDisabled && disabledTitle ? disabledTitle : undefined}
                      className={[
                        "w-full rounded-2xl py-3 px-4 text-xs font-extrabold tracking-wide transition-all",
                        "flex items-center justify-center gap-2",
                        btnDisabled
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : actionBtnClass(type),
                      ].join(" ")}
                    >
                      {createEvent.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        actionIcon(type)
                      )}
                      {createEvent.isPending ? "Processing…" : toActionLabel(type)}
                    </button>
                  );
                })}

                {/* Prompt location access if needed */}
                {geo.status === "prompt" && !coords ? (
                  <button
                    onClick={requestLocation}
                    className="w-full mt-1 rounded-2xl py-2.5 px-4 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Allow location access
                  </button>
                ) : null}
              </div>
            )}

            {/* Inline submit error */}
            {submitError ? (
              <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {submitError}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Late check-in modal ── */}
      <LateCheckInModal
        open={lateModalOpen}
        lateByMinutes={lateByMinutes}
        onCancel={() => setLateModalOpen(false)}
        onSubmit={async ({ lateReasonId, customReason }) => {
          if (!coords) return;
          try {
            await createEvent.mutateAsync({
              type: "CHECK_IN",
              latitude: coords.latitude,
              longitude: coords.longitude,
              lateReasonId,
              customReason,
            } as any);
            setLateModalOpen(false);
          } catch (e: any) {
            setSubmitError(
              e?.response?.data?.message || e?.message || "Failed to check in"
            );
            setLateModalOpen(false);
          }
        }}
      />

      {/* ── Timeline card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today</div>
            <div className="text-[14px] font-extrabold text-slate-900 mt-1">Attendance timeline</div>
          </div>
          <div className="flex items-center gap-2">
            {timeline.length > 0 ? (
              <button
                onClick={() => setConfirmRevertOpen(true)}
                disabled={revertEvent.isPending || createEvent.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Revert last
              </button>
            ) : null}
            <button
              onClick={() => today.refetch()}
              disabled={today.isFetching}
              className="text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl"
            >
              {today.isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {today.isError ? (
          <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
            <span>Failed to load attendance data.</span>
            <button
              onClick={() => today.refetch()}
              className="underline font-bold ml-2"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {timeline.length === 0 ? (
            <div className="text-[12px] text-slate-600 font-semibold">
              No attendance events recorded yet today.
            </div>
          ) : (
            timeline.map((e: any) => (
              <div
                key={e.id}
                className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${timelineIconBg(e.type)}`}
                >
                  {timelineIconEl(e.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-extrabold text-slate-900">{e.label}</div>
                  <div className="text-[11px] text-slate-500 font-semibold">
                    {formatTime(new Date(e.timestampUtc), tz)}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-400">
                  {Math.round(e.distanceMeters)} m
                </div>
                {e.withinAllowedRadius ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {confirmRevertOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-950">Revert last action?</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                This removes your latest attendance event today. Use it only if you clicked accidentally.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
              Last action: {timeline[timeline.length - 1]?.label || "Attendance action"}
            </div>
            <div className="flex justify-end gap-2">
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

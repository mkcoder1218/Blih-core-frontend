import React from "react";
import { MapPin, ShieldAlert, Loader2, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { useMyAttendanceToday } from "../../hooks/useMyAttendanceToday";
import { useCreateMyAttendanceEvent } from "../../hooks/useCreateMyAttendanceEvent";
import type { AttendanceEventType, BusinessAttendanceSettings } from "../../api/types";
import LateCheckInModal from "./LateCheckInModal";

type GeoState =
  | { status: "idle" }
  | { status: "prompt" }
  | { status: "granted" }
  | { status: "denied" }
  | { status: "error"; message: string };

type Coords = { latitude: number; longitude: number } | null;

export default function EmployeeAttendancePage() {
  const today = useMyAttendanceToday();
  const createEvent = useCreateMyAttendanceEvent();

  const settings = today.data?.data?.settings as BusinessAttendanceSettings | null | undefined;
  const timeline = today.data?.data?.timeline || [];
  const nextAllowed = today.data?.data?.nextAllowed || ["CHECK_IN"];
  const disabledReason = today.data?.data?.disabledReason || null;

  const [geo, setGeo] = React.useState<GeoState>({ status: "idle" });
  const [coords, setCoords] = React.useState<Coords>(null);

  const tz = settings?.timezone || "UTC";
  const [lateModalOpen, setLateModalOpen] = React.useState(false);
  const [lateByMinutes, setLateByMinutes] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!navigator?.geolocation) {
        if (!cancelled) setGeo({ status: "error", message: "Geolocation is not supported in this browser." });
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
        if (res.state === "granted") setGeo({ status: "granted" });
        else if (res.state === "denied") setGeo({ status: "denied" });
        else setGeo({ status: "prompt" });
        res.onchange = () => {
          if (res.state === "granted") setGeo({ status: "granted" });
          else if (res.state === "denied") setGeo({ status: "denied" });
          else setGeo({ status: "prompt" });
        };
      } catch {
        if (!cancelled) setGeo({ status: "prompt" });
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestLocation = React.useCallback(() => {
    if (!navigator?.geolocation) {
      setGeo({ status: "error", message: "Geolocation is not supported in this browser." });
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

  const office = settings && settings.latitude !== null && settings.longitude !== null
    ? { latitude: Number(settings.latitude), longitude: Number(settings.longitude), radius: Number(settings.allowedRadiusMeters) }
    : null;

  const distanceMeters = office && coords ? haversineDistanceMeters(coords.latitude, coords.longitude, office.latitude, office.longitude) : null;
  const withinRadius = office && distanceMeters !== null ? distanceMeters <= office.radius : null;

  const currentAction: AttendanceEventType | null = nextAllowed.length ? nextAllowed[0] : null;
  const actionLabel = currentAction ? toActionLabel(currentAction) : "No action";

  const actionDisabledReason = (() => {
    if (today.isLoading) return "Loading…";
    if (disabledReason) return disabledReason;
    if (!settings) return "Attendance is disabled";
    if (!settings.attendanceEnabled) return "Attendance is disabled";
    if (!office) return "Attendance location is not configured";
    if (geo.status === "denied") return "Location access denied";
    if (geo.status === "error") return geo.message;
    if (!coords) return "Location permission required";
    if (withinRadius === false) return "Outside allowed location";
    if (!currentAction) return "No further action allowed today";
    if (createEvent.isPending) return "Processing…";
    return null;
  })();

  const nowLabel = formatNow(tz);
  const dateLabel = formatDate(tz);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance</div>
            <div className="text-[16px] sm:text-[18px] font-black text-slate-900 tracking-tight mt-1">Self check-in</div>
            <div className="text-[12px] text-slate-600 font-semibold mt-1 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-400" />
              <span>{dateLabel}</span>
              <span className="text-slate-300">•</span>
              <span>{nowLabel}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{tz}</span>
            </div>
          </div>

          <button
            onClick={requestLocation}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl"
          >
            Refresh location
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-5">
          <div className="lg:col-span-7 bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current status</div>
                <div className="text-sm font-extrabold text-slate-900 mt-1">{statusText(disabledReason, office, geo, coords, withinRadius)}</div>
                <div className="text-[11px] text-slate-600 font-semibold mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">
                    {office ? (settings?.locationName || "Primary workplace") : "Workplace location not configured"}
                  </span>
                </div>
              </div>

              {withinRadius === true ? (
                <Badge tone="good" icon={<CheckCircle2 className="w-4 h-4" />} text="Inside allowed location" />
              ) : withinRadius === false ? (
                <Badge tone="bad" icon={<XCircle className="w-4 h-4" />} text="Outside allowed location" />
              ) : (
                <Badge tone="neutral" icon={<ShieldAlert className="w-4 h-4" />} text={geoBadgeText(geo, coords)} />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <MiniStat label="Allowed radius" value={office ? `${office.radius} m` : "—"} />
              <MiniStat label="Your distance" value={distanceMeters !== null ? `${Math.round(distanceMeters)} m` : "—"} />
              <MiniStat label="Next action" value={currentAction ? actionLabel : "—"} />
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Main action</div>
            <div className="text-sm font-extrabold text-slate-900 mt-1">{currentAction ? actionLabel : "No further action"}</div>
            <div className="text-[11px] text-slate-600 font-semibold mt-1">
              {actionDisabledReason ? actionDisabledReason : "Ready"}
            </div>

            <button
              disabled={Boolean(actionDisabledReason)}
              onClick={async () => {
                if (!currentAction || !coords) return;
                if (currentAction === "CHECK_IN") {
                  const calc = (today.data as any)?.data?.calculation;
                  const late = Number(calc?.lateByMinutes || 0);
                  if (late > 0) {
                    setLateByMinutes(late);
                    setLateModalOpen(true);
                    return;
                  }
                }
                await createEvent.mutateAsync({ type: currentAction, latitude: coords.latitude, longitude: coords.longitude });
              }}
              className={[
                "w-full mt-4 rounded-2xl py-3.5 px-4 text-xs font-extrabold tracking-wide transition-all",
                actionDisabledReason
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-[#1a56db] hover:bg-[#124bbf] text-white shadow-sm hover:shadow-md",
              ].join(" ")}
            >
              {createEvent.isPending ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </span>
              ) : (
                actionLabel
              )}
            </button>

            {geo.status === "prompt" && !coords ? (
              <button
                onClick={requestLocation}
                className="w-full mt-2 rounded-2xl py-2.5 px-4 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white"
              >
                Allow location access
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <LateCheckInModal
        open={lateModalOpen}
        lateByMinutes={lateByMinutes}
        onCancel={() => setLateModalOpen(false)}
        onSubmit={async ({ lateReasonId, customReason }) => {
          if (!coords) return;
          await createEvent.mutateAsync({ type: "CHECK_IN", latitude: coords.latitude, longitude: coords.longitude, lateReasonId, customReason } as any);
          setLateModalOpen(false);
        }}
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today</div>
            <div className="text-[14px] font-extrabold text-slate-900 mt-1">Attendance timeline</div>
          </div>
          <button
            onClick={() => today.refetch()}
            disabled={today.isFetching}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl"
          >
            {today.isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {today.isError ? (
          <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            Failed to load attendance summary.
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {timeline.length === 0 ? (
            <div className="text-[12px] text-slate-600 font-semibold">No attendance events recorded yet today.</div>
          ) : (
            timeline.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[12px] font-extrabold text-slate-900">{formatTime(new Date(e.timestampUtc), tz)}</div>
                  <div className="text-[11px] text-slate-600 font-semibold">{e.label}</div>
                </div>
                <div className="text-[11px] font-bold text-slate-500">{Math.round(e.distanceMeters)} m</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ tone, icon, text }: { tone: "good" | "bad" | "neutral"; icon: React.ReactNode; text: string }) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "bad"
        ? "bg-rose-50 text-rose-700 border-rose-100"
        : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <div className={`inline-flex items-center gap-2 text-[11px] font-extrabold px-3 py-1.5 rounded-xl border ${cls}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-[12px] font-extrabold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function toActionLabel(t: AttendanceEventType) {
  if (t === "CHECK_IN") return "Check In";
  if (t === "LUNCH_OUT") return "Check Out for Lunch";
  if (t === "LUNCH_IN") return "Return from Lunch";
  return "Check Out for the Day";
}

function statusText(disabledReason: string | null, office: any, geo: GeoState, coords: Coords, withinRadius: boolean | null) {
  if (disabledReason) return disabledReason;
  if (!office) return "Attendance location is not configured";
  if (geo.status === "denied") return "Location access denied";
  if (geo.status === "error") return geo.message;
  if (!coords) return "Location permission required";
  if (withinRadius === false) return "Outside allowed location";
  if (withinRadius === true) return "Inside allowed location";
  return "Checking location…";
}

function geoBadgeText(geo: GeoState, coords: Coords) {
  if (geo.status === "denied") return "Access denied";
  if (geo.status === "error") return "Location error";
  if (coords) return "Location ready";
  if (geo.status === "prompt") return "Permission required";
  return "Location pending";
}

function formatNow(timeZone: string) {
  return new Intl.DateTimeFormat(undefined, { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date());
}
function formatDate(timeZone: string) {
  return new Intl.DateTimeFormat(undefined, { timeZone, weekday: "long", year: "numeric", month: "short", day: "2-digit" }).format(new Date());
}
function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, { timeZone, hour: "2-digit", minute: "2-digit" }).format(date);
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

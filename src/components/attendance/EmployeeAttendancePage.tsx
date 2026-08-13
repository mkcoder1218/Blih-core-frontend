import React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  Copy,
  Link2,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  Undo2,
  UtensilsCrossed,
  X,
  XCircle,
} from "lucide-react";
import { useMyAttendanceToday } from "../../hooks/useMyAttendanceToday";
import { useCreateMyAttendanceEvent } from "../../hooks/useCreateMyAttendanceEvent";
import { useRevertMyAttendanceEvent } from "../../hooks/useRevertMyAttendanceEvent";
import type { AttendanceEventType, BusinessAttendanceSettings } from "../../api/types";
import { useGenerateTelegramLinkCode, useUnlinkMyTelegram } from "../../hooks/useTelegramLinkCode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GeoState =
  | { status: "idle" }
  | { status: "prompt" }
  | { status: "granted" }
  | { status: "denied" }
  | { status: "error"; message: string };

type Coords = { latitude: number; longitude: number } | null;

export default function EmployeeAttendancePage({ onSpecialRequest }: { onSpecialRequest?: () => void }) {
  const today = useMyAttendanceToday();
  const createEvent = useCreateMyAttendanceEvent();
  const revertEvent = useRevertMyAttendanceEvent();
  const generateTelegramCode = useGenerateTelegramLinkCode();
  const unlinkTelegram = useUnlinkMyTelegram();

  const [telegramCode, setTelegramCode] = React.useState<{ code: string; expiresAt: string } | null>(null);
  const [telegramCodeCopied, setTelegramCodeCopied] = React.useState(false);
  const [telegramBannerDismissed, setTelegramBannerDismissed] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [confirmRevertOpen, setConfirmRevertOpen] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

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

  const isDayComplete = nextAllowed.length === 0 && !disabledReason && !cooldown?.active && timeline.length > 0;

  const [nowTs, setNowTs] = React.useState(Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
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
    [serverNowDate, tz],
  );

  const lastFetchedAt = React.useRef<number>(Date.now());
  const [localWorkedMins, setLocalWorkedMins] = React.useState(backendWorkedMins);

  React.useEffect(() => {
    setLocalWorkedMins(backendWorkedMins);
    lastFetchedAt.current = Date.now();
  }, [backendWorkedMins]);

  React.useEffect(() => {
    if (currentStatus !== "IN_PROGRESS") return;
    const id = window.setInterval(() => {
      setLocalWorkedMins(backendWorkedMins + Math.floor((Date.now() - lastFetchedAt.current) / 60_000));
    }, 30_000);
    return () => window.clearInterval(id);
  }, [currentStatus, backendWorkedMins]);

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
        const permissionApi: any = (navigator as any).permissions;
        if (!permissionApi?.query) {
          if (!cancelled) setGeo({ status: "prompt" });
          return;
        }

        const result = await permissionApi.query({ name: "geolocation" });
        if (cancelled) return;

        const applyState = (state: string) => {
          if (state === "granted") setGeo({ status: "granted" });
          else if (state === "denied") setGeo({ status: "denied" });
          else setGeo({ status: "prompt" });
        };

        applyState(result.state);
        result.onchange = () => applyState(result.state);
      } catch {
        if (!cancelled) setGeo({ status: "prompt" });
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestLocation = React.useCallback(() => {
    if (!navigator?.geolocation) {
      setGeo({ status: "error", message: "Geolocation not supported in this browser." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setGeo({ status: "granted" });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setGeo({ status: "denied" });
        else setGeo({ status: "error", message: "Unable to retrieve current location." });
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 10_000 },
    );
  }, []);

  React.useEffect(() => {
    if (geo.status !== "granted") return;
    requestLocation();
    const id = window.setInterval(requestLocation, 60_000);
    return () => window.clearInterval(id);
  }, [geo.status, requestLocation]);

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

  const withinRadius = office && distanceMeters !== null ? distanceMeters <= office.radius : null;

  const isLunchWindowActive: boolean | null = React.useMemo(() => {
    if (lunch?.lunchMode !== "FIXED" || !lunch?.fixedLunchStartTime || !lunch?.fixedLunchEndTime) return null;

    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(serverNowDate);
      const get = (key: string) => Number(parts.find((part) => part.type === key)?.value ?? 0);
      const nowMins = get("hour") * 60 + get("minute");
      const toMins = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
      return nowMins >= toMins(lunch.fixedLunchStartTime) && nowMins <= toMins(lunch.fixedLunchEndTime);
    } catch {
      return null;
    }
  }, [serverNowDate, tz, lunch]);

  const baseDisabledReason: string | null = (() => {
    if (today.isLoading) return "Loading…";
    if (disabledReason) return disabledReason;
    if (!settings?.attendanceEnabled) return "Attendance is disabled";
    if (isSaturdayTrackingOnly) return createEvent.isPending ? "Processing..." : null;
    if (!office) return "Attendance location is not configured";
    if (geo.status === "denied") return "Location access denied";
    if (geo.status === "error") return geo.message;
    if (!coords) return "Location permission required";
    if (withinRadius === false) return "Outside allowed location";
    if (createEvent.isPending) return "Processing…";
    return null;
  })();

  const computeLateByMinutes = React.useCallback((): number => {
    if (!settings?.defaultStartTime) return 0;
    const grace = Number(settings.lateGracePeriodMinutes ?? 0);
    const toMins = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
    const expectedMinsWithGrace = toMins(settings.defaultStartTime) + grace;

    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(serverNowDate);
      const get = (key: string) => Number(parts.find((part) => part.type === key)?.value ?? 0);
      const nowMins = get("hour") * 60 + get("minute");
      return Math.max(0, nowMins - expectedMinsWithGrace);
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
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || error?.message || "Failed to record event");
    }
  };

  const handleRevertLast = async () => {
    setSubmitError(null);
    try {
      await revertEvent.mutateAsync();
      setConfirmRevertOpen(false);
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || error?.message || "Failed to revert last action");
      setConfirmRevertOpen(false);
    }
  };

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
  const cooldownActionLabel = cooldown?.action === "LUNCH_IN" ? "Return from lunch" : "Check in";
  const cooldownRequiredMinutes = Number(cooldown?.requiredMinutes || 60);
  const cooldownTitle =
    cooldown?.action === "LUNCH_IN" ? `${cooldownRequiredMinutes} minute break required` : "1 hour break required";

  const checkedInTime = day?.checkInAtUtc ? formatTime(new Date(day.checkInAtUtc), tz) : null;
  const checkedOutTime = day?.checkOutAtUtc ? formatTime(new Date(day.checkOutAtUtc), tz) : null;
  const telegramLinked = Boolean(
    data?.telegramLinked ||
      data?.telegramAccountLinked ||
      data?.telegram?.linked ||
      data?.telegramAccount?.isActive,
  );

  const hasCheckedIn = Boolean(day?.checkInAtUtc || timeline.some((event: any) => event.type === "CHECK_IN"));
  const hasLunchOut = Boolean(day?.lunchOutAtUtc || timeline.some((event: any) => event.type === "LUNCH_OUT"));
  const hasLunchIn = Boolean(day?.lunchInAtUtc || timeline.some((event: any) => event.type === "LUNCH_IN"));
  const hasCheckedOut = Boolean(day?.checkOutAtUtc || timeline.some((event: any) => event.type === "CHECK_OUT"));
  const missingLunchCheckout = Boolean(lunch?.lunchBreakEnabled && hasCheckedIn && !hasLunchOut && !hasCheckedOut);
  const missingLunchReturn = Boolean(hasLunchOut && !hasLunchIn && !hasCheckedOut);
  const lunchCheckoutNeedsAttention = Boolean(missingLunchCheckout && isLunchWindowActive === true);

  const showAttendanceWarning = Boolean(
    lunchCheckoutNeedsAttention ||
      missingLunchReturn ||
      penaltyMins > 0 ||
      penaltyReason ||
      withinRadius === false ||
      currentStatus === "MISSED",
  );

  const showLunchApprovalAction = Boolean(
    onSpecialRequest &&
      (lunchCheckoutNeedsAttention || missingLunchReturn || penaltyMins > 0 || penaltyReason || withinRadius === false),
  );

  const locationStatusText =
    withinRadius === true
      ? "Inside workplace"
      : withinRadius === false
        ? "Outside workplace"
        : geoBadgeText(geo, coords);
  const overtimeMins = Math.max(0, localWorkedMins - expectedMins);
  const attendanceExemption = data?.attendanceExemption;

  const primaryStatusTitle = (() => {
    if (isSaturdayTrackingOnly) return "Saturday tracking only";
    if (isDayComplete || hasCheckedOut) return checkedOutTime ? `Checked out at ${checkedOutTime}` : "Day complete";
    if (currentStatus === "ON_BREAK" || (hasLunchOut && !hasLunchIn)) return "On lunch break";
    if (hasCheckedIn) return checkedInTime ? `Checked in at ${checkedInTime}` : "Checked in";
    if (disabledReason) return disabledReason;
    return "Ready to check in";
  })();

  if (attendanceExemption) {
    return (
      <div className="mx-auto flex min-h-[340px] w-full max-w-4xl items-center justify-center px-4">
        <Card className="w-full rounded-md py-0 shadow-none">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">Attendance check-in is not required</h3>
            <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
              You are exempt from check-in and check-out, so attendance penalties will not be applied to your account.
            </p>
            {attendanceExemption.reason ? (
              <div className="mx-auto mt-4 max-w-xl rounded-md bg-muted/50 px-3 py-2 text-left text-sm text-foreground">
                <span className="text-muted-foreground">Approved reason:</span> {attendanceExemption.reason}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3">
      <Card className="rounded-md py-0 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">Self Check-In</h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                <span>{dateDisplay}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-foreground">{nowDisplay}</span>
                <span aria-hidden="true">·</span>
                <span>{tz}</span>
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">{primaryStatusTitle}</h2>
                  <LocationBadge withinRadius={withinRadius} geo={geo} coords={coords} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{office ? settings?.locationName || "Primary workplace" : "Workplace location not configured"}</span>
                  {office ? <span>· {office.radius} m radius</span> : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={requestLocation}
                    title="Refresh location"
                    aria-label="Refresh location"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 border-y border-border py-3 text-sm">
              <Metric label="Worked" value={fmtMins(localWorkedMins)} emphasis={currentStatus === "IN_PROGRESS"} />
              <Metric label="Remaining" value={remainingMins > 0 ? fmtMins(remainingMins) : "Done"} />
              <Metric label="Break" value={fmtMins(backendBreakMins)} />
              {checkedInTime ? <Metric label="Started" value={checkedInTime} /> : null}
            </div>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Daily progress</span>
                <span className="font-medium text-foreground">{progressPct}% of {fmtMins(expectedMins)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {lunch?.lunchBreakEnabled && lunch?.lunchMode === "FIXED" && lunch?.fixedLunchStartTime && lunch?.fixedLunchEndTime ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Coffee className="size-4" />
                <span>Lunch {lunch.fixedLunchStartTime}–{lunch.fixedLunchEndTime}</span>
                <Badge variant={isLunchWindowActive ? "secondary" : "outline"}>
                  {isLunchWindowActive === true ? "Available now" : "Not open yet"}
                </Badge>
              </div>
            ) : null}

            {showAttendanceWarning ? (
              <div className="mt-3 flex items-start gap-2 border-l-2 border-amber-400 bg-amber-50/70 px-3 py-2 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div className="leading-5">
                  {missingLunchReturn ? "Return from lunch when you are back at work." : null}
                  {lunchCheckoutNeedsAttention ? "Your lunch window is open. Check out before starting lunch." : null}
                  {withinRadius === false ? " You are currently outside the workplace radius." : null}
                  {penaltyReason ? ` ${penaltyReason}` : null}
                  {!missingLunchReturn && !lunchCheckoutNeedsAttention && withinRadius !== false && !penaltyReason && currentStatus === "MISSED"
                    ? "Your attendance record needs attention."
                    : null}
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              {isDayComplete ? (
                <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="size-4" />
                  Your attendance day is complete.
                </div>
              ) : disabledReason ? (
                <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{disabledReason}</div>
              ) : cooldown?.active ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div>
                      <div className="font-medium text-foreground">{cooldownTitle}</div>
                      <div className="mt-0.5 text-sm">
                        {cooldownActionLabel} will be available
                        {cooldownAvailableAt ? ` at ${cooldownAvailableAt}` : " after the break"}
                        {cooldown?.remainingMinutes ? ` (${cooldown.remainingMinutes} min remaining).` : "."}
                      </div>
                    </div>
                  </div>
                  <Button disabled className="w-full sm:w-auto">
                    <Clock3 className="size-4" />
                    {cooldownActionLabel}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {nextAllowed.includes("CHECK_IN") && computeLateByMinutes() > 0 ? (
                    <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      <span>
                        You are <span className="font-medium">{computeLateByMinutes()} min late</span>. Submit your reason in My Lateness Reason.
                      </span>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {nextAllowed.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No attendance action is available right now.</span>
                    ) : null}

                    {nextAllowed.map((type, index) => {
                      const isLunchOutFixed = type === "LUNCH_OUT" && lunch?.lunchMode === "FIXED";
                      const lunchWindowClosed = isLunchOutFixed && isLunchWindowActive === false;
                      const buttonDisabled = Boolean(baseDisabledReason) || lunchWindowClosed;
                      const disabledTitle = lunchWindowClosed
                        ? `Lunch window: ${lunch?.fixedLunchStartTime} - ${lunch?.fixedLunchEndTime}`
                        : baseDisabledReason ?? undefined;

                      return (
                        <span key={type} className={index === 0 ? "flex-1" : "sm:w-auto"} title={buttonDisabled ? disabledTitle : undefined}>
                          <Button
                            type="button"
                            variant={index === 0 ? "default" : "outline"}
                            disabled={buttonDisabled}
                            onClick={() => void handleAction(type)}
                            className="w-full"
                          >
                            {createEvent.isPending ? <Loader2 className="size-4 animate-spin" /> : actionIcon(type)}
                            {createEvent.isPending ? "Processing..." : toActionLabel(type)}
                          </Button>
                        </span>
                      );
                    })}

                    {showLunchApprovalAction ? (
                      <Button type="button" variant="outline" onClick={onSpecialRequest}>
                        <ShieldCheck className="size-4" />
                        Request lunch-time approval
                      </Button>
                    ) : null}
                  </div>

                  {baseDisabledReason && nextAllowed.length > 0 ? (
                    <p className="text-xs text-muted-foreground">{baseDisabledReason}</p>
                  ) : null}

                  {geo.status === "prompt" && !coords && !isSaturdayTrackingOnly ? (
                    <Button type="button" variant="secondary" onClick={requestLocation}>
                      <MapPin className="size-4" />
                      Allow location access
                    </Button>
                  ) : null}
                </div>
              )}
            </div>

            {submitError ? (
              <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{submitError}</div>
            ) : null}

            <Button type="button" variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setDetailsOpen((open) => !open)}>
              {detailsOpen ? "Hide details" : "View details"}
            </Button>

            {detailsOpen ? (
              <div className="mt-2 grid gap-x-6 gap-y-2 border-t border-border pt-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <Detail label="Credited time" value={fmtMins(localWorkedMins)} />
                <Detail label="Full worked" value={fmtMins(backendRawWorkedMins)} />
                <Detail label="Break time" value={fmtMins(backendBreakMins)} />
                <Detail label="Penalty time" value={fmtMins(penaltyMins)} />
                <Detail label="Expected" value={fmtMins(expectedMins)} />
                <Detail label="Remaining" value={remainingMins > 0 ? fmtMins(remainingMins) : "0m"} />
                <Detail label="Overtime" value={fmtMins(overtimeMins)} />
                <Detail label="Location" value={locationStatusText} />
                <Detail label="Distance" value={distanceMeters !== null ? `${Math.round(distanceMeters)} m` : "—"} />
                <Detail label="Workplace radius" value={office ? `${office.radius} m` : "—"} />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {telegramCode || (!telegramLinked && !telegramBannerDismissed) ? (
        <Card className="rounded-md py-0 shadow-none">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">Use attendance from Telegram</div>
              {telegramCode ? (
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Send <span className="font-mono text-foreground">/link {telegramCode.code}</span> to the attendance bot. Expires at {new Date(telegramCode.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
                </div>
              ) : (
                <div className="mt-0.5 text-sm text-muted-foreground">Link your account if you want to use the attendance bot.</div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {telegramCode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(telegramCode.code);
                    setTelegramCodeCopied(true);
                    window.setTimeout(() => setTelegramCodeCopied(false), 1800);
                  }}
                >
                  {telegramCodeCopied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {telegramCodeCopied ? "Copied" : "Copy code"}
                </Button>
              ) : null}

              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const response = await generateTelegramCode.mutateAsync();
                  setTelegramCode(response.data.telegramLinkCode);
                  setTelegramCodeCopied(false);
                }}
                disabled={generateTelegramCode.isPending}
              >
                <Link2 className="size-3.5" />
                {generateTelegramCode.isPending ? "Generating..." : "Link Telegram"}
              </Button>

              {!telegramCode ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setTelegramBannerDismissed(true)}
                  aria-label="Dismiss Telegram banner"
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}

              {telegramLinked ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await unlinkTelegram.mutateAsync();
                    setTelegramCode(null);
                  }}
                  disabled={unlinkTelegram.isPending}
                >
                  Unlink
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-md py-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Attendance timeline</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Today&apos;s recorded attendance events.</p>
            </div>

            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => void today.refetch()} disabled={today.isFetching}>
                <RefreshCw className={`size-3.5 ${today.isFetching ? "animate-spin" : ""}`} />
                {today.isFetching ? "Refreshing" : "Refresh"}
              </Button>

              {timeline.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Attendance actions" />}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={revertEvent.isPending || createEvent.isPending}
                      onClick={() => setConfirmRevertOpen(true)}
                    >
                      <Undo2 className="size-4" />
                      Revert last action
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>

          {today.isError ? (
            <div className="mt-3 flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>Failed to load attendance data.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => void today.refetch()}>Retry</Button>
            </div>
          ) : null}

          <div className="mt-3 divide-y divide-border">
            {timeline.length === 0 ? (
              <div className="py-2 text-sm text-muted-foreground">No attendance events recorded yet today.</div>
            ) : (
              timeline.map((event: any) => (
                <div key={event.id} className="grid grid-cols-[82px_1fr_auto] items-center gap-3 py-2.5 text-sm">
                  <div className="font-mono tabular-nums text-foreground">{formatTime(new Date(event.timestampUtc), tz)}</div>
                  <div className="min-w-0 font-medium text-foreground">{event.label}</div>
                  <div className="flex items-center gap-1.5 text-right text-muted-foreground">
                    <span>{event.withinAllowedRadius ? "Inside workplace" : `${Math.round(event.distanceMeters)} m away`}</span>
                    {event.withinAllowedRadius ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-rose-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmRevertOpen} onOpenChange={setConfirmRevertOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revert last action?</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            This removes your latest attendance event today. Use it only if you recorded the action accidentally.
          </p>
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">
            Last action: {timeline[timeline.length - 1]?.label || "Attendance action"}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmRevertOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void handleRevertLast()} disabled={revertEvent.isPending}>
              {revertEvent.isPending ? "Reverting..." : "Revert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${emphasis ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1 sm:block sm:border-b-0 sm:py-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground">{value}</div>
    </div>
  );
}

function LocationBadge({ withinRadius, geo, coords }: { withinRadius: boolean | null; geo: GeoState; coords: Coords }) {
  if (withinRadius === true) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="size-3" />
        Inside workplace
      </Badge>
    );
  }

  if (withinRadius === false) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" />
        Outside workplace
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <MapPin className="size-3" />
      {geoBadgeText(geo, coords)}
    </Badge>
  );
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadius = 6_371_000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function fmtMins(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
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

function actionIcon(type: AttendanceEventType) {
  if (type === "CHECK_IN") return <LogIn className="size-4" />;
  if (type === "LUNCH_OUT") return <Coffee className="size-4" />;
  if (type === "LUNCH_IN") return <UtensilsCrossed className="size-4" />;
  return <LogOut className="size-4" />;
}

function geoBadgeText(geo: GeoState, coords: Coords): string {
  if (geo.status === "denied") return "Location access denied";
  if (geo.status === "error") return "Location unavailable";
  if (coords) return "Location ready";
  if (geo.status === "prompt") return "Location permission required";
  return "Locating…";
}

import React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  Copy,
  ExternalLink,
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
import type { TelegramLinkCode } from "../../api/attendanceTelegram";
import { useGenerateTelegramLinkCode, useMyTelegramStatus, useUnlinkMyTelegram } from "../../hooks/useTelegramLinkCode";
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

  const [telegramCode, setTelegramCode] = React.useState<TelegramLinkCode | null>(null);
  const telegramStatus = useMyTelegramStatus(Boolean(telegramCode));
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
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(serverNowDate);

  const cooldownAvailableAt = cooldown?.untilUtc
    ? new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(cooldown.untilUtc))
    : null;
  const cooldownActionLabel = cooldown?.action === "LUNCH_IN" ? "Return" : "Check in";
  const cooldownRequiredMinutes = Number(cooldown?.requiredMinutes || 60);

  const checkedInTime = day?.checkInAtUtc ? formatTime(new Date(day.checkInAtUtc), tz) : null;
  const checkedOutTime = day?.checkOutAtUtc ? formatTime(new Date(day.checkOutAtUtc), tz) : null;
  const telegramStatusData = telegramStatus.data?.data?.telegramStatus;
  const telegramLinked = Boolean(telegramStatusData?.linked);
  const telegramUsername = telegramStatusData?.telegramUsername || null;
  const telegramBotUrl = telegramStatusData?.botUrl || telegramCode?.botUrl || null;

  React.useEffect(() => {
    if (!telegramLinked) return;
    setTelegramCode(null);
    setTelegramCodeCopied(false);
    setTelegramBannerDismissed(false);
  }, [telegramLinked]);

  const hasCheckedIn = Boolean(day?.checkInAtUtc || timeline.some((event: any) => event.type === "CHECK_IN"));
  const hasLunchOut = Boolean(day?.lunchOutAtUtc || timeline.some((event: any) => event.type === "LUNCH_OUT"));
  const hasLunchIn = Boolean(day?.lunchInAtUtc || timeline.some((event: any) => event.type === "LUNCH_IN"));
  const hasCheckedOut = Boolean(day?.checkOutAtUtc || timeline.some((event: any) => event.type === "CHECK_OUT"));
  const missingLunchCheckout = Boolean(lunch?.lunchBreakEnabled && hasCheckedIn && !hasLunchOut && !hasCheckedOut);
  const missingLunchReturn = Boolean(hasLunchOut && !hasLunchIn && !hasCheckedOut);
  const lunchCheckoutNeedsAttention = Boolean(missingLunchCheckout && isLunchWindowActive === true);
  const lateByMins = !hasCheckedIn && nextAllowed.includes("CHECK_IN") ? computeLateByMinutes() : 0;

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
    if (isSaturdayTrackingOnly) return "Saturday tracking";
    if (isDayComplete || hasCheckedOut) return checkedOutTime ? `Checked out · ${checkedOutTime}` : "Day complete";
    if (currentStatus === "ON_BREAK" || (hasLunchOut && !hasLunchIn)) return "On lunch break";
    if (hasCheckedIn) return checkedInTime ? `Checked in · ${checkedInTime}` : "Checked in";
    if (disabledReason) return disabledReason;
    return "Ready to check in";
  })();

  if (attendanceExemption) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <Card className="rounded-md py-0 shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <ShieldCheck className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">Attendance check-in not required</div>
              {attendanceExemption.reason ? (
                <div className="mt-0.5 truncate text-sm text-muted-foreground" title={attendanceExemption.reason}>
                  {attendanceExemption.reason}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-2.5">
      <Card className="rounded-md py-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold text-foreground">Self Check-In</h1>
              <span className="hidden text-sm text-muted-foreground sm:inline">{dateDisplay}</span>
            </div>
            <div className="font-mono text-sm tabular-nums text-foreground">{nowDisplay}</div>
          </div>

          <div className="py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{primaryStatusTitle}</h2>
              <LocationBadge withinRadius={withinRadius} geo={geo} coords={coords} />
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              <span>{office ? settings?.locationName || "Primary workplace" : "Workplace not configured"}</span>
              {office ? <span>· {office.radius}m</span> : null}
              <Button type="button" variant="ghost" size="icon-xs" onClick={requestLocation} aria-label="Refresh location">
                <RefreshCw className="size-3.5" />
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <CompactMetric value={fmtMins(localWorkedMins)} label="worked" emphasis={currentStatus === "IN_PROGRESS"} />
              <CompactMetric value={remainingMins > 0 ? fmtMins(remainingMins) : "0m"} label="left" />
              <CompactMetric value={fmtMins(backendBreakMins)} label="break" />
              {lateByMins > 0 ? <CompactMetric value={`${lateByMins}m`} label="late" tone="warning" /> : null}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{progressPct}%</span>
            </div>

            {showAttendanceWarning ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-amber-800">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                <span>{attendanceWarningLabel({ missingLunchReturn, lunchCheckoutNeedsAttention, withinRadius, penaltyReason, currentStatus })}</span>
                {showLunchApprovalAction ? (
                  <Button type="button" variant="outline" size="xs" onClick={onSpecialRequest}>Approval</Button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isDayComplete ? (
                <Badge variant="secondary" className="gap-1.5 px-2.5 py-1.5 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Day complete
                </Badge>
              ) : disabledReason ? (
                <span className="text-sm text-amber-800">{disabledReason}</span>
              ) : cooldown?.active ? (
                <>
                  <Button disabled>
                    <Clock3 className="size-4" /> {cooldownActionLabel}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {cooldownAvailableAt ? `Available ${cooldownAvailableAt}` : `${cooldownRequiredMinutes}m break`}
                  </span>
                </>
              ) : (
                <>
                  {nextAllowed.map((type, index) => {
                    const isLunchOutFixed = type === "LUNCH_OUT" && lunch?.lunchMode === "FIXED";
                    const lunchWindowClosed = isLunchOutFixed && isLunchWindowActive === false;
                    const buttonDisabled = Boolean(baseDisabledReason) || lunchWindowClosed;
                    const disabledTitle = lunchWindowClosed
                      ? `Lunch window: ${lunch?.fixedLunchStartTime} - ${lunch?.fixedLunchEndTime}`
                      : baseDisabledReason ?? undefined;

                    return (
                      <span key={type} title={buttonDisabled ? disabledTitle : undefined}>
                        <Button
                          type="button"
                          variant={index === 0 ? "default" : "outline"}
                          disabled={buttonDisabled}
                          onClick={() => void handleAction(type)}
                        >
                          {createEvent.isPending ? <Loader2 className="size-4 animate-spin" /> : actionIcon(type)}
                          {createEvent.isPending ? "Working..." : shortActionLabel(type)}
                        </Button>
                      </span>
                    );
                  })}

                  <Button type="button" variant="ghost" onClick={() => setDetailsOpen((open) => !open)}>
                    {detailsOpen ? "Hide details" : "Details"}
                  </Button>

                  {geo.status === "prompt" && !coords && !isSaturdayTrackingOnly ? (
                    <Button type="button" variant="secondary" onClick={requestLocation}>
                      <MapPin className="size-4" /> Enable location
                    </Button>
                  ) : null}
                </>
              )}
            </div>

            {baseDisabledReason && nextAllowed.length > 0 ? (
              <div className="mt-2 text-xs text-muted-foreground">{baseDisabledReason}</div>
            ) : null}

            {submitError ? (
              <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{submitError}</div>
            ) : null}

            {detailsOpen ? (
              <div className="mt-3 grid gap-x-6 gap-y-2 border-t border-border pt-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <Detail label="Credited" value={fmtMins(localWorkedMins)} />
                <Detail label="Worked" value={fmtMins(backendRawWorkedMins)} />
                <Detail label="Break" value={fmtMins(backendBreakMins)} />
                <Detail label="Penalty" value={fmtMins(penaltyMins)} />
                <Detail label="Expected" value={fmtMins(expectedMins)} />
                <Detail label="Remaining" value={remainingMins > 0 ? fmtMins(remainingMins) : "0m"} />
                <Detail label="Overtime" value={fmtMins(overtimeMins)} />
                <Detail label="Location" value={locationStatusText} />
                <Detail label="Distance" value={distanceMeters !== null ? `${Math.round(distanceMeters)}m` : "—"} />
                <Detail label="Radius" value={office ? `${office.radius}m` : "—"} />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {telegramLinked || telegramCode || !telegramBannerDismissed ? (
        <Card className="rounded-md py-0 shadow-none">
          <CardContent className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              {telegramLinked ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <Link2 className="size-4 shrink-0 text-muted-foreground" />
              )}

              {telegramLinked ? (
                <span className="truncate text-foreground">
                  Telegram connected{telegramUsername ? <span className="text-muted-foreground"> · @{telegramUsername}</span> : null}
                </span>
              ) : telegramCode ? (
                <span className="truncate text-muted-foreground">
                  Waiting for Telegram · <span className="font-mono text-foreground">{telegramCode.code}</span>
                </span>
              ) : (
                <span className="text-foreground">Telegram attendance</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {telegramCode ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(telegramCode.code);
                    setTelegramCodeCopied(true);
                    window.setTimeout(() => setTelegramCodeCopied(false), 1800);
                  }}
                >
                  {telegramCodeCopied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {telegramCodeCopied ? "Copied" : "Copy"}
                </Button>
              ) : null}

              {(telegramCode?.deepLink || telegramBotUrl) ? (
                <Button
                  type="button"
                  variant={telegramLinked ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    const url = telegramCode?.deepLink || telegramBotUrl;
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="size-3.5" />
                  {telegramLinked ? "Open Telegram" : "Continue in Telegram"}
                </Button>
              ) : null}

              {!telegramLinked && !telegramCode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const response = await generateTelegramCode.mutateAsync();
                    const linkCode = response.data.telegramLinkCode;
                    setTelegramCode(linkCode);
                    setTelegramCodeCopied(false);
                    setTelegramBannerDismissed(false);
                    if (linkCode.deepLink) {
                      const popup = window.open(linkCode.deepLink, "_blank", "noopener,noreferrer");
                      if (!popup) window.location.assign(linkCode.deepLink);
                    }
                  }}
                  disabled={generateTelegramCode.isPending}
                >
                  {generateTelegramCode.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
                  {generateTelegramCode.isPending ? "Connecting..." : "Connect"}
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
                    await telegramStatus.refetch();
                  }}
                  disabled={unlinkTelegram.isPending}
                >
                  {unlinkTelegram.isPending ? "Unlinking..." : "Unlink"}
                </Button>
              ) : null}

              {!telegramLinked && !telegramCode ? (
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setTelegramBannerDismissed(true)} aria-label="Dismiss Telegram banner">
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-md py-0 shadow-none">
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Today</h2>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => void today.refetch()} disabled={today.isFetching} aria-label="Refresh attendance">
                <RefreshCw className={`size-3.5 ${today.isFetching ? "animate-spin" : ""}`} />
              </Button>

              {timeline.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Attendance actions" />}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={revertEvent.isPending || createEvent.isPending} onClick={() => setConfirmRevertOpen(true)}>
                      <Undo2 className="size-4" /> Revert last action
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>

          {today.isError ? (
            <div className="mt-2 flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>Could not load attendance.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => void today.refetch()}>Retry</Button>
            </div>
          ) : null}

          <div className="mt-2 divide-y divide-border">
            {timeline.length === 0 ? (
              <div className="py-2 text-sm text-muted-foreground">No events yet.</div>
            ) : (
              timeline.map((event: any) => (
                <div key={event.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 py-2 text-sm">
                  <div className="font-mono tabular-nums text-foreground">{formatTime(new Date(event.timestampUtc), tz)}</div>
                  <div className="min-w-0 font-medium text-foreground">{event.label}</div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="hidden sm:inline">{event.withinAllowedRadius ? "Inside" : `${Math.round(event.distanceMeters)}m away`}</span>
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
          <p className="text-sm text-muted-foreground">This removes your latest attendance event.</p>
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">
            {timeline[timeline.length - 1]?.label || "Attendance action"}
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

function CompactMetric({
  value,
  label,
  emphasis = false,
  tone = "default",
}: {
  value: string;
  label: string;
  emphasis?: boolean;
  tone?: "default" | "warning";
}) {
  return (
    <div className={`flex items-baseline gap-1 ${tone === "warning" ? "text-amber-700" : ""}`}>
      <span className={`font-semibold ${emphasis ? "text-primary" : tone === "warning" ? "text-amber-700" : "text-foreground"}`}>{value}</span>
      <span className={tone === "warning" ? "text-amber-700" : "text-muted-foreground"}>{label}</span>
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
        <CheckCircle2 className="size-3" /> Inside
      </Badge>
    );
  }

  if (withinRadius === false) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" /> Outside
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <MapPin className="size-3" /> {geoBadgeText(geo, coords)}
    </Badge>
  );
}

function attendanceWarningLabel({
  missingLunchReturn,
  lunchCheckoutNeedsAttention,
  withinRadius,
  penaltyReason,
  currentStatus,
}: {
  missingLunchReturn: boolean;
  lunchCheckoutNeedsAttention: boolean;
  withinRadius: boolean | null;
  penaltyReason: string | null;
  currentStatus: string;
}) {
  if (missingLunchReturn) return "Return from lunch";
  if (lunchCheckoutNeedsAttention) return "Lunch window open";
  if (withinRadius === false) return "Outside workplace";
  if (penaltyReason) return penaltyReason;
  if (currentStatus === "MISSED") return "Attendance needs attention";
  return "Attendance needs attention";
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

function shortActionLabel(type: AttendanceEventType): string {
  if (type === "CHECK_IN") return "Check In";
  if (type === "LUNCH_OUT") return "Lunch Out";
  if (type === "LUNCH_IN") return "Return";
  return "Check Out";
}

function actionIcon(type: AttendanceEventType) {
  if (type === "CHECK_IN") return <LogIn className="size-4" />;
  if (type === "LUNCH_OUT") return <Coffee className="size-4" />;
  if (type === "LUNCH_IN") return <UtensilsCrossed className="size-4" />;
  return <LogOut className="size-4" />;
}

function geoBadgeText(geo: GeoState, coords: Coords): string {
  if (geo.status === "denied") return "Denied";
  if (geo.status === "error") return "Unavailable";
  if (coords) return "Ready";
  if (geo.status === "prompt") return "Location";
  return "Locating";
}

import React from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  Coffee,
  Loader2,
  LogIn,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type {
  AttendanceEventType,
  AttendanceMeTodayResponse,
  BusinessAttendanceSettings,
} from "../../api/types";
import { useCreateMyAttendanceEvent } from "../../hooks/useCreateMyAttendanceEvent";
import { useMyAttendanceToday } from "../../hooks/useMyAttendanceToday";

interface HeaderWorkStatusProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface NextAttendanceEvent {
  action: AttendanceEventType;
  title: string;
  targetAt: number | null;
}

interface CooldownState {
  active?: boolean;
  action?: AttendanceEventType | null;
  untilUtc?: string | null;
  remainingMinutes?: number;
}

interface AttendanceLunchState {
  fixedLunchStartTime?: string | null;
  fixedLunchEndTime?: string | null;
}

interface AttendanceVisualState {
  action: AttendanceEventType | null;
  isLoading: boolean;
  isComplete: boolean;
  isCooldownActive: boolean;
  hasError: boolean;
}

const ONE_SECOND_MS = 1_000;

export default function HeaderWorkStatus({
  onSuccess,
  onError,
}: HeaderWorkStatusProps) {
  const navigate = useNavigate();

  const attendanceQuery = useMyAttendanceToday();
  const createAttendanceEvent = useCreateMyAttendanceEvent();

  const [now, setNow] = React.useState(() => Date.now());

  const attendanceData = attendanceQuery.data
    ?.data as AttendanceMeTodayResponse | undefined;

  const settings =
    (attendanceData?.settings as BusinessAttendanceSettings | null) ??
    null;

  const nextAllowed = React.useMemo<AttendanceEventType[]>(
    () => attendanceData?.nextAllowed ?? [],
    [attendanceData?.nextAllowed],
  );

  const timeline = React.useMemo(
    () => attendanceData?.timeline ?? [],
    [attendanceData?.timeline],
  );

  const cooldown =
    (attendanceData?.cooldown as CooldownState | null) ?? null;

  const disabledReason = attendanceData?.disabledReason ?? null;

  const nextAttendanceEvent =
    React.useMemo<NextAttendanceEvent | null>(() => {
      const action =
        cooldown?.active && cooldown.action
          ? cooldown.action
          : nextAllowed[0] ?? null;

      if (!action) {
        return null;
      }

      return {
        action,
        title: toAttendanceEventLabel(action),
        targetAt: resolveAttendanceTargetTime({
          action,
          cooldownUntilUtc:
            cooldown?.active && cooldown.untilUtc
              ? cooldown.untilUtc
              : null,
          settings,
          attendanceData,
        }),
      };
    }, [
      attendanceData,
      cooldown?.action,
      cooldown?.active,
      cooldown?.untilUtc,
      nextAllowed,
      settings,
    ]);

  const isAttendanceComplete =
    timeline.length > 0 &&
    nextAllowed.length === 0 &&
    !cooldown?.active &&
    !disabledReason;

  const nextAction = nextAttendanceEvent?.action ?? null;

  const shouldRunCountdown =
    nextAttendanceEvent?.targetAt != null &&
    nextAttendanceEvent.targetAt > now;

  React.useEffect(() => {
    if (!shouldRunCountdown) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, ONE_SECOND_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    nextAttendanceEvent?.action,
    nextAttendanceEvent?.targetAt,
    shouldRunCountdown,
  ]);

  React.useEffect(() => {
    setNow(Date.now());
  }, [attendanceQuery.dataUpdatedAt]);

  const isInitialLoading =
    attendanceQuery.isLoading &&
    !attendanceQuery.data;

  const isSubmitting =
    createAttendanceEvent.isPending;

  const isLoading =
    isInitialLoading || isSubmitting;

  const actionDisabledReason = React.useMemo(() => {
    if (isInitialLoading) {
      return "Loading attendance";
    }

    if (isSubmitting) {
      return "Processing attendance";
    }

    if (disabledReason) {
      return disabledReason;
    }

    if (cooldown?.active) {
      return getCooldownMessage(
        cooldown.remainingMinutes ?? 0,
      );
    }

    if (isAttendanceComplete) {
      return "Attendance completed";
    }

    if (!nextAction) {
      return "No attendance action available";
    }

    return null;
  }, [
    cooldown?.active,
    cooldown?.remainingMinutes,
    disabledReason,
    isAttendanceComplete,
    isInitialLoading,
    isSubmitting,
    nextAction,
  ]);

  const handleOpenAttendance = () => {
    navigate("/employee/attendance/check-in");
  };

  const handleAttendanceAction = async () => {
    if (isSubmitting) {
      return;
    }

    if (isInitialLoading) {
      onError?.(
        "Attendance is still loading. Please try again.",
      );
      return;
    }

    if (disabledReason) {
      onError?.(disabledReason);
      return;
    }

    if (cooldown?.active) {
      onError?.(
        getCooldownMessage(
          cooldown.remainingMinutes ?? 0,
        ),
      );
      return;
    }

    if (isAttendanceComplete) {
      onSuccess?.(
        "Your attendance is already complete for today.",
      );
      return;
    }

    if (!nextAction) {
      onError?.(
        "No attendance action is currently available.",
      );
      return;
    }

    try {
      const coordinates =
        await resolveAttendanceCoordinates(settings);

      validateAttendanceRadius({
        coordinates,
        settings,
      });

      await createAttendanceEvent.mutateAsync({
        type: nextAction,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
      });

      onSuccess?.(
        `${toAttendancePastTenseLabel(
          nextAction,
        )} successfully`,
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to record attendance";

      onError?.(message);
    }
  };

  const handleMergedControlClick = () => {
    if (isSubmitting) {
      return;
    }

    void handleAttendanceAction();
  };

  return (
    <div className="flex w-full min-w-0">
      <button
        type="button"
        onClick={handleMergedControlClick}
        disabled={isSubmitting}
        aria-disabled={Boolean(actionDisabledReason)}
        title={
          actionDisabledReason ??
          getAttendanceControlTitle({
            event: nextAttendanceEvent,
            now,
          })
        }
        className={[
          "group flex h-11 w-full min-w-0 items-stretch overflow-hidden rounded-2xl border text-left transition-all sm:min-w-[310px] sm:max-w-[420px]",
          isSubmitting
            ? "cursor-wait border-slate-200 bg-slate-50"
            : disabledReason
              ? "cursor-pointer border-rose-200 bg-rose-50/50 hover:bg-rose-50"
              : isAttendanceComplete
                ? "cursor-pointer border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
                : cooldown?.active
                  ? "cursor-pointer border-amber-200 bg-amber-50/60 hover:bg-amber-50"
                  : "cursor-pointer border-blue-200 bg-white shadow-sm hover:border-blue-300 hover:bg-blue-50/30 hover:shadow",
        ].join(" ")}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 sm:gap-2.5 sm:px-3">
          <div
            className={[
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              getAttendanceIconContainerClass({
                isLoading,
                isComplete: isAttendanceComplete,
                isCooldownActive: Boolean(
                  cooldown?.active,
                ),
                hasError: Boolean(disabledReason),
                action: nextAction,
              }),
            ].join(" ")}
          >
            {getAttendanceIcon({
              action: nextAction,
              isLoading,
              isComplete: isAttendanceComplete,
              isCooldownActive: Boolean(
                cooldown?.active,
              ),
              hasError: Boolean(disabledReason),
            })}
          </div>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <LoadingPreview />
            ) : isAttendanceComplete ? (
              <CompletePreview />
            ) : disabledReason ? (
              <UnavailablePreview
                reason={disabledReason}
              />
            ) : nextAttendanceEvent ? (
              <NextEventPreview
                event={nextAttendanceEvent}
                now={now}
              />
            ) : (
              <NoEventPreview />
            )}
          </div>
        </div>

        <div
          className={[
            "flex min-w-[92px] shrink-0 items-center justify-center gap-1.5 border-l px-2 text-[10px] font-black transition-colors sm:min-w-[104px] sm:px-3 sm:text-[11px]",
            getActionSectionClass({
              action: nextAction,
              isLoading,
              isComplete: isAttendanceComplete,
              isCooldownActive: Boolean(
                cooldown?.active,
              ),
              hasError: Boolean(disabledReason),
            }),
          ].join(" ")}
        >
          {getActionSectionIcon({
            action: nextAction,
            isLoading,
            isComplete: isAttendanceComplete,
            isCooldownActive: Boolean(
              cooldown?.active,
            ),
            hasError: Boolean(disabledReason),
          })}
          <span className="whitespace-nowrap">
            {getActionSectionLabel({
              action: nextAction,
              isLoading,
              isComplete: isAttendanceComplete,
              isCooldownActive: Boolean(
                cooldown?.active,
              ),
              hasError: Boolean(disabledReason),
              remainingMinutes:
                cooldown?.remainingMinutes ?? 0,
            })}
          </span>
        </div>
      </button>
    </div>
  );
}

function LoadingPreview() {
  return (
    <>
      <div className="h-2.5 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-1.5 h-2 w-16 animate-pulse rounded bg-slate-200" />
    </>
  );
}

interface NextEventPreviewProps {
  event: NextAttendanceEvent;
  now: number;
}

function NextEventPreview({
  event,
  now,
}: NextEventPreviewProps) {
  return (
    <>
      <div className="flex min-w-0 items-center gap-1.5 leading-none">
        <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
          Next event
        </span>

        <span className="truncate text-[11px] font-black text-slate-900">
          {event.title}
        </span>
      </div>

      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-bold">
        <Clock3 className="h-3 w-3 shrink-0 text-blue-500" />

        <span className="truncate text-blue-600">
          {getAttendanceCountdownLabel(
            event.targetAt,
            now,
          )}
        </span>

        {event.targetAt ? (
          <>
            <span className="shrink-0 text-slate-300">
              •
            </span>

            <span className="truncate text-slate-500">
              {formatAttendanceTargetTime(
                event.targetAt,
              )}
            </span>
          </>
        ) : null}
      </div>
    </>
  );
}

function CompletePreview() {
  return (
    <>
      <div className="text-[11px] font-black leading-none text-emerald-700">
        Attendance complete
      </div>

      <div className="mt-1 text-[10px] font-semibold text-emerald-600/70">
        No remaining events today
      </div>
    </>
  );
}

interface UnavailablePreviewProps {
  reason: string;
}

function UnavailablePreview({
  reason,
}: UnavailablePreviewProps) {
  return (
    <>
      <div className="text-[11px] font-black leading-none text-rose-700">
        Attendance unavailable
      </div>

      <div className="mt-1 max-w-[190px] truncate text-[10px] font-semibold text-rose-600/70">
        {reason}
      </div>
    </>
  );
}

function NoEventPreview() {
  return (
    <>
      <div className="text-[11px] font-black leading-none text-slate-800">
        No attendance event
      </div>

      <div className="mt-1 text-[10px] font-semibold text-slate-400">
        Open attendance details
      </div>
    </>
  );
}

interface ResolveAttendanceTargetTimeParams {
  action: AttendanceEventType;
  cooldownUntilUtc: string | null;
  settings: BusinessAttendanceSettings | null;
  attendanceData: AttendanceMeTodayResponse | undefined;
}

function resolveAttendanceTargetTime({
  action,
  cooldownUntilUtc,
  settings,
  attendanceData,
}: ResolveAttendanceTargetTimeParams): number | null {
  if (cooldownUntilUtc) {
    const cooldownTimestamp =
      new Date(cooldownUntilUtc).getTime();

    if (Number.isFinite(cooldownTimestamp)) {
      return cooldownTimestamp;
    }
  }

  const configuredTime =
    getConfiguredAttendanceTime({
      action,
      settings,
      attendanceData,
    });

  if (!configuredTime) {
    return null;
  }

  return createTimestampForToday(configuredTime);
}

interface GetConfiguredAttendanceTimeParams {
  action: AttendanceEventType;
  settings: BusinessAttendanceSettings | null;
  attendanceData: AttendanceMeTodayResponse | undefined;
}

function getConfiguredAttendanceTime({
  action,
  settings,
  attendanceData,
}: GetConfiguredAttendanceTimeParams): string | null {
  const lunch = attendanceData?.lunch as
    | AttendanceLunchState
    | null
    | undefined;

  if (action === "CHECK_IN") {
    return settings?.defaultStartTime ?? null;
  }

  if (action === "LUNCH_OUT") {
    return (
      lunch?.fixedLunchStartTime ??
      settings?.fixedLunchStartTime ??
      null
    );
  }

  if (action === "LUNCH_IN") {
    return (
      lunch?.fixedLunchEndTime ??
      settings?.fixedLunchEndTime ??
      null
    );
  }

  if (action === "CHECK_OUT") {
    return settings?.defaultEndTime ?? null;
  }

  return null;
}

function createTimestampForToday(
  timeValue: string,
): number | null {
  const match = timeValue.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    seconds,
    0,
  );

  return date.getTime();
}

function getAttendanceCountdownLabel(
  targetAt: number | null,
  now: number,
): string {
  if (!targetAt || targetAt <= now) {
    return "Available now";
  }

  return `In ${formatAttendanceCountdown(
    targetAt - now,
  )}`;
}

function formatAttendanceCountdown(
  milliseconds: number,
): string {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1_000),
  );

  const days = Math.floor(
    totalSeconds / 86_400,
  );

  const hours = Math.floor(
    (totalSeconds % 86_400) / 3_600,
  );

  const minutes = Math.floor(
    (totalSeconds % 3_600) / 60,
  );

  const seconds =
    totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${String(
    seconds,
  ).padStart(2, "0")}s`;
}

function formatAttendanceTargetTime(
  timestamp: number,
): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function toAttendanceEventLabel(
  type: AttendanceEventType,
): string {
  switch (type) {
    case "CHECK_IN":
      return "Check in";

    case "LUNCH_OUT":
      return "Start lunch";

    case "LUNCH_IN":
      return "Return from lunch";

    case "CHECK_OUT":
      return "Check out";

    default:
      return "Attendance";
  }
}

function toAttendancePastTenseLabel(
  type: AttendanceEventType,
): string {
  switch (type) {
    case "CHECK_IN":
      return "Checked in";

    case "LUNCH_OUT":
      return "Lunch started";

    case "LUNCH_IN":
      return "Returned from lunch";

    case "CHECK_OUT":
      return "Checked out";

    default:
      return "Attendance recorded";
  }
}

function getAttendanceIcon({
  action,
  isLoading,
  isComplete,
  isCooldownActive,
  hasError,
}: AttendanceVisualState): React.ReactNode {
  if (isLoading) {
    return (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    );
  }

  if (hasError) {
    return (
      <AlertTriangle className="h-3.5 w-3.5" />
    );
  }

  if (isComplete) {
    return (
      <Check className="h-3.5 w-3.5" />
    );
  }

  if (isCooldownActive) {
    return (
      <Clock3 className="h-3.5 w-3.5" />
    );
  }

  if (action === "LUNCH_OUT") {
    return (
      <UtensilsCrossed className="h-3.5 w-3.5" />
    );
  }

  if (action === "LUNCH_IN") {
    return (
      <Coffee className="h-3.5 w-3.5" />
    );
  }

  if (action === "CHECK_OUT") {
    return (
      <LogOut className="h-3.5 w-3.5" />
    );
  }

  return (
    <LogIn className="h-3.5 w-3.5" />
  );
}

function getAttendanceIconContainerClass({
  action,
  isLoading,
  isComplete,
  isCooldownActive,
  hasError,
}: AttendanceVisualState): string {
  if (isLoading) {
    return "bg-slate-100 text-slate-500";
  }

  if (hasError) {
    return "bg-rose-100 text-rose-600";
  }

  if (isComplete) {
    return "bg-emerald-100 text-emerald-600";
  }

  if (isCooldownActive) {
    return "bg-amber-100 text-amber-600";
  }

  if (action === "LUNCH_OUT") {
    return "bg-amber-100 text-amber-600";
  }

  if (action === "CHECK_OUT") {
    return "bg-slate-100 text-slate-700";
  }

  return "bg-blue-50 text-blue-600";
}

function getActionSectionIcon(
  state: AttendanceVisualState,
): React.ReactNode {
  return getAttendanceIcon(state);
}

function getActionSectionClass({
  action,
  isLoading,
  isComplete,
  isCooldownActive,
  hasError,
}: AttendanceVisualState): string {
  if (isLoading) {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }

  if (hasError) {
    return "border-rose-200 bg-rose-100/60 text-rose-700";
  }

  if (isComplete) {
    return "border-emerald-200 bg-emerald-100/60 text-emerald-700";
  }

  if (isCooldownActive) {
    return "border-amber-200 bg-amber-100/60 text-amber-700";
  }

  if (action === "LUNCH_OUT") {
    return "border-amber-200 bg-amber-50 text-amber-700 group-hover:bg-amber-100";
  }

  if (action === "CHECK_OUT") {
    return "border-slate-900 bg-slate-900 text-white group-hover:bg-slate-800";
  }

  return "border-blue-600 bg-blue-600 text-white group-hover:bg-blue-700";
}

interface ActionSectionLabelParams {
  action: AttendanceEventType | null;
  isLoading: boolean;
  isComplete: boolean;
  isCooldownActive: boolean;
  hasError: boolean;
  remainingMinutes: number;
}

function getActionSectionLabel({
  action,
  isLoading,
  isComplete,
  isCooldownActive,
  hasError,
  remainingMinutes,
}: ActionSectionLabelParams): string {
  if (isLoading) {
    return "Processing";
  }

  if (hasError) {
    return "Unavailable";
  }

  if (isComplete) {
    return "Day complete";
  }

  if (isCooldownActive) {
    return getCooldownMessage(
      remainingMinutes,
    );
  }

  if (action) {
    return toAttendanceEventLabel(action);
  }

  return "Unavailable";
}

function getCooldownMessage(
  remainingMinutes: number,
): string {
  const minutes = Math.max(
    0,
    Math.ceil(
      Number(remainingMinutes || 0),
    ),
  );

  if (minutes > 0) {
    return `${minutes}m left`;
  }

  return "Please wait";
}

interface AttendanceControlTitleParams {
  event: NextAttendanceEvent | null;
  now: number;
}

function getAttendanceControlTitle({
  event,
  now,
}: AttendanceControlTitleParams): string {
  if (!event) {
    return "Attendance";
  }

  return `${event.title} — ${getAttendanceCountdownLabel(
    event.targetAt,
    now,
  )}`;
}

async function resolveAttendanceCoordinates(
  settings: BusinessAttendanceSettings | null,
): Promise<Coordinates | null> {
  const locationConfigured =
    settings?.latitude != null &&
    settings?.longitude != null;

  if (!locationConfigured) {
    return null;
  }

  if (!navigator.geolocation) {
    throw new Error(
      "Geolocation is not supported by this browser.",
    );
  }

  return new Promise<Coordinates>(
    (resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude:
              position.coords.latitude,
            longitude:
              position.coords.longitude,
          });
        },
        (error) => {
          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            reject(
              new Error(
                "Location permission is required to record attendance.",
              ),
            );
            return;
          }

          if (
            error.code === error.TIMEOUT
          ) {
            reject(
              new Error(
                "Location request timed out. Check your GPS and try again.",
              ),
            );
            return;
          }

          reject(
            new Error(
              "Unable to retrieve your current location.",
            ),
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 30_000,
        },
      );
    },
  );
}

interface ValidateAttendanceRadiusParams {
  coordinates: Coordinates | null;
  settings: BusinessAttendanceSettings | null;
}

function validateAttendanceRadius({
  coordinates,
  settings,
}: ValidateAttendanceRadiusParams): void {
  if (
    !coordinates ||
    settings?.latitude == null ||
    settings?.longitude == null
  ) {
    return;
  }

  const allowedRadius = Number(
    settings.allowedRadiusMeters ?? 0,
  );

  if (
    !Number.isFinite(allowedRadius) ||
    allowedRadius <= 0
  ) {
    return;
  }

  const workplaceDistance =
    haversineDistanceMeters(
      coordinates.latitude,
      coordinates.longitude,
      Number(settings.latitude),
      Number(settings.longitude),
    );

  if (
    workplaceDistance <= allowedRadius
  ) {
    return;
  }

  const outsideBy = Math.ceil(
    workplaceDistance - allowedRadius,
  );

  throw new Error(
    `You are outside the allowed workplace radius by ${outsideBy} metres.`,
  );
}

function haversineDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const earthRadiusMeters = 6_371_000;

  const toRadians = (
    degrees: number,
  ) => (degrees * Math.PI) / 180;

  const latitudeDifference =
    toRadians(
      latitude2 - latitude1,
    );

  const longitudeDifference =
    toRadians(
      longitude2 - longitude1,
    );

  const firstLatitude =
    toRadians(latitude1);

  const secondLatitude =
    toRadians(latitude2);

  const value =
    Math.sin(
      latitudeDifference / 2,
    ) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(
        longitudeDifference / 2,
      ) ** 2;

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(1 - value),
    )
  );
}

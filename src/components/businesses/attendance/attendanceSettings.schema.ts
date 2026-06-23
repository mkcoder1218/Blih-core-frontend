import type { BusinessAttendanceSettingsDraft } from "./attendanceSettings.types";

const timeHHmm = /^([01]\d|2[0-3]):[0-5]\d$/;

function isIanaTimezone(tz: string): boolean {
  try {
    // Modern browsers expose the list; if not, fallback to DateTimeFormat throwing.
    const supported = (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined;
    if (Array.isArray(supported)) return supported.includes(tz);
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export type AttendanceSettingsErrors = Partial<Record<keyof BusinessAttendanceSettingsDraft, string>>;

export function validateAttendanceSettings(draft: BusinessAttendanceSettingsDraft): AttendanceSettingsErrors {
  const errors: AttendanceSettingsErrors = {};

  if (draft.expectedDailyMinutes !== undefined && draft.expectedDailyMinutes !== null && draft.expectedDailyMinutes <= 0) {
    errors.expectedDailyMinutes = "Expected daily minutes must be greater than 0.";
  }
  if (draft.lateGracePeriodMinutes !== undefined && draft.lateGracePeriodMinutes !== null && draft.lateGracePeriodMinutes < 0) {
    errors.lateGracePeriodMinutes = "Grace period must be 0 or greater.";
  }
  if (draft.lateNoReasonPenaltyGraceMinutes !== undefined && draft.lateNoReasonPenaltyGraceMinutes !== null && draft.lateNoReasonPenaltyGraceMinutes < 0) {
    errors.lateNoReasonPenaltyGraceMinutes = "Penalty window must be 0 or greater.";
  }
  if (draft.defaultStartTime && !timeHHmm.test(draft.defaultStartTime)) errors.defaultStartTime = "Use HH:mm (24h).";
  if (draft.defaultEndTime && !timeHHmm.test(draft.defaultEndTime)) errors.defaultEndTime = "Use HH:mm (24h).";

  if (draft.attendanceEnabled) {
    if (draft.latitude === null || draft.latitude === undefined || Number.isNaN(draft.latitude as any)) errors.latitude = "Latitude is required.";
    else if (draft.latitude < -90 || draft.latitude > 90) errors.latitude = "Latitude must be between -90 and 90.";

    if (draft.longitude === null || draft.longitude === undefined || Number.isNaN(draft.longitude as any)) errors.longitude = "Longitude is required.";
    else if (draft.longitude < -180 || draft.longitude > 180) errors.longitude = "Longitude must be between -180 and 180.";

    if (draft.allowedRadiusMeters === null || draft.allowedRadiusMeters === undefined || Number.isNaN(draft.allowedRadiusMeters as any)) {
      errors.allowedRadiusMeters = "Allowed radius is required.";
    } else if (draft.allowedRadiusMeters <= 0) {
      errors.allowedRadiusMeters = "Allowed radius must be greater than 0.";
    }

    if (!draft.timezone) errors.timezone = "Timezone is required.";
    else if (!isIanaTimezone(draft.timezone)) errors.timezone = "Enter a valid IANA timezone (e.g. Africa/Nairobi).";
  }

  if (draft.lunchBreakEnabled && draft.lunchMode === "FIXED") {
    if (!draft.fixedLunchStartTime || !timeHHmm.test(draft.fixedLunchStartTime)) (errors as any).fixedLunchStartTime = "Use HH:mm (24h).";
    if (!draft.fixedLunchEndTime || !timeHHmm.test(draft.fixedLunchEndTime)) (errors as any).fixedLunchEndTime = "Use HH:mm (24h).";
    if (draft.fixedLunchStartTime && draft.fixedLunchEndTime && draft.fixedLunchStartTime >= draft.fixedLunchEndTime) {
      (errors as any).fixedLunchEndTime = "End time must be after start time.";
    }
  }

  return errors;
}

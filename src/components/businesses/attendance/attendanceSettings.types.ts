export type BusinessAttendanceSettingsDraft = {
  attendanceEnabled: boolean;
  locationName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  allowedRadiusMeters: number | null;
  timezone: string;
  expectedDailyMinutes: number | null;
  defaultStartTime: string;
  defaultEndTime: string;
  lateGracePeriodMinutes: number | null;
  lateNoReasonPenaltyGraceMinutes: number | null;
  lunchBreakEnabled: boolean;
  lunchMode: "FIXED" | "FLEXIBLE";
  fixedLunchStartTime: string;
  fixedLunchEndTime: string;
  allowMultipleLunchBreaks: boolean;
};

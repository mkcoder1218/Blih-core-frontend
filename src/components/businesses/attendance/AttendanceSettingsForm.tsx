import React from "react";
import AttendanceLocationFields from "./AttendanceLocationFields";
import AttendanceScheduleFields from "./AttendanceScheduleFields";
import type { BusinessAttendanceSettingsDraft } from "./attendanceSettings.types";
import { validateAttendanceSettings } from "./attendanceSettings.schema";
import AttendanceLunchFields from "./AttendanceLunchFields";

type Props = {
  value: BusinessAttendanceSettingsDraft;
  onChange: (next: BusinessAttendanceSettingsDraft) => void;
  onValidityChange?: (isValid: boolean) => void;
};

export default function AttendanceSettingsForm({ value, onChange, onValidityChange }: Props) {
  const errors = React.useMemo(() => validateAttendanceSettings(value), [value]);
  const enabled = value.attendanceEnabled;
  const isValid = Object.keys(errors).length === 0;

  React.useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return (
    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-900">Attendance configuration</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Configure the primary workplace location and default schedule for attendance validation (Phase 1).
          </div>
        </div>

        <label className="flex items-center gap-2 select-none">
          <span className="text-[11px] font-bold text-slate-600">Enabled</span>
          <input
            type="checkbox"
            checked={value.attendanceEnabled}
            onChange={(e) => onChange({ ...value, attendanceEnabled: e.target.checked })}
            className="h-4 w-4 accent-[#1a56db]"
          />
        </label>
      </div>

      <div className={enabled ? "" : "opacity-60"}>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Workplace location</div>
        <AttendanceLocationFields value={value} onChange={onChange} disabled={!enabled} errors={errors} />
      </div>

      <div className={enabled ? "" : "opacity-60"}>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Default schedule</div>
        <AttendanceScheduleFields value={value} onChange={onChange} disabled={!enabled} errors={errors} />
      </div>

      <div className={enabled ? "" : "opacity-60"}>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lunch break</div>
        <AttendanceLunchFields value={value} onChange={onChange} disabled={!enabled} errors={errors as any} />
      </div>

      {!isValid ? (
        <div className="text-[11px] text-red-700 font-semibold bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          Fix the highlighted attendance fields before saving.
        </div>
      ) : null}
    </div>
  );
}

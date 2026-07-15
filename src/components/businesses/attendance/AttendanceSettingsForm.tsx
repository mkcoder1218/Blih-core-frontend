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
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Weekend Work Schedule</div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-3 text-[11px] font-medium text-slate-600">
            Paid days off are included in paid working-day calculations but do not require attendance check-ins.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <WeekendModeControl
              label="Saturday"
              value={value.saturdayWorkMode || "PAID_DAY_OFF"}
              disabled={!enabled}
              onChange={(saturdayWorkMode) => onChange({ ...value, saturdayWorkMode })}
            />
            <WeekendModeControl
              label="Sunday"
              value={value.sundayWorkMode || "PAID_DAY_OFF"}
              disabled={!enabled}
              onChange={(sundayWorkMode) => onChange({ ...value, sundayWorkMode })}
            />
          </div>
        </div>
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

function WeekendModeControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: BusinessAttendanceSettingsDraft["saturdayWorkMode"];
  disabled: boolean;
  onChange: (mode: BusinessAttendanceSettingsDraft["saturdayWorkMode"]) => void;
}) {
  const options: Array<{ value: BusinessAttendanceSettingsDraft["saturdayWorkMode"]; label: string }> = [
    { value: "PAID_DAY_OFF", label: "Paid day off" },
    { value: "HALF_WORKING_DAY", label: "Half working day" },
    { value: "FULL_WORKING_DAY", label: "Full working day" },
  ];

  return (
    <div>
      <div className="mb-2 text-xs font-bold text-slate-800">{label}</div>
      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
              value === option.value ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"
            } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name={`weekend-${label}`}
              value={option.value}
              checked={value === option.value}
              disabled={disabled}
              onChange={(event) => onChange((event.currentTarget?.value || "PAID_DAY_OFF") as BusinessAttendanceSettingsDraft["saturdayWorkMode"])}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-600"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

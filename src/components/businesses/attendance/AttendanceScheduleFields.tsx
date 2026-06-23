import React from "react";
import type { BusinessAttendanceSettingsDraft } from "./attendanceSettings.types";
import type { AttendanceSettingsErrors } from "./attendanceSettings.schema";

type Props = {
  value: BusinessAttendanceSettingsDraft;
  onChange: (next: BusinessAttendanceSettingsDraft) => void;
  disabled: boolean;
  errors: AttendanceSettingsErrors;
};

export default function AttendanceScheduleFields({ value, onChange, disabled, errors }: Props) {
  const set = (patch: Partial<BusinessAttendanceSettingsDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Default start time" disabled={disabled} error={errors.defaultStartTime}>
          <input
            value={value.defaultStartTime}
            onChange={(e) => set({ defaultStartTime: e.target.value })}
            disabled={disabled}
            className={inputClass(disabled, Boolean(errors.defaultStartTime))}
            placeholder="09:00"
          />
        </Field>
        <Field label="Default end time" disabled={disabled} error={errors.defaultEndTime}>
          <input
            value={value.defaultEndTime}
            onChange={(e) => set({ defaultEndTime: e.target.value })}
            disabled={disabled}
            className={inputClass(disabled, Boolean(errors.defaultEndTime))}
            placeholder="17:00"
          />
        </Field>
        <Field label="Expected daily minutes" disabled={disabled} error={errors.expectedDailyMinutes}>
          <input
            value={value.expectedDailyMinutes ?? ""}
            onChange={(e) => set({ expectedDailyMinutes: e.target.value === "" ? null : Number(e.target.value) })}
            disabled={disabled}
            className={inputClass(disabled, Boolean(errors.expectedDailyMinutes))}
            placeholder="480"
            inputMode="numeric"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Field label="Late grace (minutes)" disabled={disabled} error={errors.lateGracePeriodMinutes}>
            <input
              value={value.lateGracePeriodMinutes ?? ""}
              onChange={(e) => set({ lateGracePeriodMinutes: e.target.value === "" ? null : Number(e.target.value) })}
              disabled={disabled}
              className={inputClass(disabled, Boolean(errors.lateGracePeriodMinutes))}
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
        </div>
        <div>
          <Field label="No-reason penalty window" disabled={disabled} error={errors.lateNoReasonPenaltyGraceMinutes}>
            <input
              value={value.lateNoReasonPenaltyGraceMinutes ?? ""}
              onChange={(e) => set({ lateNoReasonPenaltyGraceMinutes: e.target.value === "" ? null : Number(e.target.value) })}
              disabled={disabled}
              className={inputClass(disabled, Boolean(errors.lateNoReasonPenaltyGraceMinutes))}
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
        </div>
        <div className="text-[11px] text-slate-500 leading-relaxed">
          These defaults are used later for check-ins and daily attendance calculations. You can keep attendance disabled until you’re ready to enforce location validation.
          No-reason penalty window controls how many late minutes are allowed before a half-day penalty when no valid lateness reason exists.
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  disabled,
  error,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label className={`text-[10px] font-bold uppercase tracking-wider block ${disabled ? "text-slate-300" : "text-slate-400"}`}>
        {label}
      </label>
      {children}
      {error ? <div className="text-[11px] text-red-700 font-semibold">{error}</div> : null}
    </div>
  );
}

function inputClass(disabled: boolean, invalid = false) {
  return [
    "w-full px-3.5 py-2.5 rounded-xl border font-semibold text-xs transition-all focus:outline-none",
    disabled ? "bg-slate-50 text-slate-400 border-slate-200/60" : "bg-slate-50 focus:bg-white text-slate-700 border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]",
    invalid ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "",
  ].join(" ");
}

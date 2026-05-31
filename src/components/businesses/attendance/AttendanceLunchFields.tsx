import React from "react";
import type { BusinessAttendanceSettingsDraft } from "./attendanceSettings.types";

type Props = {
  value: BusinessAttendanceSettingsDraft;
  onChange: (next: BusinessAttendanceSettingsDraft) => void;
  disabled: boolean;
  errors: Partial<Record<string, string>>;
};

export default function AttendanceLunchFields({ value, onChange, disabled, errors }: Props) {
  const set = (patch: Partial<BusinessAttendanceSettingsDraft>) => onChange({ ...value, ...patch });
  const lunchEnabled = value.lunchBreakEnabled;
  const fixed = value.lunchMode === "FIXED";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Enable lunch break" disabled={disabled}>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.lunchBreakEnabled}
              onChange={(e) => set({ lunchBreakEnabled: e.target.checked })}
              disabled={disabled}
              className="h-4 w-4 accent-[#1a56db]"
            />
            <span className="text-xs font-semibold text-slate-700">Enabled</span>
          </label>
        </Field>

        <Field label="Lunch mode" disabled={disabled || !lunchEnabled}>
          <select
            value={value.lunchMode}
            onChange={(e) => set({ lunchMode: e.target.value as any })}
            disabled={disabled || !lunchEnabled}
            className={selectClass(disabled || !lunchEnabled)}
          >
            <option value="FLEXIBLE">Flexible</option>
            <option value="FIXED">Fixed window</option>
          </select>
        </Field>
      </div>

      {fixed && lunchEnabled ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Fixed lunch start" disabled={disabled} error={(errors as any).fixedLunchStartTime}>
            <input
              value={value.fixedLunchStartTime}
              onChange={(e) => set({ fixedLunchStartTime: e.target.value })}
              disabled={disabled}
              className={inputClass(disabled, Boolean((errors as any).fixedLunchStartTime))}
              placeholder="12:00"
            />
          </Field>
          <Field label="Fixed lunch end" disabled={disabled} error={(errors as any).fixedLunchEndTime}>
            <input
              value={value.fixedLunchEndTime}
              onChange={(e) => set({ fixedLunchEndTime: e.target.value })}
              disabled={disabled}
              className={inputClass(disabled, Boolean((errors as any).fixedLunchEndTime))}
              placeholder="13:00"
            />
          </Field>
        </div>
      ) : null}

      <Field label="Allow multiple lunch breaks" disabled={disabled || !lunchEnabled}>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.allowMultipleLunchBreaks}
            onChange={(e) => set({ allowMultipleLunchBreaks: e.target.checked })}
            disabled={disabled || !lunchEnabled}
            className="h-4 w-4 accent-[#1a56db]"
          />
          <span className="text-xs font-semibold text-slate-700">Allow repeated lunch out/in</span>
        </label>
      </Field>
    </div>
  );
}

function Field({ label, children, disabled, error }: { label: string; children: React.ReactNode; disabled?: boolean; error?: string }) {
  return (
    <div className="space-y-1">
      <label className={`text-[10px] font-bold uppercase tracking-wider block ${disabled ? "text-slate-300" : "text-slate-400"}`}>{label}</label>
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

function selectClass(disabled: boolean) {
  return [
    "w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none",
    disabled ? "text-slate-400 border-slate-200/60" : "text-slate-700 border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]",
  ].join(" ");
}


import React from "react";
import type { BusinessAttendanceSettingsDraft } from "./attendanceSettings.types";
import type { AttendanceSettingsErrors } from "./attendanceSettings.schema";
import AttendanceTimezoneSelect from "./AttendanceTimezoneSelect";
import AttendanceLocationMap from "./AttendanceLocationMap";
import AttendanceLocationSearch from "./AttendanceLocationSearch";

type Props = {
  value: BusinessAttendanceSettingsDraft;
  onChange: (next: BusinessAttendanceSettingsDraft) => void;
  disabled: boolean;
  errors: AttendanceSettingsErrors;
};

export default function AttendanceLocationFields({ value, onChange, disabled, errors }: Props) {
  const set = (patch: Partial<BusinessAttendanceSettingsDraft>) => onChange({ ...value, ...patch });
  const [advanced, setAdvanced] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [locError, setLocError] = React.useState<string>("");

  const hasCoords = value.latitude !== null && value.longitude !== null;
  const center = hasCoords ? { lat: Number(value.latitude), lng: Number(value.longitude) } : null;
  const radius = Number(value.allowedRadiusMeters || 0) || 100;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Workplace location name" disabled={disabled}>
          <input
            value={value.locationName}
            onChange={(e) => set({ locationName: e.target.value })}
            disabled={disabled}
            className={inputClass(disabled)}
            placeholder="HQ, Nairobi Office, Warehouse A..."
          />
        </Field>
        <Field label="Business timezone" disabled={disabled} error={errors.timezone}>
          <AttendanceTimezoneSelect
            value={value.timezone}
            onChange={(tz) => set({ timezone: tz })}
            disabled={disabled}
            error={errors.timezone}
          />
        </Field>
      </div>

      <AttendanceLocationSearch
        disabled={disabled}
        onPick={({ lat, lng, address }) => {
          set({ latitude: lat, longitude: lng, address });
        }}
      />

      <AttendanceLocationMap
        center={center}
        radiusMeters={radius}
        disabled={disabled}
        onChange={({ lat, lng }) => set({ latitude: lat, longitude: lng })}
      />

      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location details</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={disabled || locating}
            onClick={() => {
              setLocError("");
              if (!navigator?.geolocation) {
                setLocError("Geolocation is not supported in this browser.");
                return;
              }
              setLocating(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  set({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                  setLocating(false);
                },
                (err) => {
                  if (err.code === err.PERMISSION_DENIED) setLocError("Location access denied. Please allow location permission and try again.");
                  else setLocError("Unable to retrieve current location.");
                  setLocating(false);
                },
                { enableHighAccuracy: true, timeout: 12_000, maximumAge: 10_000 }
              );
            }}
            className="text-[11px] font-extrabold bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 px-3 py-2 rounded-xl"
          >
            {locating ? "Locating…" : "Use my current location"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAdvanced((a) => !a)}
            className="text-[11px] font-extrabold text-[#1a56db] disabled:text-slate-300"
          >
            {advanced ? "Hide advanced" : "Advanced"}
          </button>
        </div>
      </div>
      {locError ? <div className="text-[11px] font-semibold text-red-700">{locError}</div> : null}

      <Field label="Full address" disabled={disabled}>
        <textarea
          value={value.address}
          onChange={(e) => set({ address: e.target.value })}
          disabled={disabled}
          className={textareaClass(disabled)}
          rows={2}
          placeholder="Street, building, city, country"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Allowed radius (meters)" disabled={disabled} error={errors.allowedRadiusMeters}>
          <input
            value={value.allowedRadiusMeters ?? ""}
            onChange={(e) => set({ allowedRadiusMeters: e.target.value === "" ? null : Number(e.target.value) })}
            disabled={disabled}
            className={inputClass(disabled, Boolean(errors.allowedRadiusMeters))}
            placeholder="100"
            inputMode="numeric"
          />
        </Field>
        <div className="sm:col-span-2 text-[11px] text-slate-500 font-semibold leading-relaxed">
          Click the map to place the workplace marker, or drag the marker to fine-tune. The circle reflects the allowed check-in radius.
        </div>
      </div>

      {advanced ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Latitude (advanced)" disabled={disabled} error={errors.latitude}>
            <input
              value={value.latitude ?? ""}
              onChange={(e) => set({ latitude: e.target.value === "" ? null : Number(e.target.value) })}
              disabled={disabled}
              className={inputClass(disabled, Boolean(errors.latitude))}
              placeholder="-1.286389"
              inputMode="decimal"
            />
          </Field>
          <Field label="Longitude (advanced)" disabled={disabled} error={errors.longitude}>
            <input
              value={value.longitude ?? ""}
              onChange={(e) => set({ longitude: e.target.value === "" ? null : Number(e.target.value) })}
              disabled={disabled}
              className={inputClass(disabled, Boolean(errors.longitude))}
              placeholder="36.817223"
              inputMode="decimal"
            />
          </Field>
        </div>
      ) : null}
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

function textareaClass(disabled: boolean) {
  return [
    "w-full px-3.5 py-2.5 rounded-xl border font-semibold text-xs transition-all focus:outline-none",
    disabled ? "bg-slate-50 text-slate-400 border-slate-200/60" : "bg-slate-50 focus:bg-white text-slate-700 border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]",
  ].join(" ");
}

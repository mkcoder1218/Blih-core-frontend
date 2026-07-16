import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import type { BusinessAttendanceSettings, UpsertBusinessAttendanceSettingsRequest, WeekendWorkMode } from "../../api/types";
import { useAttendanceSettings } from "../../hooks/useAttendanceSettings";
import { useMe } from "../../hooks/useMe";
import { useUpsertAttendanceSettings } from "../../hooks/useUpsertAttendanceSettings";

type Props = {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
};

export default function AttendanceSettingsTab({ showAlert }: Props) {
  const me = useMe();
  const businessId = me.data?.data?.business?.id || me.data?.data?.user?.businessId || null;
  const attendanceSettings = useAttendanceSettings(businessId, Boolean(businessId));
  const saveAttendanceSettings = useUpsertAttendanceSettings();
  const [weekendDraft, setWeekendDraft] = useState<{ saturdayWorkMode: WeekendWorkMode; sundayWorkMode: WeekendWorkMode }>({
    saturdayWorkMode: "PAID_DAY_OFF",
    sundayWorkMode: "PAID_DAY_OFF",
  });

  const currentAttendanceSettings = attendanceSettings.data?.data?.attendanceSettings as BusinessAttendanceSettings | undefined;
  const weekendDirty = useMemo(
    () =>
      weekendDraft.saturdayWorkMode !== (currentAttendanceSettings?.saturdayWorkMode || "PAID_DAY_OFF") ||
      weekendDraft.sundayWorkMode !== (currentAttendanceSettings?.sundayWorkMode || "PAID_DAY_OFF"),
    [currentAttendanceSettings?.saturdayWorkMode, currentAttendanceSettings?.sundayWorkMode, weekendDraft.saturdayWorkMode, weekendDraft.sundayWorkMode]
  );

  useEffect(() => {
    if (!currentAttendanceSettings) return;
    setWeekendDraft({
      saturdayWorkMode: currentAttendanceSettings.saturdayWorkMode || "PAID_DAY_OFF",
      sundayWorkMode: currentAttendanceSettings.sundayWorkMode || "PAID_DAY_OFF",
    });
  }, [currentAttendanceSettings?.id, currentAttendanceSettings?.saturdayWorkMode, currentAttendanceSettings?.sundayWorkMode]);

  const handleSaveWeekendSchedule = async () => {
    if (!businessId) {
      showAlert("No business workspace is selected.", "error");
      return;
    }

    try {
      await saveAttendanceSettings.mutateAsync({
        businessId,
        data: buildAttendanceSettingsPayload(currentAttendanceSettings, weekendDraft),
      });
      showAlert("Weekend work schedule saved.", "success");
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Failed to save weekend work schedule.", "error");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,760px)_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">Weekend Work Schedule</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Paid days off are included in paid working-day calculations but do not require attendance check-ins.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <WeekendModeControl
            label="Saturday"
            value={weekendDraft.saturdayWorkMode}
            disabled={attendanceSettings.isLoading || saveAttendanceSettings.isPending}
            onChange={(saturdayWorkMode) => setWeekendDraft((draft) => ({ ...draft, saturdayWorkMode }))}
          />
          <WeekendModeControl
            label="Sunday"
            value={weekendDraft.sundayWorkMode}
            disabled={attendanceSettings.isLoading || saveAttendanceSettings.isPending}
            onChange={(sundayWorkMode) => setWeekendDraft((draft) => ({ ...draft, sundayWorkMode }))}
          />
        </div>

        <div className="mt-4 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSaveWeekendSchedule}
            disabled={!businessId || attendanceSettings.isLoading || saveAttendanceSettings.isPending || !weekendDirty}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            <Save className="h-4 w-4" /> {saveAttendanceSettings.isPending ? "Saving..." : "Save Weekend Schedule"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-xs leading-6 text-slate-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-200">
        <h3 className="text-sm font-bold text-slate-950 dark:text-white">How weekend rules apply</h3>
        <p className="mt-2">
          Paid days off count in paid scheduled-day totals, but employees are not marked absent or penalized for missing punches.
        </p>
        <p className="mt-2">
          Half working days use half of the configured daily expected hours. Full working days use normal attendance and penalty rules.
        </p>
      </section>
    </div>
  );
}

function buildAttendanceSettingsPayload(
  settings: BusinessAttendanceSettings | undefined,
  weekend: { saturdayWorkMode: WeekendWorkMode; sundayWorkMode: WeekendWorkMode }
): UpsertBusinessAttendanceSettingsRequest {
  return {
    attendanceEnabled: settings?.attendanceEnabled ?? false,
    locationName: settings?.locationName ?? null,
    address: settings?.address ?? null,
    latitude: settings?.latitude ?? null,
    longitude: settings?.longitude ?? null,
    allowedRadiusMeters: settings?.allowedRadiusMeters ?? 100,
    timezone: settings?.timezone || "Africa/Nairobi",
    expectedDailyMinutes: settings?.expectedDailyMinutes ?? 480,
    defaultStartTime: settings?.defaultStartTime || "09:00",
    defaultEndTime: settings?.defaultEndTime || "17:00",
    lateGracePeriodMinutes: settings?.lateGracePeriodMinutes ?? 0,
    lateNoReasonPenaltyGraceMinutes: settings?.lateNoReasonPenaltyGraceMinutes ?? 0,
    lunchBreakEnabled: settings?.lunchBreakEnabled ?? true,
    lunchMode: settings?.lunchMode || "FLEXIBLE",
    fixedLunchStartTime: settings?.fixedLunchStartTime ?? "12:00",
    fixedLunchEndTime: settings?.fixedLunchEndTime ?? "13:00",
    allowMultipleLunchBreaks: settings?.allowMultipleLunchBreaks ?? false,
    saturdayWorkMode: weekend.saturdayWorkMode || "PAID_DAY_OFF",
    sundayWorkMode: weekend.sundayWorkMode || "PAID_DAY_OFF",
  };
}

function WeekendModeControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: WeekendWorkMode;
  disabled: boolean;
  onChange: (mode: WeekendWorkMode) => void;
}) {
  const options: Array<{ value: WeekendWorkMode; label: string; description: string }> = [
    { value: "PAID_DAY_OFF", label: "Paid day off", description: "Paid, no check-ins required" },
    { value: "HALF_WORKING_DAY", label: "Half working day", description: "Half of daily expected hours" },
    { value: "FULL_WORKING_DAY", label: "Full working day", description: "Normal attendance rules" },
  ];

  return (
    <div>
      <div className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">{label}</div>
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs transition ${
              value === option.value
                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <span>
              <span className="block font-bold">{option.label}</span>
              <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{option.description}</span>
            </span>
            <input
              type="radio"
              name={`attendance-settings-${label.toLowerCase()}`}
              value={option.value}
              checked={value === option.value}
              disabled={disabled}
              onChange={(event) => onChange((event.currentTarget?.value || "PAID_DAY_OFF") as WeekendWorkMode)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-600"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

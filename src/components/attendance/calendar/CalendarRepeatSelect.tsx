import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Repeat2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  WEEKDAYS,
  buildRecurrenceRule,
  createDefaultRecurrence,
  getRecurrenceLabel,
  getWeekdayCode,
  parseRecurrenceRule,
  sortWeekdays,
  type CalendarRecurrenceValue,
  type RecurrenceFrequency,
  type RecurrenceUnit,
} from "./calendar-recurrence";

interface CalendarRepeatSelectProps {
  startAt: string;
  value?: string | null;
  disabled?: boolean;
  onChange: (rule: string | null) => void;
}

const QUICK_OPTIONS: Array<{
  value: RecurrenceFrequency;
  label: string;
}> = [
  {
    value: "NONE",
    label: "Does not repeat",
  },
  {
    value: "DAILY",
    label: "Daily",
  },
  {
    value: "WEEKLY",
    label: "Weekly",
  },
  {
    value: "MONTHLY",
    label: "Monthly",
  },
  {
    value: "YEARLY",
    label: "Annually",
  },
  {
    value: "WEEKDAYS",
    label: "Every weekday (Monday to Friday)",
  },
];

export function CalendarRepeatSelect({
  startAt,
  value,
  disabled = false,
  onChange,
}: CalendarRepeatSelectProps) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] =
    useState<CalendarRecurrenceValue>(() =>
      parseRecurrenceRule(value, startAt),
    );

  useEffect(() => {
    setDraft(parseRecurrenceRule(value, startAt));
  }, [value, startAt]);

  const current = useMemo(
    () => parseRecurrenceRule(value, startAt),
    [startAt, value],
  );

  const label = getRecurrenceLabel(current, startAt);

  const applyQuickOption = (
    frequency: RecurrenceFrequency,
  ) => {
    const next = createDefaultRecurrence(startAt);

    next.frequency = frequency;

    if (frequency === "WEEKLY") {
      next.unit = "WEEKLY";
      next.weekdays = [getWeekdayCode(startAt)];
    }

    if (frequency === "DAILY") {
      next.unit = "DAILY";
    }

    if (frequency === "MONTHLY") {
      next.unit = "MONTHLY";
    }

    if (frequency === "YEARLY") {
      next.unit = "YEARLY";
    }

    if (frequency === "WEEKDAYS") {
      next.unit = "WEEKLY";
      next.weekdays = ["MO", "TU", "WE", "TH", "FR"];
    }

    setDraft(next);
    onChange(buildRecurrenceRule(next, startAt));
    setOpen(false);
  };

  const openCustom = () => {
    const parsed = parseRecurrenceRule(value, startAt);

    setDraft({
      ...parsed,
      frequency: "CUSTOM",
      interval: Math.max(1, parsed.interval),
      unit:
        parsed.frequency === "NONE"
          ? "WEEKLY"
          : parsed.unit,
      weekdays:
        parsed.weekdays.length > 0
          ? parsed.weekdays
          : [getWeekdayCode(startAt)],
    });

    setOpen(false);
    setCustomOpen(true);
  };

  const toggleWeekday = (weekday: string) => {
    setDraft((previous) => {
      const alreadySelected =
        previous.weekdays.includes(weekday);

      const weekdays = alreadySelected
        ? previous.weekdays.filter(
            (entry) => entry !== weekday,
          )
        : [...previous.weekdays, weekday];

      return {
        ...previous,
        weekdays: sortWeekdays(weekdays),
      };
    });
  };

  const saveCustom = () => {
    const safeDraft = {
      ...draft,
      frequency: "CUSTOM" as const,
      interval: Math.max(1, draft.interval),
      count: Math.max(1, draft.count),
      weekdays:
        draft.unit === "WEEKLY" &&
        draft.weekdays.length === 0
          ? [getWeekdayCode(startAt)]
          : draft.weekdays,
    };

    onChange(buildRecurrenceRule(safeDraft, startAt));
    setDraft(safeDraft);
    setCustomOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((previous) => !previous)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Repeat2 className="h-4 w-4 shrink-0 text-slate-400" />

            <span className="truncate">
              {label}
            </span>
          </span>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close repeat options"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
            />

            <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
              {QUICK_OPTIONS.map((option) => {
                const optionDraft =
                  createDefaultRecurrence(startAt);

                optionDraft.frequency = option.value;

                const selected =
                  current.frequency === option.value;

                let optionLabel = option.label;

                if (option.value === "WEEKLY") {
                  optionLabel = `Weekly on ${new Date(
                    startAt,
                  ).toLocaleDateString(undefined, {
                    weekday: "long",
                  })}`;
                }

                if (option.value === "MONTHLY") {
                  optionLabel = `Monthly on day ${
                    new Date(startAt).getDate() || 1
                  }`;
                }

                if (option.value === "YEARLY") {
                  optionLabel = `Annually on ${new Date(
                    startAt,
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}`;
                }

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      applyQuickOption(option.value)
                    }
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <span>{optionLabel}</span>

                    {selected && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                );
              })}

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={openCustom}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <CalendarDays className="h-4 w-4 text-slate-400" />
                Custom…
              </button>
            </div>
          </>
        )}
      </div>

      {customOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4">
          <button
            type="button"
            aria-label="Close custom recurrence"
            className="absolute inset-0 cursor-default"
            onClick={() => setCustomOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  Custom recurrence
                </h3>

                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Choose how often this event repeats.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Repeat every
                </label>

                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={draft.interval}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        interval: Math.max(
                          1,
                          Number(event.currentTarget.value || 1),
                        ),
                      }))
                    }
                  />

                  <select
                    value={draft.unit}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        unit: event.currentTarget
                          .value as RecurrenceUnit,
                      }))
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="DAILY">Days</option>
                    <option value="WEEKLY">Weeks</option>
                    <option value="MONTHLY">Months</option>
                    <option value="YEARLY">Years</option>
                  </select>
                </div>
              </div>

              {draft.unit === "WEEKLY" && (
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    Repeat on
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((weekday) => {
                      const selected =
                        draft.weekdays.includes(
                          weekday.value,
                        );

                      return (
                        <button
                          key={weekday.value}
                          type="button"
                          onClick={() =>
                            toggleWeekday(weekday.value)
                          }
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {weekday.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Ends
                </label>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      checked={draft.endType === "NEVER"}
                      onChange={() =>
                        setDraft((previous) => ({
                          ...previous,
                          endType: "NEVER",
                        }))
                      }
                    />
                    Never
                  </label>

                  <label className="grid grid-cols-[auto_1fr] items-center gap-3 text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      checked={
                        draft.endType === "ON_DATE"
                      }
                      onChange={() =>
                        setDraft((previous) => ({
                          ...previous,
                          endType: "ON_DATE",
                        }))
                      }
                    />

                    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                      <span>On</span>

                      <Input
                        type="date"
                        value={draft.endDate}
                        disabled={
                          draft.endType !== "ON_DATE"
                        }
                        onChange={(event) =>
                          setDraft((previous) => ({
                            ...previous,
                            endDate:
                              event.currentTarget.value,
                          }))
                        }
                      />
                    </div>
                  </label>

                  <label className="grid grid-cols-[auto_1fr] items-center gap-3 text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      checked={
                        draft.endType === "AFTER_COUNT"
                      }
                      onChange={() =>
                        setDraft((previous) => ({
                          ...previous,
                          endType: "AFTER_COUNT",
                        }))
                      }
                    />

                    <div className="grid grid-cols-[auto_90px_auto] items-center gap-3">
                      <span>After</span>

                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={draft.count}
                        disabled={
                          draft.endType !== "AFTER_COUNT"
                        }
                        onChange={(event) =>
                          setDraft((previous) => ({
                            ...previous,
                            count: Math.max(
                              1,
                              Number(
                                event.currentTarget.value ||
                                  1,
                              ),
                            ),
                          }))
                        }
                      />

                      <span>occurrences</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={saveCustom}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

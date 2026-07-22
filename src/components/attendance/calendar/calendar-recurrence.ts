export type RecurrenceFrequency =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "WEEKDAYS"
  | "CUSTOM";

export type RecurrenceUnit = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type RecurrenceEndType = "NEVER" | "ON_DATE" | "AFTER_COUNT";

export interface CalendarRecurrenceValue {
  frequency: RecurrenceFrequency;
  interval: number;
  unit: RecurrenceUnit;
  weekdays: string[];
  endType: RecurrenceEndType;
  endDate: string;
  count: number;
}

export const WEEKDAYS = [
  { value: "MO", label: "M" },
  { value: "TU", label: "T" },
  { value: "WE", label: "W" },
  { value: "TH", label: "T" },
  { value: "FR", label: "F" },
  { value: "SA", label: "S" },
  { value: "SU", label: "S" },
] as const;

const JS_DAY_TO_RRULE = [
  "SU",
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
] as const;

const RRULE_TO_JS_DAY: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export function getWeekdayCode(dateValue: string | Date): string {
  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "MO";
  }

  return JS_DAY_TO_RRULE[date.getDay()];
}

export function createDefaultRecurrence(
  startAt?: string,
): CalendarRecurrenceValue {
  return {
    frequency: "NONE",
    interval: 1,
    unit: "WEEKLY",
    weekdays: startAt
      ? [getWeekdayCode(startAt)]
      : ["MO"],
    endType: "NEVER",
    endDate: "",
    count: 10,
  };
}

function normalizeRule(rule?: string | null): string {
  if (!rule) {
    return "";
  }

  const lines = rule
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rruleLine = lines.find((line) =>
    line.toUpperCase().startsWith("RRULE:"),
  );

  return rruleLine || lines[0] || "";
}

function parseParts(rule?: string | null): Record<string, string> {
  const normalized = normalizeRule(rule).replace(/^RRULE:/i, "");

  if (!normalized) {
    return {};
  }

  return normalized
    .split(";")
    .reduce<Record<string, string>>((result, part) => {
      const [rawKey, ...rawValue] = part.split("=");

      if (!rawKey || rawValue.length === 0) {
        return result;
      }

      result[rawKey.toUpperCase()] = rawValue.join("=");

      return result;
    }, {});
}

function toDateInput(value?: string): string {
  if (!value || !/^\d{8}(T\d{6}Z?)?$/.test(value)) {
    return "";
  }

  return [
    value.slice(0, 4),
    value.slice(4, 6),
    value.slice(6, 8),
  ].join("-");
}

export function parseRecurrenceRule(
  rule?: string | null,
  startAt?: string,
): CalendarRecurrenceValue {
  const fallback = createDefaultRecurrence(startAt);
  const parts = parseParts(rule);

  if (!parts.FREQ) {
    return fallback;
  }

  const interval = Math.max(
    1,
    Number(parts.INTERVAL || 1),
  );

  const weekdays = parts.BYDAY
    ? parts.BYDAY.split(",").filter(Boolean)
    : startAt
      ? [getWeekdayCode(startAt)]
      : ["MO"];

  let frequency: RecurrenceFrequency = "CUSTOM";

  if (
    parts.FREQ === "DAILY" &&
    parts.BYDAY === "MO,TU,WE,TH,FR" &&
    interval === 1
  ) {
    frequency = "WEEKDAYS";
  } else if (
    parts.FREQ === "DAILY" &&
    interval === 1 &&
    !parts.BYDAY
  ) {
    frequency = "DAILY";
  } else if (
    parts.FREQ === "WEEKLY" &&
    interval === 1
  ) {
    frequency = "WEEKLY";
  } else if (
    parts.FREQ === "MONTHLY" &&
    interval === 1
  ) {
    frequency = "MONTHLY";
  } else if (
    parts.FREQ === "YEARLY" &&
    interval === 1
  ) {
    frequency = "YEARLY";
  }

  let endType: RecurrenceEndType = "NEVER";

  if (parts.COUNT) {
    endType = "AFTER_COUNT";
  } else if (parts.UNTIL) {
    endType = "ON_DATE";
  }

  return {
    frequency,
    interval,
    unit: parts.FREQ as RecurrenceUnit,
    weekdays,
    endType,
    endDate: toDateInput(parts.UNTIL),
    count: Math.max(1, Number(parts.COUNT || 10)),
  };
}

function formatUntilDate(dateValue: string): string | null {
  if (!dateValue) {
    return null;
  }

  const date = new Date(`${dateValue}T23:59:59.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function getRuleFrequency(
  value: CalendarRecurrenceValue,
): RecurrenceUnit {
  if (value.frequency === "DAILY") {
    return "DAILY";
  }

  if (
    value.frequency === "WEEKLY" ||
    value.frequency === "WEEKDAYS"
  ) {
    return "WEEKLY";
  }

  if (value.frequency === "MONTHLY") {
    return "MONTHLY";
  }

  if (value.frequency === "YEARLY") {
    return "YEARLY";
  }

  return value.unit;
}

export function buildRecurrenceRule(
  value: CalendarRecurrenceValue,
  startAt: string,
): string | null {
  if (value.frequency === "NONE") {
    return null;
  }

  const frequency = getRuleFrequency(value);
  const parts = [`FREQ=${frequency}`];

  const interval =
    value.frequency === "CUSTOM"
      ? Math.max(1, value.interval)
      : 1;

  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  if (value.frequency === "WEEKDAYS") {
    parts.push("BYDAY=MO,TU,WE,TH,FR");
  } else if (
    frequency === "WEEKLY" &&
    value.frequency !== "DAILY"
  ) {
    const weekdays =
      value.weekdays.length > 0
        ? value.weekdays
        : [getWeekdayCode(startAt)];

    parts.push(`BYDAY=${weekdays.join(",")}`);
  }

  if (
    value.endType === "ON_DATE" &&
    value.endDate
  ) {
    const until = formatUntilDate(value.endDate);

    if (until) {
      parts.push(`UNTIL=${until}`);
    }
  }

  if (value.endType === "AFTER_COUNT") {
    parts.push(
      `COUNT=${Math.max(1, value.count || 1)}`,
    );
  }

  return `RRULE:${parts.join(";")}`;
}

function weekdayName(code: string): string {
  const names: Record<string, string> = {
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
    SU: "Sunday",
  };

  return names[code] || code;
}

export function getRecurrenceLabel(
  value: CalendarRecurrenceValue,
  startAt: string,
): string {
  if (value.frequency === "NONE") {
    return "Does not repeat";
  }

  if (value.frequency === "DAILY") {
    return "Daily";
  }

  if (value.frequency === "WEEKDAYS") {
    return "Every weekday (Monday to Friday)";
  }

  if (value.frequency === "WEEKLY") {
    return `Weekly on ${weekdayName(
      value.weekdays[0] || getWeekdayCode(startAt),
    )}`;
  }

  if (value.frequency === "MONTHLY") {
    const date = new Date(startAt);

    return Number.isNaN(date.getTime())
      ? "Monthly"
      : `Monthly on day ${date.getDate()}`;
  }

  if (value.frequency === "YEARLY") {
    const date = new Date(startAt);

    return Number.isNaN(date.getTime())
      ? "Annually"
      : `Annually on ${date.toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric",
          },
        )}`;
  }

  const unitLabel =
    value.unit === "DAILY"
      ? "day"
      : value.unit === "WEEKLY"
        ? "week"
        : value.unit === "MONTHLY"
          ? "month"
          : "year";

  return `Every ${value.interval} ${unitLabel}${
    value.interval === 1 ? "" : "s"
  }`;
}

export function getRRuleForFullCalendar(
  rule?: string | null,
  startAt?: string,
): string | undefined {
  const normalized = normalizeRule(rule);

  if (!normalized || !startAt) {
    return undefined;
  }

  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const dtStart = date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return `DTSTART:${dtStart}\n${normalized}`;
}

export function getEventDuration(
  startAt: string,
  endAt: string,
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const durationMs = Math.max(
    15 * 60_000,
    end.getTime() - start.getTime(),
  );

  const totalMinutes = Math.round(durationMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")}:00`;
}

export function sortWeekdays(
  weekdays: string[],
): string[] {
  return [...weekdays].sort(
    (left, right) =>
      (RRULE_TO_JS_DAY[left] ?? 7) -
      (RRULE_TO_JS_DAY[right] ?? 7),
  );
}

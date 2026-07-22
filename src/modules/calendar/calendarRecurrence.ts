const VALID_FREQUENCIES = new Set([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

const VALID_WEEKDAYS = new Set([
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
  "SU",
]);

const ALLOWED_KEYS = new Set([
  "FREQ",
  "INTERVAL",
  "BYDAY",
  "BYMONTHDAY",
  "COUNT",
  "UNTIL",
]);

function createBadRequest(message: string) {
  return Object.assign(new Error(message), {
    statusCode: 400,
  });
}

function extractRule(value: string): string {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const ruleLine = lines.find((line) =>
    line.toUpperCase().startsWith("RRULE:"),
  );

  return (ruleLine || lines[0] || "")
    .replace(/^RRULE:/i, "")
    .toUpperCase();
}

export function normalizeRecurrenceRule(
  value: unknown,
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw createBadRequest(
      "recurrenceRule must be an RRULE string.",
    );
  }

  const normalized = extractRule(value);

  if (!normalized) {
    return null;
  }

  if (normalized.length > 1000) {
    throw createBadRequest(
      "recurrenceRule is too long.",
    );
  }

  const parsed = new Map<string, string>();
  const parts = normalized.split(";");

  for (const part of parts) {
    const [rawKey, ...rawValueParts] = part.split("=");
    const key = rawKey?.trim();
    const partValue = rawValueParts.join("=").trim();

    if (!key || !partValue) {
      throw createBadRequest(
        "recurrenceRule contains an invalid option.",
      );
    }

    if (!ALLOWED_KEYS.has(key)) {
      throw createBadRequest(
        `Unsupported recurrence option: ${key}.`,
      );
    }

    if (parsed.has(key)) {
      throw createBadRequest(
        `Duplicate recurrence option: ${key}.`,
      );
    }

    parsed.set(key, partValue);
  }

  const frequency = parsed.get("FREQ");

  if (
    !frequency ||
    !VALID_FREQUENCIES.has(frequency)
  ) {
    throw createBadRequest(
      "Recurrence frequency must be DAILY, WEEKLY, MONTHLY, or YEARLY.",
    );
  }

  const interval = Number(parsed.get("INTERVAL") || 1);

  if (
    !Number.isInteger(interval) ||
    interval < 1 ||
    interval > 365
  ) {
    throw createBadRequest(
      "Recurrence interval must be between 1 and 365.",
    );
  }

  const countValue = parsed.get("COUNT");

  if (countValue) {
    const count = Number(countValue);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 999
    ) {
      throw createBadRequest(
        "Recurrence count must be between 1 and 999.",
      );
    }
  }

  const until = parsed.get("UNTIL");

  if (
    until &&
    !/^\d{8}(T\d{6}Z?)?$/.test(until)
  ) {
    throw createBadRequest(
      "Recurrence end date is invalid.",
    );
  }

  if (countValue && until) {
    throw createBadRequest(
      "Use COUNT or UNTIL, not both.",
    );
  }

  const byDay = parsed.get("BYDAY");

  if (byDay) {
    const days = byDay.split(",");

    if (
      days.length === 0 ||
      days.some((day) => !VALID_WEEKDAYS.has(day))
    ) {
      throw createBadRequest(
        "Recurrence weekdays are invalid.",
      );
    }
  }

  const byMonthDay = parsed.get("BYMONTHDAY");

  if (byMonthDay) {
    const day = Number(byMonthDay);

    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 31
    ) {
      throw createBadRequest(
        "Monthly recurrence day must be between 1 and 31.",
      );
    }
  }

  return `RRULE:${parts.join(";")}`;
}

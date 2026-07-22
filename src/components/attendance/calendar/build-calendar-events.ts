import { RRule } from "rrule";

import type { UserCalendarEvent } from "../../../api/calendar";

export interface FullCalendarEventRow {
  id: string;
  groupId: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  editable: boolean;
  startEditable: boolean;
  durationEditable: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
  extendedProps: {
    item: UserCalendarEvent;
    masterEventId: string;
    occurrenceStartAt?: string;
    occurrenceEndAt?: string;
  };
}

interface BuildCalendarEventsOptions {
  readOnly: boolean;
  rangeStart?: Date;
  rangeEnd?: Date;
}

function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA < endB && endA > startB;
}

function itemColor(item: UserCalendarEvent) {
  if (item.availabilityStatus === "UNAVAILABLE") {
    return item.color || "#dc2626";
  }

  if (item.itemType === "TASK") {
    return item.color || "#7c3aed";
  }

  if (item.itemType === "MEETING") {
    return item.color || "#2563eb";
  }

  if (item.itemType === "AVAILABILITY") {
    return item.color || "#059669";
  }

  return item.color || "#1a56db";
}

function removeRRulePrefix(rule: string) {
  return rule
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.toUpperCase().startsWith("RRULE:"))
    ?.replace(/^RRULE:/i, "");
}

function defaultRangeStart() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  date.setHours(0, 0, 0, 0);

  return date;
}

function defaultRangeEnd() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 2);
  date.setHours(23, 59, 59, 999);

  return date;
}

function getDurationMs(item: UserCalendarEvent) {
  const start = new Date(item.startAt);
  const end = new Date(item.endAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return 60 * 60_000;
  }

  return end.getTime() - start.getTime();
}

function overlapOffset(
  item: UserCalendarEvent,
  rows: UserCalendarEvent[],
) {
  const itemStart = new Date(item.startAt);
  const itemEnd = new Date(item.endAt);

  const overlapRank = rows
    .filter((other) => other.id !== item.id)
    .filter((other) =>
      rangesOverlap(
        itemStart,
        itemEnd,
        new Date(other.startAt),
        new Date(other.endAt),
      ),
    )
    .filter(
      (other) =>
        new Date(other.startAt).getTime() <= itemStart.getTime(),
    ).length;

  return overlapRank ? Math.min(2, overlapRank) : 0;
}

function eventTitle(item: UserCalendarEvent) {
  const pendingMeeting =
    item.itemType === "MEETING" &&
    item.metadata?.meetingStatus === "PENDING";

  return `${
    pendingMeeting
      ? "Pending: "
      : item.itemType === "TASK"
        ? "Task: "
        : ""
  }${item.title}`;
}

function buildBaseEvent(
  item: UserCalendarEvent,
  rows: UserCalendarEvent[],
  readOnly: boolean,
) {
  const pendingMeeting =
    item.itemType === "MEETING" &&
    item.metadata?.meetingStatus === "PENDING";

  const color = pendingMeeting
    ? "#f59e0b"
    : itemColor(item);

  const recurring = Boolean(
    item.recurrenceRule &&
      item.isRecurring &&
      !item.isRecurringInstance,
  );

  const editable =
    !readOnly &&
    !item.readOnly &&
    !item.isRecurringInstance &&
    !recurring;

  return {
    groupId: item.id,
    title: eventTitle(item),
    allDay: item.allDay,
    editable,
    startEditable: editable,
    durationEditable: editable,
    backgroundColor: color,
    borderColor: color,
    textColor: "#ffffff",
    classNames: [
      `blih-overlap-offset-${overlapOffset(item, rows)}`,
      recurring ? "blih-recurring-calendar-event" : "",
    ].filter(Boolean),
  };
}

function buildNormalEvent(
  item: UserCalendarEvent,
  rows: UserCalendarEvent[],
  readOnly: boolean,
): FullCalendarEventRow {
  return {
    ...buildBaseEvent(item, rows, readOnly),
    id: item.id,
    start: item.startAt,
    end: item.endAt,
    extendedProps: {
      item,
      masterEventId: item.id,
    },
  };
}

function buildRecurringEvents(
  item: UserCalendarEvent,
  rows: UserCalendarEvent[],
  options: BuildCalendarEventsOptions,
): FullCalendarEventRow[] {
  const rawRule = removeRRulePrefix(item.recurrenceRule || "");

  if (!rawRule) {
    return [buildNormalEvent(item, rows, options.readOnly)];
  }

  const masterStart = new Date(item.startAt);

  if (Number.isNaN(masterStart.getTime())) {
    return [buildNormalEvent(item, rows, options.readOnly)];
  }

  try {
    const parsedOptions = RRule.parseString(rawRule);

    const rule = new RRule({
      ...parsedOptions,
      dtstart: masterStart,
    });

    const rangeStart =
      options.rangeStart || defaultRangeStart();

    const rangeEnd =
      options.rangeEnd || defaultRangeEnd();

    const durationMs = getDurationMs(item);

    return rule
      .between(rangeStart, rangeEnd, true)
      .map((occurrenceStart) => {
        const occurrenceEnd = new Date(
          occurrenceStart.getTime() + durationMs,
        );

        const occurrenceItem: UserCalendarEvent = {
          ...item,
          startAt: occurrenceStart.toISOString(),
          endAt: occurrenceEnd.toISOString(),
          isRecurring: true,
          isRecurringInstance: true,
          metadata: {
            ...(item.metadata || {}),
            recurrenceMasterId: item.id,
            generatedOccurrence: true,
          },
        };

        return {
          ...buildBaseEvent(item, rows, options.readOnly),

          /*
           * Generated occurrences edit the recurring master through
           * the details dialog. Dragging is disabled until we add
           * "this event / this and following / whole series".
           */
          editable: false,
          startEditable: false,
          durationEditable: false,

          id: `${item.id}:${occurrenceStart.toISOString()}`,
          start: occurrenceStart.toISOString(),
          end: occurrenceEnd.toISOString(),

          extendedProps: {
            item: occurrenceItem,
            masterEventId: item.id,
            occurrenceStartAt: occurrenceStart.toISOString(),
            occurrenceEndAt: occurrenceEnd.toISOString(),
          },
        };
      });
  } catch (error) {
    console.error(
      `[Calendar] Invalid recurrence rule for event ${item.id}:`,
      item.recurrenceRule,
      error,
    );

    return [buildNormalEvent(item, rows, options.readOnly)];
  }
}

export function buildCalendarEvents(
  rows: UserCalendarEvent[],
  options: BuildCalendarEventsOptions,
): FullCalendarEventRow[] {
  return rows.flatMap((item) => {
    const recurringMaster =
      Boolean(item.recurrenceRule) &&
      Boolean(item.isRecurring) &&
      !item.isRecurringInstance;

    if (recurringMaster) {
      return buildRecurringEvents(item, rows, options);
    }

    return [
      buildNormalEvent(
        item,
        rows,
        options.readOnly,
      ),
    ];
  });
}

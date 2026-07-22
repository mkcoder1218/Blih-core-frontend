import type { ComponentType } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Loader2 } from "lucide-react";

import type { UserCalendarEvent } from "../../../api/calendar";

const FullCalendarView =
  FullCalendar as unknown as ComponentType<any>;

interface CalendarCanvasProps {
  events: any[];
  loading: boolean;
  readOnly?: boolean;
  selectable?: boolean;
  editable?: boolean;
  onSelect?: (info: any) => void;
  onDateClick?: (info: any) => void;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  onEventClick?: (
    item: UserCalendarEvent,
    x: number,
    y: number,
    masterEventId: string,
  ) => void;
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

function MonthEventIndicator({
  item,
}: {
  item: UserCalendarEvent;
}) {
  return (
    <span className="blih-month-event-indicator">
      <span
        className="blih-month-event-dot"
        style={{
          backgroundColor: itemColor(item),
        }}
      />

      <span className="blih-month-event-title">
        {item.title}
      </span>
    </span>
  );
}

function CalendarEventBlock({
  title,
  timeText,
}: {
  title: string;
  timeText?: string;
}) {
  return (
    <span className="blih-calendar-event-block">
      {timeText && (
        <span className="blih-calendar-event-time">
          {timeText}
        </span>
      )}

      <span className="blih-calendar-event-title">
        {title}
      </span>
    </span>
  );
}

export function CalendarCanvas({
  events,
  loading,
  readOnly,
  selectable,
  editable,
  onSelect,
  onDateClick,
  onEventDrop,
  onEventResize,
  onEventClick,
}: CalendarCanvasProps) {
  const canEdit = editable ?? !readOnly;

  return (
    <div className="blih-events-calendar blih-layered-overlap-calendar rounded-xl border border-slate-200 bg-white p-2 shadow-none sm:rounded-2xl sm:border-slate-100 sm:p-5 sm:shadow-2xs">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-xs font-bold text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading calendar...
        </div>
      ) : (
        <FullCalendarView
          /*
           * Do not add @fullcalendar/rrule here.
           * Recurrence is expanded by build-calendar-events.ts.
           */
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView={
            readOnly
              ? "timeGridDay"
              : "timeGridWeek"
          }
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: readOnly
              ? "timeGridDay,listWeek"
              : "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            list: "List",
          }}
          events={events}
          selectable={selectable ?? !readOnly}
          editable={canEdit}
          eventResizableFromStart={canEdit}
          eventStartEditable={canEdit}
          eventDurationEditable={canEdit}
          snapDuration="00:15:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          selectOverlap
          eventOverlap
          slotEventOverlap
          nowIndicator
          selectMirror
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          height="auto"
          dayMaxEvents={3}
          moreLinkClick="popover"
          select={onSelect}
          dateClick={onDateClick}
          eventDrop={onEventDrop}
          eventResize={onEventResize}
          eventContent={(info: any) => {
            const item =
              info.event.extendedProps
                .item as UserCalendarEvent;

            if (info.view.type === "dayGridMonth") {
              return (
                <MonthEventIndicator item={item} />
              );
            }

            return (
              <CalendarEventBlock
                title={info.event.title}
                timeText={info.timeText}
              />
            );
          }}
          eventDidMount={(info: any) => {
            const start =
              info.event.start?.getTime() || 0;

            const end =
              info.event.end?.getTime() ||
              start + 30 * 60_000;

            const durationMinutes = Math.max(
              1,
              Math.round(
                (end - start) / 60_000,
              ),
            );

            const laterStartWeight = Math.round(
              (start % 86_400_000) / 60_000,
            );

            const shorterEventWeight = Math.max(
              0,
              1_440 - durationMinutes,
            );

            const createdAt = new Date(
              info.event.extendedProps.item
                ?.createdAt || 0,
            ).getTime();

            const createdWeight =
              Number.isNaN(createdAt)
                ? 0
                : createdAt % 1_000;

            const harness = info.el.closest(
              ".fc-timegrid-event-harness",
            ) as HTMLElement | null;

            if (harness) {
              harness.style.zIndex = String(
                10 +
                  laterStartWeight +
                  shorterEventWeight +
                  createdWeight,
              );
            }
          }}
          eventClick={(info: any) => {
            const item =
              info.event.extendedProps
                .item as UserCalendarEvent;

            const masterEventId =
              String(
                info.event.extendedProps
                  .masterEventId ||
                  item.id,
              );

            onEventClick?.(
              item,
              info.jsEvent.clientX,
              info.jsEvent.clientY,
              masterEventId,
            );
          }}
        />
      )}
    </div>
  );
}

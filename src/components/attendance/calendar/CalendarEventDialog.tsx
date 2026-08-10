import { useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type {
  AvailabilityStatus,
  CalendarItemType,
  CalendarPerson,
  UserCalendarEvent,
} from "../../../api/calendar";
import { CalendarRepeatSelect } from "./CalendarRepeatSelect";
import { CalendarRichTextEditor } from "./CalendarRichText";

export interface CalendarEventFormState {
  id?: string;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  itemType: CalendarItemType;
  availabilityStatus: AvailabilityStatus;
  color: string;
  recurrenceRule: string | null;
  projectId: string;
  recipientUserId: string;
}

interface Props {
  open: boolean;
  form: CalendarEventFormState;
  people: CalendarPerson[];
  currentUserId?: string;
  projects: Array<{
    id: string;
    title: string;
  }>;
  overlappingEvents: UserCalendarEvent[];
  isSaving: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: CalendarEventFormState) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}

export function CalendarEventDialog({
  open,
  form,
  projects,
  overlappingEvents,
  isSaving,
  isDeleting,
  onOpenChange,
  onFormChange,
  onSave,
  onDelete,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isTask = form.itemType === "TASK";
  const isPersonalEvent = form.itemType === "EVENT";

  const update = <K extends keyof CalendarEventFormState>(
    key: K,
    value: CalendarEventFormState[K],
  ) => {
    onFormChange({
      ...form,
      [key]: value,
    });
  };

  const changeType = (itemType: CalendarItemType) => {
    const nextAvailabilityStatus =
      itemType === "AVAILABILITY" ? "UNAVAILABLE" : form.availabilityStatus;

    const nextColor =
      itemType === "TASK"
        ? "#7c3aed"
        : itemType === "AVAILABILITY"
          ? "#dc2626"
          : "#1a56db";

    onFormChange({
      ...form,
      itemType,
      recipientUserId: "",
      availabilityStatus: nextAvailabilityStatus,
      recurrenceRule: itemType === "EVENT" ? form.recurrenceRule : null,
      color: nextColor,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setAdvancedOpen(false);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-2xl overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-950">
            <CalendarClock className="h-4 w-4 text-blue-600" />
            {form.id ? "Edit calendar item" : "Create calendar item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <Input
            autoFocus
            placeholder={isTask ? "Task title" : "Add title"}
            value={form.title}
            onChange={(event) => update("title", event.currentTarget.value)}
            className="h-11 text-base font-semibold"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <select
              value={form.itemType === "MEETING" ? "EVENT" : form.itemType}
              onChange={(event) => changeType(event.currentTarget.value as CalendarItemType)}
              className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="EVENT">Event</option>
              <option value="TASK">Task</option>
              <option value="AVAILABILITY">Availability block</option>
            </select>

            {isTask ? (
              <select
                value={form.projectId}
                onChange={(event) => update("projectId", event.currentTarget.value)}
                className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500"
              >
                <option value="">Personal Tasks</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={form.availabilityStatus}
                onChange={(event) => update("availabilityStatus", event.currentTarget.value as AvailabilityStatus)}
                className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500"
              >
                <option value="AVAILABLE">Does not block availability</option>
                <option value="UNAVAILABLE">Blocks availability</option>
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-600">Starts</p>
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => update("startAt", event.currentTarget.value)}
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-600">Ends</p>
              <Input
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => update("endAt", event.currentTarget.value)}
              />
            </div>
          </div>

          {overlappingEvents.length > 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              This overlaps with {overlappingEvents.length} existing {overlappingEvents.length === 1 ? "event" : "events"}.
            </div>
          )}

          <button
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <span>{advancedOpen ? "Hide more options" : "More options"}</span>
            {advancedOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {advancedOpen && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </p>
                <Input
                  placeholder="Location or link"
                  value={form.location}
                  onChange={(event) => update("location", event.currentTarget.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <p className="mb-1.5 text-xs font-bold text-slate-600">Description</p>
                <CalendarRichTextEditor
                  value={form.description}
                  onChange={(value) => update("description", value)}
                  placeholder="Add event details…"
                />
              </div>

              {isPersonalEvent && (
                <div>
                  <p className="mb-1.5 text-xs font-bold text-slate-600">Repeat</p>
                  <CalendarRepeatSelect
                    startAt={form.startAt}
                    value={form.recurrenceRule}
                    onChange={(recurrenceRule) => update("recurrenceRule", recurrenceRule)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(event) => update("allDay", event.currentTarget.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  All-day
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  Color
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(event) => update("color", event.currentTarget.value)}
                    className="h-9 w-14 cursor-pointer bg-white p-1"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {form.id ? (
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => onDelete(form.id as string)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          ) : (
            <span />
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

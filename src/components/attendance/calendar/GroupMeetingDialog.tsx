import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Clock3,
  Loader2,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type {
  CalendarPerson,
  MeetingPayload,
  MeetingRequest,
} from "../../../api/calendar";
import {
  useCheckMeetingAvailability,
  useFindCommonMeetingTimes,
} from "../../../hooks/useUserCalendar";

interface GroupMeetingDialogProps {
  open: boolean;
  people: CalendarPerson[];
  currentUserId?: string;
  initialAttendeeIds?: string[];
  initialStartAt?: string;
  initialEndAt?: string;
  meeting?: MeetingRequest | null;
  isSaving?: boolean;
  isCancelling?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: MeetingPayload) => void | Promise<void>;
  onCancelMeeting?: () => void | Promise<void>;
}

function toLocalInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatSlot(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function meetingDurationMinutes(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 30;
  return Math.max(15, Math.min(240, Math.round((end - start) / 60_000)));
}

function buildCommonTimeWindows(startAt: string) {
  const base = startAt ? new Date(startAt) : new Date();
  const windows: Array<{ startAt: string; endAt: string }> = [];

  for (let index = 0; index < 10 && windows.length < 7; index += 1) {
    const day = new Date(base);
    day.setDate(base.getDate() + index);
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue;

    const start = new Date(day);
    start.setHours(8, 0, 0, 0);
    const end = new Date(day);
    end.setHours(18, 0, 0, 0);

    if (index === 0 && base > start && base < end) {
      start.setHours(base.getHours(), base.getMinutes() < 30 ? 30 : base.getMinutes(), 0, 0);
      if (start < base) start.setMinutes(start.getMinutes() + 30);
    }

    if (start < end) {
      windows.push({ startAt: start.toISOString(), endAt: end.toISOString() });
    }
  }

  return windows;
}

export function GroupMeetingDialog({
  open,
  people,
  currentUserId,
  initialAttendeeIds = [],
  initialStartAt,
  initialEndAt,
  meeting,
  isSaving = false,
  isCancelling = false,
  onOpenChange,
  onSubmit,
  onCancelMeeting,
}: GroupMeetingDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [attendeeUserIds, setAttendeeUserIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const availability = useCheckMeetingAvailability();
  const commonTimes = useFindCommonMeetingTimes();

  const isEditing = Boolean(meeting && !meeting.legacy);

  useEffect(() => {
    if (!open) return;

    const attendeeIds = meeting
      ? meeting.attendees
          .filter((attendee) => attendee.status !== "REMOVED")
          .map((attendee) => attendee.userId)
      : initialAttendeeIds;

    setTitle(meeting?.title || (attendeeIds.length === 1
      ? `Meeting with ${people.find((person) => person.id === attendeeIds[0])?.fullName || "team member"}`
      : ""));
    setDescription(meeting?.description || "");
    setLocation(meeting?.location || "");
    setStartAt(toLocalInput(meeting?.startAt || initialStartAt));
    setEndAt(toLocalInput(meeting?.endAt || initialEndAt));
    setAttendeeUserIds(Array.from(new Set(attendeeIds.filter((id) => id !== currentUserId))));
    setQuery("");
    setPickerOpen(false);
    availability.reset();
    commonTimes.reset();
  }, [
    open,
    meeting?.id,
    initialStartAt,
    initialEndAt,
    currentUserId,
    people,
  ]);

  const selectedPeople = useMemo(
    () => attendeeUserIds
      .map((id) => people.find((person) => person.id === id))
      .filter(Boolean) as CalendarPerson[],
    [attendeeUserIds, people],
  );

  const filteredPeople = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return people
      .filter((person) => person.id !== currentUserId)
      .filter((person) => !attendeeUserIds.includes(person.id))
      .filter((person) => !normalized || person.fullName.toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [attendeeUserIds, currentUserId, people, query]);

  const validTimes = Boolean(
    startAt &&
    endAt &&
    new Date(endAt).getTime() > new Date(startAt).getTime(),
  );

  useEffect(() => {
    if (!open || !attendeeUserIds.length || !validTimes) {
      availability.reset();
      return;
    }

    const timer = window.setTimeout(() => {
      availability.mutate({
        attendeeUserIds,
        startAt: toIso(startAt),
        endAt: toIso(endAt),
        meetingId: isEditing ? meeting?.id : undefined,
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    open,
    attendeeUserIds.join("|"),
    startAt,
    endAt,
    isEditing,
    meeting?.id,
  ]);

  const addAttendee = (id: string) => {
    if (attendeeUserIds.length >= 100) return;
    setAttendeeUserIds((current) => Array.from(new Set([...current, id])));
    setQuery("");
  };

  const removeAttendee = (id: string) => {
    setAttendeeUserIds((current) => current.filter((item) => item !== id));
  };

  const findCommonTime = async () => {
    if (!attendeeUserIds.length) return;
    const windows = buildCommonTimeWindows(startAt);
    if (!windows.length) return;

    await commonTimes.mutateAsync({
      attendeeUserIds,
      windows,
      durationMinutes: meetingDurationMinutes(startAt, endAt),
      stepMinutes: 30,
      meetingId: isEditing ? meeting?.id : undefined,
    });
  };

  const chooseSlot = (slot: { startAt: string; endAt: string }) => {
    setStartAt(toLocalInput(slot.startAt));
    setEndAt(toLocalInput(slot.endAt));
    commonTimes.reset();
  };

  const submit = async () => {
    if (!title.trim() || !attendeeUserIds.length || !validTimes) return;
    if (availability.data && !availability.data.available) return;

    await onSubmit({
      attendeeUserIds,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startAt: toIso(startAt),
      endAt: toIso(endAt),
    });
  };

  const attendeeConflictRows = availability.data?.rows.filter(
    (row) => row.role === "ATTENDEE" && !row.available,
  ) || [];
  const organizerConflict = availability.data?.rows.find(
    (row) => row.role === "ORGANIZER" && !row.available,
  );
  const canSubmit = Boolean(
    title.trim() &&
    attendeeUserIds.length &&
    validTimes &&
    !availability.isPending &&
    (!availability.data || availability.data.available),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-2xl overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-950">
            <CalendarClock className="h-4 w-4 text-blue-600" />
            {isEditing ? "Edit meeting" : "Schedule meeting"}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Invite multiple people, verify availability, and find a common time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Title</label>
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="Meeting title"
              className="h-11 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Starts</label>
              <Input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.currentTarget.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Ends</label>
              <Input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.currentTarget.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Location</label>
            <Input
              value={location}
              onChange={(event) => setLocation(event.currentTarget.value)}
              placeholder="Office, meeting room, Zoom link..."
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                Attendees
              </label>
              <span className="text-[10px] font-bold text-slate-400">{attendeeUserIds.length}/100</span>
            </div>

            {selectedPeople.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedPeople.map((person) => {
                  const existingStatus = meeting?.attendees.find((attendee) => attendee.userId === person.id)?.status;
                  return (
                    <span
                      key={person.id}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-800"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-black text-blue-700">
                        {initials(person.fullName)}
                      </span>
                      <span className="max-w-40 truncate">{person.fullName}</span>
                      {existingStatus && existingStatus !== "PENDING" && (
                        <span className="text-[9px] font-black uppercase text-blue-500">{existingStatus}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttendee(person.id)}
                        className="text-blue-400 transition hover:text-red-500"
                        aria-label={`Remove ${person.fullName}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onFocus={() => setPickerOpen(true)}
                onBlur={() => window.setTimeout(() => setPickerOpen(false), 120)}
                placeholder="Search people to invite"
                className="pl-9"
              />

              {pickerOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {filteredPeople.length ? (
                    filteredPeople.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => addAttendee(person.id)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-700">
                          {initials(person.fullName)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
                          {person.fullName}
                        </span>
                        <UserPlus className="h-4 w-4 shrink-0 text-blue-600" />
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-xs font-semibold text-slate-400">
                      No more matching people.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {attendeeUserIds.length > 0 && validTimes && (
            <div
              className={cn(
                "rounded-xl border px-3 py-3",
                availability.isPending
                  ? "border-slate-200 bg-slate-50"
                  : availability.data?.available
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-amber-200 bg-amber-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-black text-slate-800">
                    {availability.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    ) : availability.data?.available ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                    )}
                    Availability
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    {availability.isPending
                      ? "Checking everyone's calendar..."
                      : availability.data
                        ? `${availability.data.attendeeAvailableCount} available · ${availability.data.attendeeConflictCount} conflict${availability.data.attendeeConflictCount === 1 ? "" : "s"}`
                        : "Select a time to check availability."}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={commonTimes.isPending || !attendeeUserIds.length}
                  onClick={() => void findCommonTime()}
                  className="shrink-0 gap-1.5"
                >
                  {commonTimes.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Find common time
                </Button>
              </div>

              {(organizerConflict || attendeeConflictRows.length > 0) && (
                <div className="mt-2 space-y-1.5 border-t border-amber-200/70 pt-2">
                  {organizerConflict && (
                    <p className="text-[11px] font-bold text-amber-800">
                      Your calendar conflicts with “{organizerConflict.conflict?.title || "another item"}”.
                    </p>
                  )}
                  {attendeeConflictRows.map((row) => (
                    <p key={row.userId} className="text-[11px] font-bold text-amber-800">
                      {row.user?.fullName || "Attendee"} conflicts with “{row.conflict?.title || "another item"}”.
                    </p>
                  ))}
                  <p className="text-[10px] font-semibold text-amber-700">
                    Invitations cannot be sent until all conflicts are resolved.
                  </p>
                </div>
              )}
            </div>
          )}

          {commonTimes.data && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-blue-900">Common available times</p>
                <button type="button" onClick={() => commonTimes.reset()} className="text-[10px] font-bold text-blue-500">
                  Close
                </button>
              </div>
              {commonTimes.data.slots.length ? (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {commonTimes.data.slots.slice(0, 8).map((slot) => (
                    <button
                      key={slot.startAt}
                      type="button"
                      onClick={() => chooseSlot(slot)}
                      className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-[11px] font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      {formatSlot(slot.startAt)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  No common slot was found in the next seven workdays.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Description</label>
            <Textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
              placeholder="Agenda or notes..."
              className="resize-none"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {isEditing && onCancelMeeting && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || isCancelling}
                  onClick={() => void onCancelMeeting()}
                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Cancel meeting
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={isSaving || isCancelling} onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                type="button"
                disabled={!canSubmit || isSaving || isCancelling}
                onClick={() => void submit()}
                className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditing ? "Save meeting" : `Invite ${attendeeUserIds.length || ""} ${attendeeUserIds.length === 1 ? "person" : "people"}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

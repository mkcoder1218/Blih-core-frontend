import { useEffect, useMemo, useState } from "react";
import { MeetingAttendeePopover } from "./calendar/MeetingAttendeePopover";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Check,
    ChevronDown,
    Cloud,
    Edit2,
    Eye,
    Loader2,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    ShieldOff,
    Trash2,
    UserRoundCheck,
    WifiOff,
    X,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    calendarApi,
    type CalendarItemType,
    type CalendarPerson,
    type UserCalendarEvent
} from "../../api/calendar";
import { useProjects } from "../../features/projects/hooks";
import { useMe } from "../../hooks/useMe";
import {
    useCalendarPeople,
    useCreateMeetingRequest,
    useCreateUserCalendarEvent,
    useDeleteUserCalendarEvent,
    useGoogleCalendarConnection,
    useMeetingRequests,
    useRespondMeetingRequest,
    useSyncAllUserCalendarEventsToGoogle,
    useSyncUserCalendarEventToGoogle,
    useSyncUserCalendarFromGoogle,
    useUpdateUserCalendarEvent,
    useUserAvailabilityStatus,
    useUserCalendar,
} from "../../hooks/useUserCalendar";
import { CalendarCanvas } from "./calendar/CalendarCanvas";
import {
    CalendarEventDialog,
    type CalendarEventFormState,
} from "./calendar/CalendarEventDialog";
import { CalendarRichTextViewer } from "./calendar/CalendarRichText";
import { buildCalendarEvents } from "./calendar/build-calendar-events";
type Surface = "mine" | "team";
type FormState = CalendarEventFormState;

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  location: "",
  startAt: "",
  endAt: "",
  allDay: false,
  itemType: "EVENT",
  availabilityStatus: "AVAILABLE",
  color: "#1a56db",
  projectId: "",
  recipientUserId: "",
  recurrenceRule: null,
};
function toLocalInput(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function itemColor(item: UserCalendarEvent) {
  if (item.availabilityStatus === "UNAVAILABLE") return item.color || "#dc2626";
  if (item.itemType === "TASK") return item.color || "#7c3aed";
  if (item.itemType === "MEETING") return item.color || "#2563eb";
  if (item.itemType === "AVAILABILITY") return item.color || "#059669";
  return item.color || "#1a56db";
}

function typeLabel(type: CalendarItemType) {
  if (type === "AVAILABILITY") return "Availability";
  if (type === "MEETING") return "Meeting";
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function googleSyncDisplay(item: UserCalendarEvent, connected?: boolean) {
  if (item.googleSyncStatus === "SYNC_CONFLICT")
    return { label: "Sync conflict", className: "bg-amber-50 text-amber-700" };
  if (item.googleSyncStatus === "DEAD")
    return { label: "Sync retry stopped", className: "bg-red-50 text-red-700" };
  if (item.syncSource === "GOOGLE")
    return {
      label: "Imported from Google Calendar",
      className: "bg-blue-50 text-blue-700",
    };
  if (!connected && item.googleSyncStatus !== "SYNCED")
    return {
      label: "Not connected to Google Calendar",
      className: "bg-slate-100 text-slate-600",
    };
  if (item.googleSyncStatus === "FAILED")
    return { label: "Google sync failed", className: "bg-red-50 text-red-700" };
  if (item.googleSyncStatus === "PENDING_RETRY")
    return { label: "Pending retry", className: "bg-amber-50 text-amber-700" };
  if (
    item.googleSyncStatus === "SYNCED" ||
    item.lastGoogleSyncedAt ||
    item.googleSyncedAt
  )
    return {
      label: "Synced with Google Calendar",
      className: "bg-blue-50 text-blue-700",
    };
  return {
    label: "Not synced to Google Calendar",
    className: "bg-slate-100 text-slate-600",
  };
}

function googleConnectionLabel(status?: string) {
  if (status === "ACTIVE") return "Sync active";
  if (status === "NEEDS_RECONNECT") return "Sync needs reconnect";
  if (status === "WATCH_FAILED" || status === "SYNC_FAILED")
    return "Sync failed";
  if (status === "RESYNCING") return "Sync resyncing";
  return "Connected";
}

export default function AttendanceCalendarTab({
  showAlert,
}: {
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}) {
  const [surface, setSurface] = useState<Surface>("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<CalendarPerson | null>(
    null,
  );
  const calendar = useUserCalendar(
    selectedPerson ? { userId: selectedPerson.id } : undefined,
  );
  const status = useUserAvailabilityStatus();
  const google = useGoogleCalendarConnection();
  const me = useMe();
  const people = useCalendarPeople({
    search: searchQuery.trim() || undefined,
    size: 100,
  });
  const requests = useMeetingRequests({ size: 50 });
  const projects = useProjects({ size: 100 });
  const createEvent = useCreateUserCalendarEvent();
  const updateEvent = useUpdateUserCalendarEvent();
  const deleteEvent = useDeleteUserCalendarEvent();
  const syncGoogle = useSyncUserCalendarEventToGoogle();
  const syncAllGoogle = useSyncAllUserCalendarEventsToGoogle();
  const syncFromGoogle = useSyncUserCalendarFromGoogle();
  const createMeeting = useCreateMeetingRequest();
  const respondMeeting = useRespondMeetingRequest();

  const [formOpen, setFormOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingRecipient, setMeetingRecipient] =
    useState<CalendarPerson | null>(null);

  const [meetingPicker, setMeetingPicker] = useState<{
    event: UserCalendarEvent;
    x: number;
    y: number;
    query: string;
  } | null>(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    description: "",
    location: "",
    startAt: "",
    endAt: "",
  });
  const [details, setDetails] = useState<{
    event: UserCalendarEvent;
    masterEventId: string;
    x: number;
    y: number;
    mode?: "actions" | "details";
  } | null>(null);
  const [quickCreate, setQuickCreate] = useState<{
    x: number;
    y: number;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    title: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    event: UserCalendarEvent;
    isRecurring: boolean;
    instanceDate: string;
  } | null>(null);

  const isReadOnlyCalendar = Boolean(selectedPerson);
  const currentUserId = me.data?.data?.user?.id;
  const activeRequests = (requests.data || []).filter(
    (request) => request.status === "PENDING",
  );
  const incomingRequests = activeRequests.filter(
    (request) => request.recipientUserId === currentUserId,
  );
  const outgoingRequests = activeRequests.filter(
    (request) => request.requesterUserId === currentUserId,
  );

  useEffect(() => {
    const openRequests = () => {
      setSurface("mine");
      setSelectedPerson(null);
      setRequestsOpen(true);
      requests.refetch();
    };
    window.addEventListener(
      "blih:open-calendar-meeting-requests",
      openRequests,
    );
    return () =>
      window.removeEventListener(
        "blih:open-calendar-meeting-requests",
        openRequests,
      );
  }, [requests]);

  const events = useMemo(
    () =>
      buildCalendarEvents(calendar.data || [], {
        readOnly: isReadOnlyCalendar,
      }),
    [calendar.data, isReadOnlyCalendar],
  );

  const openCreate = (
    start?: Date,
    end?: Date,
    itemType: CalendarItemType = "EVENT",
  ) => {
    const startAt = start || new Date();
    const endAt = end || addMinutes(startAt, 60);
    setDetails(null);
    setQuickCreate(null);
    setForm({
      ...EMPTY_FORM,
      itemType,
      availabilityStatus:
        itemType === "AVAILABILITY" ? "UNAVAILABLE" : "AVAILABLE",
      title: itemType === "AVAILABILITY" ? "Unavailable" : "",
      color:
        itemType === "TASK"
          ? "#7c3aed"
          : itemType === "AVAILABILITY"
            ? "#dc2626"
            : "#1a56db",
      startAt: toLocalInput(startAt),
      endAt: toLocalInput(endAt),
    });
    setFormOpen(true);
  };

  const openQuickCreate = (
    start: Date,
    end: Date,
    allDay: boolean,
    jsEvent?: MouseEvent,
  ) => {
    if (isReadOnlyCalendar) return;
    setDetails(null);
    setFormOpen(false);
    setQuickCreate({
      x: jsEvent?.clientX ?? window.innerWidth / 2,
      y: jsEvent?.clientY ?? 220,
      startAt: start,
      endAt: end,
      allDay,
      title: "",
    });
  };

  const openMeetingRequestAt = (
    person: CalendarPerson,
    start: Date,
    end: Date,
  ) => {
    setDetails(null);
    setQuickCreate(null);
    setMeetingPicker(null);
    setMeetingRecipient(person);

    setMeetingForm({
      title: `Meeting with ${person.fullName}`,
      description: "",
      location: "",
      startAt: toLocalInput(start),
      endAt: toLocalInput(end),
    });

    setMeetingOpen(true);
  };
  const getMasterEvent = (
    event: UserCalendarEvent,
    masterEventId?: string,
  ) => {
    if (!masterEventId) return event;

    return (
      (calendar.data || []).find(
        (candidate) => candidate.id === masterEventId,
      ) || event
    );
  };

  const openEdit = (
    event: UserCalendarEvent,
    masterEventId?: string,
  ) => {
    const editableEvent = getMasterEvent(event, masterEventId);

    if (isReadOnlyCalendar || editableEvent.readOnly) return;

    setDetails(null);
    setQuickCreate(null);

    setForm({
      id: editableEvent.id,
      title: editableEvent.title,
      description: editableEvent.description || "",
      location: editableEvent.location || "",
      startAt: toLocalInput(editableEvent.startAt),
      endAt: toLocalInput(editableEvent.endAt),
      allDay: editableEvent.allDay,
      itemType: editableEvent.itemType || "EVENT",
      availabilityStatus:
        editableEvent.availabilityStatus || "AVAILABLE",
      color: editableEvent.color || itemColor(editableEvent),
      projectId: editableEvent.projectId || "",
      recipientUserId: "",
      recurrenceRule: editableEvent.recurrenceRule || null,
    });

    setFormOpen(true);
  };
  const openCreateFromEvent = (
    event: UserCalendarEvent,
    itemType: CalendarItemType = "EVENT",
  ) => {
    const startAt = new Date(event.startAt);
    const endAt = addMinutes(startAt, itemType === "AVAILABILITY" ? 60 : 30);
    openCreate(startAt, endAt, itemType);
  };

  const openMeetingFromEvent = (
    event: UserCalendarEvent,
    x?: number,
    y?: number,
  ) => {
    setDetails(null);
    setQuickCreate(null);

    setMeetingPicker({
      event,
      query: "",
      x: x ?? window.innerWidth / 2 - 170,
      y: y ?? window.innerHeight / 2 - 180,
    });
  };

  const openQuickCreateDetails = () => {
    if (!quickCreate) return;
    const title = quickCreate.title.trim();
    setForm({
      ...EMPTY_FORM,
      title,
      itemType: "EVENT",
      startAt: toLocalInput(quickCreate.startAt),
      endAt: toLocalInput(quickCreate.endAt),
      allDay: quickCreate.allDay,
    });
    setQuickCreate(null);
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (!form.title.trim() || !form.startAt || !form.endAt) {
      showAlert("Please add a title, start time and end time.", "error");
      return;
    }

    const startAt = fromLocalInput(form.startAt);
    const endAt = fromLocalInput(form.endAt);

    if (new Date(endAt) <= new Date(startAt)) {
      showAlert("The end time must be after the start time.", "error");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description || undefined,
      location: form.location || undefined,
      startAt,
      endAt,
      allDay: form.allDay,
      itemType: form.itemType,
      availabilityStatus: form.availabilityStatus,
      color: form.color,
      projectId: form.itemType === "TASK" ? form.projectId || null : null,
      recurrenceRule:
        form.itemType === "TASK" ||
        form.itemType === "AVAILABILITY" ||
        form.itemType === "MEETING" ||
        form.recipientUserId
          ? null
          : form.recurrenceRule,
    };

    try {
      if (form.id) {
        await updateEvent.mutateAsync({
          id: form.id,
          payload,
        });

        showAlert("Calendar item updated.", "success");
      } else if (form.recipientUserId) {
        await createMeeting.mutateAsync({
          recipientUserId: form.recipientUserId,
          title: form.title.trim(),
          description: form.description || undefined,
          location: form.location || undefined,
          startAt,
          endAt,
        });

        showAlert("Meeting invitation sent.", "success");

        requests.refetch();
        calendar.refetch();
      } else {
        await createEvent.mutateAsync(payload);

        showAlert(
          form.itemType === "TASK"
            ? "Task created and linked to Project Management."
            : "Calendar item created.",
          "success",
        );
      }

      setFormOpen(false);
      setForm(EMPTY_FORM);
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          (form.recipientUserId
            ? "Could not send meeting invitation."
            : "Could not save calendar item."),
        "error",
      );
    }
  };

  const saveQuickCreate = async () => {
    if (!quickCreate?.title.trim()) {
      showAlert("Add a title first.", "error");
      return;
    }
    try {
      await createEvent.mutateAsync({
        title: quickCreate.title.trim(),
        startAt: quickCreate.startAt.toISOString(),
        endAt: quickCreate.endAt.toISOString(),
        allDay: quickCreate.allDay,
        itemType: "EVENT",
        availabilityStatus: "AVAILABLE",
        color: EMPTY_FORM.color,
      });
      setQuickCreate(null);
      showAlert("Event created.", "success");
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message || "Could not create event.",
        "error",
      );
    }
  };

  const removeEvent = async (id: string, deleteScope?: 'THIS_EVENT' | 'ALL_EVENTS', instanceDate?: string) => {
    try {
      await deleteEvent.mutateAsync({ id, deleteScope, instanceDate });
      setDetails(null);
      setFormOpen(false);
      setDeleteConfirm(null);
      showAlert("Calendar item deleted.", "info");
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message || "Could not delete calendar item.",
        "error",
      );
    }
  };

  const openDeleteConfirm = (event: UserCalendarEvent, instanceStartDate?: string) => {
    const isRecurring = Boolean(event.recurrenceRule || event.isRecurring || event.googleRecurringEventId);
    // Use the event's start date or the provided instance date
    const instanceDate = instanceStartDate || event.startAt;
    setDeleteConfirm({ event, isRecurring, instanceDate });
  };

  const syncAllCalendarToGoogle = async (quiet = false) => {
    try {
      const result = await syncAllGoogle.mutateAsync();
      if (!quiet) {
        showAlert(
          result.failedCount
            ? `${result.syncedCount} item(s) synced. ${result.failedCount} failed.`
            : `${result.syncedCount} calendar item(s) synced to Google.`,
          result.failedCount ? "info" : "success",
        );
      }
      calendar.refetch();
      google.refetch();
      return result;
    } catch (err: any) {
      if (!quiet)
        showAlert(
          err?.response?.data?.message || "Could not sync calendar to Google.",
          "error",
        );
      throw err;
    }
  };

  const syncCalendarFromGoogle = async () => {
    try {
      const result = await syncFromGoogle.mutateAsync();
      showAlert(
        `Google sync complete: ${result.importedCount} imported, ${result.updatedCount} updated, ${result.deletedCount} deleted, ${result.skippedCount} skipped${result.failedCount ? `, ${result.failedCount} failed` : ""}.`,
        result.failedCount ? "info" : "success",
      );
      calendar.refetch();
      google.refetch();
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message || "Could not sync from Google Calendar.",
        "error",
      );
    }
  };

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete") return;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        Boolean(target?.isContentEditable);
      if (
        isTyping ||
        formOpen ||
        meetingOpen ||
        requestsOpen ||
        quickCreate ||
        deleteEvent.isPending
      )
        return;
      if (!details?.event || isReadOnlyCalendar || details.event.readOnly)
        return;
      event.preventDefault();
      openDeleteConfirm(details.event);
    };
    window.addEventListener("keydown", handleDeleteKey);
    return () => window.removeEventListener("keydown", handleDeleteKey);
  }, [
    deleteEvent.isPending,
    details,
    formOpen,
    isReadOnlyCalendar,
    meetingOpen,
    quickCreate,
    requestsOpen,
  ]);

  const connectGoogle = async () => {
    try {
      const { url } = await calendarApi.googleAuthUrl();
      const popup = window.open(
        url,
        "blih-google-calendar",
        "width=720,height=760,popup=yes",
      );
      if (!popup) {
        window.location.href = url;
        return;
      }
      const startedAt = Date.now();
      let syncedAfterConnect = false;
      const timer = window.setInterval(async () => {
        const connection = await google.refetch();
        if (popup.closed || Date.now() - startedAt > 120_000) {
          window.clearInterval(timer);
          const latest = connection.data || (await google.refetch()).data;
          if (latest?.connected && !syncedAfterConnect) {
            syncedAfterConnect = true;
            try {
              const result = await syncAllCalendarToGoogle(true);
              showAlert(
                `${result.syncedCount} calendar item(s) synced to Google.`,
                "success",
              );
            } catch {
              showAlert(
                "Google connected, but calendar items could not be synced yet.",
                "error",
              );
            }
          }
        }
      }, 2000);
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message || "Google Calendar is not configured.",
        "error",
      );
    }
  };

  const setUnavailableNow = () => {
    const startAt = new Date();
    const endAt = addMinutes(startAt, 60);
    openCreate(startAt, endAt, "AVAILABILITY");
  };

  const openMeetingRequest = (person: CalendarPerson) => {
    const startAt = new Date();
    const minutes = startAt.getMinutes();
    startAt.setMinutes(minutes < 30 ? 30 : 60, 0, 0);
    const endAt = addMinutes(startAt, 30);
    openMeetingRequestAt(person, startAt, endAt);
  };

  const sendMeetingRequest = async () => {
    if (!meetingRecipient) {
      showAlert("Please select an attendee.", "error");
      return;
    }
    if (
      !meetingForm.title.trim() ||
      !meetingForm.startAt ||
      !meetingForm.endAt
    ) {
      showAlert("Add a meeting title and time.", "error");
      return;
    }
    try {
      await createMeeting.mutateAsync({
        recipientUserId: meetingRecipient.id,
        title: meetingForm.title.trim(),
        description: meetingForm.description || undefined,
        location: meetingForm.location || undefined,
        startAt: fromLocalInput(meetingForm.startAt),
        endAt: fromLocalInput(meetingForm.endAt),
      });
      setMeetingOpen(false);
      showAlert("Meeting request sent.", "success");
      requests.refetch();
      calendar.refetch();
      setMeetingRecipient(null);
      setMeetingForm({
        title: "",
        description: "",
        location: "",
        startAt: "",
        endAt: "",
      });
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message || "Could not send meeting request.",
        "error",
      );
    }
  };

  const respondToMeeting = async (
    id: string,
    status: "ACCEPTED" | "DECLINED",
  ) => {
    try {
      await respondMeeting.mutateAsync({
        id,
        payload: { status },
      });

      setDetails(null);

      showAlert(
        status === "ACCEPTED"
          ? "Meeting accepted."
          : "Meeting declined.",
        status === "ACCEPTED"
          ? "success"
          : "info",
      );

      await Promise.all([
        requests.refetch(),
        calendar.refetch(),
      ]);
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message ||
          "Could not update meeting request.",
        "error",
      );
    }
  };

  const handleDropResize = async (info: any) => {
    const item = info.event.extendedProps.item as UserCalendarEvent;
    if (!item || item.readOnly || isReadOnlyCalendar || !info.event.start) {
      info.revert?.();
      return;
    }
    try {
      await updateEvent.mutateAsync({
        id: item.id,
        payload: {
          startAt: info.event.start.toISOString(),
          endAt: (
            info.event.end || addMinutes(info.event.start, 60)
          ).toISOString(),
          allDay: info.event.allDay,
        },
      });
      showAlert("Calendar item moved.", "success");
    } catch (err: any) {
      info.revert?.();
      showAlert(
        err?.response?.data?.message || "Could not move calendar item.",
        "error",
      );
    }
  };

  const selected = details?.event;

  const selectedMeetingRequest = selected?.meetingRequestId
    ? activeRequests.find(
        (request) =>
          request.id === selected.meetingRequestId,
      )
    : undefined;

  const canRespondToSelectedMeeting =
    Boolean(selectedMeetingRequest) &&
    selected?.itemType === "MEETING" &&
    selectedMeetingRequest?.status === "PENDING" &&
    selectedMeetingRequest?.recipientUserId === currentUserId;

  const selectedGoogleSync = selected
    ? googleSyncDisplay(selected, google.data?.connected)
    : null;
  const hasMeetingActivity = activeRequests.length > 0;
  const searchSuggestions = (people.data || []).slice(0, 8);
  const overlappingFormEvents = useMemo(() => {
    if (!formOpen || form.id || !form.startAt || !form.endAt) return [];
    const startAt = new Date(form.startAt);
    const endAt = new Date(form.endAt);
    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime()) ||
      endAt <= startAt
    )
      return [];
    return (calendar.data || []).filter((event) =>
      rangesOverlap(
        startAt,
        endAt,
        new Date(event.startAt),
        new Date(event.endAt),
      ),
    );
  }, [calendar.data, form.endAt, form.id, form.startAt, formOpen]);

  const selectSearchPerson = (person: CalendarPerson) => {
    setSurface("mine");
    setSelectedPerson(person);
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="-mx-3 border-b border-slate-200 bg-white px-3 py-3 sm:mx-0 sm:rounded-xl sm:border sm:px-5 sm:py-4 sm:shadow-2xs">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-base">
              Calendar
            </h3>
            <p className="mt-0.5 hidden text-xs font-medium text-slate-500 min-[380px]:block sm:mt-1 sm:text-[11px] sm:font-semibold">
              Schedule and availability in one view.
            </p>
            <div className="relative mt-2 max-w-md sm:mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() =>
                  window.setTimeout(() => setSearchOpen(false), 120)
                }
                placeholder="Search company members to check availability"
                className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 shadow-none outline-none ring-0 transition focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              />
              {searchOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {people.isLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching
                      people...
                    </div>
                  ) : searchSuggestions.length ? (
                    <div className="max-h-72 overflow-y-auto py-1">
                      {searchSuggestions.map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSearchPerson(person)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-black text-slate-900">
                              {person.fullName}
                            </span>
                            <span className="block truncate text-[11px] font-semibold text-slate-400">
                              {person.email}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${person.availabilityStatus === "UNAVAILABLE" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                          >
                            {person.availabilityStatus}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-xs font-bold text-slate-400">
                      No company members found.
                    </div>
                  )}
                </div>
              )}
              {selectedPerson && surface === "mine" && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
                  Viewing {selectedPerson.fullName}
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(null)}
                    className="text-slate-400 transition hover:text-slate-700"
                  >
                    My calendar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 sm:inline-flex">
              <button
                onClick={() => {
                  setSurface("mine");
                  setSelectedPerson(null);
                }}
                className={`rounded-lg px-3 py-2 text-[13px] font-bold transition-colors sm:px-3.5 sm:text-xs ${
                  surface === "mine"
                    ? "bg-white text-slate-950 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                My Schedule
              </button>
              <button
                onClick={() => setSurface("team")}
                className={`rounded-lg px-3 py-2 text-[13px] font-bold transition-colors sm:px-3.5 sm:text-xs ${
                  surface === "team"
                    ? "bg-white text-slate-950 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Team Availability
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1.2fr] gap-2 sm:flex">
              <DropdownMenu>
                <DropdownMenuTrigger className="relative inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-700 shadow-none outline-none transition hover:bg-slate-50 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-xs">
                  <MoreHorizontal className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  More
                  <ChevronDown className="ml-1 h-3.5 w-3.5 text-slate-400" />
                  {hasMeetingActivity && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 rounded-xl p-1.5 shadow-lg ring-1 ring-slate-200/80"
                >
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Calendar actions
                  </div>
                  <DropdownMenuItem
                    onClick={() => setRequestsOpen(true)}
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold"
                  >
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span>Meeting Requests</span>
                      {hasMeetingActivity && (
                        <span className="inline-flex items-center gap-1.5">
                          {!!incomingRequests.length && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              {incomingRequests.length}
                            </span>
                          )}
                          {!!outgoingRequests.length && (
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </span>
                      )}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={connectGoogle}
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold"
                  >
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span>
                        {google.data?.connected
                          ? "Google Connected"
                          : "Connect Google"}
                      </span>
                      {google.data?.connected && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${google.data.needsReconnect || google.data.watchStatus === "WATCH_FAILED" || google.data.watchStatus === "SYNC_FAILED" ? "bg-red-50 text-red-700" : google.data.watchStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {googleConnectionLabel(google.data.watchStatus)}
                        </span>
                      )}
                    </span>
                  </DropdownMenuItem>
                  {google.data?.connected && (
                    <>
                      <DropdownMenuItem
                        onClick={syncCalendarFromGoogle}
                        disabled={syncFromGoogle.isPending}
                        className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold"
                      >
                        {syncFromGoogle.isPending
                          ? "Syncing from Google..."
                          : "Sync from Google Calendar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => syncAllCalendarToGoogle()}
                        disabled={syncAllGoogle.isPending}
                        className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold"
                      >
                        {syncAllGoogle.isPending
                          ? "Syncing to Google..."
                          : "Sync calendar to Google"}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                  <DropdownMenuItem
                    onClick={() =>
                      openCreate(undefined, undefined, "AVAILABILITY")
                    }
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold"
                  >
                    Block Time
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={setUnavailableNow}
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold"
                  >
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span>Set Unavailable</span>
                      <span
                        className={`h-2 w-2 rounded-full ${status.data?.availabilityStatus === "UNAVAILABLE" ? "bg-red-500" : "bg-emerald-500"}`}
                      />
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                className="h-9 rounded-xl bg-blue-600 px-3 text-[13px] font-bold text-white shadow-none hover:bg-blue-700 sm:h-10 sm:px-4 sm:text-xs"
                onClick={() => openCreate(undefined, undefined, "EVENT")}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>

      {surface === "team" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-none sm:rounded-2xl sm:border-slate-100 sm:shadow-2xs">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-xs font-black text-slate-900">Everyone</h4>
              <span className="text-[10px] font-bold text-slate-400">
                Unavailable people are disabled for meeting requests.
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 sm:rounded-xl sm:border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(people.data || []).map((person) => (
                    <tr
                      key={person.id}
                      className={
                        selectedPerson?.id === person.id
                          ? "bg-blue-50/60"
                          : "bg-white"
                      }
                    >
                      <td className="px-3 py-2">
                        <button
                          className="text-left"
                          onClick={() => setSelectedPerson(person)}
                        >
                          <span className="block font-black text-slate-900">
                            {person.fullName}
                          </span>
                          <span className="block text-[10px] font-semibold text-slate-400">
                            {person.email}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${person.availabilityStatus === "UNAVAILABLE" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                        >
                          {person.availabilityStatus === "UNAVAILABLE" ? (
                            <WifiOff className="h-3 w-3" />
                          ) : (
                            <UserRoundCheck className="h-3 w-3" />
                          )}
                          {person.availabilityStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={person.availabilityStatus === "UNAVAILABLE"}
                          onClick={() => openMeetingRequest(person)}
                          className="gap-1"
                        >
                          <Send className="h-3.5 w-3.5" /> Let's meet
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!people.isLoading && !(people.data || []).length && (
                    <tr>
                      <td
                        className="px-3 py-8 text-center text-xs font-bold text-slate-400"
                        colSpan={3}
                      >
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-none sm:rounded-2xl sm:border-slate-100 sm:shadow-2xs">
            <h4 className="mb-3 text-xs font-black text-slate-900">
              {selectedPerson
                ? `${selectedPerson.fullName}'s Calendar`
                : "Select an employee"}
            </h4>
            {selectedPerson ? (
              <CalendarCanvas
                events={events}
                loading={calendar.isLoading}
                readOnly
                onEventClick={(item, x, y, masterEventId) =>
                  setDetails({
                    event: item,
                    masterEventId,
                    x,
                    y,
                    mode: "actions",
                  })
                }
              />
            ) : (
              <div className="rounded-lg bg-slate-50 py-12 text-center text-xs font-semibold text-slate-400 sm:rounded-xl sm:py-14">
                Select someone to preview their calendar.
              </div>
            )}
          </div>
        </div>
      )}
      {meetingPicker && (
        <MeetingAttendeePopover
          event={meetingPicker.event}
          people={people.data || []}
          currentUserId={currentUserId}
          query={meetingPicker.query}
          x={meetingPicker.x}
          y={meetingPicker.y}
          onQueryChange={(query) =>
            setMeetingPicker((current) =>
              current
                ? {
                    ...current,
                    query,
                  }
                : null,
            )
          }
          onClose={() => setMeetingPicker(null)}
          onSelect={(person) => {
            const startAt = new Date(meetingPicker.event.startAt);

            const originalEnd = new Date(meetingPicker.event.endAt);

            const endAt =
              originalEnd > startAt ? originalEnd : addMinutes(startAt, 30);

            openMeetingRequestAt(person, startAt, endAt);
          }}
        />
      )}
      {surface === "mine" && (
        <>
          <CalendarCanvas
            events={events}
            loading={calendar.isLoading}
            selectable
            editable={!selectedPerson}
            onSelect={(info) =>
              selectedPerson
                ? openMeetingRequestAt(selectedPerson, info.start, info.end)
                : openQuickCreate(
                    info.start,
                    info.end,
                    info.allDay,
                    info.jsEvent,
                  )
            }
            onDateClick={(info) =>
              selectedPerson
                ? openMeetingRequestAt(
                    selectedPerson,
                    info.date,
                    addMinutes(info.date, 60),
                  )
                : openQuickCreate(
                    info.date,
                    addMinutes(info.date, 60),
                    info.allDay,
                    info.jsEvent,
                  )
            }
            onEventDrop={handleDropResize}
            onEventResize={handleDropResize}
            onEventClick={(item, x, y, masterEventId) => {
              setQuickCreate(null);
              setDetails({
                event: item,
                masterEventId,
                x,
                y,
                mode: "actions",
              });
            }}
          />
        </>
      )}

      {quickCreate && (
        <div
          className="fixed z-[80] w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          style={{
            left: Math.min(quickCreate.x, window.innerWidth - 340),
            top: Math.min(quickCreate.y + 12, window.innerHeight - 230),
          }}
        >
          <Input
            autoFocus
            placeholder="Add title"
            value={quickCreate.title}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setQuickCreate((p) => (p ? { ...p, title: value } : p));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveQuickCreate();
              if (e.key === "Escape") setQuickCreate(null);
            }}
          />
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            {quickCreate.startAt.toLocaleString()} -{" "}
            {quickCreate.endAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuickCreate(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={openQuickCreateDetails}
            >
              More options
            </Button>
            <Button
              size="sm"
              onClick={saveQuickCreate}
              disabled={createEvent.isPending}
            >
              {createEvent.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}

      {selected && details && (
        <div
          className="fixed inset-x-3 bottom-3 z-[80] rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:inset-auto sm:w-80 sm:p-4"
          style={{
            left:
              window.innerWidth >= 640
                ? Math.min(details.x, window.innerWidth - 340)
                : undefined,
            top:
              window.innerWidth >= 640
                ? Math.min(details.y + 12, window.innerHeight - 360)
                : undefined,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: itemColor(selected) }}
                />
                <p className="truncate text-sm font-black text-slate-950">
                  {selected.title}
                </p>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {new Date(selected.startAt).toLocaleString()} -{" "}
                {new Date(selected.endAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={() => setDetails(null)}
              className="text-xs font-black text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>

          {details.mode === "details" ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                  {typeLabel(selected.itemType)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black ${selected.availabilityStatus === "UNAVAILABLE" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                  {selected.availabilityStatus}
                </span>
                {selected.project && (
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700">
                    {selected.project.title}
                  </span>
                )}
                {selectedGoogleSync && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${selectedGoogleSync.className}`}
                  >
                    <Cloud className="h-3 w-3" /> {selectedGoogleSync.label}
                  </span>
                )}
              </div>
              {selected.googleSyncStatus === "SYNC_CONFLICT" && (
                <p className="mt-2 text-[11px] font-semibold text-amber-700">
                  This event changed in Blih and Google before sync completed.
                  Latest update wins for now.
                </p>
              )}
              {selected.googleSyncStatus === "FAILED" &&
                selected.googleSyncError && (
                  <p className="mt-2 text-[11px] font-semibold text-red-600">
                    {selected.googleSyncError}
                  </p>
                )}
              <CalendarRichTextViewer
                value={selected.description}
                compact
                className="mt-3 max-h-40 overflow-y-auto pr-1"
              />
            </>
          ) : (
            <div className="mt-4 grid gap-2">
              {canRespondToSelectedMeeting &&
                selectedMeetingRequest && (
                  <div className="mb-1 grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      type="button"
                      disabled={respondMeeting.isPending}
                      onClick={() =>
                        respondToMeeting(
                          selectedMeetingRequest.id,
                          "ACCEPTED",
                        )
                      }
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {respondMeeting.isPending
                        ? "Updating..."
                        : "Accept"}
                    </Button>

                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      disabled={respondMeeting.isPending}
                      onClick={() =>
                        respondToMeeting(
                          selectedMeetingRequest.id,
                          "DECLINED",
                        )
                      }
                      className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </Button>
                  </div>
                )}

              <Button
                size="sm"
                variant="outline"
                className="justify-start gap-2"
                onClick={() =>
                  setDetails((current) =>
                    current ? { ...current, mode: "details" } : current,
                  )
                }
              >
                <Eye className="h-3.5 w-3.5" /> View details
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start gap-2"
                disabled={
                  isReadOnlyCalendar ||
                  selected.readOnly ||
                  canRespondToSelectedMeeting
                }
                onClick={() =>
                  openEdit(selected, details.masterEventId)
                }
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit event
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start gap-2"
                disabled={isReadOnlyCalendar}
                onClick={() => openCreateFromEvent(selected, "EVENT")}
              >
                <Plus className="h-3.5 w-3.5" /> Add event here
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start gap-2"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();

                  openMeetingFromEvent(selected, rect.right + 8, rect.top);
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Request meeting here
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start gap-2"
                disabled={isReadOnlyCalendar}
                onClick={() => openCreateFromEvent(selected, "AVAILABILITY")}
              >
                <ShieldOff className="h-3.5 w-3.5" /> Block this time
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                disabled={isReadOnlyCalendar || selected.readOnly || canRespondToSelectedMeeting}
                onClick={() => openDeleteConfirm(selected)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete event
              </Button>
            </div>
          )}
          {details.mode === "details" &&
            !isReadOnlyCalendar &&
            !selected.readOnly &&
            !canRespondToSelectedMeeting && (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() =>
                  openEdit(selected, details.masterEventId)
                }
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                {(selected.googleSyncStatus === "FAILED" ||
                  selected.googleSyncStatus === "DEAD") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => syncGoogle.mutate(selected.id)}
                  >
                    <Cloud className="h-3.5 w-3.5" /> Retry
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openDeleteConfirm(selected)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
        </div>
      )}

      <CalendarEventDialog
        open={formOpen}
        form={form}
        people={people.data || []}
        currentUserId={currentUserId}
        projects={(projects.data?.rows || []).map((project) => ({
          id: project.id,
          title: project.title,
        }))}
        overlappingEvents={overlappingFormEvents}
        isSaving={
          createEvent.isPending ||
          updateEvent.isPending ||
          createMeeting.isPending
        }
        isDeleting={deleteEvent.isPending}
        onOpenChange={(open) => {
          setFormOpen(open);

          if (!open) {
            setForm(EMPTY_FORM);
          }
        }}
        onFormChange={setForm}
        onSave={saveForm}
        onDelete={removeEvent}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Delete Calendar Event
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold text-slate-600">
              {deleteConfirm?.isRecurring 
                ? "This is a recurring event. Do you want to delete all occurrences or just this one?"
                : "Are you sure you want to delete this event? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            {deleteConfirm?.isRecurring ? (
              <>
                <Button
                  onClick={() => deleteConfirm && removeEvent(deleteConfirm.event.id, 'ALL_EVENTS')}
                  disabled={deleteEvent.isPending}
                  className="w-full justify-center gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteEvent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Trash2 className="h-4 w-4" />
                  Delete All Events
                </Button>
                <Button
                  onClick={() => {
                    if (deleteConfirm) removeEvent(deleteConfirm.event.id, 'THIS_EVENT', deleteConfirm.instanceDate);
                  }}
                  disabled={deleteEvent.isPending}
                  variant="outline"
                  className="w-full justify-center gap-2 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                  {deleteEvent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Trash2 className="h-4 w-4" />
                  Delete This Event Only
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteEvent.isPending}
                  variant="outline"
                  className="w-full justify-center rounded-xl"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => deleteConfirm && removeEvent(deleteConfirm.event.id)}
                  disabled={deleteEvent.isPending}
                  className="w-full justify-center gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteEvent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Trash2 className="h-4 w-4" />
                  Yes, Delete Event
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteEvent.isPending}
                  variant="outline"
                  className="w-full justify-center rounded-xl"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Requests Modal */}
      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Meeting Requests
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold text-slate-600">
              Manage your incoming and outgoing meeting requests
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                  Incoming Requests ({incomingRequests.length})
                </h3>
                <div className="space-y-2">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900">
                            {request.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            From: {request.requester?.fullName}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            {new Date(request.startAt).toLocaleString()} - {new Date(request.endAt).toLocaleTimeString()}
                          </p>
                          {request.location && (
                            <p className="mt-1 text-[11px] font-semibold text-slate-400">
                              📍 {request.location}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              respondToMeeting(request.id, "ACCEPTED");
                              setRequestsOpen(false);
                            }}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                            disabled={respondMeeting.isPending}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              respondToMeeting(request.id, "DECLINED");
                              setRequestsOpen(false);
                            }}
                            className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                            disabled={respondMeeting.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                  Outgoing Requests ({outgoingRequests.length})
                </h3>
                <div className="space-y-2">
                  {outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900">
                            {request.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            To: {request.recipient?.fullName}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            {new Date(request.startAt).toLocaleString()} - {new Date(request.endAt).toLocaleTimeString()}
                          </p>
                          {request.location && (
                            <p className="mt-1 text-[11px] font-semibold text-slate-400">
                              📍 {request.location}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase text-amber-700">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-slate-400">
                  No active meeting requests
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Request Form Modal */}
      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Request Meeting
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold text-slate-600">
              {meetingRecipient
                ? `Send a meeting request to ${meetingRecipient.fullName}`
                : "Select a person to meet with"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Meeting Title
              </label>
              <Input
                value={meetingForm.title}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, title: e.target.value })
                }
                placeholder="Meeting with..."
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Start Time
                </label>
                <Input
                  type="datetime-local"
                  value={meetingForm.startAt}
                  onChange={(e) =>
                    setMeetingForm({ ...meetingForm, startAt: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  End Time
                </label>
                <Input
                  type="datetime-local"
                  value={meetingForm.endAt}
                  onChange={(e) =>
                    setMeetingForm({ ...meetingForm, endAt: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Location (Optional)
              </label>
              <Input
                value={meetingForm.location}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, location: e.target.value })
                }
                placeholder="Office, Zoom link, etc."
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Description (Optional)
              </label>
              <textarea
                value={meetingForm.description}
                onChange={(e) =>
                  setMeetingForm({
                    ...meetingForm,
                    description: (e.target as HTMLTextAreaElement).value,
                  })
                }
                placeholder="Agenda or notes..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-300"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={sendMeetingRequest}
                disabled={createMeeting.isPending}
                className="flex-1 gap-2 rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {createMeeting.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4" />
                Send Request
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMeetingOpen(false);
                  setMeetingRecipient(null);
                }}
                disabled={createMeeting.isPending}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

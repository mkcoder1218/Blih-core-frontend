import { useEffect, useMemo, useState } from "react";
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
  Users,
  WifiOff,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type MeetingPayload,
  type MeetingRequest,
  type UserCalendarEvent,
} from "../../api/calendar";
import { useProjects } from "../../features/projects/hooks";
import { useMe } from "../../hooks/useMe";
import {
  useCalendarPeople,
  useCancelMeeting,
  useCreateMeetingRequest,
  useCreateUserCalendarEvent,
  useDeleteUserCalendarEvent,
  useGoogleCalendarConnection,
  useMeetingEventDetails,
  useMeetingRequests,
  useRespondMeetingRequest,
  useSyncAllUserCalendarEventsToGoogle,
  useSyncUserCalendarEventToGoogle,
  useSyncUserCalendarFromGoogle,
  useUpdateMeeting,
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
import { GroupMeetingDialog } from "./calendar/GroupMeetingDialog";
import { MeetingAttendeePopover } from "./calendar/MeetingAttendeePopover";
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function attendeeStatusClass(status: string) {
  if (status === "ACCEPTED") return "bg-emerald-50 text-emerald-700";
  if (status === "DECLINED") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

function googleSyncDisplay(item: UserCalendarEvent, connected?: boolean) {
  if (item.googleSyncStatus === "SYNC_CONFLICT")
    return { label: "Sync conflict", className: "bg-amber-50 text-amber-700" };
  if (item.googleSyncStatus === "DEAD")
    return { label: "Sync retry stopped", className: "bg-red-50 text-red-700" };
  if (item.syncSource === "GOOGLE")
    return { label: "Imported from Google Calendar", className: "bg-blue-50 text-blue-700" };
  if (!connected && item.googleSyncStatus !== "SYNCED")
    return { label: "Not connected to Google Calendar", className: "bg-slate-100 text-slate-600" };
  if (item.googleSyncStatus === "FAILED")
    return { label: "Google sync failed", className: "bg-red-50 text-red-700" };
  if (item.googleSyncStatus === "PENDING_RETRY")
    return { label: "Pending retry", className: "bg-amber-50 text-amber-700" };
  if (item.googleSyncStatus === "SYNCED" || item.lastGoogleSyncedAt || item.googleSyncedAt)
    return { label: "Synced with Google Calendar", className: "bg-blue-50 text-blue-700" };
  return { label: "Not synced to Google Calendar", className: "bg-slate-100 text-slate-600" };
}

function googleConnectionLabel(status?: string) {
  if (status === "ACTIVE") return "Sync active";
  if (status === "NEEDS_RECONNECT") return "Sync needs reconnect";
  if (status === "WATCH_FAILED" || status === "SYNC_FAILED") return "Sync failed";
  if (status === "RESYNCING") return "Sync resyncing";
  return "Connected";
}

function nextMeetingWindow() {
  const startAt = new Date();
  const minutes = startAt.getMinutes();
  startAt.setMinutes(minutes < 30 ? 30 : 60, 0, 0);
  return { startAt, endAt: addMinutes(startAt, 30) };
}

export default function AttendanceCalendarTab({
  showAlert,
}: {
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}) {
  const [surface, setSurface] = useState<Surface>("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<CalendarPerson | null>(null);

  const calendar = useUserCalendar(selectedPerson ? { userId: selectedPerson.id } : undefined);
  const status = useUserAvailabilityStatus();
  const google = useGoogleCalendarConnection();
  const me = useMe();
  const people = useCalendarPeople({ search: searchQuery.trim() || undefined, size: 100 });
  const requests = useMeetingRequests({ size: 100 });
  const projects = useProjects({ size: 100 });

  const createEvent = useCreateUserCalendarEvent();
  const updateEvent = useUpdateUserCalendarEvent();
  const deleteEvent = useDeleteUserCalendarEvent();
  const syncGoogle = useSyncUserCalendarEventToGoogle();
  const syncAllGoogle = useSyncAllUserCalendarEventsToGoogle();
  const syncFromGoogle = useSyncUserCalendarFromGoogle();
  const createMeeting = useCreateMeetingRequest();
  const respondMeeting = useRespondMeetingRequest();
  const updateMeeting = useUpdateMeeting();
  const cancelMeeting = useCancelMeeting();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingInitialAttendeeIds, setMeetingInitialAttendeeIds] = useState<string[]>([]);
  const [meetingInitialStartAt, setMeetingInitialStartAt] = useState<string | undefined>();
  const [meetingInitialEndAt, setMeetingInitialEndAt] = useState<string | undefined>();
  const [editingMeeting, setEditingMeeting] = useState<MeetingRequest | null>(null);
  const [meetingPicker, setMeetingPicker] = useState<{
    event: UserCalendarEvent;
    x: number;
    y: number;
    query: string;
  } | null>(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
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

  const currentUserId = me.data?.data?.user?.id;
  const isReadOnlyCalendar = Boolean(selectedPerson);
  const selected = details?.event;
  const meetingEventDetails = useMeetingEventDetails(
    selected?.itemType === "MEETING" ? selected.id : undefined,
  );

  const allMeetings = requests.data || [];
  const incomingRequests = allMeetings.filter(
    (request) => request.currentUserStatus === "PENDING",
  );
  const outgoingRequests = allMeetings.filter(
    (request) =>
      request.organizerUserId === currentUserId &&
      request.meetingStatus !== "CANCELLED" &&
      Number(request.pendingAttendeeCount || 0) > 0,
  );
  const hasMeetingActivity = incomingRequests.length > 0 || outgoingRequests.length > 0;

  const events = useMemo(
    () => buildCalendarEvents(calendar.data || [], { readOnly: isReadOnlyCalendar }),
    [calendar.data, isReadOnlyCalendar],
  );

  const selectedMeetingId = selected
    ? String(selected.metadata?.groupMeetingId || selected.meetingRequestId || "")
    : "";
  const selectedMeetingFromList = selectedMeetingId
    ? allMeetings.find((request) => request.id === selectedMeetingId)
    : undefined;
  const selectedMeeting = meetingEventDetails.data || selectedMeetingFromList;
  const canRespondToSelectedMeeting = Boolean(
    selected?.itemType === "MEETING" &&
    selectedMeeting &&
    selectedMeeting.currentUserStatus === "PENDING",
  );
  const canEditSelectedGroupMeeting = Boolean(
    selectedMeeting &&
    !selectedMeeting.legacy &&
    selectedMeeting.organizerUserId === currentUserId &&
    selectedMeeting.meetingStatus !== "CANCELLED",
  );
  const selectedGoogleSync = selected ? googleSyncDisplay(selected, google.data?.connected) : null;

  useEffect(() => {
    const openRequests = () => {
      setSurface("mine");
      setSelectedPerson(null);
      setRequestsOpen(true);
      requests.refetch();
    };
    window.addEventListener("blih:open-calendar-meeting-requests", openRequests);
    return () => window.removeEventListener("blih:open-calendar-meeting-requests", openRequests);
  }, [requests]);

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
      availabilityStatus: itemType === "AVAILABILITY" ? "UNAVAILABLE" : "AVAILABLE",
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

  const openGroupMeeting = (
    attendeeIds: string[],
    startAt: Date,
    endAt: Date,
    meeting?: MeetingRequest | null,
  ) => {
    setDetails(null);
    setQuickCreate(null);
    setMeetingPicker(null);
    setEditingMeeting(meeting || null);
    setMeetingInitialAttendeeIds(attendeeIds);
    setMeetingInitialStartAt(startAt.toISOString());
    setMeetingInitialEndAt(endAt.toISOString());
    setMeetingOpen(true);
  };

  const openMeetingRequestAt = (person: CalendarPerson, start: Date, end: Date) => {
    openGroupMeeting([person.id], start, end);
  };

  const openNewMeeting = () => {
    const { startAt, endAt } = nextMeetingWindow();
    openGroupMeeting([], startAt, endAt);
  };

  const openEditMeeting = (meeting: MeetingRequest) => {
    if (meeting.legacy) return;
    setEditingMeeting(meeting);
    setMeetingInitialAttendeeIds(meeting.attendees.map((attendee) => attendee.userId));
    setMeetingInitialStartAt(meeting.startAt);
    setMeetingInitialEndAt(meeting.endAt);
    setMeetingOpen(true);
    setDetails(null);
    setRequestsOpen(false);
  };

  const getMasterEvent = (event: UserCalendarEvent, masterEventId?: string) => {
    if (!masterEventId) return event;
    return (calendar.data || []).find((candidate) => candidate.id === masterEventId) || event;
  };

  const openEdit = (event: UserCalendarEvent, masterEventId?: string) => {
    const editableEvent = getMasterEvent(event, masterEventId);
    if (isReadOnlyCalendar || editableEvent.readOnly || editableEvent.itemType === "MEETING") return;

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
      availabilityStatus: editableEvent.availabilityStatus || "AVAILABLE",
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

  const openMeetingFromEvent = (event: UserCalendarEvent, x?: number, y?: number) => {
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
    setForm({
      ...EMPTY_FORM,
      title: quickCreate.title.trim(),
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
        await updateEvent.mutateAsync({ id: form.id, payload });
        showAlert("Calendar item updated.", "success");
      } else if (form.recipientUserId) {
        await createMeeting.mutateAsync({
          attendeeUserIds: [form.recipientUserId],
          title: form.title.trim(),
          description: form.description || undefined,
          location: form.location || undefined,
          startAt,
          endAt,
        });
        showAlert("Meeting invitation sent.", "success");
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
      await Promise.all([calendar.refetch(), requests.refetch()]);
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

  const saveGroupMeeting = async (payload: MeetingPayload) => {
    try {
      if (editingMeeting) {
        await updateMeeting.mutateAsync({ id: editingMeeting.id, payload });
        showAlert("Meeting updated.", "success");
      } else {
        await createMeeting.mutateAsync(payload);
        showAlert(
          payload.attendeeUserIds.length === 1
            ? "Meeting invitation sent."
            : `Meeting invitations sent to ${payload.attendeeUserIds.length} people.`,
          "success",
        );
      }
      setMeetingOpen(false);
      setEditingMeeting(null);
      setMeetingInitialAttendeeIds([]);
      await Promise.all([calendar.refetch(), requests.refetch()]);
    } catch (error: any) {
      const conflicts = error?.response?.data?.conflicts;
      showAlert(
        conflicts?.length
          ? "The selected time conflicts with one or more calendars. Choose another time."
          : error?.response?.data?.message || "Could not save the meeting.",
        "error",
      );
    }
  };

  const cancelEditingMeeting = async () => {
    if (!editingMeeting || editingMeeting.legacy) return;
    try {
      await cancelMeeting.mutateAsync(editingMeeting.id);
      setMeetingOpen(false);
      setEditingMeeting(null);
      setDetails(null);
      showAlert("Meeting cancelled for all attendees.", "info");
      await Promise.all([calendar.refetch(), requests.refetch()]);
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Could not cancel the meeting.", "error");
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
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Could not create event.", "error");
    }
  };

  const removeEvent = async (
    id: string,
    deleteScope?: "THIS_EVENT" | "ALL_EVENTS",
    instanceDate?: string,
  ) => {
    try {
      await deleteEvent.mutateAsync({ id, deleteScope, instanceDate });
      setDetails(null);
      setFormOpen(false);
      setDeleteConfirm(null);
      showAlert("Calendar item deleted.", "info");
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Could not delete calendar item.", "error");
    }
  };

  const openDeleteConfirm = (event: UserCalendarEvent, instanceStartDate?: string) => {
    if (event.itemType === "MEETING") return;
    const isRecurring = Boolean(event.recurrenceRule || event.isRecurring || event.googleRecurringEventId);
    setDeleteConfirm({
      event,
      isRecurring,
      instanceDate: instanceStartDate || event.startAt,
    });
  };

  const respondToMeeting = async (
    request: MeetingRequest,
    responseStatus: "ACCEPTED" | "DECLINED",
  ) => {
    try {
      await respondMeeting.mutateAsync({
        id: request.id,
        payload: { status: responseStatus, legacy: Boolean(request.legacy) },
      });
      setDetails(null);
      showAlert(
        responseStatus === "ACCEPTED" ? "Meeting accepted." : "Meeting declined.",
        responseStatus === "ACCEPTED" ? "success" : "info",
      );
      await Promise.all([requests.refetch(), calendar.refetch(), meetingEventDetails.refetch()]);
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Could not update meeting invitation.", "error");
    }
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
    } catch (error: any) {
      if (!quiet) {
        showAlert(error?.response?.data?.message || "Could not sync calendar to Google.", "error");
      }
      throw error;
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
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Could not sync from Google Calendar.", "error");
    }
  };

  const connectGoogle = async () => {
    try {
      const { url } = await calendarApi.googleAuthUrl();
      const popup = window.open(url, "blih-google-calendar", "width=720,height=760,popup=yes");
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
              showAlert(`${result.syncedCount} calendar item(s) synced to Google.`, "success");
            } catch {
              showAlert("Google connected, but calendar items could not be synced yet.", "error");
            }
          }
        }
      }, 2000);
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Google Calendar is not configured.", "error");
    }
  };

  const setUnavailableNow = () => {
    const startAt = new Date();
    openCreate(startAt, addMinutes(startAt, 60), "AVAILABILITY");
  };

  const handleDropResize = async (info: any) => {
    const item = info.event.extendedProps.item as UserCalendarEvent;
    if (
      !item ||
      item.readOnly ||
      isReadOnlyCalendar ||
      item.itemType === "MEETING" ||
      !info.event.start
    ) {
      info.revert?.();
      if (item?.itemType === "MEETING") {
        showAlert("Open the meeting details to change its time for everyone.", "info");
      }
      return;
    }
    try {
      await updateEvent.mutateAsync({
        id: item.id,
        payload: {
          startAt: info.event.start.toISOString(),
          endAt: (info.event.end || addMinutes(info.event.start, 60)).toISOString(),
          allDay: info.event.allDay,
        },
      });
      showAlert("Calendar item moved.", "success");
    } catch (error: any) {
      info.revert?.();
      showAlert(error?.response?.data?.message || "Could not move calendar item.", "error");
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
      if (isTyping || formOpen || meetingOpen || requestsOpen || quickCreate || deleteEvent.isPending) return;
      if (!details?.event || isReadOnlyCalendar || details.event.readOnly || details.event.itemType === "MEETING") return;
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

  const searchSuggestions = (people.data || []).slice(0, 8);
  const overlappingFormEvents = useMemo(() => {
    if (!formOpen || form.id || !form.startAt || !form.endAt) return [];
    const startAt = new Date(form.startAt);
    const endAt = new Date(form.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) return [];
    return (calendar.data || []).filter((event) =>
      rangesOverlap(startAt, endAt, new Date(event.startAt), new Date(event.endAt)),
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
            <h3 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-base">Calendar</h3>
            <p className="mt-0.5 hidden text-xs font-medium text-slate-500 min-[380px]:block sm:mt-1 sm:text-[11px] sm:font-semibold">
              Schedule and availability in one view.
            </p>

            <div className="mt-3 max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.currentTarget.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                  placeholder="Search company members to check availability"
                  className="h-10 rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 shadow-none focus-visible:ring-2 focus-visible:ring-blue-100"
                />

                {searchOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {people.isLoading ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching people...
                      </div>
                    ) : searchSuggestions.length ? (
                      <div className="max-h-72 overflow-y-auto py-1">
                        {searchSuggestions.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectSearchPerson(person)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-700">
                              {initials(person.fullName)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-900">
                              {person.fullName}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-xs font-bold text-slate-400">No company members found.</div>
                    )}
                  </div>
                )}
              </div>

              {selectedPerson && surface === "mine" && (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                      {initials(selectedPerson.fullName)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Viewing calendar</p>
                      <p className="truncate text-xs font-bold text-slate-800">{selectedPerson.fullName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Back to my calendar"
                    aria-label="Back to my calendar"
                    onClick={() => setSelectedPerson(null)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
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
                <DropdownMenuTrigger className="relative inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-xs">
                  <MoreHorizontal className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  More
                  <ChevronDown className="ml-1 h-3.5 w-3.5 text-slate-400" />
                  {hasMeetingActivity && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-lg ring-1 ring-slate-200/80">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Calendar actions</div>
                  <DropdownMenuItem onClick={openNewMeeting} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    <Users className="mr-2 h-4 w-4" /> Schedule Meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRequestsOpen(true)} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span>Meeting Requests</span>
                      {hasMeetingActivity && (
                        <span className="inline-flex items-center gap-1.5">
                          {!!incomingRequests.length && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{incomingRequests.length}</span>
                          )}
                          {!!outgoingRequests.length && <span className="h-2 w-2 rounded-full bg-red-500" />}
                        </span>
                      )}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={connectGoogle} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span>{google.data?.connected ? "Google Connected" : "Connect Google"}</span>
                      {google.data?.connected && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            google.data.needsReconnect ||
                            google.data.watchStatus === "WATCH_FAILED" ||
                            google.data.watchStatus === "SYNC_FAILED"
                              ? "bg-red-50 text-red-700"
                              : google.data.watchStatus === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {googleConnectionLabel(google.data.watchStatus)}
                        </span>
                      )}
                    </span>
                  </DropdownMenuItem>
                  {google.data?.connected && (
                    <>
                      <DropdownMenuItem onClick={syncCalendarFromGoogle} disabled={syncFromGoogle.isPending} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                        {syncFromGoogle.isPending ? "Syncing from Google..." : "Sync from Google Calendar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => syncAllCalendarToGoogle()} disabled={syncAllGoogle.isPending} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                        {syncAllGoogle.isPending ? "Syncing to Google..." : "Sync calendar to Google"}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                  <DropdownMenuItem onClick={() => openCreate(undefined, undefined, "AVAILABILITY")} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    Block Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={setUnavailableNow} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span>Set Unavailable</span>
                      <span className={`h-2 w-2 rounded-full ${status.data?.availabilityStatus === "UNAVAILABLE" ? "bg-red-500" : "bg-emerald-500"}`} />
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button className="h-9 rounded-xl bg-blue-600 px-3 text-[13px] font-bold text-white hover:bg-blue-700 sm:h-10 sm:px-4 sm:text-xs" onClick={() => openCreate(undefined, undefined, "EVENT")}>
                <Plus className="mr-1.5 h-4 w-4" /> Create
              </Button>
            </div>
          </div>
        </div>
      </div>

      {surface === "team" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:border-slate-100 sm:shadow-2xs">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-xs font-black text-slate-900">Everyone</h4>
              <span className="text-[10px] font-bold text-slate-400">Select a person to preview or schedule a meeting.</span>
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
                    <tr key={person.id} className={selectedPerson?.id === person.id ? "bg-blue-50/60" : "bg-white"}>
                      <td className="px-3 py-2">
                        <button className="flex items-center gap-2 text-left" onClick={() => setSelectedPerson(person)}>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-black text-slate-700">{initials(person.fullName)}</span>
                          <span className="font-black text-slate-900">{person.fullName}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${person.availabilityStatus === "UNAVAILABLE" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {person.availabilityStatus === "UNAVAILABLE" ? <WifiOff className="h-3 w-3" /> : <UserRoundCheck className="h-3 w-3" />}
                          {person.availabilityStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => {
                          const window = nextMeetingWindow();
                          openMeetingRequestAt(person, window.startAt, window.endAt);
                        }} className="gap-1">
                          <Send className="h-3.5 w-3.5" /> Let's meet
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!people.isLoading && !(people.data || []).length && (
                    <tr><td className="px-3 py-8 text-center text-xs font-bold text-slate-400" colSpan={3}>No employees found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:border-slate-100 sm:shadow-2xs">
            <h4 className="mb-3 text-xs font-black text-slate-900">
              {selectedPerson ? `${selectedPerson.fullName}'s Calendar` : "Select an employee"}
            </h4>
            {selectedPerson ? (
              <CalendarCanvas
                events={events}
                loading={calendar.isLoading}
                readOnly
                selectable
                onSelect={(info) => openMeetingRequestAt(selectedPerson, info.start, info.end)}
                onDateClick={(info) => openMeetingRequestAt(selectedPerson, info.date, addMinutes(info.date, 60))}
                onEventClick={(item, x, y, masterEventId) => setDetails({ event: item, masterEventId, x, y, mode: "actions" })}
              />
            ) : (
              <div className="rounded-lg bg-slate-50 py-12 text-center text-xs font-semibold text-slate-400 sm:rounded-xl sm:py-14">Select someone to preview their calendar.</div>
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
          onQueryChange={(query) => setMeetingPicker((current) => current ? { ...current, query } : null)}
          onClose={() => setMeetingPicker(null)}
          onSelect={(person) => {
            const startAt = new Date(meetingPicker.event.startAt);
            const originalEnd = new Date(meetingPicker.event.endAt);
            openMeetingRequestAt(person, startAt, originalEnd > startAt ? originalEnd : addMinutes(startAt, 30));
          }}
        />
      )}

      {surface === "mine" && (
        <CalendarCanvas
          events={events}
          loading={calendar.isLoading}
          selectable
          editable={!selectedPerson}
          onSelect={(info) => selectedPerson
            ? openMeetingRequestAt(selectedPerson, info.start, info.end)
            : openQuickCreate(info.start, info.end, info.allDay, info.jsEvent)}
          onDateClick={(info) => selectedPerson
            ? openMeetingRequestAt(selectedPerson, info.date, addMinutes(info.date, 60))
            : openQuickCreate(info.date, addMinutes(info.date, 60), info.allDay, info.jsEvent)}
          onEventDrop={handleDropResize}
          onEventResize={handleDropResize}
          onEventClick={(item, x, y, masterEventId) => {
            setQuickCreate(null);
            setDetails({ event: item, masterEventId, x, y, mode: "actions" });
          }}
        />
      )}

      {quickCreate && (
        <div
          className="fixed z-[80] w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          style={{ left: Math.min(quickCreate.x, window.innerWidth - 340), top: Math.min(quickCreate.y + 12, window.innerHeight - 230) }}
        >
          <Input
            autoFocus
            placeholder="Add title"
            value={quickCreate.title}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setQuickCreate((current) => current ? { ...current, title: value } : current);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveQuickCreate();
              if (event.key === "Escape") setQuickCreate(null);
            }}
          />
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            {quickCreate.startAt.toLocaleString()} - {quickCreate.endAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setQuickCreate(null)}>Cancel</Button>
            <Button size="sm" variant="outline" onClick={openQuickCreateDetails}>More options</Button>
            <Button size="sm" onClick={saveQuickCreate} disabled={createEvent.isPending}>{createEvent.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      )}

      {selected && details && (
        <div
          className="fixed inset-x-3 bottom-3 z-[80] rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:inset-auto sm:w-96 sm:p-4"
          style={{
            left: window.innerWidth >= 640 ? Math.min(details.x, window.innerWidth - 400) : undefined,
            top: window.innerWidth >= 640 ? Math.min(details.y + 12, window.innerHeight - 500) : undefined,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: itemColor(selected) }} />
                <p className="truncate text-sm font-black text-slate-950">{selected.title}</p>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {new Date(selected.startAt).toLocaleString()} - {new Date(selected.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <button onClick={() => setDetails(null)} className="text-xs font-black text-slate-400 hover:text-slate-700">Close</button>
          </div>

          {details.mode === "details" ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{typeLabel(selected.itemType)}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${selected.availabilityStatus === "UNAVAILABLE" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{selected.availabilityStatus}</span>
                {selected.project && <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700">{selected.project.title}</span>}
                {selectedGoogleSync && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${selectedGoogleSync.className}`}>
                    <Cloud className="h-3 w-3" /> {selectedGoogleSync.label}
                  </span>
                )}
              </div>

              {selected.itemType === "MEETING" && (
                <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  {meetingEventDetails.isLoading ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading meeting people...</div>
                  ) : selectedMeeting ? (
                    <>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Organizer</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">{initials(selectedMeeting.organizer?.fullName || "Organizer")}</span>
                          <p className="text-xs font-black text-slate-800">{selectedMeeting.organizer?.fullName || "Organizer"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Attendees</p>
                        <div className="mt-1.5 space-y-1.5">
                          {selectedMeeting.attendees.map((attendee) => (
                            <div key={attendee.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[8px] font-black text-slate-600">{initials(attendee.user?.fullName || "Attendee")}</span>
                                <span className="truncate text-[11px] font-bold text-slate-700">{attendee.user?.fullName || "Attendee"}</span>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${attendeeStatusClass(attendee.status)}`}>{attendee.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400">Meeting people are unavailable.</p>
                  )}
                </div>
              )}

              {selected.googleSyncStatus === "SYNC_CONFLICT" && (
                <p className="mt-2 text-[11px] font-semibold text-amber-700">This event changed in Blih and Google before sync completed. Latest update wins for now.</p>
              )}
              {selected.googleSyncStatus === "FAILED" && selected.googleSyncError && (
                <p className="mt-2 text-[11px] font-semibold text-red-600">{selected.googleSyncError}</p>
              )}
              <CalendarRichTextViewer value={selected.description} compact className="mt-3 max-h-40 overflow-y-auto pr-1" />
            </>
          ) : (
            <div className="mt-4 grid gap-2">
              {canRespondToSelectedMeeting && selectedMeeting && (
                <div className="mb-1 grid grid-cols-2 gap-2">
                  <Button size="sm" type="button" disabled={respondMeeting.isPending} onClick={() => respondToMeeting(selectedMeeting, "ACCEPTED")} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                    <Check className="h-3.5 w-3.5" /> {respondMeeting.isPending ? "Updating..." : "Accept"}
                  </Button>
                  <Button size="sm" type="button" variant="outline" disabled={respondMeeting.isPending} onClick={() => respondToMeeting(selectedMeeting, "DECLINED")} className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                    <X className="h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              )}

              <Button size="sm" variant="outline" className="justify-start gap-2" onClick={() => setDetails((current) => current ? { ...current, mode: "details" } : current)}>
                <Eye className="h-3.5 w-3.5" /> View details
              </Button>

              {canEditSelectedGroupMeeting && selectedMeeting ? (
                <Button size="sm" variant="outline" className="justify-start gap-2" onClick={() => openEditMeeting(selectedMeeting)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit meeting & attendees
                </Button>
              ) : selected.itemType !== "MEETING" ? (
                <Button size="sm" variant="outline" className="justify-start gap-2" disabled={isReadOnlyCalendar || selected.readOnly} onClick={() => openEdit(selected, details.masterEventId)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit event
                </Button>
              ) : null}

              <Button size="sm" variant="outline" className="justify-start gap-2" disabled={isReadOnlyCalendar} onClick={() => openCreateFromEvent(selected, "EVENT")}>
                <Plus className="h-3.5 w-3.5" /> Add event here
              </Button>
              <Button size="sm" variant="outline" className="justify-start gap-2" onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                openMeetingFromEvent(selected, rect.right + 8, rect.top);
              }}>
                <Send className="h-3.5 w-3.5" /> Request meeting here
              </Button>
              <Button size="sm" variant="outline" className="justify-start gap-2" disabled={isReadOnlyCalendar} onClick={() => openCreateFromEvent(selected, "AVAILABILITY")}>
                <ShieldOff className="h-3.5 w-3.5" /> Block this time
              </Button>
              {selected.itemType !== "MEETING" && (
                <Button size="sm" variant="outline" className="justify-start gap-2 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700" disabled={isReadOnlyCalendar || selected.readOnly} onClick={() => openDeleteConfirm(selected)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete event
                </Button>
              )}
            </div>
          )}

          {details.mode === "details" && !isReadOnlyCalendar && !selected.readOnly && selected.itemType !== "MEETING" && (
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(selected, details.masterEventId)}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
              {(selected.googleSyncStatus === "FAILED" || selected.googleSyncStatus === "DEAD") && (
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => syncGoogle.mutate(selected.id)}><Cloud className="h-3.5 w-3.5" /> Retry</Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => openDeleteConfirm(selected)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )}
          {details.mode === "details" && canEditSelectedGroupMeeting && selectedMeeting && (
            <div className="mt-4">
              <Button size="sm" className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => openEditMeeting(selectedMeeting)}>
                <Edit2 className="h-3.5 w-3.5" /> Edit meeting
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
        projects={(projects.data?.rows || []).map((project) => ({ id: project.id, title: project.title }))}
        overlappingEvents={overlappingFormEvents}
        isSaving={createEvent.isPending || updateEvent.isPending || createMeeting.isPending}
        isDeleting={deleteEvent.isPending}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setForm(EMPTY_FORM);
        }}
        onFormChange={setForm}
        onSave={saveForm}
        onDelete={removeEvent}
      />

      <GroupMeetingDialog
        open={meetingOpen}
        people={people.data || []}
        currentUserId={currentUserId}
        initialAttendeeIds={meetingInitialAttendeeIds}
        initialStartAt={meetingInitialStartAt}
        initialEndAt={meetingInitialEndAt}
        meeting={editingMeeting}
        isSaving={createMeeting.isPending || updateMeeting.isPending}
        isCancelling={cancelMeeting.isPending}
        onOpenChange={(open) => {
          setMeetingOpen(open);
          if (!open) {
            setEditingMeeting(null);
            setMeetingInitialAttendeeIds([]);
          }
        }}
        onSubmit={saveGroupMeeting}
        onCancelMeeting={editingMeeting ? cancelEditingMeeting : undefined}
      />

      <Dialog open={Boolean(deleteConfirm)} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Delete Calendar Event</DialogTitle>
            <DialogDescription className="text-sm font-semibold text-slate-600">
              {deleteConfirm?.isRecurring
                ? "This is a recurring event. Do you want to delete all occurrences or just this one?"
                : "Are you sure you want to delete this event? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-3">
            {deleteConfirm?.isRecurring ? (
              <>
                <Button onClick={() => deleteConfirm && removeEvent(deleteConfirm.event.id, "ALL_EVENTS")} disabled={deleteEvent.isPending} className="w-full justify-center gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700">
                  {deleteEvent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}<Trash2 className="h-4 w-4" /> Delete All Events
                </Button>
                <Button onClick={() => deleteConfirm && removeEvent(deleteConfirm.event.id, "THIS_EVENT", deleteConfirm.instanceDate)} disabled={deleteEvent.isPending} variant="outline" className="w-full justify-center gap-2 rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                  {deleteEvent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}<Trash2 className="h-4 w-4" /> Delete This Event Only
                </Button>
                <Button onClick={() => setDeleteConfirm(null)} disabled={deleteEvent.isPending} variant="outline" className="w-full justify-center rounded-xl">Cancel</Button>
              </>
            ) : (
              <>
                <Button onClick={() => deleteConfirm && removeEvent(deleteConfirm.event.id)} disabled={deleteEvent.isPending} className="w-full justify-center gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700">
                  {deleteEvent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}<Trash2 className="h-4 w-4" /> Yes, Delete Event
                </Button>
                <Button onClick={() => setDeleteConfirm(null)} disabled={deleteEvent.isPending} variant="outline" className="w-full justify-center rounded-xl">Cancel</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Meeting Requests</DialogTitle>
            <DialogDescription className="text-sm font-semibold text-slate-600">Manage invitations and attendee responses.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {incomingRequests.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Incoming Requests ({incomingRequests.length})</h3>
                <div className="space-y-2">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900">{request.title}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Organizer: {request.organizer?.fullName || request.requester?.fullName || "Employee"}</p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">{new Date(request.startAt).toLocaleString()} - {new Date(request.endAt).toLocaleTimeString()}</p>
                          {request.location && <p className="mt-1 text-[11px] font-semibold text-slate-400">📍 {request.location}</p>}
                          {request.attendees.length > 1 && <p className="mt-1 text-[10px] font-bold text-blue-600">{request.attendees.length} attendees</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => respondToMeeting(request, "ACCEPTED")} className="gap-1 bg-emerald-600 hover:bg-emerald-700" disabled={respondMeeting.isPending}><Check className="h-3.5 w-3.5" /> Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => respondToMeeting(request, "DECLINED")} className="gap-1 border-red-200 text-red-600 hover:bg-red-50" disabled={respondMeeting.isPending}><X className="h-3.5 w-3.5" /> Decline</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Outgoing Meetings ({outgoingRequests.length})</h3>
                <div className="space-y-2">
                  {outgoingRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900">{request.title}</p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">{new Date(request.startAt).toLocaleString()} - {new Date(request.endAt).toLocaleTimeString()}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {request.attendees.map((attendee) => (
                              <span key={attendee.id} className={`rounded-full px-2 py-1 text-[9px] font-black ${attendeeStatusClass(attendee.status)}`}>
                                {attendee.user?.fullName || "Attendee"} · {attendee.status}
                              </span>
                            ))}
                          </div>
                        </div>
                        {!request.legacy && (
                          <Button size="sm" variant="outline" onClick={() => openEditMeeting(request)} className="shrink-0 gap-1"><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <div className="py-12 text-center"><p className="text-sm font-bold text-slate-400">No pending meeting requests</p></div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

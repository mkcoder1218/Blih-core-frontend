import { useEffect, useMemo, useState, type ComponentType } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarClock, ChevronDown, Cloud, Edit2, Eye, Loader2, MoreHorizontal, Plus, Search, Send, ShieldOff, Trash2, UserRoundCheck, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useCalendarPeople,
  useCreateMeetingRequest,
  useCreateUserCalendarEvent,
  useDeleteUserCalendarEvent,
  useGoogleCalendarConnection,
  useMeetingRequests,
  useRespondMeetingRequest,
  useSyncUserCalendarEventToGoogle,
  useSyncAllUserCalendarEventsToGoogle,
  useUpdateUserCalendarEvent,
  useUserAvailabilityStatus,
  useUserCalendar,
} from '../../hooks/useUserCalendar';
import { calendarApi, type AvailabilityStatus, type CalendarItemType, type CalendarPerson, type UserCalendarEvent } from '../../api/calendar';
import { useProjects } from '../../features/projects/hooks';
import { useMe } from '../../hooks/useMe';

const FullCalendarView = FullCalendar as unknown as ComponentType<any>;

type Surface = 'mine' | 'team';
type FormState = {
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
  projectId: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  location: '',
  startAt: '',
  endAt: '',
  allDay: false,
  itemType: 'EVENT',
  availabilityStatus: 'AVAILABLE',
  color: '#1a56db',
  projectId: '',
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
  if (item.availabilityStatus === 'UNAVAILABLE') return item.color || '#dc2626';
  if (item.itemType === 'TASK') return item.color || '#7c3aed';
  if (item.itemType === 'MEETING') return item.color || '#2563eb';
  if (item.itemType === 'AVAILABILITY') return item.color || '#059669';
  return item.color || '#1a56db';
}

function typeLabel(type: CalendarItemType) {
  if (type === 'AVAILABILITY') return 'Availability';
  if (type === 'MEETING') return 'Meeting';
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function MonthEventIndicator({ item }: { item: UserCalendarEvent }) {
  return (
    <span className="blih-month-event-indicator">
      <span className="blih-month-event-dot" style={{ backgroundColor: itemColor(item) }} />
      <span className="blih-month-event-title">{item.title}</span>
    </span>
  );
}

function CalendarEventBlock({ title, timeText }: { title: string; timeText?: string }) {
  return (
    <span className="blih-calendar-event-block">
      {timeText && <span className="blih-calendar-event-time">{timeText}</span>}
      <span className="blih-calendar-event-title">{title}</span>
    </span>
  );
}

export default function AttendanceCalendarTab({ showAlert }: { showAlert: (title: string, type?: 'success' | 'info' | 'error') => void }) {
  const [surface, setSurface] = useState<Surface>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<CalendarPerson | null>(null);
  const calendar = useUserCalendar(selectedPerson ? { userId: selectedPerson.id } : undefined);
  const status = useUserAvailabilityStatus();
  const google = useGoogleCalendarConnection();
  const me = useMe();
  const people = useCalendarPeople({ search: searchQuery.trim() || undefined, size: 100 });
  const requests = useMeetingRequests({ size: 50 });
  const projects = useProjects({ size: 100 });
  const createEvent = useCreateUserCalendarEvent();
  const updateEvent = useUpdateUserCalendarEvent();
  const deleteEvent = useDeleteUserCalendarEvent();
  const syncGoogle = useSyncUserCalendarEventToGoogle();
  const syncAllGoogle = useSyncAllUserCalendarEventsToGoogle();
  const createMeeting = useCreateMeetingRequest();
  const respondMeeting = useRespondMeetingRequest();

  const [formOpen, setFormOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [meetingForm, setMeetingForm] = useState({ title: '', description: '', location: '', startAt: '', endAt: '' });
  const [details, setDetails] = useState<{ event: UserCalendarEvent; x: number; y: number; mode?: 'actions' | 'details' } | null>(null);
  const [quickCreate, setQuickCreate] = useState<{ x: number; y: number; startAt: Date; endAt: Date; allDay: boolean; title: string } | null>(null);

  const isReadOnlyCalendar = Boolean(selectedPerson);
  const currentUserId = me.data?.data?.user?.id;
  const activeRequests = (requests.data || []).filter((request) => request.status === 'PENDING');
  const incomingRequests = activeRequests.filter((request) => request.recipientUserId === currentUserId);
  const outgoingRequests = activeRequests.filter((request) => request.requesterUserId === currentUserId);

  useEffect(() => {
    const openRequests = () => {
      setSurface('mine');
      setSelectedPerson(null);
      setRequestsOpen(true);
      requests.refetch();
    };
    window.addEventListener('blih:open-calendar-meeting-requests', openRequests);
    return () => window.removeEventListener('blih:open-calendar-meeting-requests', openRequests);
  }, [requests]);

  const events = useMemo(() => {
    const rows = calendar.data || [];
    return rows.map((item) => {
      const isPendingMeeting = item.itemType === 'MEETING' && item.metadata?.meetingStatus === 'PENDING';
      const color = isPendingMeeting ? '#f59e0b' : itemColor(item);
      const itemStart = new Date(item.startAt);
      const itemEnd = new Date(item.endAt);
      const overlapRank = rows
        .filter((other) => other.id !== item.id && rangesOverlap(itemStart, itemEnd, new Date(other.startAt), new Date(other.endAt)))
        .filter((other) => new Date(other.startAt) <= itemStart)
        .length;
      const overlapOffset = overlapRank ? Math.min(2, overlapRank) : 0;
      return {
        id: item.id,
        title: `${isPendingMeeting ? 'Pending: ' : item.itemType === 'TASK' ? 'Task: ' : item.itemType === 'AVAILABILITY' ? '' : ''}${item.title}`,
        start: item.startAt,
        end: item.endAt,
        allDay: item.allDay,
        editable: !isReadOnlyCalendar && !item.readOnly,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        classNames: [`blih-overlap-offset-${overlapOffset}`],
        extendedProps: { item },
      };
    });
  }, [calendar.data, isReadOnlyCalendar]);

  const openCreate = (start?: Date, end?: Date, itemType: CalendarItemType = 'EVENT') => {
    const startAt = start || new Date();
    const endAt = end || addMinutes(startAt, 60);
    setDetails(null);
    setQuickCreate(null);
    setForm({
      ...EMPTY_FORM,
      itemType,
      availabilityStatus: itemType === 'AVAILABILITY' ? 'UNAVAILABLE' : 'AVAILABLE',
      title: itemType === 'AVAILABILITY' ? 'Unavailable' : '',
      color: itemType === 'TASK' ? '#7c3aed' : itemType === 'AVAILABILITY' ? '#dc2626' : '#1a56db',
      startAt: toLocalInput(startAt),
      endAt: toLocalInput(endAt),
    });
    setFormOpen(true);
  };

  const openQuickCreate = (start: Date, end: Date, allDay: boolean, jsEvent?: MouseEvent) => {
    if (isReadOnlyCalendar) return;
    setDetails(null);
    setFormOpen(false);
    setQuickCreate({
      x: jsEvent?.clientX ?? window.innerWidth / 2,
      y: jsEvent?.clientY ?? 220,
      startAt: start,
      endAt: end,
      allDay,
      title: '',
    });
  };

  const openMeetingRequestAt = (person: CalendarPerson, start: Date, end: Date) => {
    setDetails(null);
    setQuickCreate(null);
    setSelectedPerson(person);
    setMeetingForm({
      title: `Meeting with ${person.fullName}`,
      description: '',
      location: '',
      startAt: toLocalInput(start),
      endAt: toLocalInput(end),
    });
    setMeetingOpen(true);
  };

  const openEdit = (event: UserCalendarEvent) => {
    if (isReadOnlyCalendar || event.readOnly) return;
    setDetails(null);
    setQuickCreate(null);
    setForm({
      id: event.id,
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startAt: toLocalInput(event.startAt),
      endAt: toLocalInput(event.endAt),
      allDay: event.allDay,
      itemType: event.itemType || 'EVENT',
      availabilityStatus: event.availabilityStatus || 'AVAILABLE',
      color: event.color || itemColor(event),
      projectId: event.projectId || '',
    });
    setFormOpen(true);
  };

  const openCreateFromEvent = (event: UserCalendarEvent, itemType: CalendarItemType = 'EVENT') => {
    const startAt = new Date(event.startAt);
    const endAt = addMinutes(startAt, itemType === 'AVAILABILITY' ? 60 : 30);
    openCreate(startAt, endAt, itemType);
  };

  const openMeetingFromEvent = (event: UserCalendarEvent) => {
    const startAt = new Date(event.startAt);
    const endAt = addMinutes(startAt, 30);
    if (selectedPerson) {
      openMeetingRequestAt(selectedPerson, startAt, endAt);
      return;
    }
    setDetails(null);
    showAlert('Search and select a company member first, then request a meeting on their calendar.', 'info');
  };

  const openQuickCreateDetails = () => {
    if (!quickCreate) return;
    const title = quickCreate.title.trim();
    setForm({
      ...EMPTY_FORM,
      title,
      itemType: 'EVENT',
      startAt: toLocalInput(quickCreate.startAt),
      endAt: toLocalInput(quickCreate.endAt),
      allDay: quickCreate.allDay,
    });
    setQuickCreate(null);
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (!form.title.trim() || !form.startAt || !form.endAt) {
      showAlert('Please add a title, start time and end time.', 'error');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description || undefined,
      location: form.location || undefined,
      startAt: fromLocalInput(form.startAt),
      endAt: fromLocalInput(form.endAt),
      allDay: form.allDay,
      itemType: form.itemType,
      availabilityStatus: form.itemType === 'AVAILABILITY' ? form.availabilityStatus : form.availabilityStatus,
      color: form.color,
      projectId: form.itemType === 'TASK' ? form.projectId || null : null,
    };
    try {
      let saved: UserCalendarEvent;
      if (form.id) {
        saved = await updateEvent.mutateAsync({ id: form.id, payload });
        showAlert('Calendar item updated.', 'success');
      } else {
        saved = await createEvent.mutateAsync(payload);
        showAlert(form.itemType === 'TASK' ? 'Task created and linked to Project Management.' : 'Calendar item created.', 'success');
      }
      if (google.data?.connected && saved?.id) {
        try {
          await syncGoogle.mutateAsync(saved.id);
        } catch {
          showAlert('Calendar item saved, but Google sync failed.', 'info');
        }
      }
      setFormOpen(false);
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Could not save calendar item.', 'error');
    }
  };

  const saveQuickCreate = async () => {
    if (!quickCreate?.title.trim()) {
      showAlert('Add a title first.', 'error');
      return;
    }
    try {
      const saved = await createEvent.mutateAsync({
        title: quickCreate.title.trim(),
        startAt: quickCreate.startAt.toISOString(),
        endAt: quickCreate.endAt.toISOString(),
        allDay: quickCreate.allDay,
        itemType: 'EVENT',
        availabilityStatus: 'AVAILABLE',
        color: EMPTY_FORM.color,
      });
      if (google.data?.connected && saved?.id) {
        try {
          await syncGoogle.mutateAsync(saved.id);
        } catch {
          showAlert('Event created, but Google sync failed.', 'info');
        }
      }
      setQuickCreate(null);
      showAlert('Event created.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Could not create event.', 'error');
    }
  };

  const removeEvent = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      setDetails(null);
      setFormOpen(false);
      showAlert('Calendar item deleted.', 'info');
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Could not delete calendar item.', 'error');
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
          result.failedCount ? 'info' : 'success'
        );
      }
      calendar.refetch();
      google.refetch();
      return result;
    } catch (err: any) {
      if (!quiet) showAlert(err?.response?.data?.message || 'Could not sync calendar to Google.', 'error');
      throw err;
    }
  };

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== 'Delete') return;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        Boolean(target?.isContentEditable);
      if (isTyping || formOpen || meetingOpen || requestsOpen || quickCreate || deleteEvent.isPending) return;
      if (!details?.event || isReadOnlyCalendar || details.event.readOnly) return;
      event.preventDefault();
      removeEvent(details.event.id);
    };
    window.addEventListener('keydown', handleDeleteKey);
    return () => window.removeEventListener('keydown', handleDeleteKey);
  }, [deleteEvent.isPending, details, formOpen, isReadOnlyCalendar, meetingOpen, quickCreate, requestsOpen]);

  const connectGoogle = async () => {
    try {
      const { url } = await calendarApi.googleAuthUrl();
      const popup = window.open(url, 'blih-google-calendar', 'width=720,height=760,popup=yes');
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
              showAlert(`${result.syncedCount} calendar item(s) synced to Google.`, 'success');
            } catch {
              showAlert('Google connected, but calendar items could not be synced yet.', 'error');
            }
          }
        }
      }, 2000);
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Google Calendar is not configured.', 'error');
    }
  };

  const setUnavailableNow = () => {
    const startAt = new Date();
    const endAt = addMinutes(startAt, 60);
    openCreate(startAt, endAt, 'AVAILABILITY');
  };

  const openMeetingRequest = (person: CalendarPerson) => {
    const startAt = new Date();
    const minutes = startAt.getMinutes();
    startAt.setMinutes(minutes < 30 ? 30 : 60, 0, 0);
    const endAt = addMinutes(startAt, 30);
    openMeetingRequestAt(person, startAt, endAt);
  };

  const sendMeetingRequest = async () => {
    if (!selectedPerson) return;
    if (!meetingForm.title.trim() || !meetingForm.startAt || !meetingForm.endAt) {
      showAlert('Add a meeting title and time.', 'error');
      return;
    }
    try {
      await createMeeting.mutateAsync({
        recipientUserId: selectedPerson.id,
        title: meetingForm.title.trim(),
        description: meetingForm.description || undefined,
        location: meetingForm.location || undefined,
        startAt: fromLocalInput(meetingForm.startAt),
        endAt: fromLocalInput(meetingForm.endAt),
      });
      setMeetingOpen(false);
      showAlert('Meeting request sent.', 'success');
      requests.refetch();
      calendar.refetch();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Could not send meeting request.', 'error');
    }
  };

  const respondToMeeting = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await respondMeeting.mutateAsync({ id, payload: { status } });
      showAlert(status === 'ACCEPTED' ? 'Meeting accepted.' : 'Meeting declined.', status === 'ACCEPTED' ? 'success' : 'info');
      requests.refetch();
      calendar.refetch();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Could not update meeting request.', 'error');
    }
  };

  const handleDropResize = async (info: any) => {
    const item = info.event.extendedProps.item as UserCalendarEvent;
    if (!item || item.readOnly || isReadOnlyCalendar || !info.event.start) {
      info.revert?.();
      return;
    }
    try {
      const saved = await updateEvent.mutateAsync({
        id: item.id,
        payload: {
          startAt: info.event.start.toISOString(),
          endAt: (info.event.end || addMinutes(info.event.start, 60)).toISOString(),
          allDay: info.event.allDay,
        },
      });
      if (google.data?.connected && saved?.id) {
        try {
          await syncGoogle.mutateAsync(saved.id);
        } catch {
          showAlert('Calendar item moved, but Google sync failed.', 'info');
        }
      }
      showAlert('Calendar item moved.', 'success');
    } catch (err: any) {
      info.revert?.();
      showAlert(err?.response?.data?.message || 'Could not move calendar item.', 'error');
    }
  };

  const selected = details?.event;
  const hasMeetingActivity = activeRequests.length > 0;
  const searchSuggestions = (people.data || []).slice(0, 8);
  const overlappingFormEvents = useMemo(() => {
    if (!formOpen || form.id || !form.startAt || !form.endAt) return [];
    const startAt = new Date(form.startAt);
    const endAt = new Date(form.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) return [];
    return (calendar.data || []).filter((event) => rangesOverlap(startAt, endAt, new Date(event.startAt), new Date(event.endAt)));
  }, [calendar.data, form.endAt, form.id, form.startAt, formOpen]);

  const selectSearchPerson = (person: CalendarPerson) => {
    setSurface('mine');
    setSelectedPerson(person);
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="-mx-3 border-b border-slate-200 bg-white px-3 py-3 sm:mx-0 sm:rounded-xl sm:border sm:px-5 sm:py-4 sm:shadow-2xs">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-base">Calendar</h3>
            <p className="mt-0.5 hidden text-xs font-medium text-slate-500 min-[380px]:block sm:mt-1 sm:text-[11px] sm:font-semibold">Schedule and availability in one view.</p>
            <div className="relative mt-2 max-w-md sm:mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                placeholder="Search company members to check availability"
                className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 shadow-none outline-none ring-0 transition focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
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
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSearchPerson(person)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-black text-slate-900">{person.fullName}</span>
                            <span className="block truncate text-[11px] font-semibold text-slate-400">{person.email}</span>
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${person.availabilityStatus === 'UNAVAILABLE' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {person.availabilityStatus}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-xs font-bold text-slate-400">No company members found.</div>
                  )}
                </div>
              )}
              {selectedPerson && surface === 'mine' && (
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
                onClick={() => { setSurface('mine'); setSelectedPerson(null); }}
                className={`rounded-lg px-3 py-2 text-[13px] font-bold transition-colors sm:px-3.5 sm:text-xs ${
                  surface === 'mine' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                My Schedule
              </button>
              <button
                onClick={() => setSurface('team')}
                className={`rounded-lg px-3 py-2 text-[13px] font-bold transition-colors sm:px-3.5 sm:text-xs ${
                  surface === 'team' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
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
                <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-lg ring-1 ring-slate-200/80">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Calendar actions
                  </div>
                  <DropdownMenuItem onClick={() => setRequestsOpen(true)} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span>Meeting Requests</span>
                      {hasMeetingActivity && (
                        <span className="inline-flex items-center gap-1.5">
                          {!!incomingRequests.length && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{incomingRequests.length}</span>}
                          {!!outgoingRequests.length && <span className="h-2 w-2 rounded-full bg-red-500" />}
                        </span>
                      )}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={connectGoogle} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    {google.data?.connected ? 'Google Connected' : 'Connect Google'}
                  </DropdownMenuItem>
                  {google.data?.connected && (
                    <DropdownMenuItem
                      onClick={() => syncAllCalendarToGoogle()}
                      disabled={syncAllGoogle.isPending}
                      className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold"
                    >
                      {syncAllGoogle.isPending ? 'Syncing to Google...' : 'Sync calendar to Google'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                  <DropdownMenuItem onClick={() => openCreate(undefined, undefined, 'AVAILABILITY')} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    Block Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={setUnavailableNow} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span>Set Unavailable</span>
                      <span className={`h-2 w-2 rounded-full ${status.data?.availabilityStatus === 'UNAVAILABLE' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button className="h-9 rounded-xl bg-blue-600 px-3 text-[13px] font-bold text-white shadow-none hover:bg-blue-700 sm:h-10 sm:px-4 sm:text-xs" onClick={() => openCreate(undefined, undefined, 'EVENT')}>
                <Plus className="mr-1.5 h-4 w-4" />
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>

      {surface === 'team' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-none sm:rounded-2xl sm:border-slate-100 sm:shadow-2xs">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-xs font-black text-slate-900">Everyone</h4>
              <span className="text-[10px] font-bold text-slate-400">Unavailable people are disabled for meeting requests.</span>
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
                    <tr key={person.id} className={selectedPerson?.id === person.id ? 'bg-blue-50/60' : 'bg-white'}>
                      <td className="px-3 py-2">
                        <button className="text-left" onClick={() => setSelectedPerson(person)}>
                          <span className="block font-black text-slate-900">{person.fullName}</span>
                          <span className="block text-[10px] font-semibold text-slate-400">{person.email}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${person.availabilityStatus === 'UNAVAILABLE' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {person.availabilityStatus === 'UNAVAILABLE' ? <WifiOff className="h-3 w-3" /> : <UserRoundCheck className="h-3 w-3" />}
                          {person.availabilityStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="outline" disabled={person.availabilityStatus === 'UNAVAILABLE'} onClick={() => openMeetingRequest(person)} className="gap-1">
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
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-none sm:rounded-2xl sm:border-slate-100 sm:shadow-2xs">
            <h4 className="mb-3 text-xs font-black text-slate-900">{selectedPerson ? `${selectedPerson.fullName}'s Calendar` : 'Select an employee'}</h4>
            {selectedPerson ? <CalendarCanvas events={events} loading={calendar.isLoading} readOnly onEventClick={(item, x, y) => setDetails({ event: item, x, y, mode: 'actions' })} /> : (
              <div className="rounded-lg bg-slate-50 py-12 text-center text-xs font-semibold text-slate-400 sm:rounded-xl sm:py-14">Select someone to preview their calendar.</div>
            )}
          </div>
        </div>
      )}

      {surface === 'mine' && (
        <>
          <CalendarCanvas
            events={events}
            loading={calendar.isLoading}
            selectable
            editable={!selectedPerson}
            onSelect={(info) => selectedPerson ? openMeetingRequestAt(selectedPerson, info.start, info.end) : openQuickCreate(info.start, info.end, info.allDay, info.jsEvent)}
            onDateClick={(info) => selectedPerson ? openMeetingRequestAt(selectedPerson, info.date, addMinutes(info.date, 60)) : openQuickCreate(info.date, addMinutes(info.date, 60), info.allDay, info.jsEvent)}
            onEventDrop={handleDropResize}
            onEventResize={handleDropResize}
            onEventClick={(item, x, y) => { setQuickCreate(null); setDetails({ event: item, x, y, mode: 'actions' }); }}
          />
        </>
      )}

      {quickCreate && (
        <div className="fixed z-[80] w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg" style={{ left: Math.min(quickCreate.x, window.innerWidth - 340), top: Math.min(quickCreate.y + 12, window.innerHeight - 230) }}>
          <Input autoFocus placeholder="Add title" value={quickCreate.title} onChange={(e) => { const value = e.currentTarget.value; setQuickCreate((p) => p ? { ...p, title: value } : p); }} onKeyDown={(e) => { if (e.key === 'Enter') saveQuickCreate(); if (e.key === 'Escape') setQuickCreate(null); }} />
          <p className="mt-2 text-[11px] font-semibold text-slate-500">{quickCreate.startAt.toLocaleString()} - {quickCreate.endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setQuickCreate(null)}>Cancel</Button>
            <Button size="sm" variant="outline" onClick={openQuickCreateDetails}>More options</Button>
            <Button size="sm" onClick={saveQuickCreate} disabled={createEvent.isPending}>{createEvent.isPending ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      )}

      {selected && details && (
        <div className="fixed inset-x-3 bottom-3 z-[80] rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:inset-auto sm:w-80 sm:p-4" style={{ left: window.innerWidth >= 640 ? Math.min(details.x, window.innerWidth - 340) : undefined, top: window.innerWidth >= 640 ? Math.min(details.y + 12, window.innerHeight - 360) : undefined }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: itemColor(selected) }} />
                <p className="truncate text-sm font-black text-slate-950">{selected.title}</p>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{new Date(selected.startAt).toLocaleString()} - {new Date(selected.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button onClick={() => setDetails(null)} className="text-xs font-black text-slate-400 hover:text-slate-700">Close</button>
          </div>
          {details.mode === 'details' ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{typeLabel(selected.itemType)}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${selected.availabilityStatus === 'UNAVAILABLE' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{selected.availabilityStatus}</span>
                {selected.project && <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700">{selected.project.title}</span>}
                {selected.googleSyncedAt && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700"><Cloud className="h-3 w-3" /> Synced</span>}
              </div>
              {selected.description && <p className="mt-3 text-xs leading-5 text-slate-600">{selected.description}</p>}
            </>
          ) : (
            <div className="mt-4 grid gap-2">
              <Button size="sm" variant="outline" className="justify-start gap-2" onClick={() => setDetails((current) => current ? { ...current, mode: 'details' } : current)}>
                <Eye className="h-3.5 w-3.5" /> View details
              </Button>
              <Button size="sm" variant="outline" className="justify-start gap-2" disabled={isReadOnlyCalendar || selected.readOnly} onClick={() => openEdit(selected)}>
                <Edit2 className="h-3.5 w-3.5" /> Edit event
              </Button>
              <Button size="sm" variant="outline" className="justify-start gap-2" disabled={isReadOnlyCalendar} onClick={() => openCreateFromEvent(selected, 'EVENT')}>
                <Plus className="h-3.5 w-3.5" /> Add event here
              </Button>
              <Button size="sm" variant="outline" className="justify-start gap-2" onClick={() => openMeetingFromEvent(selected)}>
                <Send className="h-3.5 w-3.5" /> Request meeting here
              </Button>
              <Button size="sm" variant="outline" className="justify-start gap-2" disabled={isReadOnlyCalendar} onClick={() => openCreateFromEvent(selected, 'AVAILABILITY')}>
                <ShieldOff className="h-3.5 w-3.5" /> Block this time
              </Button>
            </div>
          )}
          {details.mode === 'details' && !isReadOnlyCalendar && !selected.readOnly && (
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(selected)}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => syncGoogle.mutate(selected.id)}><Cloud className="h-3.5 w-3.5" /> Sync</Button>
              <Button size="sm" variant="destructive" onClick={() => removeEvent(selected.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-blue-600" />{form.id ? 'Edit calendar item' : 'Create calendar item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select value={form.itemType} onChange={(e) => { const value = e.currentTarget.value as CalendarItemType; setForm((p) => ({ ...p, itemType: value, availabilityStatus: value === 'AVAILABILITY' ? 'UNAVAILABLE' : p.availabilityStatus, color: value === 'TASK' ? '#7c3aed' : value === 'AVAILABILITY' ? '#dc2626' : p.color })); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                <option value="EVENT">Event</option>
                <option value="TASK">Task</option>
                <option value="AVAILABILITY">Availability block</option>
              </select>
              {form.itemType === 'TASK' ? (
                <select value={form.projectId} onChange={(e) => { const value = e.currentTarget.value; setForm((p) => ({ ...p, projectId: value })); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                  <option value="">Personal Tasks</option>
                  {(projects.data?.rows || []).map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select>
              ) : (
                <select value={form.availabilityStatus} onChange={(e) => { const value = e.currentTarget.value as AvailabilityStatus; setForm((p) => ({ ...p, availabilityStatus: value })); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                  <option value="AVAILABLE">Does not block availability</option>
                  <option value="UNAVAILABLE">Blocks availability</option>
                </select>
              )}
            </div>
            <Input placeholder={form.itemType === 'TASK' ? 'Task title' : 'Title'} value={form.title} onChange={(e) => { const value = e.currentTarget.value; setForm((p) => ({ ...p, title: value })); }} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input type="datetime-local" value={form.startAt} onChange={(e) => { const value = e.currentTarget.value; setForm((p) => ({ ...p, startAt: value })); }} />
              <Input type="datetime-local" value={form.endAt} onChange={(e) => { const value = e.currentTarget.value; setForm((p) => ({ ...p, endAt: value })); }} />
            </div>
            {!!overlappingFormEvents.length && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                This overlaps with {overlappingFormEvents.length} existing {overlappingFormEvents.length === 1 ? 'event' : 'events'}.
              </div>
            )}
            <Input placeholder="Location or meeting link" value={form.location} onChange={(e) => { const value = e.currentTarget.value; setForm((p) => ({ ...p, location: value })); }} />
            <Textarea placeholder="Notes" rows={4} value={form.description} onChange={(e) => { const value = e.currentTarget.value; setForm((p) => ({ ...p, description: value })); }} />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input type="checkbox" checked={form.allDay} onChange={(e) => { const checked = e.currentTarget.checked; setForm((p) => ({ ...p, allDay: checked })); }} />
                All-day
              </label>
              <Input type="color" value={form.color} onChange={(e) => { const value = e.currentTarget.value; setForm((p) => ({ ...p, color: value })); }} className="w-16" />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              {form.id ? <Button variant="destructive" onClick={() => removeEvent(form.id!)} disabled={deleteEvent.isPending}>Delete</Button> : <span />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button onClick={saveForm} disabled={createEvent.isPending || updateEvent.isPending}>{createEvent.isPending || updateEvent.isPending ? 'Saving...' : 'Save'}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              Meeting Requests
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {requests.isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-10 text-xs font-bold text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading requests...
              </div>
            ) : !activeRequests.length ? (
              <div className="rounded-xl bg-slate-50 py-10 text-center text-xs font-bold text-slate-400">
                No pending meeting requests.
              </div>
            ) : (
              activeRequests.map((request) => {
                const isIncoming = request.recipientUserId === currentUserId;
                return (
                  <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-none sm:border-slate-100 sm:p-4 sm:shadow-2xs">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${isIncoming ? 'bg-blue-600' : 'bg-red-500'}`} />
                          <p className="text-sm font-black text-slate-950">{request.title}</p>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          {new Date(request.startAt).toLocaleString()} - {new Date(request.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          {isIncoming
                            ? `From ${request.requester?.fullName || 'teammate'}`
                            : `Waiting for ${request.recipient?.fullName || 'teammate'}`}
                        </p>
                        {request.description && <p className="mt-2 text-xs leading-5 text-slate-600">{request.description}</p>}
                      </div>
                      {isIncoming ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={respondMeeting.isPending}
                            onClick={() => respondToMeeting(request.id, 'DECLINED')}
                            className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={respondMeeting.isPending}
                            onClick={() => respondToMeeting(request.id, 'ACCEPTED')}
                            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                          >
                            <span className="h-2 w-2 rounded-full bg-white" />
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">Waiting</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Let's meet</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Meeting title" value={meetingForm.title} onChange={(e) => { const value = e.currentTarget.value; setMeetingForm((p) => ({ ...p, title: value })); }} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input type="datetime-local" value={meetingForm.startAt} onChange={(e) => { const value = e.currentTarget.value; setMeetingForm((p) => ({ ...p, startAt: value })); }} />
              <Input type="datetime-local" value={meetingForm.endAt} onChange={(e) => { const value = e.currentTarget.value; setMeetingForm((p) => ({ ...p, endAt: value })); }} />
            </div>
            <Input placeholder="Location or meeting link" value={meetingForm.location} onChange={(e) => { const value = e.currentTarget.value; setMeetingForm((p) => ({ ...p, location: value })); }} />
            <Textarea placeholder="Message" rows={3} value={meetingForm.description} onChange={(e) => { const value = e.currentTarget.value; setMeetingForm((p) => ({ ...p, description: value })); }} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMeetingOpen(false)}>Cancel</Button>
              <Button onClick={sendMeetingRequest} disabled={createMeeting.isPending}>Send request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CalendarCanvas(props: {
  events: any[];
  loading: boolean;
  readOnly?: boolean;
  selectable?: boolean;
  editable?: boolean;
  onSelect?: (info: any) => void;
  onDateClick?: (info: any) => void;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  onEventClick?: (item: UserCalendarEvent, x: number, y: number) => void;
}) {
  const canEdit = props.editable ?? !props.readOnly;

  return (
    <div className="blih-events-calendar blih-layered-overlap-calendar rounded-xl border border-slate-200 bg-white p-2 shadow-none sm:rounded-2xl sm:border-slate-100 sm:p-5 sm:shadow-2xs">
      {props.loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-xs font-bold text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading calendar...
        </div>
      ) : (
        <FullCalendarView
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={props.readOnly ? 'timeGridDay' : 'timeGridWeek'}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: props.readOnly ? 'timeGridDay,listWeek' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
          buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day', list: 'List' }}
          events={props.events}
          selectable={props.selectable ?? !props.readOnly}
          editable={canEdit}
          eventResizableFromStart={canEdit}
          eventStartEditable={canEdit}
          eventDurationEditable={canEdit}
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
          select={props.onSelect}
          dateClick={props.onDateClick}
          eventDrop={props.onEventDrop}
          eventResize={props.onEventResize}
          eventContent={(info: any) => {
            const item = info.event.extendedProps.item as UserCalendarEvent;
            if (info.view.type === 'dayGridMonth') return <MonthEventIndicator item={item} />;
            return <CalendarEventBlock title={info.event.title} timeText={info.timeText} />;
          }}
          eventDidMount={(info: any) => {
            const start = info.event.start?.getTime() || 0;
            const end = info.event.end?.getTime() || start + 30 * 60_000;
            const durationMinutes = Math.max(1, Math.round((end - start) / 60_000));
            const laterStartWeight = Math.round((start % 86_400_000) / 60_000);
            const shorterEventWeight = Math.max(0, 1_440 - durationMinutes);
            const createdAt = new Date(info.event.extendedProps.item?.createdAt || 0).getTime();
            const createdWeight = Number.isNaN(createdAt) ? 0 : createdAt % 1_000;
            const harness = info.el.closest('.fc-timegrid-event-harness') as HTMLElement | null;
            if (harness) {
              harness.style.zIndex = String(10 + laterStartWeight + shorterEventWeight + createdWeight);
            }
          }}
          eventClick={(info: any) => {
            const item = info.event.extendedProps.item as UserCalendarEvent;
            props.onEventClick?.(item, info.jsEvent.clientX, info.jsEvent.clientY);
          }}
        />
      )}
    </div>
  );
}

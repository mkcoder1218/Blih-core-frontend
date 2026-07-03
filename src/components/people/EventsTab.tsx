/**
 * EventsTab — Company calendar events with two permission-gated sub-tabs:
 *   1. "Upcoming Events"  — visible to all (profiles.self / profiles.read)
 *   2. "Manage Events"    — visible to HR (hr.read / hr.write)
 */
import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import {
  Calendar, Plus, Edit2, Trash2, PartyPopper, Star, TrendingUp, Globe, Briefcase,
} from 'lucide-react';
import {
  TabSwitcher, PageHeader, EmptyState, LoadingSpinner, ConfirmDialog,
  FormField, FormRow, InfoAlert, SectionCard,
} from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMyPermissions } from '../../hooks/usePermissions';
import { useUpcomingEvents, useHREvents, useCreateHREvent, useUpdateHREvent, useDeleteHREvent } from '../../hooks/useHREvents';
import type { HREvent, HREventType, CreateHREventPayload } from '../../api/hrEvents';
import HolidayImportPanel from './HolidayImportPanel';

const FullCalendarView = FullCalendar as unknown as ComponentType<any>;

// ── Event type config ──────────────────────────────────────────────────────────
const EVENT_TYPE_CONFIG: Record<string, { label: string; emoji: string; gradient: string; icon: ReactNode }> = {
  birthday:        { label: 'Birthday',        emoji: '🎂', gradient: 'from-sky-400 to-blue-600',     icon: <PartyPopper className="w-4 h-4" /> },
  work_anniversary:{ label: 'Work Anniversary', emoji: '🏆', gradient: 'from-purple-400 to-pink-500', icon: <Star className="w-4 h-4" /> },
  promotion:       { label: 'Promotion',        emoji: '🚀', gradient: 'from-amber-400 to-orange-500', icon: <TrendingUp className="w-4 h-4" /> },
  holiday:         { label: 'Holiday',          emoji: '🗓️', gradient: 'from-emerald-400 to-teal-500', icon: <Globe className="w-4 h-4" /> },
  company_event:   { label: 'Company Event',   emoji: '🎉', gradient: 'from-violet-400 to-indigo-500', icon: <Briefcase className="w-4 h-4" /> },
  other:           { label: 'Other',            emoji: '📌', gradient: 'from-slate-400 to-slate-600',  icon: <Calendar className="w-4 h-4" /> },
};

const EVENT_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  birthday:         { bg: '#0284c7', border: '#0369a1', text: '#ffffff' },
  work_anniversary: { bg: '#9333ea', border: '#7e22ce', text: '#ffffff' },
  promotion:        { bg: '#d97706', border: '#b45309', text: '#ffffff' },
  holiday:          { bg: '#059669', border: '#047857', text: '#ffffff' },
  company_event:    { bg: '#4f46e5', border: '#4338ca', text: '#ffffff' },
  other:            { bg: '#64748b', border: '#475569', text: '#ffffff' },
};

const CATEGORY_FILTERS: { id: string; label: string; type: string | null }[] = [
  { id: 'all',              label: 'All',              type: null },
  { id: 'birthday',         label: 'Birthdays',        type: 'birthday' },
  { id: 'work_anniversary', label: 'Work Anniversaries', type: 'work_anniversary' },
  { id: 'promotion',        label: 'Promoted',         type: 'promotion' },
  { id: 'holiday',          label: 'Holidays',         type: 'holiday' },
  { id: 'company_event',    label: 'Company Events',   type: 'company_event' },
];

// Format a date string nicely: "Jan 22nd"
function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  const month = dt.toLocaleString('en-US', { month: 'short' });
  const day = dt.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${month} ${day}${suffix}`;
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T12:00:00'); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400_000);
}

function addOneDay(dateStr?: string | null) {
  if (!dateStr) return undefined;
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Upcoming Events sub-tab ────────────────────────────────────────────────────
export function EventsCalendarPanel() {
  const { data, isLoading } = useHREvents({ size: 500 });
  const [selectedEvent, setSelectedEvent] = useState<HREvent | null>(null);

  const calendarEvents = useMemo(() => {
    return (data?.rows ?? []).map((ev) => {
      const cfg = EVENT_TYPE_CONFIG[ev.eventType] ?? EVENT_TYPE_CONFIG.other;
      const colors = EVENT_TYPE_COLORS[ev.eventType] ?? EVENT_TYPE_COLORS.other;

      return {
        id: ev.id,
        title: `${ev.emoji || cfg.emoji} ${ev.title}`,
        start: ev.eventDate,
        end: addOneDay(ev.endDate),
        allDay: true,
        backgroundColor: ev.color || colors.bg,
        borderColor: ev.color || colors.border,
        textColor: colors.text,
        extendedProps: { event: ev },
      };
    });
  }, [data?.rows]);

  const handleEventClick = (arg: EventClickArg) => {
    setSelectedEvent(arg.event.extendedProps.event as HREvent);
  };

  const selectedConfig = selectedEvent
    ? EVENT_TYPE_CONFIG[selectedEvent.eventType] ?? EVENT_TYPE_CONFIG.other
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-950 tracking-tight">Events Calendar</h4>
          <p className="text-[11px] text-slate-500 font-medium">Company events, holidays, birthdays and milestones in one calendar.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 flex-wrap">
          {Object.entries(EVENT_TYPE_CONFIG).slice(0, 6).map(([key, cfg]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: EVENT_TYPE_COLORS[key]?.bg ?? EVENT_TYPE_COLORS.other.bg }}
              />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      <div className="blih-events-calendar rounded-2xl border border-slate-100 bg-white p-3 shadow-2xs sm:p-5">
        {isLoading ? (
          <LoadingSpinner label="Loading calendar..." />
        ) : (
          <FullCalendarView
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listMonth',
            }}
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              list: 'List',
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
            nowIndicator
            eventDisplay="block"
            firstDay={1}
          />
        )}
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          {selectedEvent && selectedConfig && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-base text-white"
                    style={{ backgroundColor: selectedEvent.color || EVENT_TYPE_COLORS[selectedEvent.eventType]?.bg || EVENT_TYPE_COLORS.other.bg }}
                  >
                    {selectedEvent.emoji || selectedConfig.emoji}
                  </span>
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                    {selectedConfig.label}
                  </span>
                  {selectedEvent.isRecurring && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-600">
                      Annual
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-600">
                    {selectedEvent.visibility}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatFullDate(selectedEvent.eventDate)}
                    {selectedEvent.endDate ? ` to ${formatFullDate(selectedEvent.endDate)}` : ''}
                  </p>
                </div>

                {selectedEvent.description && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Details</p>
                    <p className="mt-1 leading-6 text-slate-600">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.employee && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</p>
                    <p className="mt-1 font-semibold text-slate-800">{selectedEvent.employee.fullName}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UpcomingEventsPanel({ showAlert }: { showAlert: (m: string, t?: 'success' | 'info' | 'error') => void }) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data, isLoading } = useUpcomingEvents(365);

  const allEvents = data?.rows ?? [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const filtered  = (activeFilter === 'all' ? allEvents : allEvents.filter(e => e.eventType === activeFilter))
    .filter(e => new Date(e.eventDate + 'T12:00:00') >= today);

  return (
    <div className="space-y-5">
      {/* Header row: title + filters + view toggle */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-950 tracking-tight">Upcoming Events</h4>
          <p className="text-[11px] text-slate-500 font-medium">Company celebrations and holidays.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Category pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {CATEGORY_FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer select-none transition-all ${
                  activeFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading events…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Calendar />} title="No upcoming events" description="Events will appear here once added by HR." />
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(ev => {
            const cfg  = EVENT_TYPE_CONFIG[ev.eventType] ?? EVENT_TYPE_CONFIG.other;
            const days = daysUntil(ev.eventDate);
            const name = ev.employee?.fullName ?? ev.title;
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={ev.id}
                onClick={() => showAlert(`${cfg.label}: ${ev.title}`, 'info')}
                className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col items-center justify-between text-center overflow-hidden h-[340px] cursor-pointer shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all"
              >
                <div className={`relative w-36 h-36 bg-gradient-to-tr ${cfg.gradient} rounded-2xl flex items-center justify-center text-white mt-1 shadow-inner overflow-hidden`}>
                  {ev.emoji ? (
                    <span className="text-4xl">{ev.emoji}</span>
                  ) : ev.eventType === 'holiday' ? (
                    <div className="w-full h-full flex flex-col justify-between py-4 text-center bg-slate-50">
                      <span className="text-xs uppercase tracking-widest font-black text-rose-500 block">
                        {new Date(ev.eventDate + 'T12:00:00').toLocaleString('en-US', { month: 'long' })}
                      </span>
                      <span className="text-5xl font-extrabold text-slate-800 block tracking-tighter">
                        {new Date(ev.eventDate + 'T12:00:00').getDate()}
                      </span>
                      {ev.metadata?.country && <span className="text-[9px] text-slate-400 font-bold uppercase">{ev.metadata.country}</span>}
                    </div>
                  ) : (
                    <span className="text-3xl font-black text-white/90">{initials}</span>
                  )}
                  {ev.employee && (
                    <div className="absolute bottom-2 left-0 right-0 bg-black/20 backdrop-blur-sm py-1 text-[10px] uppercase tracking-wider font-extrabold text-white/90">
                      {ev.employee.fullName}
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-1 w-full">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">
                    {cfg.label}
                    {days === 0 && <span className="ml-1 text-emerald-600">· Today!</span>}
                    {days === 1 && <span className="ml-1 text-blue-600">· Tomorrow</span>}
                    {days > 1  && days <= 14 && <span className="ml-1 text-amber-500">· in {days}d</span>}
                  </span>
                  <span className="text-sm font-black text-slate-800 block">{fmtDate(ev.eventDate)}</span>
                  {ev.description && <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{ev.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="space-y-2">
          {filtered.map(ev => {
            const cfg  = EVENT_TYPE_CONFIG[ev.eventType] ?? EVENT_TYPE_CONFIG.other;
            const days = daysUntil(ev.eventDate);

            return (
              <div key={ev.id}
                onClick={() => showAlert(`${cfg.label}: ${ev.title}`, 'info')}
                className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-xs transition-all cursor-pointer"
              >
                {/* Colored icon */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${cfg.gradient} flex items-center justify-center text-white flex-shrink-0 text-xl shadow-inner`}>
                  {ev.emoji || cfg.emoji}
                </div>

                {/* Date block */}
                <div className="flex-shrink-0 text-center w-14">
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                    {new Date(ev.eventDate + 'T12:00:00').toLocaleString('en-US', { month: 'short' })}
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-tight">
                    {new Date(ev.eventDate + 'T12:00:00').getDate()}
                  </p>
                </div>

                {/* Separator */}
                <div className="w-px h-10 bg-slate-100 flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-black text-slate-900 truncate">{ev.title}</p>
                    <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0">{cfg.label}</span>
                    {ev.isRecurring && <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded flex-shrink-0">Annual</span>}
                  </div>
                  {ev.description && (
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ev.description}</p>
                  )}
                  {ev.employee && (
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{ev.employee.fullName}</p>
                  )}
                </div>

                {/* Days badge */}
                <div className="flex-shrink-0 text-right">
                  {days === 0 && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-black px-2 py-1 rounded-lg">Today!</span>
                  )}
                  {days === 1 && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-black px-2 py-1 rounded-lg">Tomorrow</span>
                  )}
                  {days > 1 && days <= 14 && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-black px-2 py-1 rounded-lg">in {days}d</span>
                  )}
                  {days > 14 && (
                    <span className="text-[10px] text-slate-300 font-bold">{fmtDate(ev.eventDate)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Manage Events sub-tab ──────────────────────────────────────────────────────
const EMPTY_FORM: CreateHREventPayload & { id?: string } = {
  eventType: 'company_event', title: '', description: '', eventDate: '',
  endDate: '', isRecurring: false, visibility: 'all', employeeUserId: '', emoji: '', color: '',
};

function ManageEventsPanel({ showAlert }: { showAlert: (m: string, t?: 'success' | 'info' | 'error') => void }) {
  const { data, isLoading } = useHREvents({ size: 200 });
  const createEvent = useCreateHREvent();
  const updateEvent = useUpdateHREvent();
  const deleteEvent = useDeleteHREvent();

  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [editing, setEditing]       = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const allEvents = data?.rows ?? [];
  const filtered  = typeFilter === 'all' ? allEvents : allEvents.filter(e => e.eventType === typeFilter);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (ev: HREvent) => {
    setEditing(ev.id);
    setForm({
      id: ev.id, eventType: ev.eventType, title: ev.title, description: ev.description ?? '',
      eventDate: ev.eventDate, endDate: ev.endDate ?? '', isRecurring: ev.isRecurring,
      visibility: ev.visibility, employeeUserId: ev.employeeUserId ?? '',
      emoji: ev.emoji ?? '', color: ev.color ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.eventDate) return;
    const payload = {
      eventType:       form.eventType,
      title:           form.title,
      description:     form.description || undefined,
      eventDate:       form.eventDate,
      endDate:         form.endDate     || undefined,
      isRecurring:     Boolean(form.isRecurring),
      visibility:      form.visibility,
      employeeUserId:  form.employeeUserId || undefined,
      emoji:           form.emoji          || undefined,
      color:           form.color          || undefined,
    };
    try {
      if (editing) {
        await updateEvent.mutateAsync({ id: editing, ...payload });
        showAlert('Event updated successfully!', 'success');
      } else {
        await createEvent.mutateAsync(payload);
        showAlert('Event created successfully!', 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      showAlert(err?.response?.data?.error ?? 'Failed to save event.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteEvent.mutateAsync(deleteId);
    setDeleteId(null);
    showAlert('Event deleted.', 'info');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-950 tracking-tight">Manage Events</h4>
          <p className="text-[11px] text-slate-500 font-medium">Create, edit and delete company calendar events.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={typeFilter} onChange={e => setTypeFilter(e.currentTarget.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer">
            <option value="all">All Types</option>
            {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="w-4 h-4" /> New Event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading events…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Calendar />} title="No events yet" description="Create your first event using the button above."
          action={<Button onClick={openCreate} className="gap-1.5"><Plus className="w-4 h-4" />New Event</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map(ev => {
            const cfg  = EVENT_TYPE_CONFIG[ev.eventType] ?? EVENT_TYPE_CONFIG.other;
            const days = daysUntil(ev.eventDate);
            return (
              <div key={ev.id}
                className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 hover:border-slate-200 transition-all">
                {/* Color dot */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cfg.gradient} flex items-center justify-center text-white flex-shrink-0 text-lg`}>
                  {ev.emoji || cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-black text-slate-900">{ev.title}</p>
                    <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase">{cfg.label}</span>
                    {ev.isRecurring && <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded">Recurring</span>}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      ev.visibility === 'all' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>{ev.visibility}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 font-semibold">
                    <span>{fmtDate(ev.eventDate)}{ev.endDate ? ` → ${fmtDate(ev.endDate)}` : ''}</span>
                    {days >= 0 && days <= 7 && <span className="text-emerald-600 font-bold">· {days === 0 ? 'Today' : `in ${days}d`}</span>}
                    {ev.employee && <span>· {ev.employee.fullName}</span>}
                    {ev.department && <span>· {ev.department.name}</span>}
                  </div>
                  {ev.description && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ev.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(ev.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Public Holiday Import ─────────────────────────────────────────── */}
      <HolidayImportPanel showAlert={showAlert} />

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              {editing ? 'Edit Event' : 'New Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <FormRow cols={2}>
              <FormField label="Event Type" required>
                <Select value={form.eventType} onValueChange={v => setForm(p => ({ ...p, eventType: v as HREventType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Visibility">
                <Select value={form.visibility} onValueChange={v => setForm(p => ({ ...p, visibility: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    <SelectItem value="department">Department only</SelectItem>
                    <SelectItem value="individual">Individual only</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </FormRow>
            <FormField label="Event Title" required>
              <Input placeholder="e.g. Adwa Victory Day" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.currentTarget.value }))} />
            </FormField>
            <FormRow cols={2}>
              <FormField label="Event Date" required>
                <Input type="date" value={form.eventDate}
                  onChange={e => setForm(p => ({ ...p, eventDate: e.currentTarget.value }))} />
              </FormField>
              <FormField label="End Date (optional)">
                <Input type="date" value={form.endDate as string}
                  onChange={e => setForm(p => ({ ...p, endDate: e.currentTarget.value }))} />
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Emoji (optional)">
                <Input placeholder="e.g. 🎂" value={form.emoji as string}
                  onChange={e => setForm(p => ({ ...p, emoji: e.currentTarget.value }))} />
              </FormField>
              <FormField label="Employee User ID (optional)">
                <Input placeholder="For personal events" value={form.employeeUserId as string}
                  onChange={e => setForm(p => ({ ...p, employeeUserId: e.currentTarget.value }))} />
              </FormField>
            </FormRow>
            <FormField label="Description">
              <Textarea placeholder="Event details…" rows={3} value={form.description as string}
                onChange={e => setForm(p => ({ ...p, description: e.currentTarget.value }))} />
            </FormField>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input type="checkbox" checked={Boolean(form.isRecurring)}
                onChange={e => setForm(p => ({ ...p, isRecurring: e.currentTarget.checked }))}
                className="rounded" />
              Recurring annually
            </label>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!form.title.trim() || !form.eventDate || createEvent.isPending || updateEvent.isPending}
                onClick={handleSubmit}>
                {(createEvent.isPending || updateEvent.isPending) ? 'Saving…' : editing ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        description="This event will be permanently removed from the calendar."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteEvent.isPending}
      />
    </div>
  );
}

// ── Main EventsTab export ──────────────────────────────────────────────────────
interface EventsTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function EventsTab({ showAlert }: EventsTabProps) {
  const { hasAny, isSuperAdmin } = useMyPermissions();
  const canManage  = hasAny('hr.read', 'hr.write') || isSuperAdmin;

  const tabs = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'upcoming', label: 'Upcoming Events' },
    ...(canManage ? [{ id: 'manage', label: 'Manage Events' }] : []),
    ...(isSuperAdmin || hasAny('settings.update', 'hr.write') ? [{ id: 'config', label: 'Holiday Config' }] : []),
  ];

  const [activeTab, setActiveTab] = useState<string>('calendar');

  return (
    <div className="space-y-6">
      <TabSwitcher
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {activeTab === 'calendar' && <EventsCalendarPanel />}
      {activeTab === 'upcoming' && <UpcomingEventsPanel showAlert={showAlert} />}
      {activeTab === 'manage'   && <ManageEventsPanel   showAlert={showAlert} />}
      {activeTab === 'config'   && <HolidayImportPanel  showAlert={showAlert} />}
    </div>
  );
}

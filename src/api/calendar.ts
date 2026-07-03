import { api } from './client';

export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';
export type CalendarItemType = 'TASK' | 'EVENT' | 'AVAILABILITY' | 'MEETING';
export type MeetingRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type CalendarSyncSource = 'BLIH' | 'GOOGLE';

export interface UserCalendarEvent {
  id: string;
  businessId: string;
  employeeUserId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  itemType: CalendarItemType;
  source?: 'PROJECT_TASK' | 'CALENDAR';
  readOnly?: boolean;
  availabilityStatus: AvailabilityStatus;
  color?: string | null;
  projectId?: string | null;
  projectTaskId?: string | null;
  meetingRequestId?: string | null;
  googleEventId?: string | null;
  googleCalendarId?: string | null;
  googleSyncStatus?: 'NOT_SYNCED' | 'SYNCED' | 'FAILED' | 'PENDING_RETRY' | 'SYNC_CONFLICT' | 'DEAD';
  googleSyncError?: string | null;
  lastGoogleSyncedAt?: string | null;
  syncSource?: CalendarSyncSource;
  googleUpdatedAt?: string | null;
  googleETag?: string | null;
  recurrenceRule?: string | null;
  googleRecurringEventId?: string | null;
  googleOriginalStartTime?: Record<string, any> | null;
  isRecurring?: boolean;
  isRecurringInstance?: boolean;
  deletedSource?: 'BLIH' | 'GOOGLE' | null;
  googleDeletedAt?: string | null;
  googleSyncedAt?: string | null;
  project?: { id: string; title: string; code?: string | null; status?: string | null } | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventPayload {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  itemType?: CalendarItemType;
  availabilityStatus?: AvailabilityStatus;
  color?: string;
  projectId?: string | null;
  metadata?: Record<string, any>;
}

export interface CalendarPerson {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  availabilityStatus: AvailabilityStatus;
  unavailableUntil?: string | null;
  currentBlock?: UserCalendarEvent | null;
}

export interface MeetingRequest {
  id: string;
  requesterUserId: string;
  recipientUserId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  status: MeetingRequestStatus;
  requester?: { id: string; fullName: string; email: string };
  recipient?: { id: string; fullName: string; email: string };
  responseNote?: string | null;
  createdAt: string;
}

export interface GoogleImportSyncSummary {
  importedCount: number;
  updatedCount: number;
  deletedCount: number;
  skippedCount: number;
  failedCount: number;
  errors?: Array<{ googleEventId?: string; message: string }>;
}

export const calendarApi = {
  list: async (params?: { from?: string; to?: string; availabilityStatus?: AvailabilityStatus; userId?: string }) => {
    const res = await api.get('/api/v1/calendar', { params });
    return (res.data.rows ?? []) as UserCalendarEvent[];
  },
  create: async (payload: CalendarEventPayload) => {
    const res = await api.post('/api/v1/calendar', payload);
    return res.data.event as UserCalendarEvent;
  },
  update: async (id: string, payload: Partial<CalendarEventPayload>) => {
    const res = await api.patch(`/api/v1/calendar/${id}`, payload);
    return res.data.event as UserCalendarEvent;
  },
  remove: async (id: string) => {
    await api.delete(`/api/v1/calendar/${id}`);
  },
  status: async () => {
    const res = await api.get('/api/v1/calendar/status');
    return res.data as { availabilityStatus: AvailabilityStatus; event?: UserCalendarEvent | null };
  },
  people: async (params?: { search?: string; size?: number }) => {
    const res = await api.get('/api/v1/calendar/people', { params });
    return (res.data.rows ?? []) as CalendarPerson[];
  },
  meetingRequests: async (params?: { status?: MeetingRequestStatus; size?: number }) => {
    const res = await api.get('/api/v1/calendar/meeting-requests', { params });
    return (res.data.rows ?? []) as MeetingRequest[];
  },
  createMeetingRequest: async (payload: { recipientUserId: string; title: string; description?: string; location?: string; startAt: string; endAt: string }) => {
    const res = await api.post('/api/v1/calendar/meeting-requests', payload);
    return res.data.request as MeetingRequest;
  },
  respondMeetingRequest: async (id: string, payload: { status: 'ACCEPTED' | 'DECLINED'; responseNote?: string }) => {
    const res = await api.patch(`/api/v1/calendar/meeting-requests/${id}`, payload);
    return res.data.request as MeetingRequest;
  },
  googleConnection: async () => {
    const res = await api.get('/api/v1/calendar/google');
    return res.data as {
      connected: boolean;
      calendarId: string;
      connectedAt?: string | null;
      watchStatus?: 'ACTIVE' | 'NOT_CONFIGURED' | 'WATCH_FAILED' | 'NEEDS_RECONNECT' | 'SYNC_FAILED' | 'RESYNCING' | 'STOPPED';
      watchExpiresAt?: string | null;
      needsReconnect?: boolean;
    };
  },
  googleAuthUrl: async () => {
    const res = await api.get('/api/v1/calendar/google/auth-url');
    return res.data as { url: string };
  },
  googleDisconnect: async () => {
    await api.delete('/api/v1/calendar/google');
  },
  syncGoogle: async (id: string) => {
    const res = await api.post(`/api/v1/calendar/${id}/google-sync`);
    return res.data.event as UserCalendarEvent;
  },
  syncAllGoogle: async () => {
    const res = await api.post('/api/v1/calendar/google-sync-all');
    return res.data as { syncedCount: number; failedCount: number; failed?: Array<{ id: string; title: string; message: string }> };
  },
  syncFromGoogle: async () => {
    const res = await api.post('/api/v1/calendar/google/sync-from-google');
    return res.data as GoogleImportSyncSummary;
  },
};

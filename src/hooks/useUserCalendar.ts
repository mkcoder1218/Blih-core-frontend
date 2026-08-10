import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  calendarApi,
  type AvailabilityStatus,
  type CalendarEventPayload,
  type MeetingPayload,
} from '../api/calendar';

const KEY = ['user-calendar'];

export function useUserCalendar(params?: { from?: string; to?: string; availabilityStatus?: AvailabilityStatus; userId?: string }) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => calendarApi.list(params),
    staleTime: 30_000,
  });
}

export function useUserAvailabilityStatus() {
  return useQuery({
    queryKey: [...KEY, 'status'],
    queryFn: calendarApi.status,
    staleTime: 30_000,
  });
}

export function useGoogleCalendarConnection() {
  return useQuery({
    queryKey: [...KEY, 'google'],
    queryFn: calendarApi.googleConnection,
    staleTime: 30_000,
  });
}

export function useCalendarPeople(params?: { search?: string; size?: number }) {
  return useQuery({
    queryKey: [...KEY, 'people', params],
    queryFn: () => calendarApi.people(params),
    staleTime: 30_000,
  });
}

export function useMeetingRequests(params?: { status?: string; size?: number }) {
  return useQuery({
    queryKey: [...KEY, 'meeting-requests', params],
    queryFn: () => calendarApi.meetingRequests(params),
    staleTime: 20_000,
  });
}

export function useMeetingEventDetails(eventId?: string) {
  return useQuery({
    queryKey: [...KEY, 'meeting-event-details', eventId],
    queryFn: () => calendarApi.meetingEventDetails(eventId!),
    enabled: Boolean(eventId),
    staleTime: 10_000,
  });
}

export function useCreateUserCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CalendarEventPayload) => calendarApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUserCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CalendarEventPayload> }) => calendarApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteUserCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deleteScope, instanceDate }: { id: string; deleteScope?: 'THIS_EVENT' | 'ALL_EVENTS'; instanceDate?: string }) =>
      calendarApi.remove(id, { deleteScope, instanceDate }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSyncUserCalendarEventToGoogle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarApi.syncGoogle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSyncAllUserCalendarEventsToGoogle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => calendarApi.syncAllGoogle(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSyncUserCalendarFromGoogle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => calendarApi.syncFromGoogle(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateMeetingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MeetingPayload) => calendarApi.createMeetingRequest(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRespondMeetingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { status: 'ACCEPTED' | 'DECLINED'; responseNote?: string; legacy?: boolean };
    }) => calendarApi.respondMeetingRequest(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MeetingPayload> }) =>
      calendarApi.updateMeeting(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCancelMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarApi.cancelMeeting(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCheckMeetingAvailability() {
  return useMutation({
    mutationFn: (payload: {
      attendeeUserIds: string[];
      startAt: string;
      endAt: string;
      meetingId?: string;
    }) => calendarApi.meetingAvailability(payload),
  });
}

export function useFindCommonMeetingTimes() {
  return useMutation({
    mutationFn: (payload: {
      attendeeUserIds: string[];
      windows: Array<{ startAt: string; endAt: string }>;
      durationMinutes?: number;
      stepMinutes?: number;
      meetingId?: string;
    }) => calendarApi.commonMeetingTimes(payload),
  });
}

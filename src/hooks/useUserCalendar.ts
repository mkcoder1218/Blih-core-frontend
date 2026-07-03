import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarApi, type CalendarEventPayload, type AvailabilityStatus, type MeetingRequestStatus } from '../api/calendar';

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

export function useMeetingRequests(params?: { status?: MeetingRequestStatus; size?: number }) {
  return useQuery({
    queryKey: [...KEY, 'meeting-requests', params],
    queryFn: () => calendarApi.meetingRequests(params),
    staleTime: 20_000,
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
    mutationFn: (id: string) => calendarApi.remove(id),
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

export function useCreateMeetingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { recipientUserId: string; title: string; description?: string; location?: string; startAt: string; endAt: string }) => calendarApi.createMeetingRequest(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRespondMeetingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: 'ACCEPTED' | 'DECLINED'; responseNote?: string } }) => calendarApi.respondMeetingRequest(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

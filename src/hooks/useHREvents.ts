import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrEventsApi, type CreateHREventPayload, type UpdateHREventPayload } from '../api/hrEvents';

const KEY = ['hr-events'];

export function useHREvents(params?: { type?: string; from?: string; to?: string; size?: number }) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => hrEventsApi.list(params),
    staleTime: 60_000,
  });
}

export function useUpcomingEvents(days = 90) {
  const today = new Date().toISOString().slice(0, 10);
  const to    = new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
  return useHREvents({ from: today, to, size: 100 });
}

export function useCreateHREvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHREventPayload) => hrEventsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHREvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateHREventPayload) =>
      hrEventsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHREvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrEventsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

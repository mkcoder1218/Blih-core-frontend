import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  disciplinaryApi,
  type CreateDisciplinaryPayload,
  type UpdateDisciplinaryPayload,
} from '../api/disciplinary';

const KEY = ['disciplinary-cases'];

export function useDisciplinaryCases(params?: { status?: string; severity?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => disciplinaryApi.list(params),
    staleTime: 30_000,
  });
}

export function useCriticalDisciplinaryCases() {
  return useDisciplinaryCases({ status: 'open', severity: 'critical', size: 20 });
}

export function useCreateDisciplinaryCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDisciplinaryPayload) => disciplinaryApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDisciplinaryCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateDisciplinaryPayload) =>
      disciplinaryApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

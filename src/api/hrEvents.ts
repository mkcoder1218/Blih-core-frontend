import { api } from './client';

export type HREventType =
  | 'birthday' | 'work_anniversary' | 'promotion'
  | 'holiday'  | 'company_event'    | 'other';

export type HREventVisibility = 'all' | 'department' | 'individual';

export interface HREvent {
  id: string;
  businessId: string;
  createdByUserId: string;
  employeeUserId?: string | null;
  departmentId?: string | null;
  eventType: HREventType;
  title: string;
  description?: string | null;
  eventDate: string;          // YYYY-MM-DD
  endDate?: string | null;
  isRecurring: boolean;
  visibility: HREventVisibility;
  emoji?: string | null;
  color?: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  employee?: { id: string; fullName: string; email: string } | null;
  creator?:  { id: string; fullName: string } | null;
  department?: { id: string; name: string } | null;
}

export interface HREventListResult {
  rows: HREvent[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateHREventPayload {
  eventType: HREventType;
  title: string;
  description?: string;
  eventDate: string;
  endDate?: string;
  isRecurring?: boolean;
  visibility?: HREventVisibility;
  employeeUserId?: string;
  departmentId?: string;
  emoji?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export type UpdateHREventPayload = Partial<CreateHREventPayload>;

export const hrEventsApi = {
  list: async (params?: {
    type?: string; from?: string; to?: string; page?: number; size?: number;
  }): Promise<HREventListResult> => {
    const res = await api.get('/api/v1/people/events', { params });
    return res.data.data ?? res.data;
  },

  create: async (payload: CreateHREventPayload): Promise<HREvent> => {
    const res = await api.post('/api/v1/people/events', payload);
    return res.data.data ?? res.data;
  },

  update: async (id: string, payload: UpdateHREventPayload): Promise<HREvent> => {
    const res = await api.patch(`/api/v1/people/events/${id}`, payload);
    return res.data.data ?? res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/people/events/${id}`);
  },
};

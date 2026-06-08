import { api } from './client';

export type DisciplinarySeverity = 'minor' | 'major' | 'critical';
export type DisciplinaryStatus   = 'open' | 'under_review' | 'resolved' | 'closed';

export interface DisciplinaryCase {
  id: string;
  businessId: string;
  employeeUserId: string;
  reportedByUserId: string;
  caseType: string;           // grievance | misconduct | attendance | policy_violation | etc.
  severity: DisciplinarySeverity;
  title: string;
  description: string;
  actionTaken?: string | null;
  status: DisciplinaryStatus;
  metadata: Record<string, any>;
  createdAt: string;
  employee?: { id: string; fullName: string; email: string } | null;
  reporter?: { id: string; fullName: string } | null;
}

export interface DisciplinaryListResult {
  rows: DisciplinaryCase[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateDisciplinaryPayload {
  employeeUserId: string;
  caseType: string;
  severity?: DisciplinarySeverity;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface UpdateDisciplinaryPayload {
  status?: DisciplinaryStatus;
  actionTaken?: string;
  severity?: DisciplinarySeverity;
}

export const disciplinaryApi = {
  list: async (params?: { status?: string; severity?: string; page?: number; size?: number }): Promise<DisciplinaryListResult> => {
    const res = await api.get('/api/v1/hr/disciplinary', { params });
    return res.data.data ?? res.data;
  },

  create: async (payload: CreateDisciplinaryPayload): Promise<DisciplinaryCase> => {
    const res = await api.post('/api/v1/hr/disciplinary', payload);
    return res.data.data ?? res.data;
  },

  update: async (id: string, payload: UpdateDisciplinaryPayload): Promise<DisciplinaryCase> => {
    const res = await api.patch(`/api/v1/hr/disciplinary/${id}`, payload);
    return res.data.data ?? res.data;
  },
};

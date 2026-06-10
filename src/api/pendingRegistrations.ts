import { api } from './client';

export interface PendingRegistrant {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: 'pending' | 'rejected';
  createdAt: string;
  rejectionReason: string | null;
  rejectedAt: string | null;
  requestedRoleKey: string | null;
  employmentType: string | null;
  hireDate: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  personal: {
    dateOfBirth: string | null;
    gender: string | null;
    maritalStatus: string | null;
    nationality: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    zipCode: string | null;
  };
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelationship: string | null;
  bankName: string | null;
  bankAccount: string | null;
}

export interface PendingListResponse {
  items: PendingRegistrant[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const pendingRegistrationsApi = {
  list: (status: 'pending' | 'rejected' = 'pending', page = 1, size = 20) =>
    api.get<{ data: PendingListResponse }>(`/api/v1/hr/pending-registrations`, {
      params: { status, page, size },
    }),

  getOne: (userId: string) =>
    api.get(`/api/v1/hr/pending-registrations/${userId}`),

  approve: (userId: string) =>
    api.post(`/api/v1/hr/pending-registrations/${userId}/approve`),

  reject: (userId: string, reason: string, templateMessage?: string) =>
    api.post(`/api/v1/hr/pending-registrations/${userId}/reject`, { reason, templateMessage }),
};

export const REJECTION_TEMPLATES = [
  {
    id: 'incomplete_docs',
    label: 'Incomplete Documents',
    message:
      'Your registration could not be approved because the documents you uploaded (National ID) are incomplete or unclear. Please re-upload clear, legible images of both sides of your ID and resubmit.',
  },
  {
    id: 'info_mismatch',
    label: 'Information Mismatch',
    message:
      'Some of the information you provided does not match our records or contains inconsistencies. Please review and correct your personal and work details before resubmitting.',
  },
  {
    id: 'wrong_role',
    label: 'Role Not Available',
    message:
      'The role you requested is not currently available for self-registration. Please select a different role or contact HR directly to discuss your position.',
  },
  {
    id: 'missing_info',
    label: 'Missing Required Information',
    message:
      'Your application is missing some required information. Please complete all required fields and resubmit your application.',
  },
  {
    id: 'position_filled',
    label: 'Position Already Filled',
    message:
      'The position you applied for has already been filled. Please select a different position or department and resubmit your application.',
  },
];

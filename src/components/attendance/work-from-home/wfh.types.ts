import type { AttendanceRequest } from '../../../hooks/useAttendanceRequests';

export type ShowAlert = (
  message: string,
  type?: 'success' | 'info' | 'error',
) => void;

export type WfhWorkType = 'full_day' | 'partial_day';

export interface WfhFormValues {
  workType: WfhWorkType;
  fromDate: string;
  toDate: string;
  startTime: string;
  endTime: string;
  workLocation: string;
  reason: string;
  plannedTasks: string;
}

export interface WfhRequestCardData {
  id: string;
  raw: AttendanceRequest;
  employee: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  category: string;
  from: string;
  to: string;
  duration: string;
  submitted: string;
  title: string;
  reason: string;
  approvedBy: string;
  status: AttendanceRequest['status'];
  actionNote: string;
}

export interface AlertProps {
  showAlert: ShowAlert;
}
import type { AttendanceRequest } from '../../../hooks/useAttendanceRequests';
import type {
  WfhFormValues,
  WfhRequestCardData,
} from './wfh.types';

export const INITIAL_WFH_FORM: WfhFormValues = {
  workType: 'full_day',
  fromDate: '',
  toDate: '',
  startTime: '08:30',
  endTime: '17:30',
  workLocation: '',
  reason: '',
  plannedTasks: '',
};

function localDateValue(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localTimeValue(date: Date | null, fallback: string): string {
  if (!date || Number.isNaN(date.getTime())) return fallback;
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseStructuredReason(reason: string) {
  const sections = String(reason || '')
    .split(/\n\s*\n/g)
    .map((section) => section.trim())
    .filter(Boolean);

  let workLocation = '';
  let plannedTasks = '';
  const reasonSections: string[] = [];

  for (const section of sections) {
    if (section.toLowerCase().startsWith('work location:')) {
      workLocation = section.slice(section.indexOf(':') + 1).trim();
      continue;
    }

    if (section.toLowerCase().startsWith('planned tasks:')) {
      plannedTasks = section.slice(section.indexOf(':') + 1).trim();
      continue;
    }

    reasonSections.push(section);
  }

  return {
    reason: reasonSections.join('\n\n'),
    workLocation,
    plannedTasks,
  };
}

export function wfhFormFromRequest(
  request: AttendanceRequest,
): WfhFormValues {
  const fromAt = request.fromAt ? new Date(request.fromAt) : null;
  const toAt = request.toAt ? new Date(request.toAt) : null;
  const workType = String(request.category || '')
    .toLowerCase()
    .includes('partial')
    ? 'partial_day'
    : 'full_day';
  const parsedReason = parseStructuredReason(request.reason);

  return {
    workType,
    fromDate: localDateValue(fromAt),
    toDate: localDateValue(toAt),
    startTime: localTimeValue(fromAt, '08:30'),
    endTime: localTimeValue(toAt, '17:30'),
    workLocation: parsedReason.workLocation,
    reason: parsedReason.reason,
    plannedTasks: parsedReason.plannedTasks,
  };
}

export function formatWfhDateTime(
  value?: string | null,
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatWfhDuration(
  minutes?: number | null,
): string {
  if (!minutes || minutes <= 0) {
    return '-';
  }

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;

  if (days > 0) {
    return hours > 0
      ? `${days}d ${hours}h`
      : `${days}d`;
  }

  if (hours > 0) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  return `${remainingMinutes}m`;
}

export function calculateDurationMinutes(
  fromAt: Date,
  toAt: Date,
): number {
  return Math.max(
    0,
    Math.round(
      (toAt.getTime() - fromAt.getTime()) / 60_000,
    ),
  );
}

export function buildWfhDateRange(
  values: WfhFormValues,
): {
  fromAt: Date;
  toAt: Date;
} {
  const fromTime =
    values.workType === 'full_day'
      ? '00:00'
      : values.startTime;

  const toTime =
    values.workType === 'full_day'
      ? '23:59'
      : values.endTime;

  return {
    fromAt: new Date(
      `${values.fromDate}T${fromTime}:00`,
    ),
    toAt: new Date(`${values.toDate}T${toTime}:00`),
  };
}

export function buildWfhReason(
  values: WfhFormValues,
): string {
  const sections = [
    values.reason.trim(),
    values.workLocation.trim()
      ? `Work location: ${values.workLocation.trim()}`
      : '',
    values.plannedTasks.trim()
      ? `Planned tasks: ${values.plannedTasks.trim()}`
      : '',
  ];

  return sections.filter(Boolean).join('\n\n');
}

export function toWfhCard(
  request: AttendanceRequest,
): WfhRequestCardData {
  const employee = request.employee;
  const profile = employee?.BusinessUserProfile;

  return {
    id: request.id,
    raw: request,
    employee:
      employee?.fullName ||
      employee?.email ||
      'Employee',
    role: profile?.position?.title || '-',
    department: profile?.department?.name || '-',
    email: employee?.email || '-',
    phone: employee?.phone || '-',
    category: request.category || 'Work From Home',
    from: formatWfhDateTime(request.fromAt),
    to: formatWfhDateTime(request.toAt),
    duration: formatWfhDuration(
      request.durationMinutes,
    ),
    submitted: formatWfhDateTime(request.createdAt),
    title: request.title,
    reason: request.reason,
    approvedBy:
      request.actionedBy?.fullName ||
      request.actionedBy?.email ||
      '-',
    status: request.status,
    actionNote: request.actionNote || '',
  };
}

export function getWfhStatusClasses(
  status: AttendanceRequest['status'],
): string {
  switch (status) {
    case 'approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300';

    case 'rejected':
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-300';

    case 'cancelled':
      return 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300';

    case 'expired':
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/35 dark:text-orange-300';

    case 'invalid':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-300';

    default:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300';
  }
}

export function getWfhStatusLabel(
  status: AttendanceRequest['status'],
): string {
  switch (status) {
    case 'approved':
      return 'Approved';

    case 'rejected':
      return 'Rejected';

    case 'cancelled':
      return 'Cancelled';

    case 'expired':
      return 'Expired';

    case 'invalid':
      return 'Invalid';

    default:
      return 'Pending';
  }
}

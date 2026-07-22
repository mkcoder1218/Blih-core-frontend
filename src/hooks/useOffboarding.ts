import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '../api/client';

export type ExitInitiator =
  | 'employee'
  | 'employer';

export type ExitMode =
  | 'immediate'
  | 'urgent'
  | 'standard_notice';

export type EmployerExitType =
  | 'termination'
  | 'redundancy';

export interface EmployeeExitPayload {
  exitMode: ExitMode;
  exitReasonId: string;
  reason?: string;
  effectiveDate: string;
  noticePeriodDays: number;
  letterHtml: string;
  templateId?: string;
  templateSnapshot?: unknown;
  formValues?: Record<
    string,
    unknown
  >;
}

export interface EmployerExitPayload {
  employeeUserId: string;
  exitType: EmployerExitType;
  exitMode: ExitMode;
  exitReasonId: string;
  reason?: string;
  effectiveDate: string;
  noticePeriodDays: number;
  letterHtml: string;
  templateId?: string;
  templateSnapshot?: unknown;
  formValues?: Record<
    string,
    unknown
  >;
}

export interface ExitApprovalPayload {
  effectiveDate?: string;
  approvalNote?: string;
}

export interface ExitFinalPayPayload {
  status:
    | 'pending'
    | 'processing'
    | 'settled';

  grossAmount?: number;
  deductions?: number;
  netAmount?: number;
  settledAt?: string;
  settledByUserId?: string;
  notes?: string;
}

export interface CreateExitInterviewPayload {
  exitProcessId: string;

  data: {
    interviewDate?: string;
    startTime?: string;
    title?: string;
    interviewType?: string;
    location?: string | null;
    meetingUrl?: string | null;
  };
}

export interface UpdateExitStatusPayload {
  id: string;
  status: string;
  data?: Record<
    string,
    unknown
  >;
}

const EXIT_REQUEST_KEYS = [
  ['exit-requests'],
  ['exit-request-me'],
  ['exit-analytics'],
] as const;

function invalidateExitQueries(
  queryClient: ReturnType<
    typeof useQueryClient
  >,
) {
  for (const queryKey of EXIT_REQUEST_KEYS) {
    queryClient.invalidateQueries({
      queryKey,
    });
  }

  queryClient.invalidateQueries({
    queryKey: ['exit-request'],
  });

  queryClient.invalidateQueries({
    queryKey: ['exit-clearance'],
  });

  queryClient.invalidateQueries({
    queryKey: ['exit-timeline'],
  });
}

export function useExitRequests(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['exit-requests'],

    enabled:
      options?.enabled ?? true,

    queryFn: async () => {
      const response = await api.get(
        '/api/v1/hr/exit',
      );

      const raw =
        response.data?.data;

      if (Array.isArray(raw?.rows)) {
        return raw.rows;
      }

      return Array.isArray(raw)
        ? raw
        : [];
    },
  });
}

export function useMyExitRequest(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['exit-request-me'],

    enabled:
      options?.enabled ?? true,

    queryFn: async () => {
      const response = await api.get(
        '/api/v1/hr/exit/me',
      );

      return (
        response.data?.data ?? null
      );
    },
  });
}

export function useExitRequest(
  id?: string,
) {
  return useQuery({
    queryKey: [
      'exit-request',
      id,
    ],

    enabled: Boolean(id),

    queryFn: async () => {
      const response = await api.get(
        `/api/v1/hr/exit/${id}`,
      );

      return (
        response.data?.data ?? null
      );
    },
  });
}

export function useSubmitExitRequest() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      data: EmployeeExitPayload,
    ) =>
      api.post(
        '/api/v1/hr/exit/resign',
        data,
      ),

    onSuccess: () => {
      invalidateExitQueries(
        queryClient,
      );
    },
  });
}

export function useCreateExitProcess() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      data: EmployerExitPayload,
    ) =>
      api.post(
        '/api/v1/hr/exit',
        data,
      ),

    onSuccess: () => {
      invalidateExitQueries(
        queryClient,
      );
    },
  });
}

export function useApproveExitRequest() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ExitApprovalPayload;
    }) =>
      api.post(
        `/api/v1/hr/exit/${id}/approve`,
        data,
      ),

    onSuccess: () => {
      invalidateExitQueries(
        queryClient,
      );
    },
  });
}

export function useRejectExitRequest() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      rejectionReason,
    }: {
      id: string;
      rejectionReason: string;
    }) =>
      api.post(
        `/api/v1/hr/exit/${id}/reject`,
        {
          rejectionReason,
        },
      ),

    onSuccess: () => {
      invalidateExitQueries(
        queryClient,
      );
    },
  });
}

export function useUpdateExitStatus() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      data,
    }: UpdateExitStatusPayload) =>
      api.patch(
        `/api/v1/hr/exit/${id}/status`,
        {
          status,
          ...(data || {}),
        },
      ),

    onSuccess: () => {
      invalidateExitQueries(
        queryClient,
      );
    },
  });
}

export function useCreateExitInterview() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      exitProcessId,
      data,
    }: CreateExitInterviewPayload) =>
      api.post(
        `/api/v1/hr/exit/${exitProcessId}/interview`,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      invalidateExitQueries(
        queryClient,
      );

      queryClient.invalidateQueries({
        queryKey: [
          'exit-request',
          variables.exitProcessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'exit-interview',
          variables.exitProcessId,
        ],
      });
    },
  });
}

export function useSendOffboardingForm() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      exitProcessId: string,
    ) =>
      api.post(
        `/api/v1/hr/exit/${exitProcessId}/send-offboarding-form`,
      ),

    onSuccess: (
      _response,
      exitProcessId,
    ) => {
      invalidateExitQueries(
        queryClient,
      );

      queryClient.invalidateQueries({
        queryKey: [
          'exit-request',
          exitProcessId,
        ],
      });
    },
  });
}

export function useCompleteExitProcess() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      completionNote,
    }: {
      id: string;
      completionNote?: string;
    }) =>
      api.patch(
        `/api/v1/hr/exit/${id}/status`,
        {
          status: 'completed',
          approvalNote:
            completionNote ||
            undefined,
        },
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey: ['exit-requests'],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'exit-request',
          variables.id,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'exit-clearance',
          variables.id,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'exit-resources',
          variables.id,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'exit-request-me',
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'exit-analytics',
        ],
      });
    },
  });
}

export function useExitClearance(
  exitProcessId?: string,
) {
  return useQuery({
    queryKey: [
      'exit-clearance',
      exitProcessId,
    ],

    enabled: Boolean(
      exitProcessId,
    ),

    queryFn: async () => {
      const response = await api.get(
        `/api/v1/hr/exit/${exitProcessId}/clearance`,
      );

      return (
        response.data?.data ?? null
      );
    },
  });
}

export function useCompleteExitClearanceStep() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      exitProcessId,
      stepId,
      notes,
    }: {
      exitProcessId: string;
      stepId: string;
      notes?: string;
    }) =>
      api.post(
        `/api/v1/hr/exit/${exitProcessId}/clearance/${stepId}/complete`,
        {
          notes,
        },
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          'exit-clearance',
          variables.exitProcessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: ['exit-requests'],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'exit-request',
          variables.exitProcessId,
        ],
      });
    },
  });
}

export function useWaiveExitClearanceStep() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      exitProcessId,
      stepId,
      notes,
    }: {
      exitProcessId: string;
      stepId: string;
      notes?: string;
    }) =>
      api.post(
        `/api/v1/hr/exit/${exitProcessId}/clearance/${stepId}/waive`,
        {
          notes,
        },
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          'exit-clearance',
          variables.exitProcessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: ['exit-requests'],
      });
    },
  });
}

export function useUpdateExitClearanceStep() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      exitProcessId,
      stepId,
      data,
    }: {
      exitProcessId: string;
      stepId: string;
      data: Record<
        string,
        unknown
      >;
    }) =>
      api.patch(
        `/api/v1/hr/exit/${exitProcessId}/clearance/${stepId}`,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          'exit-clearance',
          variables.exitProcessId,
        ],
      });
    },
  });
}

export function useUpdateExitFinalPay() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ExitFinalPayPayload;
    }) =>
      api.patch(
        `/api/v1/hr/exit/${id}/final-pay`,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey: [
          'exit-clearance',
          variables.id,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: ['exit-requests'],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'exit-request',
          variables.id,
        ],
      });
    },
  });
}

export function useDisableExitAccount() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post(
        `/api/v1/hr/exit/${id}/disable-account`,
      ),

    onSuccess: () => {
      invalidateExitQueries(
        queryClient,
      );
    },
  });
}

export function useExitTimeline(
  exitProcessId?: string,
) {
  return useQuery({
    queryKey: [
      'exit-timeline',
      exitProcessId,
    ],

    enabled: Boolean(
      exitProcessId,
    ),

    queryFn: async () => {
      const response = await api.get(
        `/api/v1/hr/exit/${exitProcessId}/timeline`,
      );

      return (
        response.data?.data ?? []
      );
    },
  });
}

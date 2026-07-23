import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createEmploymentContract,
  createEmploymentContractFromOffer,
  createEmploymentContractTemplate,
  deleteEmploymentContract,
  deleteEmploymentContractTemplate,
  getEmploymentContract,
  getEmploymentContracts,
  getEmploymentContractStatuses,
  getEmploymentContractTemplates,
  previewEmploymentContract,
  previewSavedEmploymentContract,
  updateEmploymentContract,
  updateEmploymentContractTemplate,
  type CreateContractFromOfferInput,
  type EmploymentContractCreateInput,
  type EmploymentContractListParams,
  type EmploymentContractPreviewInput,
  type EmploymentContractTemplateInput,
  type EmploymentContractUpdateInput,
} from "../api/employmentContracts";
import {
  assignEmploymentContract,
  getEmploymentContractEmployeePrefill,
  type AssignEmploymentContractInput,
} from "../api/employmentContracts";
export const employmentContractKeys = {
  all: [
    "employment-contracts",
  ] as const,

  lists: () =>
    [
      ...employmentContractKeys.all,
      "list",
    ] as const,
    employeePrefill: (
      employeeRecordId: string,
    ) =>
      [
        ...employmentContractKeys.all,
        "employee-prefill",
        employeeRecordId,
      ] as const,
  list: (
    params?: EmploymentContractListParams,
  ) =>
    [
      ...employmentContractKeys.lists(),
      params ?? {},
    ] as const,

  details: () =>
    [
      ...employmentContractKeys.all,
      "detail",
    ] as const,

  detail: (
    id: string,
  ) =>
    [
      ...employmentContractKeys.details(),
      id,
    ] as const,

  templates: (
    params?: {
      contractType?: string;
      includeInactive?: boolean;
    },
  ) =>
    [
      ...employmentContractKeys.all,
      "templates",
      params ?? {},
    ] as const,

  statuses: () =>
    [
      ...employmentContractKeys.all,
      "statuses",
    ] as const,
};

export function useEmploymentContractStatuses() {
  return useQuery({
    queryKey:
      employmentContractKeys.statuses(),

    queryFn: async () => {
      const response =
        await getEmploymentContractStatuses();

      return (
        response.data?.data ??
        []
      );
    },

    staleTime:
      5 * 60 * 1000,
  });
}

export function useEmploymentContractTemplates(
  params?: {
    contractType?: string;
    includeInactive?: boolean;
  },
) {
  return useQuery({
    queryKey:
      employmentContractKeys.templates(
        params,
      ),

    queryFn: async () => {
      const response =
        await getEmploymentContractTemplates(
          params,
        );

      return (
        response.data?.data ??
        []
      );
    },

    staleTime:
      30 * 1000,
  });
}

export function useEmploymentContracts(
  params?: EmploymentContractListParams,
) {
  return useQuery({
    queryKey:
      employmentContractKeys.list(
        params,
      ),

    queryFn: () =>
      getEmploymentContracts(
        params,
      ),

    staleTime:
      15 * 1000,
  });
}

export function useEmploymentContract(
  id?: string | null,
) {
  return useQuery({
    queryKey:
      employmentContractKeys.detail(
        id ?? "",
      ),

    queryFn: async () => {
      if (!id) {
        throw new Error(
          "Contract ID is required",
        );
      }

      const response =
        await getEmploymentContract(
          id,
        );

      return response.data.data;
    },

    enabled:
      Boolean(id),
  });
}

export function useCreateEmploymentContractTemplate() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      input: EmploymentContractTemplateInput,
    ) =>
      createEmploymentContractTemplate(
        input,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          employmentContractKeys.all,
      });
    },
  });
}

export function useUpdateEmploymentContractTemplate() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<EmploymentContractTemplateInput>;
    }) =>
      updateEmploymentContractTemplate(
        id,
        input,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          employmentContractKeys.all,
      });
    },
  });
}

export function useDeleteEmploymentContractTemplate() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      id: string,
    ) =>
      deleteEmploymentContractTemplate(
        id,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          employmentContractKeys.all,
      });
    },
  });
}

export function useCreateEmploymentContract() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      input: EmploymentContractCreateInput,
    ) =>
      createEmploymentContract(
        input,
      ),

    onSuccess: (
      response,
    ) => {
      queryClient.invalidateQueries({
        queryKey:
          employmentContractKeys.lists(),
      });

      const created =
        response.data?.data;

      if (created?.id) {
        queryClient.setQueryData(
          employmentContractKeys.detail(
            created.id,
          ),
          created,
        );
      }
    },
  });
}

export function useCreateEmploymentContractFromOffer() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      offerId,
      input,
    }: {
      offerId: string;
      input: CreateContractFromOfferInput;
    }) =>
      createEmploymentContractFromOffer(
        offerId,
        input,
      ),

    onSuccess: (
      response,
    ) => {
      queryClient.invalidateQueries({
        queryKey:
          employmentContractKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "offer-letters",
          ],
      });

      const created =
        response.data?.data;

      if (created?.id) {
        queryClient.setQueryData(
          employmentContractKeys.detail(
            created.id,
          ),
          created,
        );
      }
    },
  });
}

export function useUpdateEmploymentContract() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: EmploymentContractUpdateInput;
    }) =>
      updateEmploymentContract(
        id,
        input,
      ),

    onSuccess: (
      response,
    ) => {
      queryClient.invalidateQueries({
        queryKey:
          employmentContractKeys.lists(),
      });

      const updated =
        response.data?.data;

      if (updated?.id) {
        queryClient.setQueryData(
          employmentContractKeys.detail(
            updated.id,
          ),
          updated,
        );
      }
    },
  });
}

export function useDeleteEmploymentContract() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      id: string,
    ) =>
      deleteEmploymentContract(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {
      queryClient.removeQueries({
        queryKey:
          employmentContractKeys.detail(
            id,
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          employmentContractKeys.lists(),
      });
    },
  });
}

export function usePreviewEmploymentContract() {
  return useMutation({
    mutationFn: (
      input: EmploymentContractPreviewInput,
    ) =>
      previewEmploymentContract(
        input,
      ),
  });
}

export function usePreviewSavedEmploymentContract() {
  return useMutation({
    mutationFn: (
      id: string,
    ) =>
      previewSavedEmploymentContract(
        id,
      ),
  });
}
export function useEmploymentContractEmployeePrefill(
  employeeRecordId?: string | null,
) {
  return useQuery({
    queryKey:
      employmentContractKeys.employeePrefill(
        employeeRecordId ?? "",
      ),

    queryFn: async () => {
      if (!employeeRecordId) {
        throw new Error(
          "Employee record ID is required",
        );
      }

      const response =
        await getEmploymentContractEmployeePrefill(
          employeeRecordId,
        );

      return response.data.data;
    },

    enabled:
      Boolean(employeeRecordId),

    staleTime:
      30 * 1000,
  });
}

export function useAssignEmploymentContract() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeRecordId,
      input,
    }: {
      employeeRecordId: string;
      input: AssignEmploymentContractInput;
    }) =>
      assignEmploymentContract(
        employeeRecordId,
        input,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          employmentContractKeys.all,
      });
    },
  });
}

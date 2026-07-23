import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getMyPendingEmploymentContract,
  signMyEmploymentContract,
  type SignMyEmploymentContractInput,
} from "../api/myEmploymentContract";

export const myEmploymentContractKeys = {
  all: [
    "my-employment-contract",
  ] as const,

  pending: [
    "my-employment-contract",
    "pending",
  ] as const,
};

export function useMyPendingEmploymentContract() {
  return useQuery({
    queryKey:
      myEmploymentContractKeys.pending,

    queryFn: async () => {
      const response =
        await getMyPendingEmploymentContract();

      return response.data.data;
    },

    staleTime:
      0,

    refetchOnMount:
      "always",

    refetchOnWindowFocus:
      true,

    retry:
      1,
  });
}

export function useSignMyEmploymentContract() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      input,
    }: {
      contractId: string;
      input: SignMyEmploymentContractInput;
    }) =>
      signMyEmploymentContract(
        contractId,
        input,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          myEmploymentContractKeys.all,
      });
    },
  });
}

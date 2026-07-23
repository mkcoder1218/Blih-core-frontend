import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  signEmploymentContractAsEmployer,
  type SignEmployerContractInput,
} from "../api/employmentContractSignatures";

export function useSignEmploymentContractAsEmployer() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      input,
    }: {
      contractId: string;

      input: SignEmployerContractInput;
    }) =>
      signEmploymentContractAsEmployer(
        contractId,
        input,
      ),

    onSuccess: async (
      _response,
      variables,
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "employment-contracts",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "employment-contract",
            variables.contractId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "my-employment-contract",
          ],
        }),
      ]);
    },
  });
}

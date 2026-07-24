import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  probationApi,
  type PositionCompetencyInput,
} from "../api/probation";

export function usePositionCompetencies(
  positionId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "position-probation-competencies",
      positionId,
    ],
    queryFn: () =>
      probationApi.getPositionCompetencies(
        positionId!,
      ),
    enabled: Boolean(positionId) && enabled,
  });
}

export function useReplacePositionCompetencies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      positionId,
      competencies,
    }: {
      positionId: string;
      competencies: PositionCompetencyInput[];
    }) =>
      probationApi.replacePositionCompetencies(
        positionId,
        competencies,
      ),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "position-probation-competencies",
          variables.positionId,
        ],
      });
    },
  });
}

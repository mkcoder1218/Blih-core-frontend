import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, ProfileDraft, UpdateProfileDraftRequest } from "../api/types";

export function useUpdateProfileDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: UpdateProfileDraftRequest }) => {
      const res = await api.patch<ApiEnvelope<{ draft: ProfileDraft }>>(`/api/v1/people/profile-drafts/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profileDrafts"] });
    },
  });
}


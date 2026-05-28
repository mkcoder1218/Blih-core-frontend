import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, CreateProfileDraftRequest, ProfileDraft } from "../api/types";

export function useCreateProfileDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProfileDraftRequest) => {
      const res = await api.post<ApiEnvelope<{ draft: ProfileDraft }>>("/api/v1/people/profile-drafts", payload);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profileDrafts"] });
    },
  });
}


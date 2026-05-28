import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, ProfileDraftsResponse } from "../api/types";

export function useProfileDrafts() {
  return useQuery({
    queryKey: ["profileDrafts"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<ProfileDraftsResponse>>("/api/v1/people/profile-drafts");
      return res.data;
    },
  });
}


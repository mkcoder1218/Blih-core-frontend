import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, ProfileTemplatesResponse } from "../api/types";

export function useProfileTemplates() {
  return useQuery({
    queryKey: ["profileTemplates"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<ProfileTemplatesResponse>>("/api/v1/people/profile-templates");
      return res.data;
    },
  });
}


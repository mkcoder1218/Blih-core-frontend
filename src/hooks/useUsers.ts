import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, User, UsersResponse } from "../api/types";

export function useUsers(filters: { permission?: string; search?: string; page?: number; size?: number } = {}) {
  const { permission, search, page = 1, size = 100 } = filters;
  
  return useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (permission) params.append("permission", permission);
      if (search) params.append("search", search);
      params.append("page", page.toString());
      params.append("size", size.toString());

      const res = await api.get<UsersResponse>(`/api/v1/users?${params.toString()}`);
      return res.data;
    },
  });
}

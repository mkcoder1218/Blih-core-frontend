import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approveDevice, getEmployeeDevices, getMyDevices, registerMyDevice, rejectDevice } from "../api/devices";
import { getAccessToken } from "../api/storage";

export function useMyDevices() {
  const token = getAccessToken();
  return useQuery({
    queryKey: ["my-devices"],
    enabled: Boolean(token),
    queryFn: getMyDevices,
  });
}

export function useRegisterMyDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerMyDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-devices"] });
      queryClient.invalidateQueries({ queryKey: ["employee-devices"] });
    },
  });
}

export function useEmployeeDevices() {
  return useQuery({
    queryKey: ["employee-devices"],
    queryFn: getEmployeeDevices,
  });
}

export function useApproveDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-devices"] });
      queryClient.invalidateQueries({ queryKey: ["my-devices"] });
    },
  });
}

export function useRejectDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-devices"] });
      queryClient.invalidateQueries({ queryKey: ["my-devices"] });
    },
  });
}

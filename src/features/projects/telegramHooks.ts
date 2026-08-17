import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProjectTelegramSettings,
  saveProjectTelegramBot,
  saveProjectTelegramDepartment,
  sendProjectTelegramTestMessage,
  sendTodayTasksToTelegram,
  testProjectTelegramConnection,
} from "./telegramApi";

const PROJECT_TELEGRAM_SETTINGS_KEY = ["projects", "telegram", "settings"] as const;

export function useProjectTelegramSettings(enabled = true) {
  return useQuery({
    queryKey: PROJECT_TELEGRAM_SETTINGS_KEY,
    queryFn: getProjectTelegramSettings,
    enabled,
    staleTime: 20_000,
  });
}

export function useSaveProjectTelegramBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveProjectTelegramBot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECT_TELEGRAM_SETTINGS_KEY }),
  });
}

export function useSaveProjectTelegramDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ departmentId, enabled, channels }: { departmentId: string; enabled: boolean; channels: Array<{ chatId: string; label?: string; enabled?: boolean }> }) =>
      saveProjectTelegramDepartment(departmentId, { enabled, channels }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECT_TELEGRAM_SETTINGS_KEY }),
  });
}

export function useTestProjectTelegramConnection() {
  return useMutation({ mutationFn: testProjectTelegramConnection });
}

export function useSendProjectTelegramTestMessage() {
  return useMutation({ mutationFn: sendProjectTelegramTestMessage });
}

export function useSendTodayTasksToTelegram() {
  return useMutation({ mutationFn: sendTodayTasksToTelegram });
}

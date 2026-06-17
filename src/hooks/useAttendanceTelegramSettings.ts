import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTelegramSettings, sendTelegramSettingTest, upsertTelegramSetting, type TelegramBotType } from "../api/attendanceTelegram";

export function useAttendanceTelegramSettings(businessId: string | null) {
  return useQuery({
    queryKey: ["attendance-telegram-settings", businessId],
    queryFn: () => getTelegramSettings(businessId as string),
    enabled: Boolean(businessId)
  });
}

export function useUpsertAttendanceTelegramSetting(businessId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ botType, data }: { botType: TelegramBotType; data: any }) => upsertTelegramSetting(businessId as string, botType, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance-telegram-settings", businessId] })
  });
}

export function useSendAttendanceTelegramTest(businessId: string | null) {
  return useMutation({
    mutationFn: ({ botType }: { botType: TelegramBotType }) => sendTelegramSettingTest(businessId as string, botType)
  });
}

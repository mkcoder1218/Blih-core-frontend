import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateTelegramLinkCode, getMyTelegramStatus, unlinkMyTelegram } from "../api/attendanceTelegram";

const TELEGRAM_STATUS_KEY = ["attendanceTelegram", "me", "status"] as const;

export function useMyTelegramStatus(pollWhileLinking = false) {
  return useQuery({
    queryKey: TELEGRAM_STATUS_KEY,
    queryFn: getMyTelegramStatus,
    staleTime: pollWhileLinking ? 0 : 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const linked = Boolean(query.state.data?.data?.telegramStatus?.linked);
      return pollWhileLinking && !linked ? 2_500 : false;
    },
  });
}

export function useGenerateTelegramLinkCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateTelegramLinkCode,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TELEGRAM_STATUS_KEY });
    },
  });
}

export function useUnlinkMyTelegram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unlinkMyTelegram,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TELEGRAM_STATUS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["attendanceMe", "today"] });
    },
  });
}

import { useMutation } from "@tanstack/react-query";
import { generateTelegramLinkCode, unlinkMyTelegram } from "../api/attendanceTelegram";

export function useGenerateTelegramLinkCode() {
  return useMutation({ mutationFn: generateTelegramLinkCode });
}

export function useUnlinkMyTelegram() {
  return useMutation({ mutationFn: unlinkMyTelegram });
}

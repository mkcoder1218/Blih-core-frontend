import { api } from "./client";
import type { ApiEnvelope } from "./types";

export type TelegramBotType = "PERSONAL_SUMMARY";

export type TelegramSetting = {
  id?: string;
  businessId: string;
  botType: TelegramBotType;
  botTokenMasked?: string | null;
  chatId?: string | null;
  sendTime?: string | null;
  timezone: string;
  enabled: boolean;
};

export async function getTelegramSettings(businessId: string) {
  const res = await api.get<ApiEnvelope<{ telegramSettings: TelegramSetting[] }>>(`/api/v1/businesses/${businessId}/telegram-settings`);
  return res.data;
}

export async function upsertTelegramSetting(businessId: string, botType: TelegramBotType, payload: Partial<TelegramSetting> & { botToken?: string }) {
  const res = await api.put<ApiEnvelope<{ telegramSetting: TelegramSetting }>>(`/api/v1/businesses/${businessId}/telegram-settings/${botType}`, payload);
  return res.data;
}

export async function sendTelegramSettingTest(businessId: string, botType: TelegramBotType) {
  const res = await api.post<ApiEnvelope<{ sent: boolean }>>(`/api/v1/businesses/${businessId}/telegram-settings/${botType}/test`);
  return res.data;
}

export async function generateTelegramLinkCode() {
  const res = await api.post<ApiEnvelope<{ telegramLinkCode: { code: string; expiresAt: string } }>>("/api/v1/attendance/telegram/me/link-code");
  return res.data;
}

export async function unlinkMyTelegram() {
  const res = await api.post<ApiEnvelope<{ unlinked: boolean }>>("/api/v1/attendance/telegram/me/unlink");
  return res.data;
}

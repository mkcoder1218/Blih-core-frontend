import { api } from "./client";
import type { ApiEnvelope } from "./types";

export type TelegramBotType = "PERSONAL_SUMMARY" | "DATABASE_BACKUP";

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

export type TelegramLinkCode = {
  code: string;
  expiresAt: string;
  botUsername?: string | null;
  botUrl?: string | null;
  deepLink?: string | null;
};

export type TelegramConnectionStatus = {
  linked: boolean;
  telegramUsername?: string | null;
  linkedAt?: string | null;
  botUsername?: string | null;
  botUrl?: string | null;
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

export async function sendCurrentBusinessTelegramTest(botType: TelegramBotType) {
  const res = await api.post<ApiEnvelope<{ sent: boolean }>>(`/api/v1/attendance/telegram/business/${botType}/test`);
  return res.data;
}

export async function sendCurrentBusinessTelegramGroupMessageTest(message: string) {
  const res = await api.post<ApiEnvelope<{ sent: boolean }>>("/api/v1/attendance/telegram/business/group-message-test", { message });
  return res.data;
}

export async function getMyTelegramStatus() {
  const res = await api.get<ApiEnvelope<{ telegramStatus: TelegramConnectionStatus }>>("/api/v1/attendance/telegram/me/status");
  return res.data;
}

export async function generateTelegramLinkCode() {
  const res = await api.post<ApiEnvelope<{ telegramLinkCode: TelegramLinkCode }>>("/api/v1/attendance/telegram/me/link-code");
  return res.data;
}

export async function unlinkMyTelegram() {
  const res = await api.post<ApiEnvelope<{ unlinked: boolean }>>("/api/v1/attendance/telegram/me/unlink");
  return res.data;
}

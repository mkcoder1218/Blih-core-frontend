import { api } from "../../api/client";
import type { ApiEnvelope } from "../../api/types";

export type TelegramDepartmentChannel = {
  id?: string;
  chatId: string;
  label: string;
  enabled: boolean;
};

export type TelegramDepartmentSetting = {
  id: string;
  name: string;
  enabled: boolean;
  channels: TelegramDepartmentChannel[];
};

export type ProjectTelegramSettings = {
  bot: {
    enabled: boolean;
    configured: boolean;
    botTokenMasked?: string | null;
  };
  departments: TelegramDepartmentSetting[];
};

export type SendTodayTelegramResult = {
  syncDate: string;
  eligibleTasks: number;
  sentTasks: number;
  sentTaskDeliveries: number;
  sentMessages: number;
  skippedAlreadySent: number;
  skippedNotConfigured: number;
  errors: Array<{ departmentId: string; employeeId: string; chatId: string; message: string }>;
};

export async function getProjectTelegramSettings() {
  const res = await api.get<ApiEnvelope<ProjectTelegramSettings>>("/api/v1/settings/telegram-tasks/settings");
  return res.data.data;
}

export async function saveProjectTelegramBot(payload: { enabled: boolean; botToken?: string }) {
  const res = await api.put<ApiEnvelope<ProjectTelegramSettings["bot"]>>("/api/v1/settings/telegram-tasks/settings/bot", payload);
  return res.data.data;
}

export async function saveProjectTelegramDepartment(
  departmentId: string,
  payload: { enabled: boolean; channels: Array<{ chatId: string; label?: string; enabled?: boolean }> },
) {
  const res = await api.put<ApiEnvelope<ProjectTelegramSettings>>(`/api/v1/settings/telegram-tasks/settings/departments/${departmentId}`, payload);
  return res.data.data;
}

export async function testProjectTelegramConnection() {
  const res = await api.post<ApiEnvelope<{ connected: boolean; username?: string | null; displayName?: string | null }>>("/api/v1/settings/telegram-tasks/test-connection");
  return res.data.data;
}

export async function sendProjectTelegramTestMessage(departmentId: string) {
  const res = await api.post<ApiEnvelope<{ sent: boolean; groups: number }>>("/api/v1/settings/telegram-tasks/test-message", { departmentId });
  return res.data.data;
}

export async function sendTodayTasksToTelegram() {
  const res = await api.post<ApiEnvelope<SendTodayTelegramResult>>("/api/v1/settings/telegram-tasks/send-today");
  return res.data.data;
}

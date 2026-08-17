import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useProjectTelegramSettings,
  useSaveProjectTelegramBot,
  useSaveProjectTelegramDepartment,
  useSendProjectTelegramTestMessage,
  useTestProjectTelegramConnection,
} from "../../features/projects/telegramHooks";
import type { TelegramDepartmentChannel } from "../../features/projects/telegramApi";

type Props = {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
};

type ChannelDraft = Pick<TelegramDepartmentChannel, "chatId" | "label" | "enabled">;

type DepartmentDraft = {
  enabled: boolean;
  channels: ChannelDraft[];
};

function apiError(error: any, fallback: string) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
}

export default function TelegramTaskSyncSettingsTab({ showAlert }: Props) {
  const settings = useProjectTelegramSettings();
  const saveBot = useSaveProjectTelegramBot();
  const saveDepartment = useSaveProjectTelegramDepartment();
  const testConnection = useTestProjectTelegramConnection();
  const testMessage = useSendProjectTelegramTestMessage();
  const [botEnabled, setBotEnabled] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [departmentDrafts, setDepartmentDrafts] = useState<Record<string, DepartmentDraft>>({});

  useEffect(() => {
    if (!settings.data) return;
    setBotEnabled(settings.data.bot.enabled);
    setDepartmentDrafts(
      Object.fromEntries(
        settings.data.departments.map((department) => [
          department.id,
          {
            enabled: department.enabled,
            channels: department.channels.map((channel) => ({
              chatId: channel.chatId,
              label: channel.label || "",
              enabled: channel.enabled,
            })),
          },
        ]),
      ),
    );
  }, [settings.data]);

  const enabledDepartmentCount = useMemo(
    () => Object.keys(departmentDrafts).filter((departmentId) => departmentDrafts[departmentId]?.enabled).length,
    [departmentDrafts],
  );

  const updateDepartment = (departmentId: string, updater: (draft: DepartmentDraft) => DepartmentDraft) => {
    setDepartmentDrafts((current) => ({
      ...current,
      [departmentId]: updater(current[departmentId] || { enabled: false, channels: [] }),
    }));
  };

  const handleSaveBot = async () => {
    try {
      await saveBot.mutateAsync({ enabled: botEnabled, ...(botToken.trim() ? { botToken: botToken.trim() } : {}) });
      setBotToken("");
      showAlert("Telegram task bot settings saved.", "success");
    } catch (error) {
      showAlert(apiError(error, "Failed to save Telegram bot settings."), "error");
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testConnection.mutateAsync();
      showAlert(`Connected to @${result.username || result.displayName || "Telegram bot"}.`, "success");
    } catch (error) {
      showAlert(apiError(error, "Telegram connection test failed."), "error");
    }
  };

  const handleSaveDepartment = async (departmentId: string) => {
    const draft = departmentDrafts[departmentId] || { enabled: false, channels: [] };
    try {
      await saveDepartment.mutateAsync({ departmentId, enabled: draft.enabled, channels: draft.channels });
      showAlert("Department Telegram routing saved.", "success");
    } catch (error) {
      showAlert(apiError(error, "Failed to save department Telegram routing."), "error");
    }
  };

  const handleTestDepartment = async (departmentId: string) => {
    try {
      const result = await testMessage.mutateAsync(departmentId);
      showAlert(`Test message sent to ${result.groups} Telegram group${result.groups === 1 ? "" : "s"}.`, "success");
    } catch (error) {
      showAlert(apiError(error, "Telegram test message failed."), "error");
    }
  };

  if (settings.isLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500">Loading Telegram task sync settings...</div>;
  }

  if (settings.isError || !settings.data) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">Could not load Telegram task sync settings.</div>;
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-950 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/10 p-2.5"><Bot className="h-5 w-5" /></div>
            <div>
              <h2 className="text-base font-black">Telegram Project Task Sync</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">Publish new tasks from Projects manually and send completed-task summaries automatically when employees check out.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {enabledDepartmentCount} departments enabled
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Integration</span>
              <span className="flex h-10 items-center justify-between rounded-xl border border-slate-200 px-3">
                <span className="text-xs font-bold text-slate-700">Enabled</span>
                <input type="checkbox" checked={botEnabled} onChange={(event) => setBotEnabled(event.currentTarget.checked)} className="h-4 w-4 accent-blue-600" />
              </span>
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Bot Token</span>
              <Input type="password" value={botToken} onChange={(event) => setBotToken(event.target.value)} placeholder={settings.data.bot.botTokenMasked || "Paste Telegram bot token"} className="h-10 rounded-xl" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleTestConnection} disabled={testConnection.isPending || !settings.data.bot.configured} className="rounded-xl">
              {testConnection.isPending ? "Testing..." : "Test Connection"}
            </Button>
            <Button onClick={handleSaveBot} disabled={saveBot.isPending} className="rounded-xl bg-blue-600 hover:bg-blue-700">
              {saveBot.isPending ? "Saving..." : "Save Bot"}
            </Button>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {settings.data.departments.map((department) => {
          const draft = departmentDrafts[department.id] || { enabled: false, channels: [] };
          return (
            <section key={department.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-950">{department.name}</h3>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${draft.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{draft.enabled ? "Active" : "Disabled"}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Every active Chat ID below receives this department's task messages.</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  Department Sync
                  <input type="checkbox" checked={draft.enabled} onChange={(event) => updateDepartment(department.id, (current) => ({ ...current, enabled: event.currentTarget.checked }))} className="h-4 w-4 accent-blue-600" />
                </label>
              </div>

              <div className="mt-4 space-y-2">
                {draft.channels.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs font-medium text-slate-500">No Telegram groups configured for this department.</div>
                ) : null}
                {draft.channels.map((channel, index) => (
                  <div key={`${department.id}-${index}`} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1.4fr_auto_auto] sm:items-center">
                    <Input value={channel.label} onChange={(event) => updateDepartment(department.id, (current) => ({ ...current, channels: current.channels.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) }))} placeholder="Group label" className="h-9 rounded-lg bg-white text-xs" />
                    <Input value={channel.chatId} onChange={(event) => updateDepartment(department.id, (current) => ({ ...current, channels: current.channels.map((item, itemIndex) => itemIndex === index ? { ...item, chatId: event.target.value } : item) }))} placeholder="Telegram Chat ID e.g. -100..." className="h-9 rounded-lg bg-white font-mono text-xs" />
                    <label className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-600"><input type="checkbox" checked={channel.enabled} onChange={(event) => updateDepartment(department.id, (current) => ({ ...current, channels: current.channels.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.currentTarget.checked } : item) }))} className="h-4 w-4 accent-blue-600" /> Active</label>
                    <button type="button" onClick={() => updateDepartment(department.id, (current) => ({ ...current, channels: current.channels.filter((_, itemIndex) => itemIndex !== index) }))} className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-100 bg-white px-3 text-rose-600 hover:bg-rose-50" aria-label="Remove Telegram group"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={() => updateDepartment(department.id, (current) => ({ ...current, channels: [...current.channels, { chatId: "", label: "", enabled: true }] }))} className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" /> Add Group
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={testMessage.isPending || !draft.enabled || !draft.channels.some((channel) => channel.chatId.trim() && channel.enabled)} onClick={() => handleTestDepartment(department.id)} className="rounded-xl">
                    <Send className="mr-2 h-4 w-4" /> Test Message
                  </Button>
                  <Button type="button" disabled={saveDepartment.isPending} onClick={() => handleSaveDepartment(department.id)} className="rounded-xl bg-slate-950 hover:bg-slate-800">
                    Save Department
                  </Button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

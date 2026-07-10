import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageCircle, PlugZap, RotateCcw, Save, Send } from "lucide-react";
import { sendCurrentBusinessTelegramGroupMessageTest } from "../../api/attendanceTelegram";
import { settingsApi } from "../../api/settings";
import { smtpApi } from "../../api/smtp";

type Props = {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
};

const employeeFields = [
  { key: "employeeName", label: "Employee Name", sample: "Biruk Birhanu" },
  { key: "date", label: "Date", sample: "Jul 10, 2026" },
  { key: "checkInTime", label: "Check-in Time", sample: "09:18" },
  { key: "minutesLate", label: "Minutes Late", sample: "18" },
  { key: "businessName", label: "Business Name", sample: "Blih Marketing" },
] as const;
type EmployeeFieldKey = typeof employeeFields[number]["key"];

const chipClass = "mx-0.5 inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-900";
const chipMarkup = (key: string, label: string) => `<span contenteditable="false" data-field="${key}" class="${chipClass}">${label}</span>`;
const defaultTelegramHtml = `${chipMarkup("employeeName", "Employee Name")} checked in ${chipMarkup("minutesLate", "Minutes Late")} minutes late on ${chipMarkup("date", "Date")}.`;
const defaultSubjectHtml = `Punctuality notice for ${chipMarkup("date", "Date")}`;
const defaultBodyHtml = `Hello ${chipMarkup("employeeName", "Employee Name")},<br><br>You checked in at ${chipMarkup("checkInTime", "Check-in Time")}, which is ${chipMarkup("minutesLate", "Minutes Late")} minutes after your expected starting time.<br><br>Regards,<br>${chipMarkup("businessName", "Business Name")}`;
const punctualitySettingKey = "punctuality_messages";

export default function PunctualityMessagesTab({ showAlert }: Props) {
  const qc = useQueryClient();
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [telegramHtml, setTelegramHtml] = useState(defaultTelegramHtml);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailSubjectHtml, setEmailSubjectHtml] = useState(defaultSubjectHtml);
  const [emailBodyHtml, setEmailBodyHtml] = useState(defaultBodyHtml);
  const [editorVersion, setEditorVersion] = useState(0);
  const settingsQuery = useQuery({
    queryKey: ["business-settings", punctualitySettingKey],
    queryFn: settingsApi.list,
  });
  const savedSetting = settingsQuery.data?.find((item) => item.key === punctualitySettingKey);

  useEffect(() => {
    if (!savedSetting?.value) return;
    const value = savedSetting.value || {};
    setTelegramEnabled(value.telegramEnabled !== false);
    setTelegramHtml(value.telegramHtml || defaultTelegramHtml);
    setEmailEnabled(value.emailEnabled !== false);
    setEmailSubjectHtml(value.emailSubjectHtml || defaultSubjectHtml);
    setEmailBodyHtml(value.emailBodyHtml || defaultBodyHtml);
    setEditorVersion((current) => current + 1);
  }, [savedSetting?.id, savedSetting?.updatedAt]);

  const saveMessages = useMutation({
    mutationFn: () => settingsApi.set({
      key: punctualitySettingKey,
      category: "attendance",
      isPublic: false,
      value: {
        telegramEnabled,
        telegramHtml,
        emailEnabled,
        emailSubjectHtml,
        emailBodyHtml,
      },
    }),
    onSuccess: async () => {
      showAlert("Punctuality message settings saved.", "success");
      await qc.invalidateQueries({ queryKey: ["business-settings", punctualitySettingKey] });
    },
    onError: (e: any) => showAlert(e?.response?.data?.message || "Failed to save punctuality messages.", "error"),
  });

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <TelegramNoticeSection
        editorVersion={editorVersion}
        showAlert={showAlert}
        enabled={telegramEnabled}
        onEnabledChange={setTelegramEnabled}
        messageHtml={telegramHtml}
        onMessageChange={setTelegramHtml}
      />

      <EmailNoticeSection
        editorVersion={editorVersion}
        showAlert={showAlert}
        enabled={emailEnabled}
        onEnabledChange={setEmailEnabled}
        subjectHtml={emailSubjectHtml}
        bodyHtml={emailBodyHtml}
        onSubjectChange={setEmailSubjectHtml}
        onBodyChange={setEmailBodyHtml}
      />

      <div className="xl:col-span-2 flex justify-end">
        <button type="button" disabled={saveMessages.isPending || settingsQuery.isLoading} onClick={() => saveMessages.mutate()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saveMessages.isPending ? "Saving..." : "Save Punctuality Messages"}
        </button>
      </div>
    </div>
  );
}

function TelegramNoticeSection({ editorVersion, showAlert, enabled, onEnabledChange, messageHtml, onMessageChange }: {
  editorVersion: number;
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  messageHtml: string;
  onMessageChange: (value: string) => void;
}) {
  const messageRef = useRef<HTMLDivElement | null>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const preview = useMemo(() => htmlToPreview(messageHtml), [messageHtml]);
  const telegramTest = useMutation({
    mutationFn: () => sendCurrentBusinessTelegramGroupMessageTest(preview),
    onSuccess: () => showAlert("Telegram group test sent.", "success"),
    onError: (e: any) => showAlert(e?.response?.data?.message || e?.message || "Failed to send Telegram test.", "error"),
  });

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) lastRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  const updateFromDom = () => {
    if (messageRef.current) onMessageChange(messageRef.current.innerHTML);
  };

  const insertField = (field: typeof employeeFields[number]) => {
    insertChipIntoEditor(messageRef.current, lastRangeRef, field, updateFromDom);
  };

  const resetDefault = () => {
    if (messageRef.current) messageRef.current.innerHTML = defaultTelegramHtml;
    onMessageChange(defaultTelegramHtml);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-950 dark:text-white">Telegram Group Notice</h2>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.currentTarget.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
          Send Telegram notices to the group
        </label>
      </div>

      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Write the message the Telegram group will receive when an employee arrives late.</p>

      <ComposerEditor
        label="Message"
        active
        editorRef={messageRef}
        initialHtml={messageHtml}
        editorVersion={editorVersion}
        onFocus={rememberSelection}
        onSelect={rememberSelection}
        onInput={updateFromDom}
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Add Employee Information</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Click an item below to add it to your message automatically.</p>
          </div>
          <button type="button" onClick={resetDefault} className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to Default Message
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {employeeFields.map((field) => (
            <button key={field.key} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertField(field)} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-100 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-blue-950/40">
              {field.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Example Telegram Message</p>
        <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-700 dark:text-slate-200">{preview}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Test Telegram Group</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Sends the example Telegram message above using the configured attendance bot and group chat.</p>
        </div>
        <button type="button" disabled={telegramTest.isPending || !preview.trim()} onClick={() => telegramTest.mutate()} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
          <PlugZap className="h-4 w-4" /> {telegramTest.isPending ? "Sending..." : "Send Telegram Test"}
        </button>
      </div>
    </section>
  );
}

function EmailNoticeSection({ editorVersion, showAlert, enabled, onEnabledChange, subjectHtml, bodyHtml, onSubjectChange, onBodyChange }: {
  editorVersion: number;
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  subjectHtml: string;
  bodyHtml: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}) {
  const subjectRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const [activeEditor, setActiveEditor] = useState<"subject" | "message">("message");
  const [testRecipientEmail, setTestRecipientEmail] = useState("");

  const subjectPreview = useMemo(() => htmlToPreview(subjectHtml), [subjectHtml]);
  const bodyPreview = useMemo(() => htmlToPreview(bodyHtml), [bodyHtml]);
  const emailTest = useMutation({
    mutationFn: () => smtpApi.sendPunctualityTestEmail({
      testRecipientEmail,
      subject: subjectPreview,
      body: bodyPreview,
    }),
    onSuccess: () => showAlert("Punctuality test email sent.", "success"),
    onError: (e: any) => showAlert(e?.response?.data?.message || "Failed to send punctuality test email.", "error"),
  });

  const rememberSelection = (editor: "subject" | "message") => {
    setActiveEditor(editor);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) lastRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  const updateFromDom = (editor: "subject" | "message") => {
    const el = editor === "subject" ? subjectRef.current : bodyRef.current;
    if (!el) return;
    if (editor === "subject") onSubjectChange(el.innerHTML);
    else onBodyChange(el.innerHTML);
  };

  const insertField = (field: typeof employeeFields[number]) => {
    const target = activeEditor === "subject" ? subjectRef.current : bodyRef.current;
    insertChipIntoEditor(target, lastRangeRef, field, () => updateFromDom(activeEditor));
  };

  const resetDefaults = () => {
    if (subjectRef.current) subjectRef.current.innerHTML = defaultSubjectHtml;
    if (bodyRef.current) bodyRef.current.innerHTML = defaultBodyHtml;
    onSubjectChange(defaultSubjectHtml);
    onBodyChange(defaultBodyHtml);
    setActiveEditor("message");
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-950 dark:text-white">Individual Email Notice</h2>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.currentTarget.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
          Send email notices to late employees
        </label>
      </div>

      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Write the message employees will receive when they arrive late.</p>

      <div className="grid gap-3">
        <ComposerEditor
          label="Subject"
          active={activeEditor === "subject"}
          editorRef={subjectRef}
          initialHtml={subjectHtml}
          editorVersion={editorVersion}
          singleLine
          onFocus={() => rememberSelection("subject")}
          onSelect={() => rememberSelection("subject")}
          onInput={() => updateFromDom("subject")}
        />
        <ComposerEditor
          label="Message"
          active={activeEditor === "message"}
          editorRef={bodyRef}
          initialHtml={bodyHtml}
          editorVersion={editorVersion}
          onFocus={() => rememberSelection("message")}
          onSelect={() => rememberSelection("message")}
          onInput={() => updateFromDom("message")}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Add Employee Information</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Click an item below to add it to your message automatically.</p>
            <p className="mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-300">Editing: {activeEditor === "subject" ? "Subject" : "Message"}</p>
          </div>
          <button type="button" onClick={resetDefaults} className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to Default Message
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {employeeFields.map((field) => (
            <button key={field.key} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertField(field)} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-100 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-blue-950/40">
              {field.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Example Email</p>
        <div className="mt-3 space-y-3 text-xs leading-5 text-slate-700 dark:text-slate-200">
          <p className="font-bold">{subjectPreview}</p>
          <p className="whitespace-pre-line">{bodyPreview}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Test Email Notice</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Send the example email above using this business SMTP configuration.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={testRecipientEmail}
            onChange={(e) => setTestRecipientEmail(e.currentTarget.value)}
            placeholder="Send test email to..."
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button type="button" disabled={emailTest.isPending || !testRecipientEmail.trim()} onClick={() => emailTest.mutate()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            <Send className="h-4 w-4" /> {emailTest.isPending ? "Sending..." : "Send Test Email"}
          </button>
        </div>
      </div>
    </section>
  );
}

function insertChipIntoEditor(target: HTMLDivElement | null, lastRangeRef: React.MutableRefObject<Range | null>, field: typeof employeeFields[number], onChange: () => void) {
  if (!target) return;
  target.focus();

  const selection = window.getSelection();
  const storedRange = lastRangeRef.current;
  const range = storedRange && target.contains(storedRange.commonAncestorContainer)
    ? storedRange
    : document.createRange();
  if (!storedRange || !target.contains(range.commonAncestorContainer)) range.selectNodeContents(target);
  range.collapse(false);

  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.dataset.field = field.key;
  chip.className = chipClass;
  chip.textContent = field.label;

  const fragment = document.createDocumentFragment();
  fragment.append(document.createTextNode(" "), chip, document.createTextNode(" "));
  range.deleteContents();
  range.insertNode(fragment);
  range.setStartAfter(chip);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
  lastRangeRef.current = range.cloneRange();
  onChange();
}

function ComposerEditor({ label, active, editorRef, initialHtml, editorVersion, singleLine, onFocus, onSelect, onInput }: {
  label: string;
  active: boolean;
  editorRef: React.MutableRefObject<HTMLDivElement | null>;
  initialHtml: string;
  editorVersion: number;
  singleLine?: boolean;
  onFocus: () => void;
  onSelect: () => void;
  onInput: () => void;
}) {
  const initialHtmlRef = useRef(initialHtml);
  const didMountHtmlRef = useRef(false);

  const setEditorRef = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node && !didMountHtmlRef.current) {
      node.innerHTML = initialHtmlRef.current;
      didMountHtmlRef.current = true;
    }
  }, [editorRef]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
    initialHtmlRef.current = initialHtml;
  }, [editorVersion]);

  return (
    <label className="space-y-1">
      <span className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
        {active ? <span className="normal-case tracking-normal text-blue-600 dark:text-blue-300">Currently editing</span> : null}
      </span>
      <div
        ref={setEditorRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={onFocus}
        onKeyUp={onSelect}
        onMouseUp={onSelect}
        onInput={onInput}
        onKeyDown={(event) => {
          if (singleLine && event.key === "Enter") event.preventDefault();
        }}
        className={[
          "w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100",
          singleLine ? "min-h-10 whitespace-nowrap overflow-x-auto" : "min-h-36 whitespace-pre-wrap leading-6",
          active ? "border-blue-300 ring-2 ring-blue-50 dark:ring-blue-950/50" : "border-slate-200 dark:border-slate-700",
        ].join(" ")}
      />
    </label>
  );
}

function htmlToPreview(html: string) {
  if (typeof document === "undefined") return "";
  const container = document.createElement("div");
  container.innerHTML = html;
  const fieldMap = new Map(employeeFields.map((field) => [field.key, field.sample]));

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    if (el.dataset.field) return fieldMap.get(el.dataset.field as EmployeeFieldKey) || "";
    if (el.tagName === "BR") return "\n";
    return Array.from(el.childNodes).map(walk).join("");
  };

  return Array.from(container.childNodes).map(walk).join("").replace(/\n{3,}/g, "\n\n").trim();
}

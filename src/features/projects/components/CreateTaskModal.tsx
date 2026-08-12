import { useRef, useState, type ClipboardEvent as ReactClipboardEvent } from "react";
import { ClipboardPaste, ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/api/client";
import { EmployeeSelect } from "./EmployeeSelect";
import { TASK_STATUSES, assertNonEmpty } from "../schemas";
import { useCreateProjectTask } from "../hooks";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const SCREENSHOT_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SCREENSHOT_SIZE = 10 * 1024 * 1024;

type QueuedScreenshot = {
  id: string;
  file: File;
};

function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeScreenshotFile(file: File, source: "upload" | "clipboard") {
  if (!SCREENSHOT_MIME_TYPES.has(file.type)) {
    throw new Error("Use a PNG, JPG/JPEG, or WebP screenshot.");
  }

  if (file.size > MAX_SCREENSHOT_SIZE) {
    throw new Error("Each screenshot must be 10 MB or smaller.");
  }

  if (source === "upload" && file.name) return file;

  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
  return new File([file], `task-screenshot-${Date.now()}.${extension}`, {
    type: file.type,
    lastModified: Date.now(),
  });
}

async function uploadProjectTaskScreenshot(taskId: string, file: File) {
  const body = new FormData();
  body.append("moduleKey", "projects");
  body.append("file", file);

  const uploadResponse = await api.post("/api/v1/files/upload", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const fileAssetId = uploadResponse.data?.file?.id;
  if (!fileAssetId) {
    throw new Error("The screenshot was uploaded but no file ID was returned.");
  }

  try {
    await api.post("/api/v1/attachments", {
      fileAssetId,
      entityType: "project_task",
      entityId: taskId,
      moduleKey: "projects",
      attachmentType: "screenshot",
    });
  } catch (error) {
    try {
      await api.delete(`/api/v1/files/${fileAssetId}`);
    } catch {
      // Best-effort cleanup if linking the uploaded file to the task fails.
    }
    throw error;
  }
}

export function CreateTaskModal({ projectId }: { projectId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [screenshots, setScreenshots] = useState<QueuedScreenshot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeEmployeeId: "",
    status: "TODO",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
  });
  const createTask = useCreateProjectTask(projectId);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const resetAfterCreate = () => {
    setForm({
      title: "",
      description: "",
      assigneeEmployeeId: "",
      status: "TODO",
      priority: "MEDIUM",
      startDate: "",
      dueDate: "",
    });
    setScreenshots([]);
    setAttachmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return;
    setOpen(nextOpen);

    if (!nextOpen) {
      setAttachmentError("");
      setScreenshots([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const queueScreenshots = (files: File[], source: "upload" | "clipboard") => {
    if (files.length === 0) return;

    const next: QueuedScreenshot[] = [];
    let validationError = "";

    for (const file of files) {
      try {
        const normalized = normalizeScreenshotFile(file, source);
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: normalized,
        });
      } catch (e: any) {
        validationError ||= e?.message || "Could not add screenshot.";
      }
    }

    if (next.length > 0) {
      setScreenshots((previous) => [...previous, ...next]);
    }
    setAttachmentError(validationError);
  };

  const handleFileSelection = (files: FileList | null) => {
    queueScreenshots(Array.from(files ?? []), "upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
    const images = Array.from(event.clipboardData.files as FileList).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      setAttachmentError("No screenshot image was found in the clipboard.");
      return;
    }

    event.preventDefault();
    queueScreenshots(images, "clipboard");
  };

  const pasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      setAttachmentError("Direct clipboard access is not available in this browser. Click the paste area and press Ctrl+V (Cmd+V on Mac).");
      return;
    }

    try {
      setAttachmentError("");
      const clipboardItems = await navigator.clipboard.read();
      const files: File[] = [];

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        files.push(new File([blob], "clipboard-screenshot", { type: imageType, lastModified: Date.now() }));
      }

      if (files.length === 0) {
        setAttachmentError("No screenshot image was found in the clipboard.");
        return;
      }

      queueScreenshots(files, "clipboard");
    } catch (e: any) {
      setAttachmentError(
        e?.message || "Clipboard permission was denied. Click the paste area and press Ctrl+V (Cmd+V on Mac) instead.",
      );
    }
  };

  const removeScreenshot = (id: string) => {
    setScreenshots((previous) => previous.filter((screenshot) => screenshot.id !== id));
    setAttachmentError("");
  };

  const submit = async () => {
    if (submitting) return;

    try {
      setError("");
      setAttachmentError("");
      assertNonEmpty(form.title, "Task title");
      setSubmitting(true);

      const createdTask = await createTask.mutateAsync({
        ...form,
        description: form.description || undefined,
        assigneeEmployeeId: form.assigneeEmployeeId || undefined,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      });

      const taskId = createdTask?.id;
      if (screenshots.length > 0 && !taskId) {
        throw new Error("Task was created but no task ID was returned, so screenshots could not be attached.");
      }

      let failedScreenshots = 0;
      if (taskId) {
        for (const screenshot of screenshots) {
          try {
            await uploadProjectTaskScreenshot(taskId, screenshot.file);
          } catch {
            failedScreenshots += 1;
          }
        }
      }

      setOpen(false);
      resetAfterCreate();

      if (failedScreenshots > 0) {
        window.alert(
          `Task created successfully, but ${failedScreenshots} screenshot${failedScreenshots === 1 ? "" : "s"} could not be attached. You can add them again from Edit Task.`,
        );
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Could not create task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        New Task
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-600">Task title</span>
            <input
              value={form.title}
              onChange={(e) => updateForm("title", e.currentTarget.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-600">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.currentTarget.value)}
              className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Assignee</span>
            <EmployeeSelect
              value={form.assigneeEmployeeId}
              onChange={(v) => updateForm("assigneeEmployeeId", v)}
              placeholder="Select assignee"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Status</span>
            <select
              value={form.status}
              onChange={(e) => updateForm("status", e.currentTarget.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Priority</span>
            <select
              value={form.priority}
              onChange={(e) => updateForm("priority", e.currentTarget.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Start date</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => updateForm("startDate", e.currentTarget.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Due date</span>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => updateForm("dueDate", e.currentTarget.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </label>

          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-600">Screenshots</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(event) => handleFileSelection(event.currentTarget.files)}
            />

            <div
              tabIndex={0}
              onPaste={handlePaste}
              className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200">
                    <ImageIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Paste or upload task screenshots</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Click here and press Ctrl+V / Cmd+V, or choose PNG, JPG/JPEG, or WebP files up to 10 MB each.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={() => void pasteFromClipboard()}>
                    <ClipboardPaste className="h-4 w-4" />
                    Paste
                  </Button>
                </div>
              </div>
            </div>

            {screenshots.length > 0 && (
              <div className="mt-3 space-y-2">
                {screenshots.map((screenshot) => (
                  <div
                    key={screenshot.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">{screenshot.file.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(screenshot.file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={submitting}
                      aria-label={`Remove ${screenshot.file.name}`}
                      onClick={() => removeScreenshot(screenshot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {attachmentError && (
              <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{attachmentError}</div>
            )}
          </div>
        </div>
        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || createTask.isPending}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

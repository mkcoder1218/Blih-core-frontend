import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent } from "react";
import { ClipboardPaste, ExternalLink, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmployeeSelect } from "./EmployeeSelect";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { ProjectTask } from "../types";
import { useDeleteProjectTask, useUpdateProjectTask } from "../hooks";
import { api } from "@/api/client";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const SCREENSHOT_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SCREENSHOT_SIZE = 10 * 1024 * 1024;

type TaskScreenshotAttachment = {
  id: string;
  fileAssetId: string;
  attachmentType?: string | null;
  FileAsset?: {
    originalName: string;
    sizeBytes: number | string;
  } | null;
};

async function listProjectTaskScreenshots(taskId: string) {
  const response = await api.get("/api/v1/attachments", {
    params: { entityType: "project_task", entityId: taskId, page: 1, size: 100 },
  });
  const payload = response.data?.data ?? response.data;
  const rows = (Array.isArray(payload?.rows) ? payload.rows : []) as TaskScreenshotAttachment[];
  return rows.filter((row) => row.attachmentType === "screenshot");
}

async function uploadProjectTaskScreenshot(taskId: string, file: File) {
  const body = new FormData();
  body.append("moduleKey", "projects");
  body.append("file", file);

  const uploadResponse = await api.post("/api/v1/files/upload", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const fileAssetId = uploadResponse.data?.file?.id;
  if (!fileAssetId) throw new Error("The screenshot was uploaded but no file ID was returned.");

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

async function getProjectTaskScreenshotPreviewUrl(fileAssetId: string) {
  const tokenResponse = await api.get(`/api/v1/files/${fileAssetId}/token`);
  const token = tokenResponse.data?.token;
  if (!token) throw new Error("Could not create a screenshot preview link.");

  const baseUrl = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${baseUrl}/api/v1/files/${fileAssetId}/download?preview=1&token=${encodeURIComponent(token)}`;
}

function formatFileSize(value: number | string | undefined) {
  const bytes = Number(value ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeScreenshotFile(file: File, source: "upload" | "clipboard") {
  if (!SCREENSHOT_MIME_TYPES.has(file.type)) {
    throw new Error("Use a PNG, JPG/JPEG, or WebP screenshot.");
  }
  if (file.size > MAX_SCREENSHOT_SIZE) {
    throw new Error("Screenshot must be 10 MB or smaller.");
  }
  if (source === "upload" && file.name) return file;

  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
  return new File([file], `task-screenshot-${Date.now()}.${extension}`, {
    type: file.type,
    lastModified: Date.now(),
  });
}

export function TaskDetailsModal({
  projectId,
  task,
  open,
  canEdit,
  onOpenChange,
}: {
  projectId: string;
  task: ProjectTask | null;
  open: boolean;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTask = useUpdateProjectTask(projectId);
  const deleteTask = useDeleteProjectTask(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [attachments, setAttachments] = useState<TaskScreenshotAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeEmployeeId: "",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
    weight: "",
  });

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  useEffect(() => {
    if (!task) return;
    setError("");
    setAttachmentError("");
    setForm({
      title: task.title || "",
      description: task.description || "",
      assigneeEmployeeId: task.assigneeEmployeeId || "",
      priority: task.priority || "MEDIUM",
      startDate: task.startDate || "",
      dueDate: task.dueDate || "",
      estimatedHours: String((task as any).estimatedHours ?? ""),
      actualHours: String((task as any).actualHours ?? ""),
      weight: String((task as any).weight ?? ""),
    });
  }, [task]);

  useEffect(() => {
    if (!open || !task) {
      setAttachments([]);
      return;
    }

    let cancelled = false;
    setAttachmentsLoading(true);
    setAttachmentError("");

    listProjectTaskScreenshots(task.id)
      .then((rows) => {
        if (!cancelled) setAttachments(rows);
      })
      .catch((e: any) => {
        if (!cancelled) {
          setAttachmentError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Could not load screenshots.");
        }
      })
      .finally(() => {
        if (!cancelled) setAttachmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, task?.id]);

  const refreshAttachments = async () => {
    if (!task) return;
    const rows = await listProjectTaskScreenshots(task.id);
    setAttachments(rows);
  };

  const attachScreenshot = async (file: File, source: "upload" | "clipboard") => {
    if (!task || uploadingScreenshot) return;

    try {
      setAttachmentError("");
      setUploadingScreenshot(true);
      const normalized = normalizeScreenshotFile(file, source);
      await uploadProjectTaskScreenshot(task.id, normalized);
      await refreshAttachments();
    } catch (e: any) {
      setAttachmentError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Could not attach screenshot.");
    } finally {
      setUploadingScreenshot(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelection = (file: File | undefined) => {
    if (file) void attachScreenshot(file, "upload");
  };

  const handlePaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
    const image = Array.from(event.clipboardData.files as FileList).find((file) => file.type.startsWith("image/"));
    if (!image) {
      setAttachmentError("No screenshot image was found in the clipboard.");
      return;
    }

    event.preventDefault();
    void attachScreenshot(image, "clipboard");
  };

  const pasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      setAttachmentError("Direct clipboard access is not available in this browser. Click the paste area and press Ctrl+V (Cmd+V on Mac).");
      return;
    }

    try {
      setAttachmentError("");
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const file = new File([blob], "clipboard-screenshot", { type: imageType, lastModified: Date.now() });
        await attachScreenshot(file, "clipboard");
        return;
      }
      setAttachmentError("No screenshot image was found in the clipboard.");
    } catch (e: any) {
      setAttachmentError(
        e?.message || "Clipboard permission was denied. Click the paste area and press Ctrl+V (Cmd+V on Mac) instead.",
      );
    }
  };

  const openAttachment = async (attachment: TaskScreenshotAttachment) => {
    const previewWindow = window.open("", "_blank");
    try {
      setAttachmentError("");
      const url = await getProjectTaskScreenshotPreviewUrl(attachment.fileAssetId);
      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      previewWindow?.close();
      setAttachmentError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Could not open screenshot.");
    }
  };

  const save = async () => {
    if (!task) return;
    if (form.title.trim().length < 2) {
      setError("Task title is required.");
      return;
    }

    try {
      setError("");
      await updateTask.mutateAsync({
        taskId: task.id,
        data: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          assigneeEmployeeId: form.assigneeEmployeeId || null,
          priority: form.priority,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          estimatedHours: form.estimatedHours === "" ? undefined : Number(form.estimatedHours),
          actualHours: form.actualHours === "" ? undefined : Number(form.actualHours),
          weight: form.weight === "" ? undefined : Number(form.weight),
        },
      });
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Could not update task.");
    }
  };

  const remove = async () => {
    if (!task) return;
    const confirmed = window.confirm(`Delete "${task.title}"? This removes the task from the project.`);
    if (!confirmed) return;

    try {
      setError("");
      await deleteTask.mutateAsync(task.id);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Could not delete task.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{canEdit ? "Edit Task" : "Task Details"}</DialogTitle>
        </DialogHeader>

        {task && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <ProjectStatusBadge status={task.status} />
              <ProjectStatusBadge status={task.priority} />
              <span className="text-xs font-bold text-slate-400">{task.code || "Task"}</span>
            </div>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-600">Task title</span>
              <input
                value={form.title}
                onChange={(e) => updateForm("title", e.currentTarget.value)}
                disabled={!canEdit}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-600">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.currentTarget.value)}
                disabled={!canEdit}
                className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Assignee</span>
              <EmployeeSelect value={form.assigneeEmployeeId} onChange={(v) => updateForm("assigneeEmployeeId", v)} placeholder="Select assignee" disabled={!canEdit} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Priority</span>
              <select
                value={form.priority}
                onChange={(e) => updateForm("priority", e.currentTarget.value)}
                disabled={!canEdit}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50"
              >
                {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Start date</span>
              <input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.currentTarget.value)} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Due date</span>
              <input type="date" value={form.dueDate} onChange={(e) => updateForm("dueDate", e.currentTarget.value)} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Estimated hours</span>
              <input type="number" min="0" value={form.estimatedHours} onChange={(e) => updateForm("estimatedHours", e.currentTarget.value)} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Actual hours</span>
              <input type="number" min="0" value={form.actualHours} onChange={(e) => updateForm("actualHours", e.currentTarget.value)} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Weight</span>
              <input type="number" min="0.1" step="0.1" value={form.weight} onChange={(e) => updateForm("weight", e.currentTarget.value)} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <div className="sm:col-span-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ImageIcon className="h-4 w-4" /> Screenshots
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Paste from your clipboard or upload a PNG, JPG, or WebP screenshot up to 10 MB.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => handleFileSelection(event.currentTarget.files?.[0])}
                  />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingScreenshot} onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" /> Upload
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={uploadingScreenshot} onClick={() => void pasteFromClipboard()}>
                    <ClipboardPaste className="h-4 w-4" /> Paste screenshot
                  </Button>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onPaste={handlePaste}
                className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-center text-xs text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-label="Paste a screenshot from the clipboard"
              >
                {uploadingScreenshot ? (
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-700"><Loader2 className="h-4 w-4 animate-spin" /> Uploading screenshot...</span>
                ) : (
                  <>Click here and press <span className="font-bold text-slate-700">Ctrl+V</span> (or <span className="font-bold text-slate-700">Cmd+V</span>) to paste a screenshot.</>
                )}
              </div>

              {attachmentError && <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{attachmentError}</div>}

              {attachmentsLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading screenshots...</div>
              ) : attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment) => {
                    const file = attachment.FileAsset;
                    return (
                      <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700">{file?.originalName || "Task screenshot"}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(file?.sizeBytes)}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void openAttachment(attachment)}>
                          <ExternalLink className="h-4 w-4" /> View
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No screenshots attached yet.</p>
              )}
            </div>
          </div>
        )}

        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}

        <DialogFooter className="gap-2 sm:justify-between">
          {canEdit && (
            <Button variant="destructive" onClick={remove} disabled={deleteTask.isPending}>
              <Trash2 className="h-4 w-4" /> {deleteTask.isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {canEdit && <Button onClick={save} disabled={updateTask.isPending}>{updateTask.isPending ? "Saving..." : "Save Task"}</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

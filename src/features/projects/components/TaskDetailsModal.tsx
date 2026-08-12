import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent } from "react";
import { ClipboardPaste, ExternalLink, ImageIcon, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmployeeSelect } from "./EmployeeSelect";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { getTaskKanbanColumnId } from "../kanban";
import type { ProjectKanbanColumn, ProjectTask } from "../types";
import { useChangeProjectTaskStatus, useDeleteProjectTask, useUpdateProjectTask } from "../hooks";
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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeScreenshotFile(file: File, source: "upload" | "clipboard") {
  if (!SCREENSHOT_MIME_TYPES.has(file.type)) throw new Error("Use a PNG, JPG/JPEG, or WebP screenshot.");
  if (file.size > MAX_SCREENSHOT_SIZE) throw new Error("Screenshot must be 10 MB or smaller.");
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
  columns,
  open,
  canEdit,
  onOpenChange,
}: {
  projectId: string;
  task: ProjectTask | null;
  columns: ProjectKanbanColumn[];
  open: boolean;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTask = useUpdateProjectTask(projectId);
  const changeTaskStatus = useChangeProjectTaskStatus(projectId);
  const deleteTask = useDeleteProjectTask(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [attachments, setAttachments] = useState<TaskScreenshotAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeEmployeeId: "",
    kanbanColumnId: "",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
    weight: "",
  });

  const hydrateForm = (currentTask: ProjectTask) => {
    setForm({
      title: currentTask.title || "",
      description: currentTask.description || "",
      assigneeEmployeeId: currentTask.assigneeEmployeeId || "",
      kanbanColumnId: getTaskKanbanColumnId(currentTask, columns),
      priority: currentTask.priority || "MEDIUM",
      startDate: currentTask.startDate || "",
      dueDate: currentTask.dueDate || "",
      estimatedHours: String(currentTask.estimatedHours ?? ""),
      actualHours: String(currentTask.actualHours ?? ""),
      weight: String(currentTask.weight ?? ""),
    });
  };

  useEffect(() => {
    if (!task) return;
    setEditing(false);
    setError("");
    setAttachmentError("");
    hydrateForm(task);
  }, [task, columns]);

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
      .catch((requestError: any) => {
        if (!cancelled) setAttachmentError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not load screenshots.");
      })
      .finally(() => {
        if (!cancelled) setAttachmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, task?.id]);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const refreshAttachments = async () => {
    if (!task) return;
    setAttachments(await listProjectTaskScreenshots(task.id));
  };

  const attachScreenshot = async (file: File, source: "upload" | "clipboard") => {
    if (!task || uploadingScreenshot || !editing) return;
    try {
      setAttachmentError("");
      setUploadingScreenshot(true);
      await uploadProjectTaskScreenshot(task.id, normalizeScreenshotFile(file, source));
      await refreshAttachments();
    } catch (requestError: any) {
      setAttachmentError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not attach screenshot.");
    } finally {
      setUploadingScreenshot(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
    if (!editing) return;
    const image = Array.from(event.clipboardData.files as FileList).find((file) => file.type.startsWith("image/"));
    if (!image) {
      setAttachmentError("No screenshot image was found in the clipboard.");
      return;
    }
    event.preventDefault();
    void attachScreenshot(image, "clipboard");
  };

  const pasteFromClipboard = async () => {
    if (!editing) return;
    if (!navigator.clipboard?.read) {
      setAttachmentError("Direct clipboard access is not available. Focus the paste area and press Ctrl+V / Cmd+V.");
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        await attachScreenshot(new File([blob], "clipboard-screenshot", { type: imageType, lastModified: Date.now() }), "clipboard");
        return;
      }
      setAttachmentError("No screenshot image was found in the clipboard.");
    } catch (requestError: any) {
      setAttachmentError(requestError?.message || "Clipboard permission was denied. Focus the paste area and press Ctrl+V / Cmd+V instead.");
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
    } catch (requestError: any) {
      previewWindow?.close();
      setAttachmentError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not open screenshot.");
    }
  };

  const cancelEdit = () => {
    if (task) hydrateForm(task);
    setError("");
    setAttachmentError("");
    setEditing(false);
  };

  const save = async () => {
    if (!task) return;
    if (form.title.trim().length < 2) {
      setError("Task title is required.");
      return;
    }

    const column = columns.find((item) => item.id === form.kanbanColumnId) || columns[0];
    try {
      setError("");
      if (column && task.status !== column.status) {
        await changeTaskStatus.mutateAsync({ taskId: task.id, status: column.status });
      }
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
          metadata: {
            ...(task.metadata || {}),
            kanbanColumnId: column?.id || form.kanbanColumnId,
          },
        },
      });
      setEditing(false);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not update task.");
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
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not delete task.");
    }
  };

  const currentColumn = task ? columns.find((column) => column.id === getTaskKanbanColumnId(task, columns)) : undefined;
  const assignee = task?.employeeAssignee?.user?.fullName || "Unassigned";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Task" : "Task Details"}</DialogTitle>
        </DialogHeader>

        {task && !editing && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-950">{task.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{task.code || "Task"}</span>
                    <ProjectStatusBadge status={task.priority} />
                    <ProjectStatusBadge status={task.status} />
                  </div>
                </div>
                <div className="text-right text-[10px] font-semibold text-slate-400">
                  <div>Created {formatDateTime(task.createdAt)}</div>
                  {task.updatedAt && <div className="mt-0.5">Updated {formatDateTime(task.updatedAt)}</div>}
                </div>
              </div>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-3">
              <h4 className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Details</h4>
              <dl className="grid gap-x-5 gap-y-3 text-xs sm:grid-cols-2">
                <div><dt className="font-bold text-slate-400">Board column</dt><dd className="mt-0.5 font-semibold text-slate-800">{currentColumn?.name || task.status.replace(/_/g, " ")}</dd></div>
                <div><dt className="font-bold text-slate-400">Assignee</dt><dd className="mt-0.5 font-semibold text-slate-800">{assignee}</dd></div>
                <div><dt className="font-bold text-slate-400">Start date</dt><dd className="mt-0.5 font-semibold text-slate-800">{task.startDate || "—"}</dd></div>
                <div><dt className="font-bold text-slate-400">Due date</dt><dd className="mt-0.5 font-semibold text-slate-800">{task.dueDate || "—"}</dd></div>
                <div><dt className="font-bold text-slate-400">Estimated hours</dt><dd className="mt-0.5 font-semibold text-slate-800">{task.estimatedHours ?? "—"}</dd></div>
                <div><dt className="font-bold text-slate-400">Actual hours</dt><dd className="mt-0.5 font-semibold text-slate-800">{task.actualHours ?? "—"}</dd></div>
              </dl>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Description</div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{task.description || "No description."}</p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700"><ImageIcon className="h-4 w-4" /> Attachments <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{attachments.length}</span></div>
              {attachmentsLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading screenshots...</div>
              ) : attachments.length ? (
                <div className="space-y-1.5">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-2.5 py-2">
                      <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-700">{attachment.FileAsset?.originalName || "Task screenshot"}</p><p className="text-[10px] text-slate-400">{formatFileSize(attachment.FileAsset?.sizeBytes)}</p></div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void openAttachment(attachment)}><ExternalLink className="h-4 w-4" /> View</Button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-slate-400">No screenshots attached.</p>}
              {attachmentError && <div className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{attachmentError}</div>}
            </section>
          </div>
        )}

        {task && editing && (
          <div className="space-y-3">
            <section className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Basics</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-1 block text-xs font-bold text-slate-600">Task title</span><input value={form.title} onChange={(event) => updateForm("title", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" /></label>
                <label className="sm:col-span-2"><span className="mb-1 block text-xs font-bold text-slate-600">Description</span><textarea value={form.description} onChange={(event) => updateForm("description", event.currentTarget.value)} rows={4} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>
                <label><span className="mb-1 block text-xs font-bold text-slate-600">Start date</span><input type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm" /></label>
                <label><span className="mb-1 block text-xs font-bold text-slate-600">Due date</span><input type="date" value={form.dueDate} onChange={(event) => updateForm("dueDate", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm" /></label>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Assignment</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="mb-1 block text-xs font-bold text-slate-600">Assignee</span><EmployeeSelect value={form.assigneeEmployeeId} onChange={(value) => updateForm("assigneeEmployeeId", value)} placeholder="Select assignee" /></label>
                <label><span className="mb-1 block text-xs font-bold text-slate-600">Board column</span><select value={form.kanbanColumnId} onChange={(event) => updateForm("kanbanColumnId", event.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">{columns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}</select></label>
                <label><span className="mb-1 block text-xs font-bold text-slate-600">Priority</span><select value={form.priority} onChange={(event) => updateForm("priority", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
                <label><span className="mb-1 block text-xs font-bold text-slate-600">Weight</span><input type="number" min="0.1" step="0.1" value={form.weight} onChange={(event) => updateForm("weight", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm" /></label>
                <label><span className="mb-1 block text-xs font-bold text-slate-600">Estimated hours</span><input type="number" min="0" value={form.estimatedHours} onChange={(event) => updateForm("estimatedHours", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm" /></label>
                <label><span className="mb-1 block text-xs font-bold text-slate-600">Actual hours</span><input type="number" min="0" value={form.actualHours} onChange={(event) => updateForm("actualHours", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm" /></label>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div><h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Attachments</h3><p className="mt-1 text-[11px] text-slate-400">Paste or upload screenshots while editing.</p></div>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => event.currentTarget.files?.[0] && void attachScreenshot(event.currentTarget.files[0], "upload")} />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingScreenshot} onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Upload</Button>
                  <Button type="button" variant="outline" size="sm" disabled={uploadingScreenshot} onClick={() => void pasteFromClipboard()}><ClipboardPaste className="h-4 w-4" /> Paste</Button>
                </div>
              </div>
              <div tabIndex={0} onPaste={handlePaste} className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-500 outline-none focus:border-blue-500">
                {uploadingScreenshot ? <span className="inline-flex items-center gap-2 font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span> : <>Focus here and press <strong>Ctrl+V / Cmd+V</strong> to paste.</>}
              </div>
              <div className="mt-2 space-y-1.5">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-2.5 py-2">
                    <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-700">{attachment.FileAsset?.originalName || "Task screenshot"}</p><p className="text-[10px] text-slate-400">{formatFileSize(attachment.FileAsset?.sizeBytes)}</p></div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void openAttachment(attachment)}><ExternalLink className="h-4 w-4" /> View</Button>
                  </div>
                ))}
              </div>
              {attachmentError && <div className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{attachmentError}</div>}
            </section>
          </div>
        )}

        {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}

        <DialogFooter className="gap-2 sm:justify-between">
          {editing && canEdit ? (
            <Button variant="destructive" onClick={() => void remove()} disabled={deleteTask.isPending}><Trash2 className="h-4 w-4" /> {deleteTask.isPending ? "Deleting..." : "Delete"}</Button>
          ) : <span />}
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={cancelEdit}>Cancel edit</Button>
                <Button onClick={() => void save()} disabled={updateTask.isPending || changeTaskStatus.isPending}>{updateTask.isPending || changeTaskStatus.isPending ? "Saving..." : "Save Task"}</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                {canEdit && <Button onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit</Button>}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

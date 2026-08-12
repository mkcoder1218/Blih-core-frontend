import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type ReactNode } from "react";
import { ClipboardPaste, ExternalLink, ImageIcon, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/api/client";
import { EmployeeSelect } from "./EmployeeSelect";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { getTaskKanbanColumnId } from "../kanban";
import type { ProjectKanbanColumn, ProjectTask } from "../types";
import { useChangeProjectTaskStatus, useDeleteProjectTask, useUpdateProjectTask } from "../hooks";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const SCREENSHOT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SCREENSHOT_SIZE = 10 * 1024 * 1024;

type Attachment = {
  id: string;
  fileAssetId: string;
  attachmentType?: string | null;
  FileAsset?: { originalName: string; sizeBytes: number | string } | null;
};

type TaskForm = {
  title: string;
  description: string;
  assigneeEmployeeId: string;
  kanbanColumnId: string;
  priority: string;
  startDate: string;
  dueDate: string;
  estimatedHours: string;
  actualHours: string;
  weight: string;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm text-foreground">{value}</dd></div>;
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
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function normalizeScreenshot(file: File, source: "upload" | "clipboard") {
  if (!SCREENSHOT_TYPES.has(file.type)) throw new Error("Use a PNG, JPG/JPEG, or WebP screenshot.");
  if (file.size > MAX_SCREENSHOT_SIZE) throw new Error("Screenshot must be 10 MB or smaller.");
  if (source === "upload" && file.name) return file;
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
  return new File([file], `task-screenshot-${Date.now()}.${extension}`, { type: file.type, lastModified: Date.now() });
}

async function listScreenshots(taskId: string) {
  const response = await api.get("/api/v1/attachments", { params: { entityType: "project_task", entityId: taskId, page: 1, size: 100 } });
  const payload = response.data?.data ?? response.data;
  return ((Array.isArray(payload?.rows) ? payload.rows : []) as Attachment[]).filter((row) => row.attachmentType === "screenshot");
}

async function uploadScreenshot(taskId: string, file: File) {
  const body = new FormData();
  body.append("moduleKey", "projects");
  body.append("file", file);
  const uploaded = await api.post("/api/v1/files/upload", body, { headers: { "Content-Type": "multipart/form-data" } });
  const fileAssetId = uploaded.data?.file?.id;
  if (!fileAssetId) throw new Error("The screenshot was uploaded but no file ID was returned.");
  try {
    await api.post("/api/v1/attachments", { fileAssetId, entityType: "project_task", entityId: taskId, moduleKey: "projects", attachmentType: "screenshot" });
  } catch (error) {
    try { await api.delete(`/api/v1/files/${fileAssetId}`); } catch { /* best effort */ }
    throw error;
  }
}

async function previewUrl(fileAssetId: string) {
  const response = await api.get(`/api/v1/files/${fileAssetId}/token`);
  const token = response.data?.token;
  if (!token) throw new Error("Could not create a screenshot preview link.");
  const baseUrl = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${baseUrl}/api/v1/files/${fileAssetId}/download?preview=1&token=${encodeURIComponent(token)}`;
}

export function TaskDetailsModal({ projectId, task, columns, open, canEdit, onOpenChange }: {
  projectId: string;
  task: ProjectTask | null;
  columns: ProjectKanbanColumn[];
  open: boolean;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTask = useUpdateProjectTask(projectId);
  const changeStatus = useChangeProjectTaskStatus(projectId);
  const deleteTask = useDeleteProjectTask(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<TaskForm>({ title: "", description: "", assigneeEmployeeId: "", kanbanColumnId: "", priority: "MEDIUM", startDate: "", dueDate: "", estimatedHours: "", actualHours: "", weight: "" });

  const hydrate = (current: ProjectTask) => setForm({
    title: current.title || "",
    description: current.description || "",
    assigneeEmployeeId: current.assigneeEmployeeId || "",
    kanbanColumnId: getTaskKanbanColumnId(current, columns),
    priority: current.priority || "MEDIUM",
    startDate: current.startDate || "",
    dueDate: current.dueDate || "",
    estimatedHours: String(current.estimatedHours ?? ""),
    actualHours: String(current.actualHours ?? ""),
    weight: String(current.weight ?? ""),
  });

  useEffect(() => {
    if (!task) return;
    setEditing(false); setError(""); setAttachmentError(""); hydrate(task);
  }, [task, columns]);

  useEffect(() => {
    if (!open || !task) { setAttachments([]); return; }
    let cancelled = false;
    setAttachmentsLoading(true); setAttachmentError("");
    listScreenshots(task.id)
      .then((rows) => { if (!cancelled) setAttachments(rows); })
      .catch((requestError: any) => { if (!cancelled) setAttachmentError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not load screenshots."); })
      .finally(() => { if (!cancelled) setAttachmentsLoading(false); });
    return () => { cancelled = true; };
  }, [open, task?.id]);

  const setField = (key: keyof TaskForm, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const refreshAttachments = async () => { if (task) setAttachments(await listScreenshots(task.id)); };

  const attach = async (file: File, source: "upload" | "clipboard") => {
    if (!task || uploading || !editing) return;
    try {
      setAttachmentError(""); setUploading(true);
      await uploadScreenshot(task.id, normalizeScreenshot(file, source));
      await refreshAttachments();
    } catch (requestError: any) {
      setAttachmentError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not attach screenshot.");
    } finally {
      setUploading(false); if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
    if (!editing) return;
    const image = Array.from(event.clipboardData.files as FileList).find((file) => file.type.startsWith("image/"));
    if (!image) { setAttachmentError("No screenshot image was found in the clipboard."); return; }
    event.preventDefault(); void attach(image, "clipboard");
  };

  const pasteFromClipboard = async () => {
    if (!editing) return;
    if (!navigator.clipboard?.read) { setAttachmentError("Direct clipboard access is not available. Focus the paste area and press Ctrl+V / Cmd+V."); return; }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        await attach(new File([blob], "clipboard-screenshot", { type: imageType, lastModified: Date.now() }), "clipboard");
        return;
      }
      setAttachmentError("No screenshot image was found in the clipboard.");
    } catch (requestError: any) { setAttachmentError(requestError?.message || "Clipboard permission was denied."); }
  };

  const openAttachment = async (attachment: Attachment) => {
    const preview = window.open("", "_blank");
    try {
      setAttachmentError("");
      const url = await previewUrl(attachment.fileAssetId);
      if (preview) { preview.opener = null; preview.location.href = url; }
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (requestError: any) {
      preview?.close();
      setAttachmentError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not open screenshot.");
    }
  };

  const cancelEdit = () => { if (task) hydrate(task); setError(""); setAttachmentError(""); setEditing(false); };

  const save = async () => {
    if (!task) return;
    if (form.title.trim().length < 2) { setError("Task title is required."); return; }
    const column = columns.find((item) => item.id === form.kanbanColumnId) || columns[0];
    try {
      setError("");
      if (column && task.status !== column.status) await changeStatus.mutateAsync({ taskId: task.id, status: column.status });
      await updateTask.mutateAsync({ taskId: task.id, data: {
        title: form.title.trim(), description: form.description.trim() || null, assigneeEmployeeId: form.assigneeEmployeeId || null,
        priority: form.priority, startDate: form.startDate || null, dueDate: form.dueDate || null,
        estimatedHours: form.estimatedHours === "" ? undefined : Number(form.estimatedHours), actualHours: form.actualHours === "" ? undefined : Number(form.actualHours), weight: form.weight === "" ? undefined : Number(form.weight),
        metadata: { ...(task.metadata || {}), kanbanColumnId: column?.id || form.kanbanColumnId },
      }});
      setEditing(false);
    } catch (requestError: any) { setError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not update task."); }
  };

  const remove = async () => {
    if (!task || !window.confirm(`Delete "${task.title}"? This removes the task from the project.`)) return;
    try { setError(""); await deleteTask.mutateAsync(task.id); onOpenChange(false); }
    catch (requestError: any) { setError(requestError?.response?.data?.message || requestError?.response?.data?.error || requestError?.message || "Could not delete task."); }
  };

  const currentColumn = task ? columns.find((column) => column.id === getTaskKanbanColumnId(task, columns)) : undefined;
  const assignee = task?.employeeAssignee?.user?.fullName || "Unassigned";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none">
        <DialogHeader><DialogTitle>{editing ? "Edit task" : "Task details"}</DialogTitle></DialogHeader>

        {task && !editing ? <div className="space-y-2.5">
          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardContent className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="text-base font-medium text-foreground">{task.title}</h3><div className="mt-1 flex flex-wrap items-center gap-1.5"><span className="text-xs text-muted-foreground">{task.code || "Task"}</span><ProjectStatusBadge status={task.priority} /><ProjectStatusBadge status={task.status} /></div></div>
            <div className="text-right text-[10px] text-muted-foreground"><div>Created {formatDateTime(task.createdAt)}</div>{task.updatedAt ? <div className="mt-0.5">Updated {formatDateTime(task.updatedAt)}</div> : null}</div>
          </CardContent></Card>
          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><CardTitle>Details</CardTitle></CardHeader><CardContent><dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2"><DetailItem label="Board column" value={currentColumn?.name || task.status.replace(/_/g, " ")} /><DetailItem label="Assignee" value={assignee} /><DetailItem label="Start date" value={task.startDate || "—"} /><DetailItem label="Due date" value={task.dueDate || "—"} /><DetailItem label="Estimated hours" value={task.estimatedHours ?? "—"} /><DetailItem label="Actual hours" value={task.actualHours ?? "—"} /></dl><div className="mt-3 border-t border-border pt-3"><p className="text-xs text-muted-foreground">Description</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{task.description || "No description."}</p></div></CardContent></Card>
          <AttachmentsCard attachments={attachments} loading={attachmentsLoading} error={attachmentError} onOpen={openAttachment} />
        </div> : null}

        {task && editing ? <div className="space-y-2.5">
          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><CardTitle>Basics</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 sm:col-span-2"><FieldLabel>Task title</FieldLabel><Input value={form.title} onChange={(event) => setField("title", event.currentTarget.value)} className="rounded-md" /></label><label className="grid gap-1 sm:col-span-2"><FieldLabel>Description</FieldLabel><Textarea value={form.description} onChange={(event) => setField("description", event.currentTarget.value)} rows={4} className="rounded-md" /></label><label className="grid gap-1"><FieldLabel>Start date</FieldLabel><Input type="date" value={form.startDate} onChange={(event) => setField("startDate", event.currentTarget.value)} className="rounded-md" /></label><label className="grid gap-1"><FieldLabel>Due date</FieldLabel><Input type="date" value={form.dueDate} onChange={(event) => setField("dueDate", event.currentTarget.value)} className="rounded-md" /></label></CardContent></Card>
          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><CardTitle>Assignment</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1"><FieldLabel>Assignee</FieldLabel><EmployeeSelect value={form.assigneeEmployeeId} onChange={(value) => setField("assigneeEmployeeId", value)} placeholder="Select assignee" /></label><label className="grid gap-1"><FieldLabel>Board column</FieldLabel><Select value={form.kanbanColumnId} onValueChange={(value) => setField("kanbanColumnId", String(value ?? ""))}><SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger><SelectContent>{columns.map((column) => <SelectItem key={column.id} value={column.id}>{column.name}</SelectItem>)}</SelectContent></Select></label><label className="grid gap-1"><FieldLabel>Priority</FieldLabel><Select value={form.priority} onValueChange={(value) => setField("priority", String(value ?? "MEDIUM"))}><SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent></Select></label><label className="grid gap-1"><FieldLabel>Weight</FieldLabel><Input type="number" min="0.1" step="0.1" value={form.weight} onChange={(event) => setField("weight", event.currentTarget.value)} className="rounded-md" /></label><label className="grid gap-1"><FieldLabel>Estimated hours</FieldLabel><Input type="number" min="0" value={form.estimatedHours} onChange={(event) => setField("estimatedHours", event.currentTarget.value)} className="rounded-md" /></label><label className="grid gap-1"><FieldLabel>Actual hours</FieldLabel><Input type="number" min="0" value={form.actualHours} onChange={(event) => setField("actualHours", event.currentTarget.value)} className="rounded-md" /></label></CardContent></Card>
          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><CardTitle>Attachments</CardTitle></CardHeader><CardContent className="space-y-2.5"><div className="flex flex-wrap justify-end gap-1.5"><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => event.currentTarget.files?.[0] && void attach(event.currentTarget.files[0], "upload")} /><Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}><Upload className="size-3.5" />Upload</Button><Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => void pasteFromClipboard()}><ClipboardPaste className="size-3.5" />Paste</Button></div><div tabIndex={0} onPaste={handlePaste} className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-center text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40">{uploading ? <span className="inline-flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" />Uploading...</span> : "Focus here and press Ctrl+V / Cmd+V to paste."}</div><AttachmentRows attachments={attachments} onOpen={openAttachment} />{attachmentError ? <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{attachmentError}</div> : null}</CardContent></Card>
        </div> : null}

        {error ? <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        <DialogFooter className="gap-2 sm:justify-between">{editing && canEdit ? <Button variant="destructive" onClick={() => void remove()} disabled={deleteTask.isPending}><Trash2 className="size-3.5" />{deleteTask.isPending ? "Deleting..." : "Delete"}</Button> : <span />}<div className="flex gap-2">{editing ? <><Button variant="outline" onClick={cancelEdit}>Cancel edit</Button><Button onClick={() => void save()} disabled={updateTask.isPending || changeStatus.isPending}>{updateTask.isPending || changeStatus.isPending ? "Saving..." : "Save task"}</Button></> : <><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>{canEdit ? <Button onClick={() => setEditing(true)}><Pencil className="size-3.5" />Edit</Button> : null}</>}</div></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttachmentRows({ attachments, onOpen }: { attachments: Attachment[]; onOpen: (attachment: Attachment) => void }) {
  return attachments.length ? <div className="space-y-1.5">{attachments.map((attachment) => <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-2.5 py-2"><div className="min-w-0"><p className="truncate text-xs text-foreground">{attachment.FileAsset?.originalName || "Task screenshot"}</p><p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.FileAsset?.sizeBytes)}</p></div><Button type="button" variant="ghost" size="sm" onClick={() => void onOpen(attachment)}><ExternalLink className="size-3.5" />View</Button></div>)}</div> : <p className="text-xs text-muted-foreground">No screenshots attached.</p>;
}

function AttachmentsCard({ attachments, loading, error, onOpen }: { attachments: Attachment[]; loading: boolean; error: string; onOpen: (attachment: Attachment) => void }) {
  return <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><div className="flex items-center gap-2"><CardTitle className="flex items-center gap-2"><ImageIcon className="size-3.5" />Attachments</CardTitle><Badge variant="secondary" className="h-5 rounded-md px-1.5 font-normal">{attachments.length}</Badge></div></CardHeader><CardContent>{loading ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Loading screenshots...</div> : <AttachmentRows attachments={attachments} onOpen={onOpen} />}{error ? <div className="mt-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div> : null}</CardContent></Card>;
}

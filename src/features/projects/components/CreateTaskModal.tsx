import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type ReactNode } from "react";
import { ClipboardPaste, ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/api/client";
import { EmployeeSelect } from "./EmployeeSelect";
import { assertNonEmpty } from "../schemas";
import { useCreateProjectTask } from "../hooks";
import type { ProjectKanbanColumn } from "../types";
import { DEFAULT_PROJECT_KANBAN_COLUMNS } from "../kanban";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const SCREENSHOT_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SCREENSHOT_SIZE = 10 * 1024 * 1024;

type QueuedScreenshot = { id: string; file: File };

function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeScreenshotFile(file: File, source: "upload" | "clipboard") {
  if (!SCREENSHOT_MIME_TYPES.has(file.type)) throw new Error("Use a PNG, JPG/JPEG, or WebP screenshot.");
  if (file.size > MAX_SCREENSHOT_SIZE) throw new Error("Each screenshot must be 10 MB or smaller.");
  if (source === "upload" && file.name) return file;
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
  return new File([file], `task-screenshot-${Date.now()}.${extension}`, { type: file.type, lastModified: Date.now() });
}

async function uploadProjectTaskScreenshot(taskId: string, file: File) {
  const body = new FormData();
  body.append("moduleKey", "projects");
  body.append("file", file);
  const uploadResponse = await api.post("/api/v1/files/upload", body, { headers: { "Content-Type": "multipart/form-data" } });
  const fileAssetId = uploadResponse.data?.file?.id;
  if (!fileAssetId) throw new Error("The screenshot was uploaded but no file ID was returned.");
  try {
    await api.post("/api/v1/attachments", { fileAssetId, entityType: "project_task", entityId: taskId, moduleKey: "projects", attachmentType: "screenshot" });
  } catch (error) {
    try { await api.delete(`/api/v1/files/${fileAssetId}`); } catch { /* Best effort cleanup. */ }
    throw error;
  }
}

function getDefaultColumnId(columns: ProjectKanbanColumn[]) {
  return columns.find((column) => column.status === "TODO")?.id || columns[0]?.id || "todo";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

export function CreateTaskModal({ projectId, columns }: { projectId: string; columns?: ProjectKanbanColumn[] }) {
  const boardColumns = columns?.length ? columns : DEFAULT_PROJECT_KANBAN_COLUMNS;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [screenshots, setScreenshots] = useState<QueuedScreenshot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigneeEmployeeId: "", kanbanColumnId: getDefaultColumnId(boardColumns), priority: "MEDIUM", startDate: "", dueDate: "" });
  const createTask = useCreateProjectTask(projectId);

  useEffect(() => {
    if (!boardColumns.some((column) => column.id === form.kanbanColumnId)) {
      setForm((previous) => ({ ...previous, kanbanColumnId: getDefaultColumnId(boardColumns) }));
    }
  }, [boardColumns, form.kanbanColumnId]);

  const updateForm = (key: keyof typeof form, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const resetAfterCreate = () => {
    setForm({ title: "", description: "", assigneeEmployeeId: "", kanbanColumnId: getDefaultColumnId(boardColumns), priority: "MEDIUM", startDate: "", dueDate: "" });
    setScreenshots([]); setAttachmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return;
    setOpen(nextOpen);
    if (!nextOpen) { setError(""); setAttachmentError(""); setScreenshots([]); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };
  const queueScreenshots = (files: File[], source: "upload" | "clipboard") => {
    if (!files.length) return;
    const next: QueuedScreenshot[] = []; let validationError = "";
    for (const file of files) {
      try { const normalized = normalizeScreenshotFile(file, source); next.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file: normalized }); }
      catch (requestError: any) { validationError ||= requestError?.message || "Could not add screenshot."; }
    }
    if (next.length) setScreenshots((previous) => [...previous, ...next]);
    setAttachmentError(validationError);
  };
  const handleFileSelection = (files: FileList | null) => { queueScreenshots(Array.from(files ?? []), "upload"); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const handlePaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
    const images = Array.from(event.clipboardData.files as FileList).filter((file) => file.type.startsWith("image/"));
    if (!images.length) { setAttachmentError("No screenshot image was found in the clipboard."); return; }
    event.preventDefault(); queueScreenshots(images, "clipboard");
  };
  const pasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) { setAttachmentError("Direct clipboard access is not available in this browser. Focus the paste area and press Ctrl+V / Cmd+V."); return; }
    try {
      setAttachmentError(""); const clipboardItems = await navigator.clipboard.read(); const files: File[] = [];
      for (const item of clipboardItems) { const imageType = item.types.find((type) => type.startsWith("image/")); if (!imageType) continue; const blob = await item.getType(imageType); files.push(new File([blob], "clipboard-screenshot", { type: imageType, lastModified: Date.now() })); }
      if (!files.length) { setAttachmentError("No screenshot image was found in the clipboard."); return; }
      queueScreenshots(files, "clipboard");
    } catch (requestError: any) { setAttachmentError(requestError?.message || "Clipboard permission was denied. Focus the paste area and press Ctrl+V / Cmd+V instead."); }
  };

  const submit = async () => {
    if (submitting) return;
    try {
      setError(""); setAttachmentError(""); assertNonEmpty(form.title, "Task title"); setSubmitting(true);
      const column = boardColumns.find((item) => item.id === form.kanbanColumnId) || boardColumns[0];
      const createdTask = await createTask.mutateAsync({ title: form.title.trim(), description: form.description.trim() || undefined, assigneeEmployeeId: form.assigneeEmployeeId || undefined, status: column?.status || "TODO", priority: form.priority, startDate: form.startDate || undefined, dueDate: form.dueDate || undefined, metadata: { kanbanColumnId: column?.id || form.kanbanColumnId } });
      const taskId = createdTask?.id;
      if (screenshots.length > 0 && !taskId) throw new Error("Task was created but no task ID was returned, so screenshots could not be attached.");
      let failedScreenshots = 0;
      if (taskId) for (const screenshot of screenshots) { try { await uploadProjectTaskScreenshot(taskId, screenshot.file); } catch { failedScreenshots += 1; } }
      setOpen(false); resetAfterCreate();
      if (failedScreenshots > 0) window.alert(`Task created, but ${failedScreenshots} screenshot${failedScreenshots === 1 ? "" : "s"} could not be attached. You can add them from Edit.`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || requestError?.response?.data?.message || requestError?.message || "Could not create task.");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}><Plus className="size-3.5" />New task</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none">
        <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
        <div className="space-y-2.5">
          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border">
            <CardHeader className="pb-0"><CardTitle>Basics</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2"><FieldLabel>Task title</FieldLabel><Input value={form.title} onChange={(event) => updateForm("title", event.currentTarget.value)} className="rounded-md" /></label>
              <label className="grid gap-1 sm:col-span-2"><FieldLabel>Description</FieldLabel><Textarea value={form.description} onChange={(event) => updateForm("description", event.currentTarget.value)} rows={4} className="rounded-md" /></label>
              <label className="grid gap-1"><FieldLabel>Start date</FieldLabel><Input type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.currentTarget.value)} className="rounded-md" /></label>
              <label className="grid gap-1"><FieldLabel>Due date</FieldLabel><Input type="date" value={form.dueDate} onChange={(event) => updateForm("dueDate", event.currentTarget.value)} className="rounded-md" /></label>
            </CardContent>
          </Card>

          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border">
            <CardHeader className="pb-0"><CardTitle>Assignment</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1"><FieldLabel>Assignee</FieldLabel><EmployeeSelect value={form.assigneeEmployeeId} onChange={(value) => updateForm("assigneeEmployeeId", value)} placeholder="Select assignee" /></label>
              <label className="grid gap-1"><FieldLabel>Board column</FieldLabel><Select value={form.kanbanColumnId} onValueChange={(value) => updateForm("kanbanColumnId", String(value ?? ""))}><SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger><SelectContent>{boardColumns.map((column) => <SelectItem key={column.id} value={column.id}>{column.name}</SelectItem>)}</SelectContent></Select></label>
              <label className="grid gap-1"><FieldLabel>Priority</FieldLabel><Select value={form.priority} onValueChange={(value) => updateForm("priority", String(value ?? "MEDIUM"))}><SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent></Select></label>
            </CardContent>
          </Card>

          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border">
            <CardHeader className="pb-0"><CardTitle>Attachments</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(event) => handleFileSelection(event.currentTarget.files)} />
              <div tabIndex={0} onPaste={handlePaste} className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background"><ImageIcon className="size-4 text-muted-foreground" /></span><div className="min-w-0"><p className="text-xs font-medium text-foreground">Paste or upload screenshots</p><p className="mt-0.5 text-[11px] text-muted-foreground">Ctrl+V / Cmd+V, or PNG/JPG/WebP up to 10 MB each.</p></div></div>
                  <div className="flex gap-1.5"><Button type="button" variant="outline" size="sm" disabled={submitting} onClick={() => fileInputRef.current?.click()}><Upload className="size-3.5" />Upload</Button><Button type="button" variant="outline" size="sm" disabled={submitting} onClick={() => void pasteFromClipboard()}><ClipboardPaste className="size-3.5" />Paste</Button></div>
                </div>
              </div>
              {screenshots.length > 0 ? <div className="space-y-1.5">{screenshots.map((screenshot) => <div key={screenshot.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-2.5 py-2"><div className="flex min-w-0 items-center gap-2"><ImageIcon className="size-3.5 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="truncate text-xs text-foreground">{screenshot.file.name}</p><p className="text-[10px] text-muted-foreground">{formatFileSize(screenshot.file.size)}</p></div></div><Button type="button" variant="ghost" size="icon-xs" disabled={submitting} aria-label={`Remove ${screenshot.file.name}`} onClick={() => setScreenshots((current) => current.filter((item) => item.id !== screenshot.id))}><Trash2 className="size-3.5" /></Button></div>)}</div> : null}
              {attachmentError ? <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{attachmentError}</div> : null}
            </CardContent>
          </Card>
        </div>
        {error ? <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        <DialogFooter><Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>Cancel</Button><Button onClick={() => void submit()} disabled={submitting || createTask.isPending}>{submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}{submitting ? "Creating..." : "Create task"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

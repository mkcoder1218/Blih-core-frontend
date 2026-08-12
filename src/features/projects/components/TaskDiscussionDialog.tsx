import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/api/client";
import type { ProjectTask } from "../types";

type TaskComment = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    employeeCode?: string | null;
    user?: {
      fullName?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

async function listTaskComments(projectId: string, taskId: string): Promise<TaskComment[]> {
  const response = await api.get(`/api/v1/projects/${projectId}/tasks/${taskId}/comments`);
  const payload = response.data?.data ?? response.data;
  return Array.isArray(payload) ? payload : [];
}

async function createTaskComment(projectId: string, taskId: string, body: string) {
  await api.post(`/api/v1/projects/${projectId}/tasks/${taskId}/comments`, { body });
}

function getAuthor(comment: TaskComment) {
  return comment.author?.user?.fullName?.trim() || comment.author?.user?.email?.trim() || comment.author?.employeeCode?.trim() || "Team member";
}

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "TM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

export function TaskDiscussionDialog({
  projectId,
  task,
  open,
  onOpenChange,
}: {
  projectId: string;
  task: ProjectTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (showLoading = false) => {
    if (!open || !task) return;
    try {
      if (showLoading) setLoading(true);
      setComments(await listTaskComments(projectId, task.id));
      setError("");
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, "Could not load the task discussion."));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [open, projectId, task]);

  useEffect(() => {
    if (!open || !task) {
      setComments([]);
      setDraft("");
      setError("");
      return;
    }

    void refresh(true);
    const intervalId = window.setInterval(() => void refresh(false), 12_000);
    return () => window.clearInterval(intervalId);
  }, [open, task?.id, refresh]);

  const send = async () => {
    if (!task || sending) return;
    const body = draft.trim();
    if (!body) return;

    try {
      setSending(true);
      setError("");
      await createTaskComment(projectId, task.id, body);
      setDraft("");
      await refresh(false);
      window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 0);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, "Could not send the task update."));
    } finally {
      setSending(false);
    }
  };

  const assignee = task?.employeeAssignee?.user?.fullName || "Unassigned";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Task Discussion
          </DialogTitle>
        </DialogHeader>

        {task && (
          <div className="flex min-h-0 flex-col gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="truncate text-sm font-black text-slate-900">{task.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span>{task.code || "Task"}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" /> Assigned to {assignee}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Use this thread for progress updates, blockers, questions, instructions, and handoff notes.
              </p>
            </div>

            <div className="min-h-[260px] max-h-[46vh] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-xs font-semibold text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading discussion...
                </div>
              ) : comments.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs font-black text-slate-500">No updates yet</p>
                  <p className="mt-1 text-[11px] text-slate-400">Send the first update to start the task conversation.</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const author = getAuthor(comment);
                  return (
                    <article key={comment.id} className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-700">
                        {initials(author)}
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="truncate text-xs font-black text-slate-800">{author}</span>
                          <time dateTime={comment.createdAt} className="shrink-0 text-[10px] font-semibold text-slate-400">
                            {formatTime(comment.createdAt)}
                          </time>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{comment.body}</p>
                      </div>
                    </article>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    void send();
                  }
                }}
                maxLength={10_000}
                rows={3}
                placeholder="Tell the assignee/team what is going on, what is blocked, or what needs to happen next..."
                className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-2 pt-2">
                <span className="text-[10px] font-semibold text-slate-400">Ctrl+Enter / Cmd+Enter to send</span>
                <Button type="button" size="sm" disabled={sending || !draft.trim()} onClick={() => void send()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? "Sending..." : "Send update"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

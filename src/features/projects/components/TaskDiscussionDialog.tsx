import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  AtSign,
  Loader2,
  MessageCircle,
  Send,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/api/client";
import { listProjectMembers } from "../api";
import type { ProjectMember, ProjectTask } from "../types";

type Mention = {
  employeeId: string;
  userId: string;
  name: string;
  email?: string;
};

type TaskComment = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: {
    mentions?: Mention[];
    [key: string]: unknown;
  } | null;
  author?: {
    employeeCode?: string | null;
    user?: {
      id?: string | null;
      fullName?: string | null;
      email?: string | null;
    } | null;
  } | null;
  authorUser?: {
    id?: string | null;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

type MentionTarget = Mention;

type ActiveMention = {
  start: number;
  end: number;
  query: string;
};

async function listTaskComments(
  projectId: string,
  taskId: string,
): Promise<TaskComment[]> {
  const response = await api.get(
    `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
  );
  const payload = response.data?.data ?? response.data;
  return Array.isArray(payload) ? payload : [];
}

async function createTaskComment(
  projectId: string,
  taskId: string,
  body: string,
  mentions: Mention[],
) {
  await api.post(
    `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
    {
      body,
      metadata: {
        mentions,
      },
    },
  );
}

function getAuthor(comment: TaskComment) {
  return (
    comment.author?.user?.fullName?.trim() ||
    comment.author?.user?.email?.trim() ||
    comment.authorUser?.fullName?.trim() ||
    comment.authorUser?.email?.trim() ||
    comment.author?.employeeCode?.trim() ||
    "Team member"
  );
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
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function memberToMention(member: ProjectMember): MentionTarget | null {
  const employee = member.employee as any;
  const user = employee?.user;
  const employeeId = member.employeeId || employee?.id;
  const userId = user?.id || employee?.userId;
  const name =
    user?.fullName?.trim() ||
    employee?.fullName?.trim() ||
    employee?.employeeCode?.trim();

  if (!employeeId || !userId || !name) return null;

  return {
    employeeId,
    userId,
    name,
    email: user?.email?.trim() || undefined,
  };
}

function findActiveMention(value: string, cursor: number): ActiveMention | null {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(?:^|\s)@([^@\s]*)$/);
  if (!match) return null;

  const atIndex = beforeCursor.lastIndexOf("@");
  if (atIndex < 0) return null;

  return {
    start: atIndex,
    end: cursor,
    query: match[1] || "",
  };
}

function mentionIsStillPresent(body: string, mention: Mention) {
  return body.includes(`@${mention.name}`);
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
  const [membersLoading, setMembersLoading] = useState(false);
  const [mentionTargets, setMentionTargets] = useState<MentionTarget[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<Mention[]>([]);
  const [activeMention, setActiveMention] = useState<ActiveMention | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refresh = useCallback(
    async (showLoading = false) => {
      if (!open || !task) return;
      try {
        if (showLoading) setLoading(true);
        setComments(await listTaskComments(projectId, task.id));
        setError("");
      } catch (requestError: any) {
        setError(
          getErrorMessage(
            requestError,
            "Could not load the task discussion.",
          ),
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [open, projectId, task],
  );

  const loadMentionTargets = useCallback(async () => {
    if (!open || !task) return;

    try {
      setMembersLoading(true);
      const members = await listProjectMembers(projectId);
      const byEmployeeId = new Map<string, MentionTarget>();

      members.forEach((member) => {
        const mention = memberToMention(member);
        if (mention) byEmployeeId.set(mention.employeeId, mention);
      });

      const assigneeEmployeeId = task.assigneeEmployeeId;
      const assigneeUser = task.employeeAssignee?.user;
      if (
        assigneeEmployeeId &&
        assigneeUser?.id &&
        assigneeUser.fullName &&
        !byEmployeeId.has(assigneeEmployeeId)
      ) {
        byEmployeeId.set(assigneeEmployeeId, {
          employeeId: assigneeEmployeeId,
          userId: assigneeUser.id,
          name: assigneeUser.fullName,
          email: assigneeUser.email || undefined,
        });
      }

      setMentionTargets(
        Array.from(byEmployeeId.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
    } catch {
      setMentionTargets([]);
    } finally {
      setMembersLoading(false);
    }
  }, [open, projectId, task]);

  useEffect(() => {
    if (!open || !task) {
      setComments([]);
      setDraft("");
      setError("");
      setSelectedMentions([]);
      setActiveMention(null);
      setMentionTargets([]);
      return;
    }

    void refresh(true);
    void loadMentionTargets();
    const intervalId = window.setInterval(() => void refresh(false), 12_000);
    return () => window.clearInterval(intervalId);
  }, [open, task?.id, refresh, loadMentionTargets]);

  const filteredMentionTargets = useMemo(() => {
    if (!activeMention) return [];
    const query = activeMention.query.trim().toLowerCase();

    return mentionTargets
      .filter((person) => {
        if (!query) return true;
        return `${person.name} ${person.email || ""}`
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 8);
  }, [activeMention, mentionTargets]);

  useEffect(() => {
    setActiveMentionIndex(0);
  }, [activeMention?.query]);

  const send = async () => {
    if (!task || sending) return;
    const body = draft.trim();
    if (!body) return;

    const mentions = selectedMentions.filter((mention) =>
      mentionIsStillPresent(body, mention),
    );

    try {
      setSending(true);
      setError("");
      await createTaskComment(projectId, task.id, body, mentions);
      setDraft("");
      setSelectedMentions([]);
      setActiveMention(null);
      await refresh(false);
      window.setTimeout(
        () =>
          endRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          }),
        0,
      );
    } catch (requestError: any) {
      setError(
        getErrorMessage(requestError, "Could not send the task update."),
      );
    } finally {
      setSending(false);
    }
  };

  const handleDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    const cursor = event.currentTarget.selectionStart ?? value.length;
    setDraft(value);
    setActiveMention(findActiveMention(value, cursor));
  };

  const selectMention = (person: MentionTarget) => {
    if (!activeMention) return;

    const before = draft.slice(0, activeMention.start);
    const after = draft.slice(activeMention.end);
    const inserted = `@${person.name} `;
    const nextDraft = `${before}${inserted}${after}`;
    const nextCursor = before.length + inserted.length;

    setDraft(nextDraft);
    setSelectedMentions((current) => {
      const withoutDuplicate = current.filter(
        (mention) => mention.employeeId !== person.employeeId,
      );
      return [...withoutDuplicate, person];
    });
    setActiveMention(null);
    setActiveMentionIndex(0);

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (activeMention && filteredMentionTargets.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveMentionIndex((current) =>
          (current + 1) % filteredMentionTargets.length,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveMentionIndex((current) =>
          (current - 1 + filteredMentionTargets.length) %
          filteredMentionTargets.length,
        );
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        selectMention(filteredMentionTargets[activeMentionIndex]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setActiveMention(null);
        return;
      }
    }

    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void send();
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
              <p className="truncate text-sm font-black text-slate-900">
                {task.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span>{task.code || "Task"}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" /> Assigned to {assignee}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Use this thread for progress updates, blockers, questions,
                instructions, and handoff notes.
              </p>
            </div>

            <div className="min-h-[260px] max-h-[46vh] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-xs font-semibold text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading
                  discussion...
                </div>
              ) : comments.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs font-black text-slate-500">
                    No updates yet
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Send the first update to start the task conversation.
                  </p>
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
                          <span className="truncate text-xs font-black text-slate-800">
                            {author}
                          </span>
                          <time
                            dateTime={comment.createdAt}
                            className="shrink-0 text-[10px] font-semibold text-slate-400"
                          >
                            {formatTime(comment.createdAt)}
                          </time>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">
                          {comment.body}
                        </p>
                      </div>
                    </article>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="relative rounded-xl border border-slate-200 bg-white p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={handleDraftChange}
                onClick={(event) => {
                  const target = event.currentTarget;
                  setActiveMention(
                    findActiveMention(
                      target.value,
                      target.selectionStart ?? target.value.length,
                    ),
                  );
                }}
                onKeyUp={(event) => {
                  if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)) {
                    return;
                  }
                  const target = event.currentTarget;
                  setActiveMention(
                    findActiveMention(
                      target.value,
                      target.selectionStart ?? target.value.length,
                    ),
                  );
                }}
                onKeyDown={handleComposerKeyDown}
                maxLength={10_000}
                rows={3}
                placeholder="Tell the assignee/team what is going on. Type @ to tag a project member..."
                className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

              {activeMention && (
                <div className="absolute bottom-[calc(100%-8px)] left-2 right-2 z-50 mb-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
                    <AtSign className="h-3.5 w-3.5" /> Tag project member
                  </div>

                  {membersLoading ? (
                    <div className="flex items-center gap-2 px-3 py-4 text-xs font-semibold text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading members...
                    </div>
                  ) : filteredMentionTargets.length > 0 ? (
                    filteredMentionTargets.map((person, index) => (
                      <button
                        key={person.employeeId}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectMention(person)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                          index === activeMentionIndex
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-700">
                          {initials(person.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-slate-800">
                            {person.name}
                          </span>
                          {person.email && (
                            <span className="block truncate text-[10px] font-medium text-slate-400">
                              {person.email}
                            </span>
                          )}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-xs font-semibold text-slate-400">
                      {mentionTargets.length === 0
                        ? "No project members are available to tag."
                        : `No member matches “${activeMention.query}”.`}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-2 pt-2">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
                  <span>Type @ to tag</span>
                  <span className="text-slate-300">•</span>
                  <span>Ctrl+Enter / Cmd+Enter to send</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={sending || !draft.trim()}
                  onClick={() => void send()}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sending ? "Sending..." : "Send update"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

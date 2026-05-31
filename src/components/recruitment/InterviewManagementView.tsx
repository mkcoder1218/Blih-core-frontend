import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Clock, Star, CheckCircle2, XCircle, ChevronDown,
  Loader2, Save, X, Plus, Trash2, Bell, Sparkles,
} from "lucide-react";
import {
  useInterviews, useCompleteSession, useCancelInterview,
  useSkills, useCreateSkill, useMyInterviewNotes, useSaveMyNotes,
} from "../../hooks/useJobRequests";
import { useInterviewNotifications } from "../../hooks/useSocket";
import { useMe } from "../../hooks/useMe";

const STATUS_STYLE: Record<string, string> = {
  pending_acceptance: "bg-amber-100 text-amber-700",
  scheduled:          "bg-blue-100  text-blue-700",
  completed:          "bg-green-100 text-green-700",
  cancelled:          "bg-red-100   text-red-600",
  no_show:            "bg-slate-100 text-slate-500",
};
const STATUS_LABEL: Record<string, string> = {
  pending_acceptance: "Awaiting Candidate",
  scheduled:          "Scheduled",
  completed:          "Completed",
  cancelled:          "Cancelled",
  no_show:            "No Show",
};
const RATING_LABEL = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

interface Props {
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}

// ── Create Skill Modal ────────────────────────────────────────────────────────
function CreateSkillModal({ onClose, onCreated }: { onClose: () => void; onCreated: (s: any) => void }) {
  const mut = useCreateSkill();
  const [name, setName] = useState("");
  const [cat, setCat]   = useState("");
  const submit = async () => {
    if (!name.trim()) return;
    const s = await mut.mutateAsync({ name: name.trim(), category: cat.trim() || undefined });
    onCreated(s); onClose();
  };
  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[14px] font-black text-slate-900">Create New Skill</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Skill Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. React, Communication…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category <span className="normal-case font-semibold text-slate-400">(optional)</span></label>
            <input value={cat} onChange={e => setCat(e.target.value)} placeholder="e.g. Frontend, Soft Skills…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[12px] font-black text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={mut.isPending || !name.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[12px] font-black hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {mut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Create Skill
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Per-interview panel (loads own notes) ─────────────────────────────────────
function InterviewPanel({ iv, showAlert, allSkills, onShowCreateSkill, currentUserId }: {
  iv: any;
  showAlert: (t: string, type?: "success" | "info" | "error") => void;
  allSkills: any[];
  onShowCreateSkill: () => void;
  currentUserId: string | undefined;
}) {
  const { data, isLoading } = useMyInterviewNotes(iv.id);
  const saveMut = useSaveMyNotes();
  const completeMut = useCompleteSession();
  const cancelMut  = useCancelInterview();

  const note = data?.note;
  const interviewSkills: any[] = data?.interviewSkills || [];

  // Local editable state — seeded from server note
  const [questions,      setQuestions]      = useState<any[]>([]);
  const [notes,          setNotes]          = useState("");
  const [skillRatings,   setSkillRatings]   = useState<{ skillId: string; skillName: string; actualRating: number | null }[]>([]);
  const [candidateScore, setCandidateScore] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  // Seed local state when note loads — questions are per-interviewer (already isolated on backend)
  useEffect(() => {
    if (!note) return;
    setQuestions(note.questions || []);
    setNotes(note.notes || "");
    setCandidateScore(note.candidateScore ?? null);

    // Start from the saved ratings
    const saved: { skillId: string; actualRating: number | null }[] = note.skillRatings || [];
    const enriched = saved.map((r: any) => {
      const globalSkill = allSkills.find((s: any) => s.id === r.skillId);
      return {
        skillId: r.skillId,
        skillName: globalSkill?.name || r.skillName || "Skill",
        actualRating: r.actualRating ?? null,
      };
    });

    // Merge in any interview-assigned skills not yet in the saved ratings
    // (handles existing notes created before the seeding fix)
    const savedIds = new Set(enriched.map(r => r.skillId));
    const fromInterview = interviewSkills
      .filter((is: any) => !savedIds.has(is.skillId))
      .map((is: any) => ({
        skillId: is.skillId,
        skillName: is.Skill?.name || allSkills.find((s: any) => s.id === is.skillId)?.name || "Skill",
        actualRating: null,
      }));

    setSkillRatings([...enriched, ...fromInterview]);
    setDirty(false);
  }, [note?.id]);

  const markDirty = () => setDirty(true);

  // Add a skill from the global list to this interviewer's ratings
  const handleAddSkill = (skill: any) => {
    if (skillRatings.find(s => s.skillId === skill.id)) return;
    setSkillRatings(prev => [...prev, { skillId: skill.id, skillName: skill.name, actualRating: null }]);
    setShowSkillPicker(false);
    markDirty();
  };

  // Remove a skill from this interviewer's ratings
  const handleRemoveSkill = (skillId: string) => {
    setSkillRatings(prev => prev.filter(s => s.skillId !== skillId));
    markDirty();
  };

  const handleSave = async () => {
    try {
      await saveMut.mutateAsync({
        interviewId: iv.id,
        questions,
        notes,
        skillRatings: skillRatings.map(s => ({ skillId: s.skillId, actualRating: s.actualRating })),
        candidateScore,
      });
      setDirty(false);
      showAlert("Notes saved", "success");
    } catch (e: any) { showAlert(`Failed: ${e.message}`, "error"); }
  };

  const handleComplete = async () => {
    try {
      await saveMut.mutateAsync({ interviewId: iv.id, questions, notes, skillRatings: skillRatings.map(s => ({ skillId: s.skillId, actualRating: s.actualRating })), candidateScore });
      const res = await completeMut.mutateAsync({ id: iv.id, skillRatings: skillRatings.map(s => ({ skillId: s.skillId, actualRating: s.actualRating })) });
      showAlert((res as any).message || "Session completed", "success");
    } catch (e: any) { showAlert(`Failed: ${e.message}`, "error"); }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this interview?")) return;
    try { await cancelMut.mutateAsync(iv.id); showAlert("Interview cancelled", "error"); }
    catch (e: any) { showAlert(`Failed: ${e.message}`, "error"); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
      <Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs font-bold">Loading your notes…</span>
    </div>
  );

  const session = `${iv.currentSession || 1} / ${iv.totalSessions || 1}`;
  // Skills not yet added to this interviewer's ratings
  const availableSkills = allSkills.filter((s: any) => !skillRatings.find(r => r.skillId === s.id));
  // Only the interview leader (interviewerUserId) or the person who scheduled it can complete/cancel
  const isLeader =
    currentUserId !== undefined && (
      iv.interviewerUserId === currentUserId ||
      iv.scheduledByUserId === currentUserId
    );

  return (
    <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-5">
      {/* Meta chips */}
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Type", value: iv.type || "—" }, { label: "Duration", value: `${iv.duration} min` }, { label: "Session", value: session }].map(m => (
          <div key={m.label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
            <p className="text-[13px] font-black text-slate-800">{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Skills evaluation (per-interviewer actual ratings) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills Evaluation</p>
          <div className="flex items-center gap-2">
            {availableSkills.length > 0 && (
              <button onClick={() => setShowSkillPicker(v => !v)}
                className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">
                <Plus className="w-3 h-3" /> Add Skill
              </button>
            )}
            <button onClick={onShowCreateSkill}
              className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
              <Sparkles className="w-3 h-3" /> New
            </button>
          </div>
        </div>

        {/* Skill picker dropdown */}
        {showSkillPicker && availableSkills.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pick a skill to evaluate</p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {availableSkills.map((s: any) => (
                <button key={s.id} onClick={() => handleAddSkill(s)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                  <span className="text-[13px] font-bold text-slate-800">{s.name}</span>
                  {s.category && <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{s.category}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {skillRatings.length === 0 && (
          <button onClick={() => setShowSkillPicker(true)}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-blue-200 rounded-xl text-[12px] font-black text-blue-500 hover:border-blue-400 hover:bg-blue-50/40 transition-all">
            <Plus className="w-4 h-4" /> Add skills to evaluate
          </button>
        )}

        {skillRatings.map(sr => (
          <div key={sr.skillId} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button onClick={() => handleRemoveSkill(sr.skillId)}
                className="text-slate-300 hover:text-rose-400 transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
              <span className="text-[13px] font-black text-slate-800 truncate">{sr.skillName}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold">Your Rating:</span>
              {[1,2,3,4,5].map(r => (
                <button key={r} title={RATING_LABEL[r]}
                  onClick={() => { setSkillRatings(prev => prev.map(s => s.skillId === sr.skillId ? { ...s, actualRating: r } : s)); markDirty(); }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${sr.actualRating && r <= sr.actualRating ? "bg-green-400 text-white" : "bg-white border border-slate-200 text-slate-300 hover:border-green-300"}`}>
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              ))}
              {sr.actualRating && <span className="text-[10px] font-bold text-slate-500">{RATING_LABEL[sr.actualRating]}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Candidate overall score ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Candidate Rating</p>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1 flex-wrap">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => { setCandidateScore(n * 10); markDirty(); }}
                className={`w-7 h-7 rounded-lg text-[11px] font-black transition-all ${candidateScore && n * 10 <= candidateScore ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-400 hover:border-blue-300"}`}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[13px] font-black text-slate-700">{candidateScore ? `${candidateScore}%` : "—"}</span>
            {candidateScore && (
              <button onClick={() => { setCandidateScore(null); markDirty(); }} className="text-slate-300 hover:text-slate-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── My Questions ── */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Interview Questions</p>
        {questions.map((q: any, idx: number) => (
          <div key={idx} className="flex gap-2">
            <textarea value={typeof q === "string" ? q : q.question}
              onChange={e => { const nq = [...questions]; nq[idx] = typeof q === "string" ? e.target.value : { ...q, question: e.target.value }; setQuestions(nq); markDirty(); }}
              className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 resize-none min-h-[56px]"
              placeholder={`Question ${idx + 1}`} />
            <button onClick={() => { setQuestions(questions.filter((_, i) => i !== idx)); markDirty(); }}
              className="text-rose-400 hover:text-rose-600 transition-colors self-start mt-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={() => { setQuestions([...questions, { question: "" }]); markDirty(); }}
          className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:text-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Question
        </button>
      </div>

      {/* ── My Notes ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Notes</p>
        <textarea value={notes} onChange={e => { setNotes(e.target.value); markDirty(); }}
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 resize-none min-h-[80px]"
          placeholder="Your private notes about this interview…" />
      </div>

      {/* Save button (shown when dirty) */}
      {dirty && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saveMut.isPending}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[12px] font-black hover:bg-blue-700 transition-colors disabled:opacity-60">
            {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Notes
          </button>
        </div>
      )}

      {/* ── Action buttons ── */}
      {iv.status === "scheduled" && (
        <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-slate-100">
          {isLeader ? (
            <>
              <button onClick={handleComplete} disabled={completeMut.isPending}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-2xl text-[12px] font-black hover:bg-green-700 transition-all disabled:opacity-60">
                {completeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {(iv.currentSession || 1) < (iv.totalSessions || 1) ? `Complete Session ${iv.currentSession || 1}` : "Complete Final Session"}
              </button>
              <button onClick={handleCancel} disabled={cancelMut.isPending}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-500 rounded-2xl text-[12px] font-black hover:bg-red-50 transition-all disabled:opacity-60">
                <XCircle className="w-4 h-4" /> Cancel Interview
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 w-full">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <p className="text-[12px] font-semibold text-slate-500">Only the interview leader can complete or cancel this session.</p>
            </div>
          )}
        </div>
      )}

      {iv.status === "completed" && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-[12px] font-black text-green-700">All sessions completed. Candidate advanced to offer stage.</p>
        </div>
      )}
      {iv.status === "pending_acceptance" && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-[12px] font-black text-amber-700">Waiting for candidate to accept the interview invitation.</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InterviewManagementView({ showAlert }: Props) {
  const { data: interviews, isLoading, refetch } = useInterviews();
  const { data: allSkills = [] } = useSkills();
  const { data: me } = useMe();
  const currentUserId = me?.data?.user?.id as string | undefined;
  const [expandedId,      setExpandedId]      = useState<string | null>(null);
  const [liveNotifs,      setLiveNotifs]      = useState<Array<{ id: string; data: any }>>([]);
  const [showCreateSkill, setShowCreateSkill] = useState(false);

  const handleNotification = useCallback((event: string, data: any) => {
    const id = Date.now().toString();
    setLiveNotifs(prev => [{ id, data }, ...prev.slice(0, 3)]);
    refetch();
    const msgs: Record<string, string> = {
      "interview:accepted":          `${data.candidateName} accepted the interview`,
      "interview:declined":          `${data.candidateName} declined the interview`,
      "interview:assigned":          `You've been assigned to interview ${data.candidateName}`,
      "interview:completed":         `Interview completed — ${data.candidateName} advanced to offer`,
      "interview:cancelled":         "An interview was cancelled",
      "interview:session_completed": `Session ${data.currentSession} completed`,
    };
    if (msgs[event]) showAlert(msgs[event], event.includes("declined") || event.includes("cancelled") ? "error" : "success");
    setTimeout(() => setLiveNotifs(prev => prev.filter(n => n.id !== id)), 5000);
  }, [refetch, showAlert]);
  useInterviewNotifications(handleNotification);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading interviews…</span>
    </div>
  );

  const list = interviews || [];

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black text-slate-900 tracking-tight">My Interviews</h1>
          <p className="text-[12px] text-slate-400 font-semibold mt-0.5">Interviews assigned to you — {list.length} total</p>
        </div>
        {liveNotifs.length > 0 && (
          <div className="relative">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{liveNotifs.length}</span>
          </div>
        )}
      </div>

      {/* Live toasts */}
      <AnimatePresence>
        {liveNotifs.map(n => (
          <motion.div key={n.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Bell className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-[12px] font-bold text-blue-800">{n.data?.message || "New notification"}</p>
          </motion.div>
        ))}
      </AnimatePresence>

      {list.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
          <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No interviews assigned</p>
        </div>
      )}

      {list.map((iv: any) => {
        const isExpanded = expandedId === iv.id;
        const candidate  = iv.JobApplication;
        const job        = candidate?.JobOpening;
        return (
          <div key={iv.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Card header */}
            <div className="px-4 sm:px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
              onClick={() => setExpandedId(isExpanded ? null : iv.id)}>

              {/* top row: avatar + name/position + chevron */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 text-[13px] uppercase flex-shrink-0 mt-0.5">
                  {(candidate?.fullName || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-black text-slate-900 leading-tight truncate">{candidate?.fullName || "Unknown"}</p>
                  <p className="text-[11px] text-slate-400 font-semibold truncate">{job?.title || "Position"}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 mt-1 ${isExpanded ? "rotate-180" : ""}`} />
              </div>

              {/* bottom row: status badge + date/time */}
              <div className="flex items-center justify-between mt-3 pl-12">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${STATUS_STYLE[iv.status] || "bg-slate-100 text-slate-500"}`}>
                  {STATUS_LABEL[iv.status] || iv.status}
                </span>
                <div className="text-right">
                  <p className="text-[12px] font-black text-slate-700">
                    {new Date(iv.interviewAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {new Date(iv.interviewAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded — per-interviewer panel */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <InterviewPanel
                    iv={iv}
                    showAlert={showAlert}
                    allSkills={allSkills as any[]}
                    onShowCreateSkill={() => setShowCreateSkill(true)}
                    currentUserId={currentUserId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {showCreateSkill && (
        <CreateSkillModal
          onClose={() => setShowCreateSkill(false)}
          onCreated={skill => showAlert(`Skill "${skill.name}" created`, "success")}
        />
      )}
    </div>
  );
}

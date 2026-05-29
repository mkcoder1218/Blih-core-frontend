import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Calendar, Clock, MapPin, Users, Plus, Trash2, ArrowLeft,
  ChevronDown, Star, Loader2,
} from "lucide-react";
import { UserSearchSelect } from "../people/UserSearchSelect";
import { useDepartments } from "../../hooks/useDepartments";
import { useSkills, useCreateSkill } from "../../hooks/useJobRequests";

interface PanelMember { userId: string; }
interface InterviewQuestion { question: string; department: string; }
interface SkillEntry { skillId: string; requiredRating: number; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBackToApplication?: () => void;
  candidateName: string;
  jobTitle: string;
  jobApplicationId: string;
  onSchedule: (data: any) => void;
  isLoading?: boolean;
}

const RATING_LABELS = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

export default function ScheduleInterviewModal({
  isOpen, onClose, onBackToApplication, candidateName, jobTitle,
  jobApplicationId, onSchedule, isLoading,
}: Props) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: departmentsData, isLoading: isLoadingDeps } = useDepartments();
  const { data: skillsData, isLoading: isLoadingSkills } = useSkills();
  const createSkillMutation = useCreateSkill();

  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [totalSessions, setTotalSessions] = useState("1");
  const [type, setType] = useState("Face to Face");
  const [venue, setVenue] = useState("");
  const [department, setDepartment] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [interviewerUserId, setInterviewerUserId] = useState("");
  const [panel, setPanel] = useState<PanelMember[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([{ question: "", department: "" }]);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [showNewSkillForm, setShowNewSkillForm] = useState(false);

  if (!isOpen) return null;

  const handleAddSkill = (skillId: string) => {
    if (skills.find(s => s.skillId === skillId)) return;
    setSkills([...skills, { skillId, requiredRating: 3 }]);
  };

  const handleRemoveSkill = (skillId: string) => {
    setSkills(skills.filter(s => s.skillId !== skillId));
  };

  const handleSkillRating = (skillId: string, rating: number) => {
    setSkills(skills.map(s => s.skillId === skillId ? { ...s, requiredRating: rating } : s));
  };

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) return;
    const skill = await createSkillMutation.mutateAsync({
      name: newSkillName.trim(),
      category: newSkillCategory.trim() || undefined,
    });
    handleAddSkill(skill.id);
    setNewSkillName("");
    setNewSkillCategory("");
    setShowNewSkillForm(false);
  };

  const handleSubmit = () => {
    const panelMembers = panel.filter(m => m.userId).map(m => ({ userId: m.userId }));
    if (interviewerUserId) {
      panelMembers.unshift({ userId: interviewerUserId });
    }
    onSchedule({
      jobApplicationId,
      interviewAt: `${date}T${time}:00`,
      duration: parseInt(duration),
      totalSessions: parseInt(totalSessions),
      type,
      venue,
      department,
      interviewerUserId: interviewerUserId || undefined,
      panel: panelMembers,
      questions: questions.filter(q => q.question.trim()),
      additionalNotes,
      skills,
    });
  };

  const skillsMap = Object.fromEntries((skillsData || []).map((s: any) => [s.id, s]));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-4xl bg-[#fafbfc] rounded-[32px] shadow-2xl overflow-hidden border border-white"
        >
          {/* Header */}
          <div className="p-8 pb-4 bg-white border-b border-slate-50 sticky top-0 z-10">
            <button
              onClick={onBackToApplication || onClose}
              className="flex items-center gap-2 text-blue-600 font-bold text-[11px] uppercase tracking-widest mb-6 hover:translate-x-[-4px] transition-transform"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Application</span>
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Schedule Interview</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  for <span className="text-slate-800">{candidateName}</span> — {jobTitle} Position
                </p>
              </div>
              <button onClick={onClose} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 font-sans">
            {/* Interview Details */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-8 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Interview Details</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Interview Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Duration (minutes)</label>
                    <div className="relative">
                      <select value={duration} onChange={e => setDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:bg-white transition-all outline-none">
                        <option value="30">30 Minutes</option>
                        <option value="60">60 Minutes</option>
                        <option value="90">90 Minutes</option>
                        <option value="120">120 Minutes</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Interview Time</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Total Sessions</label>
                    <div className="relative">
                      <select value={totalSessions} onChange={e => setTotalSessions(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:bg-white transition-all outline-none">
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Session{n > 1 ? "s" : ""}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Interview Type</label>
                  <div className="relative">
                    <select value={type} onChange={e => { setType(e.target.value); if (e.target.value !== "Video Call") setVenue(""); }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:bg-white transition-all outline-none">
                      <option value="Face to Face">Face to Face</option>
                      <option value="Video Call">Video Call</option>
                      <option value="Phone Call">Phone Call</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                {type === "Video Call" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Meeting Link</label>
                    <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:bg-white transition-all"
                      placeholder="https://meet.google.com/..." />
                  </div>
                )}
                {type === "Face to Face" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Venue / Location</label>
                    <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:bg-white transition-all"
                      placeholder="Conference Room A, Floor 3..." />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Department</label>
                <div className="relative">
                  <select value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:bg-white transition-all outline-none">
                    <option value="">Select a department</option>
                    {isLoadingDeps ? <option>Loading...</option> : departmentsData?.departments.map((dep: any) => (
                      <option key={dep.id} value={dep.name}>{dep.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Lead Interviewer */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-6 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Lead Interviewer</h3>
              <p className="text-[11px] text-slate-400 font-semibold -mt-4">This person will receive the interview assignment notification</p>
              <UserSearchSelect
                value={interviewerUserId}
                onChange={setInterviewerUserId}
                placeholder="Select lead interviewer"
              />
            </div>

            {/* Panel */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Additional Panel Members</h3>
                <button onClick={() => setPanel([...panel, { userId: "" }])}
                  className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:text-blue-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /><span>Add Member</span>
                </button>
              </div>
              {panel.length === 0 && (
                <p className="text-[11px] text-slate-400 font-semibold">No additional panel members. Click "Add Member" to add.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                {panel.map((member, idx) => (
                  <div key={idx} className="relative group/field">
                    <UserSearchSelect
                      value={member.userId}
                      onChange={userId => { const p = [...panel]; p[idx].userId = userId; setPanel(p); }}
                      placeholder={`Panel member ${idx + 1}`}
                    />
                    <button onClick={() => setPanel(panel.filter((_, i) => i !== idx))}
                      className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-rose-100 shadow-sm rounded-full flex items-center justify-center text-rose-400 hover:text-rose-600 opacity-0 group-hover/field:opacity-100 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Skills to Evaluate</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Set required proficiency level (1–5) for each skill</p>
                </div>
                <button onClick={() => setShowNewSkillForm(!showNewSkillForm)}
                  className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:text-blue-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /><span>New Skill</span>
                </button>
              </div>

              {/* New skill form */}
              {showNewSkillForm && (
                <div className="flex gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)}
                    placeholder="Skill name (e.g. React)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-400" />
                  <input value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value)}
                    placeholder="Category (optional)"
                    className="w-36 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-400" />
                  <button onClick={handleCreateSkill} disabled={createSkillMutation.isPending || !newSkillName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black disabled:opacity-50 hover:bg-blue-700 transition-colors">
                    {createSkillMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
                  </button>
                </div>
              )}

              {/* Skill picker */}
              {isLoadingSkills ? (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold"><Loader2 className="w-4 h-4 animate-spin" /> Loading skills...</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(skillsData || []).map((skill: any) => {
                    const isSelected = skills.some(s => s.skillId === skill.id);
                    return (
                      <button key={skill.id} onClick={() => isSelected ? handleRemoveSkill(skill.id) : handleAddSkill(skill.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                        }`}>
                        {skill.name}
                        {skill.category && <span className="ml-1 opacity-60">· {skill.category}</span>}
                      </button>
                    );
                  })}
                  {(skillsData || []).length === 0 && (
                    <p className="text-[11px] text-slate-400 font-semibold">No skills yet. Create one above.</p>
                  )}
                </div>
              )}

              {/* Selected skills with rating */}
              {skills.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Proficiency Levels</p>
                  {skills.map(entry => {
                    const skill = skillsMap[entry.skillId];
                    if (!skill) return null;
                    return (
                      <div key={entry.skillId} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <div>
                          <span className="text-[13px] font-black text-slate-800">{skill.name}</span>
                          {skill.category && <span className="ml-2 text-[10px] text-slate-400 font-bold">{skill.category}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(r => (
                            <button key={r} onClick={() => handleSkillRating(entry.skillId, r)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                r <= entry.requiredRating ? "bg-amber-400 text-white" : "bg-white border border-slate-200 text-slate-300"
                              }`}
                              title={RATING_LABELS[r]}>
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ))}
                          <span className="ml-2 text-[10px] font-black text-slate-500 w-20">{RATING_LABELS[entry.requiredRating]}</span>
                          <button onClick={() => handleRemoveSkill(entry.skillId)} className="ml-1 text-rose-400 hover:text-rose-600 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Interview Questions</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Interviewers can edit these during the interview</p>
                </div>
                <button onClick={() => setQuestions([...questions, { question: "", department: "" }])}
                  className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:text-blue-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /><span>Add Question</span>
                </button>
              </div>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={idx} className="relative group/question p-5 border border-blue-100/40 rounded-3xl bg-blue-50/20 space-y-3 hover:bg-white hover:border-blue-200 transition-all">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Question {idx + 1}</label>
                    <textarea value={q.question} onChange={e => { const nq = [...questions]; nq[idx].question = e.target.value; setQuestions(nq); }}
                      className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none min-h-[80px] resize-none"
                      placeholder="Describe your experience with..." />
                    <div className="relative">
                      <select value={q.department} onChange={e => { const nq = [...questions]; nq[idx].department = e.target.value; setQuestions(nq); }}
                        className="w-full bg-white border border-slate-100 rounded-2xl p-3 pr-10 text-xs font-bold text-slate-700 appearance-none outline-none">
                        <option value="">Department (optional)</option>
                        {departmentsData?.departments.map((dep: any) => <option key={dep.id} value={dep.name}>{dep.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    {questions.length > 1 && (
                      <button onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                        className="absolute -right-2 -top-2 w-7 h-7 bg-white border border-rose-100 shadow-lg rounded-full flex items-center justify-center text-rose-400 hover:text-rose-600 opacity-0 group-hover/question:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-4 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Additional Notes</h3>
              <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 min-h-[100px] outline-none focus:bg-white transition-all resize-none"
                placeholder="Special instructions, materials to prepare, or notes for the panel..." />
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 bg-white border-t border-slate-50 grid grid-cols-2 gap-4">
            <button onClick={onClose}
              className="bg-white border border-slate-200 text-slate-500 font-black py-4 rounded-2xl text-xs tracking-widest uppercase hover:bg-slate-50 hover:text-slate-800 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isLoading}
              className="bg-[#2563eb] text-white font-black py-4 rounded-2xl text-xs tracking-widest uppercase shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</> : "Schedule Interview & Send Invite"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

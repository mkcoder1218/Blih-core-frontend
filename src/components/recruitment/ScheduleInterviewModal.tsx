/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Trash2,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { UserSearchSelect } from "../people/UserSearchSelect";
import { useDepartments } from "../../hooks/useDepartments";

interface InterviewPanelMember {
  userId: string;
}

interface InterviewQuestion {
  question: string;
  department: string;
}

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToApplication?: () => void;
  candidateName: string;
  jobTitle: string;
  jobApplicationId: string;
  onSchedule: (data: any) => void;
}

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  onBackToApplication,
  candidateName,
  jobTitle,
  jobApplicationId,
  onSchedule,
}: ScheduleInterviewModalProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: departmentsData, isLoading: isLoadingDeps } = useDepartments();
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [sessions, setSessions] = useState("1");
  const [type, setType] = useState("Face to Face");
  const [venue, setVenue] = useState("");
  const [department, setDepartment] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [panel, setPanel] = useState<InterviewPanelMember[]>([{ userId: "" }]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([
    { question: "", department: "" },
  ]);

  if (!isOpen) return null;

  const handleAddInterviewer = () => {
    setPanel([...panel, { userId: "" }]);
  };

  const handleRemoveInterviewer = (index: number) => {
    setPanel(panel.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", department: "" }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSchedule({
      jobApplicationId,
      interviewAt: `${date}T${time}:00`,
      duration: parseInt(duration),
      sessions: parseInt(sessions),
      type,
      venue,
      department,
      panel: panel
        .filter((m) => Boolean(m.userId))
        .map((m) => ({ userId: m.userId })),
      questions,
      additionalNotes,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
          <div className="p-8 pb-4 bg-white border-b border-slate-50 relative sticky top-0 z-10">
            <button
              onClick={onBackToApplication || onClose}
              className="flex items-center gap-2 text-blue-600 font-bold text-[11px] uppercase tracking-widest mb-6 hover:translate-x-[-4px] transition-transform"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Application</span>
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                  Schedule Interview
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  for <span className="text-slate-800">{candidateName}</span> —{" "}
                  {jobTitle} Position
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-all font-sans"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 font-sans">
            {/* Interview Details Card */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-8 shadow-3xs">
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight">
                Interview Details
              </h3>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                      Interview Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                      Duration (minutes)
                    </label>
                    <div className="relative">
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:bg-white transition-all outline-none"
                      >
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
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                      Interview Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                      Sessions
                    </label>
                    <div className="relative">
                      <select
                        value={sessions}
                        onChange={(e) => setSessions(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:bg-white transition-all outline-none"
                      >
                        <option value="1">1 Session</option>
                        <option value="2">2 Sessions</option>
                        <option value="3">3 Sessions</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                    Interview Type
                  </label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value);
                        if (
                          e.target.value === "Face to Face" ||
                          e.target.value === "Phone Call"
                        ) {
                          setVenue("");
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:bg-white transition-all outline-none"
                    >
                      <option value="Face to Face">Face to Face</option>
                      <option value="Video Call">Video Call</option>
                      <option value="Phone Call">Phone Call</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                {type === "Video Call" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                      Venue / Meeting Link
                    </label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:bg-white transition-all"
                      placeholder="Google Meet URL"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                  Department
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:bg-white transition-all outline-none"
                  >
                    <option value="">Select a department</option>
                    {isLoadingDeps ? (
                      <option>Loading...</option>
                    ) : (
                      departmentsData?.departments.map((dep) => (
                        <option key={dep.id} value={dep.name}>
                          {dep.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Panel Card */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-6 shadow-3xs">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-black text-slate-800 tracking-tight">
                  Interview Panel / Committee
                </h3>
                <button
                  onClick={handleAddInterviewer}
                  className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Interviewer</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {panel.map((member, idx) => (
                  <div key={idx} className="relative group/field space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                        Interviewer {idx + 1} Name
                      </label>
                      <UserSearchSelect
                        value={member.userId}
                        onChange={(userId) => {
                          const newPanel = [...panel];
                          newPanel[idx].userId = userId;
                          setPanel(newPanel);
                        }}
                        placeholder="Select interviewer"
                      />
                    </div>
                    {panel.length > 1 && (
                      <button
                        onClick={() => handleRemoveInterviewer(idx)}
                        className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-rose-100 shadow-sm rounded-full flex items-center justify-center text-rose-400 hover:text-rose-600 opacity-0 group-hover/field:opacity-100 transition-all translate-y-2 group-hover/field:translate-y-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Questions Card */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-6 shadow-3xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-black text-slate-800 tracking-tight">
                    Interview Questions
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Add questions from department or create custom ones
                  </p>
                </div>
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="relative group/question p-6 border border-blue-100/40 rounded-3xl bg-blue-50/20 space-y-4 transition-all hover:bg-white hover:border-blue-200"
                  >
                    <div className="space-y-2 px-1">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                        Question {idx + 1}
                      </label>
                      <textarea
                        value={q.question}
                        onChange={(e) => {
                          const newQ = [...questions];
                          newQ[idx].question = e.target.value;
                          setQuestions(newQ);
                        }}
                        className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none min-h-[100px] resize-none"
                        placeholder="Describe your experience with..."
                      />
                    </div>
                    <div className="space-y-2 px-1">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block opacity-70">
                        Question Source Department
                      </label>
                      <div className="relative">
                        <select
                          value={q.department}
                          onChange={(e) => {
                            const newQ = [...questions];
                            newQ[idx].department = e.target.value;
                            setQuestions(newQ);
                          }}
                          className="w-full bg-white border border-slate-100 rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 appearance-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        >
                          <option value="">Select department</option>
                          {isLoadingDeps ? (
                            <option>Loading...</option>
                          ) : (
                            departmentsData?.departments.map((dep) => (
                              <option key={dep.id} value={dep.name}>
                                {dep.name}
                              </option>
                            ))
                          )}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    {questions.length > 1 && (
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="absolute -right-2 -top-2 w-7 h-7 bg-white border border-rose-100 shadow-lg rounded-full flex items-center justify-center text-rose-400 hover:text-rose-600 opacity-0 group-hover/question:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-8 space-y-4 shadow-3xs">
              <h3 className="text-[14px] font-black text-slate-800 tracking-tight">
                Additional Notes
              </h3>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 min-h-[120px] outline-none focus:bg-white transition-all resize-none"
                placeholder="Any special instructions, materials to prepare, or notes for the interview panel..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-white border-t border-slate-50 grid grid-cols-2 gap-4">
            <button
              onClick={onClose}
              className="bg-white border border-slate-200 text-slate-500 font-black py-4.5 rounded-2xl text-xs tracking-widest uppercase hover:bg-slate-50 hover:text-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#2563eb] text-white font-black py-4.5 rounded-2xl text-xs tracking-widest uppercase shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95"
            >
              Schedule Interview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

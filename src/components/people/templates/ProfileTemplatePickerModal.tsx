import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ProfileTemplate } from "../../../api/types";

export default function ProfileTemplatePickerModal(props: {
  open: boolean;
  templates: ProfileTemplate[];
  onClose: () => void;
  onSelect: (t: ProfileTemplate) => void;
}) {
  if (!props.open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
        <div className="absolute inset-0" onClick={props.onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-20 space-y-4"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-[13px] font-bold text-slate-900">Create Draft</h4>
              <div className="text-[10.5px] text-slate-500 font-medium mt-0.5">Select a profile template to start a draft.</div>
            </div>
            <button onClick={props.onClose} className="text-slate-400 hover:text-slate-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {props.templates.map((t) => (
              <button
                key={t.id}
                onClick={() => props.onSelect(t)}
                className="text-left bg-white hover:bg-slate-50 border border-slate-150 rounded-2xl p-5 transition-all cursor-pointer"
              >
                <div className="text-[13px] font-extrabold text-slate-900 tracking-tight">{t.name}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1.5 leading-relaxed">{t.description}</div>
                <div className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {t.fields.length} fields
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

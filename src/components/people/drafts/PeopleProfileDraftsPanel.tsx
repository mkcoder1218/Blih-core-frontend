import React, { useEffect, useMemo, useRef, useState } from "react";
import { Copy, FileText, Plus, Trash2 } from "lucide-react";
import ProfileTemplatePickerModal from "../templates/ProfileTemplatePickerModal";
import TemplateFormRenderer from "../templates/TemplateFormRenderer";
import { useProfileTemplates } from "../../../hooks/useProfileTemplates";
import CreateEmployeeModal from "../CreateEmployeeModal";
import { useProfileDrafts } from "../../../hooks/useProfileDrafts";
import { useCreateProfileDraft } from "../../../hooks/useCreateProfileDraft";
import { useUpdateProfileDraft } from "../../../hooks/useUpdateProfileDraft";
import { useDeleteProfileDraft } from "../../../hooks/useDeleteProfileDraft";
import type { ProfileDraft, ProfileTemplate } from "../../../api/types";

function toDateLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function PeopleProfileDraftsPanel(props: {
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createEmployeeModalOpen, setCreateEmployeeModalOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string>("");
  const [resumeId, setResumeId] = useState<string | undefined>();

  const templatesQuery = useProfileTemplates();
  const draftsQuery = useProfileDrafts();
  const createDraftMut = useCreateProfileDraft();
  const updateDraftMut = useUpdateProfileDraft();
  const deleteDraftMut = useDeleteProfileDraft();

  const templates: ProfileTemplate[] = templatesQuery.data?.data?.templates || [];
  const drafts: ProfileDraft[] = draftsQuery.data?.data?.drafts || [];

  const activeDraft = useMemo(() => drafts.find((d) => d.id === activeDraftId) || null, [drafts, activeDraftId]);
  const activeTemplate = useMemo(() => {
    if (!activeDraft) return null;
    return templates.find((t) => t.id === activeDraft.templateId) || null;
  }, [activeDraft, templates]);

  useEffect(() => {
    if (!activeDraftId && drafts.length) setActiveDraftId(drafts[0].id);
  }, [drafts.length]);

  const openCreate = () => {
    setResumeId(undefined);
    setCreateEmployeeModalOpen(true);
  };

  const resumeInModal = (id: string) => {
    setResumeId(id);
    setCreateEmployeeModalOpen(true);
  };

  const createDraft = async (t: ProfileTemplate) => {
    const seed: Record<string, any> = {};
    for (const f of t.fields || []) seed[f.name] = f.placeholder ?? "";
    try {
      const res = await createDraftMut.mutateAsync({ templateId: t.id, data: seed, status: "draft" });
      const id = res.data?.draft?.id;
      if (id) setActiveDraftId(id);
      setPickerOpen(false);
      props.showAlert(`Draft created from "${t.name}"`, "success");
    } catch (e: any) {
      props.showAlert(e?.response?.data?.message || e?.message || "Create failed", "error");
    }
  };

  const pendingPatchRef = useRef<{ id: string; data: Record<string, any> } | null>(null);
  const debounceRef = useRef<any>(null);

  const updateField = (name: string, value: any) => {
    if (!activeDraft) return;
    const nextData = { ...(activeDraft.data || {}), [name]: value };
    pendingPatchRef.current = { id: activeDraft.id, data: nextData };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const p = pendingPatchRef.current;
      if (!p) return;
      try {
        await updateDraftMut.mutateAsync({ id: p.id, data: { data: p.data } });
      } catch (e: any) {
        props.showAlert(e?.response?.data?.message || e?.message || "Update failed", "error");
      }
    }, 450);
  };

  const deleteDraft = async (id: string) => {
    try {
      await deleteDraftMut.mutateAsync(id);
      if (activeDraftId === id) setActiveDraftId("");
      props.showAlert("Draft deleted.", "success");
    } catch (e: any) {
      props.showAlert(e?.response?.data?.message || e?.message || "Delete failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={openCreate}
        className="w-full border-2 border-dashed border-[#2563eb] hover:bg-slate-50/45 rounded-3xl p-10 bg-white flex flex-col items-center justify-center gap-3.5 transition-all cursor-pointer group shadow-xs"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-all">
          <Plus className="w-6 h-6 stroke-[3]" />
        </div>
        <div className="text-center">
          <span className="text-[15px] font-bold text-slate-900 block transition-colors">Create New Employee Profile</span>
          <span className="text-xs text-slate-500 mt-1.5 block font-medium">Onboard a new employee to the system.</span>
        </div>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 space-y-5 shadow-xs">
          {!activeDraft || !activeTemplate ? (
            <div className="text-xs text-slate-500 font-semibold">{draftsQuery.isLoading ? "Loading drafts..." : "Select or create a draft to begin."}</div>
          ) : (
            <>
              <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">Draft Employee Profile</h4>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created</span>
                  <strong className="text-xs font-extrabold text-[#111827] block mt-1">{toDateLabel(activeDraft.createdAt)}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Updated</span>
                  <strong className="text-xs font-extrabold text-[#111827] block mt-1">{toDateLabel(activeDraft.updatedAt)}</strong>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-white space-y-3 flex-1 flex flex-col min-h-0">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">Profile Details</span>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[400px] custom-scrollbar">
                  <TemplateFormRenderer fields={activeTemplate.fields as any} values={activeDraft.data || {}} onChange={updateField} />
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100 mt-auto">
                  <button
                    onClick={() => {
                      if (activeDraft) {
                        resumeInModal(activeDraft.id);
                      }
                    }}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all select-none flex-1 text-center cursor-pointer shadow-sm"
                  >
                    Complete Onboarding
                  </button>
                  <button
                    onClick={() => props.showAlert("Copied draft data (simulation).", "success")}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
                    title="Copy Draft Specifications"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteDraft(activeDraft.id)}
                    className="p-2 border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl cursor-pointer"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-7 border border-dashed border-slate-200 rounded-2xl bg-slate-50/25 p-6 min-h-[300px]">
          {draftsQuery.isLoading ? (
            <div className="h-full flex flex-col justify-center items-center p-10">
              <FileText className="w-10 h-10 text-slate-300 mb-2.5" />
              <span className="text-slate-400 text-xs font-semibold">Loading drafts...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center p-10">
              <FileText className="w-10 h-10 text-slate-300 mb-2.5" />
              <span className="text-slate-400 text-xs font-semibold">No employee profile drafts.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Drafts</div>
              {drafts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDraftId(d.id)}
                  className={`w-full text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
                    d.id === activeDraftId ? "border-blue-200 shadow-sm" : "border-slate-150 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate">Draft</div>
                      <div className="text-[10.5px] text-slate-500 font-medium mt-0.5 truncate">
                        Template: {templates.find((t) => t.id === d.templateId)?.name || d.templateId}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); resumeInModal(d.id); }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Continue
                      </button>
                      <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{toDateLabel(d.updatedAt)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProfileTemplatePickerModal
        open={pickerOpen}
        templates={(templatesQuery.data?.data?.templates || []) as any}
        onClose={() => setPickerOpen(false)}
        onSelect={createDraft as any}
      />

      <CreateEmployeeModal 
         isOpen={createEmployeeModalOpen} 
         onClose={() => {
            setCreateEmployeeModalOpen(false);
            draftsQuery.refetch(); // Refresh list after closing
         }} 
         showAlert={props.showAlert}
         initialDraftId={resumeId}
         onSuccess={() => props.showAlert("Employee Boarding Complete!", "success")}
      />
    </div>
  );
}


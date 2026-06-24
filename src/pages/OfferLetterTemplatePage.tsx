import React, { useMemo, useState } from "react";
import { ArrowLeft, Braces, Eye, FileText, Save, ShieldCheck } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Navigate, useNavigate } from "react-router-dom";
import { createOfferLetterTemplate } from "../api/offerLetters";
import { useAlert } from "../contexts/AlertContext";
import { useMe } from "../hooks/useMe";

const variables = [
  "candidateName",
  "jobTitle",
  "department",
  "startDate",
  "salary",
  "companyName",
  "managerName",
];

const initialBody = `<p>Dear <strong>{{candidateName}}</strong>,</p>
<p>We are delighted to offer you the position of <strong>{{jobTitle}}</strong> at {{companyName}}.</p>
<p>Your anticipated start date is {{startDate}}, and your compensation will be {{salary}}.</p>
<p>We are excited about the experience and perspective you will bring to our team.</p>
<p>Sincerely,<br>{{managerName}}<br>{{companyName}}</p>`;

export default function OfferLetterTemplatePage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const me = useMe();
  const roles: string[] = (me.data as any)?.data?.roles || [];
  const allowed = roles.includes("BUSINESS_ADMIN") || roles.includes("HR_MANAGER");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Offer for {{jobTitle}} at {{companyName}}");
  const [bodyHtml, setBodyHtml] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(true);

  const placeholders = useMemo(() => {
    const found = new Set<string>();
    const regex = /\{\{\s*([\w]+)\s*\}\}/g;
    let match;
    while ((match = regex.exec(`${subject} ${bodyHtml}`)) !== null) found.add(match[1]);
    return Array.from(found);
  }, [subject, bodyHtml]);

  if (!me.data) return null;
  if (!allowed) return <Navigate to="/unauthorized" replace />;

  const insertVariable = (variable: string) => {
    setBodyHtml((current) => `${current}<p>{{${variable}}}</p>`);
  };

  const saveTemplate = async () => {
    if (!name.trim() || !subject.trim() || !bodyHtml.replace(/<[^>]*>/g, "").trim()) {
      showAlert("Add a template name, subject, and letter content.", "error");
      return;
    }
    setSaving(true);
    try {
      await createOfferLetterTemplate({
        name: name.trim(),
        subject: subject.trim(),
        bodyHtml,
        bodyText: bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        variables: placeholders,
      });
      showAlert("Offer letter template created successfully.", "success");
      navigate(-1);
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Failed to create template.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50/70">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate(-1)} className="mt-0.5 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">Create offer letter template</h1>
                <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:flex">
                  <ShieldCheck className="h-3 w-3" /> Admin & HR
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">Build a reusable, on-brand offer for your hiring team.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview((value) => !value)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 xl:hidden">
              <Eye className="h-4 w-4" /> {preview ? "Hide preview" : "Show preview"}
            </button>
            <button disabled={saving} onClick={saveTemplate} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save template"}
            </button>
          </div>
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900"><FileText className="h-4 w-4 text-blue-600" /> Template details</div>
            </div>
            <div className="space-y-5 p-6">
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-700">Template name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Standard full-time offer" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-700">Email subject</span>
                <input value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" />
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-slate-700">Letter content</span>
                  <span className="text-[11px] font-semibold text-slate-400">{placeholders.length} dynamic fields</span>
                </div>
                <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black text-blue-900"><Braces className="h-4 w-4" /> Insert a dynamic field</div>
                  <div className="flex max-w-full flex-wrap gap-2">
                    {variables.map((variable) => (
                      <button type="button" key={variable} onClick={() => insertVariable(variable)} className="max-w-full rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 font-mono text-[11px] font-bold text-blue-700 hover:border-blue-300">
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-blue-600">Click a bracket field to add it to the letter.</p>
                </div>
                <div className="offer-template-editor overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <ReactQuill
                    theme="snow"
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    modules={{ toolbar: [[{ header: [1, 2, false] }], ["bold", "italic", "underline"], [{ list: "ordered" }, { list: "bullet" }], [{ align: [] }], ["link", "clean"]] }}
                  />
                </div>
              </div>

            </div>
          </section>

          <section className={`${preview ? "block" : "hidden"} min-w-0 xl:block`}>
            <div className="sticky top-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Eye className="h-4 w-4 text-blue-600" /> Live preview</div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Candidate view</span>
              </div>
              <div className="min-w-0 overflow-hidden p-4 sm:p-6">
                <article className="mx-auto min-h-[680px] w-full min-w-0 max-w-[680px] overflow-hidden bg-white px-6 py-10 shadow-md sm:px-10">
                  <div className="mb-10 flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">B</div>
                    <div className="text-right text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Official employment offer</div>
                  </div>
                  <h2 className="break-words text-xl font-black text-slate-950">{subject || "Your email subject"}</h2>
                  <div className="offer-template-preview prose prose-slate mt-8 max-w-full break-words text-sm leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                  <div className="mt-12 border-t border-slate-100 pt-5 text-[11px] font-medium text-slate-400">This template can only be created and used by Business Admins and HR Managers.</div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
      <style>{`
        .offer-template-editor .ql-toolbar { border: 0; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 10px 12px; }
        .offer-template-editor .ql-container { border: 0; min-height: 340px; font-family: inherit; font-size: 14px; }
        .offer-template-editor .ql-editor { min-height: 340px; padding: 22px; line-height: 1.75; }
        .offer-template-preview, .offer-template-preview * { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
      `}</style>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { ArrowLeft, Eye, FileText, Save, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import DocumentTemplateEditor from "@/components/shared/DocumentTemplateEditor";
import type { RichTextVariable } from "@/components/shared/RichTextEditor";
import { createOfferLetterTemplate, updateOfferLetterTemplate } from "../api/offerLetters";
import { useAlert } from "../contexts/AlertContext";
import { useMe } from "../hooks/useMe";

const variables: RichTextVariable[] = [
  { key: "candidateName", label: "Candidate name" },
  { key: "jobTitle", label: "Job title" },
  { key: "department", label: "Department" },
  { key: "startDate", label: "Start date" },
  { key: "salary", label: "Salary" },
  { key: "companyName", label: "Company name" },
  { key: "managerName", label: "Manager name" },
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
  const [headerHtml, setHeaderHtml] = useState("");
  const [headerEnabled, setHeaderEnabled] = useState(false);
  const [bodyHtml, setBodyHtml] = useState(initialBody);
  const [footerHtml, setFooterHtml] = useState("");
  const [footerEnabled, setFooterEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(true);

  const placeholders = useMemo(() => {
    const found = new Set<string>();
    const regex = /\{\{\s*([\w]+)\s*\}\}/g;
    let match;
    const source = `${subject} ${headerEnabled ? headerHtml : ""} ${bodyHtml} ${footerEnabled ? footerHtml : ""}`;
    while ((match = regex.exec(source)) !== null) found.add(match[1]);
    return Array.from(found);
  }, [subject, headerEnabled, headerHtml, bodyHtml, footerEnabled, footerHtml]);

  if (!me.data) return null;
  if (!allowed) return <Navigate to="/unauthorized" replace />;

  const saveTemplate = async () => {
    if (!name.trim() || !subject.trim() || !bodyHtml.replace(/<[^>]*>/g, "").trim()) {
      showAlert("Add a template name, subject, and letter content.", "error");
      return;
    }
    setSaving(true);
    try {
      const response = await createOfferLetterTemplate({
        name: name.trim(),
        subject: subject.trim(),
        bodyHtml,
        bodyText: bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        variables: placeholders,
      });
      const created = response?.data?.data;
      if (created?.id && (headerEnabled || footerEnabled)) {
        await updateOfferLetterTemplate(created.id, {
          headerHtml: headerEnabled ? headerHtml : null,
          footerHtml: footerEnabled ? footerHtml : null,
        });
      }
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
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
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
              <p className="mt-1 text-sm font-medium text-slate-500">Build a reusable letter with an optional branded header and footer.</p>
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

        <div className="mb-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold text-slate-700">Template name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Standard full-time offer" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold text-slate-700">Email subject</span>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" />
          </label>
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
          <DocumentTemplateEditor
            headerHtml={headerHtml}
            onHeaderHtmlChange={setHeaderHtml}
            headerEnabled={headerEnabled}
            onHeaderEnabledChange={setHeaderEnabled}
            bodyHtml={bodyHtml}
            onBodyHtmlChange={setBodyHtml}
            footerHtml={footerHtml}
            onFooterHtmlChange={setFooterHtml}
            footerEnabled={footerEnabled}
            onFooterEnabledChange={setFooterEnabled}
            variables={variables}
            bodyPlaceholder="Write the offer letter..."
          />

          <section className={`${preview ? "block" : "hidden"} min-w-0 xl:block`}>
            <div className="sticky top-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Eye className="h-4 w-4 text-blue-600" /> Live preview</div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Candidate view</span>
              </div>
              <div className="min-w-0 overflow-hidden p-4 sm:p-6">
                <article className="mx-auto min-h-[760px] w-full min-w-0 max-w-[680px] overflow-hidden bg-white shadow-md">
                  {headerEnabled ? <div className="border-b border-slate-100 px-8 py-5 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: headerHtml }} /> : null}
                  <div className="px-8 py-9">
                    <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">B</div>
                      <div className="text-right text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Official employment offer</div>
                    </div>
                    <h2 className="break-words text-xl font-black text-slate-950">{subject || "Your email subject"}</h2>
                    <div className="offer-template-preview prose prose-slate mt-8 max-w-full break-words text-sm leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                  </div>
                  {footerEnabled ? <div className="border-t border-slate-100 px-8 py-5 text-xs text-slate-500" dangerouslySetInnerHTML={{ __html: footerHtml }} /> : null}
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
      <style>{`.offer-template-preview, .offer-template-preview * { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }`}</style>
    </div>
  );
}

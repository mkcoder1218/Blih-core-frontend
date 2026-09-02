import React from "react";
import { FileText, PanelBottom, PanelTop } from "lucide-react";
import RichTextEditor, { type RichTextVariable } from "./RichTextEditor";

type Props = {
  bodyHtml: string;
  onBodyHtmlChange: (value: string) => void;
  headerHtml?: string;
  onHeaderHtmlChange?: (value: string) => void;
  footerHtml?: string;
  onFooterHtmlChange?: (value: string) => void;
  headerEnabled?: boolean;
  onHeaderEnabledChange?: (value: boolean) => void;
  footerEnabled?: boolean;
  onFooterEnabledChange?: (value: boolean) => void;
  variables?: RichTextVariable[];
  bodyPlaceholder?: string;
  className?: string;
};

export default function DocumentTemplateEditor({
  bodyHtml,
  onBodyHtmlChange,
  headerHtml = "",
  onHeaderHtmlChange,
  footerHtml = "",
  onFooterHtmlChange,
  headerEnabled = false,
  onHeaderEnabledChange,
  footerEnabled = false,
  onFooterEnabledChange,
  variables = [],
  bodyPlaceholder = "Write your document content...",
  className = "",
}: Props) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-slate-700">
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Insert</span>
          <span>Format</span>
          <span>Tools</span>
          <span>Help</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
          <FileText className="h-4 w-4 text-blue-600" />
          Document layout
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onHeaderEnabledChange?.(!headerEnabled)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              headerEnabled
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <PanelTop className="h-3.5 w-3.5" />
            {headerEnabled ? "Header on" : "Add header"}
          </button>
          <button
            type="button"
            onClick={() => onFooterEnabledChange?.(!footerEnabled)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              footerEnabled
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <PanelBottom className="h-3.5 w-3.5" />
            {footerEnabled ? "Footer on" : "Add footer"}
          </button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-230px)] overflow-y-auto bg-slate-100/80 px-3 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto min-h-[920px] w-full max-w-[820px] bg-white shadow-[0_1px_3px_rgba(15,23,42,.12),0_12px_30px_rgba(15,23,42,.08)]">
          {headerEnabled ? (
            <div className="border-b border-dashed border-slate-200 px-10 pb-4 pt-7">
              <RichTextEditor
                value={headerHtml}
                onChange={(value) => onHeaderHtmlChange?.(value)}
                label="Header"
                description="Shown at the top of every generated page. Add a logo, company name, or bank instruction title."
                variables={variables}
                minHeight={90}
                maxHeight={180}
                placeholder="Add document header..."
              />
            </div>
          ) : null}

          <div className="px-10 py-8">
            <RichTextEditor
              value={bodyHtml}
              onChange={onBodyHtmlChange}
              label="Document content"
              description="Format the document visually. Saved HTML is preserved for preview and PDF generation."
              variables={variables}
              minHeight={500}
              maxHeight={720}
              placeholder={bodyPlaceholder}
              required
            />
          </div>

          {footerEnabled ? (
            <div className="border-t border-dashed border-slate-200 px-10 pb-7 pt-4">
              <RichTextEditor
                value={footerHtml}
                onChange={(value) => onFooterHtmlChange?.(value)}
                label="Footer"
                description="Shown at the bottom of every generated page."
                variables={variables}
                minHeight={80}
                maxHeight={160}
                placeholder="Add document footer..."
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

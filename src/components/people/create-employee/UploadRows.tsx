import { CheckCircle2, ChevronDown, FilePlus2, Upload } from "lucide-react";

export function UploadRow({ label, docKey, files, onFileChange }: any) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
      <span className="flex items-center gap-2 text-xs font-bold text-slate-700"><Upload className="h-4 w-4 text-slate-400" />{label}</span>
      <div className="relative">
        <input type="file" onChange={(e) => onFileChange(e, docKey)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        <div className={`flex w-[180px] items-center justify-center gap-1.5 rounded-lg border px-4 py-1.5 text-[10px] font-bold ${files[docKey] ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>
          {files[docKey] ? <><CheckCircle2 className="h-3 w-3" />Selected</> : "Upload File"}
        </div>
      </div>
    </div>
  );
}

export function UploadOrSelectRow({ label, docKey, files, onFileChange, templates, selectedTemplate, onTemplateSelect, onGenerateClick }: any) {
  const hasFile = Boolean(files[docKey]);
  const hasTemplate = Boolean(selectedTemplate);
  const selectedName = templates.find((item: any) => item.id === selectedTemplate)?.name;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 ${hasFile || hasTemplate ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100 bg-slate-50"}`}>
      <span className="flex items-center gap-2 text-xs font-bold text-slate-700"><Upload className="h-4 w-4 text-slate-400" />{label}<button type="button" onClick={onGenerateClick} className="text-[10px] text-blue-600">(Generate)</button></span>
      <div className="flex flex-wrap items-center gap-3">
        {hasFile || hasTemplate ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" />{hasFile ? files[docKey].name.slice(0, 24) : selectedName}</span> : null}
        <div className="relative"><input type="file" onChange={(e) => { onTemplateSelect(""); onFileChange(e, docKey); }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /><div className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-bold text-slate-600">Upload</div></div>
        <span className="text-[11px] font-bold text-slate-400">or</span>
        <div className="relative"><select value={selectedTemplate} onChange={(e) => onTemplateSelect(e.currentTarget.value)} className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-4 pr-8 text-[10px] font-bold"><option value="">Select</option>{templates.map((template: any) => <option key={template.id} value={template.id}>{template.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" /></div>
        {hasTemplate ? <button type="button" onClick={onGenerateClick} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400"><FilePlus2 className="h-3.5 w-3.5" /></button> : null}
      </div>
    </div>
  );
}

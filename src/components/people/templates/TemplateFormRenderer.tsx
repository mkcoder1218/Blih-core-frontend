import React from "react";
import type { ProfileTemplateField as TemplateField } from "../../../api/types";

function FieldLabel({ f }: { f: TemplateField }) {
  return (
    <span className="text-[9px] text-slate-400 font-bold block">
      {f.label}
      {f.required ? " *" : ""}
    </span>
  );
}

export default function TemplateFormRenderer(props: {
  fields: TemplateField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {props.fields.map((f) => {
        const v = props.values[f.name] ?? "";
        const baseClass =
          "w-full bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:bg-white";

        if (f.componentType === "textarea") {
          return (
            <div key={f.name} className="space-y-0.5 col-span-2">
              <FieldLabel f={f} />
              <textarea
                rows={3}
                value={v}
                placeholder={f.placeholder}
                onChange={(e) => props.onChange(f.name, e.target.value)}
                className={`${baseClass} resize-none py-2`}
              />
            </div>
          );
        }

        if (f.componentType === "select") {
          return (
            <div key={f.name} className="space-y-0.5">
              <FieldLabel f={f} />
              <select value={v} onChange={(e) => props.onChange(f.name, e.target.value)} className={baseClass}>
                <option value="">Select...</option>
                {(f.options || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (f.componentType === "checkbox") {
          return (
            <div key={f.name} className="space-y-0.5 flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                checked={Boolean(v)}
                onChange={(e) => props.onChange(f.name, e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-[11px] font-semibold text-slate-700">{f.label}</span>
            </div>
          );
        }

        const inputType =
          f.componentType === "date" ? "date" : f.componentType === "number" ? "number" : "text";

        return (
          <div key={f.name} className="space-y-0.5">
            <FieldLabel f={f} />
            <input
              type={inputType}
              value={v}
              placeholder={f.placeholder}
              onChange={(e) => props.onChange(f.name, inputType === "number" ? Number(e.target.value) : e.target.value)}
              className={baseClass}
            />
          </div>
        );
      })}
    </div>
  );
}

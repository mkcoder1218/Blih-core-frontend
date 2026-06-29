import React from 'react'
export function FinancialField({
  label, value, placeholder, inputMode = 'decimal', onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        inputMode={inputMode}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
      />
    </label>
  );
}
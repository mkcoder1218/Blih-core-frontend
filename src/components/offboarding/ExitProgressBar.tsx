import React from 'react';

export default function ExitProgressBar({ percent, label }: { percent: number; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">{label}</span>}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

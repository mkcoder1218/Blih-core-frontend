import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

export function DetailRow({ label, value }: { label: string; value?: ReactNode | null }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-700 break-words">{value || '-'}</p>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface ProbationScoreProps {
  value: number;
  emphasized?: boolean;
}

export function ProbationScore({ value, emphasized = false }: ProbationScoreProps) {
  const boundedValue = Math.max(0, Math.min(100, value));
  const tone = value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="flex min-w-24 items-center gap-2" aria-label={`${value}%`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${boundedValue}%` }} />
      </div>
      <span className={cn("w-10 text-right text-xs", emphasized ? "font-black text-slate-950" : "font-bold text-slate-700")}>
        {value}%
      </span>
    </div>
  );
}


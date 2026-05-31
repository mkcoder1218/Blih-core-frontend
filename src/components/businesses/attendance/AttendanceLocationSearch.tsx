import React from "react";
import { searchNominatim, type NominatimResult } from "../../../api/osmGeocoding";

export default function AttendanceLocationSearch({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (pick: { lat: number; lng: number; address: string }) => void;
}) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<NominatimResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const abortRef = React.useRef<AbortController | null>(null);
  const debounceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (disabled) return;
    setError("");
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const data = await searchNominatim(q, { signal: ac.signal });
        setResults(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, disabled]);

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search address (OpenStreetMap)</div>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={disabled}
          placeholder="Search for an address or place…"
          className={[
            "w-full px-3.5 py-2.5 rounded-xl border font-semibold text-xs transition-all focus:outline-none",
            disabled
              ? "bg-slate-50 text-slate-400 border-slate-200/60"
              : "bg-slate-50 focus:bg-white text-slate-700 border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]",
          ].join(" ")}
        />
        {loading ? <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Searching…</div> : null}
      </div>

      {error ? <div className="text-[11px] font-semibold text-red-700">{error}</div> : null}

      {!disabled && results.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {results.map((r) => (
            <button
              type="button"
              key={r.place_id}
              onClick={() => {
                const lat = Number(r.lat);
                const lng = Number(r.lon);
                onPick({ lat, lng, address: r.display_name });
                setResults([]);
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}


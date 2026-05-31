import React from "react";

const FALLBACK_TIMEZONES = [
  "UTC",
  "Africa/Nairobi",
  "Africa/Addis_Ababa",
  "Africa/Lagos",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
];

function getTimezones(): string[] {
  try {
    const supported = (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined;
    if (Array.isArray(supported) && supported.length) return supported;
  } catch {
    // ignore
  }
  return FALLBACK_TIMEZONES;
}

export default function AttendanceTimezoneSelect({
  value,
  onChange,
  disabled,
  error,
  placeholder = "Select timezone…",
}: {
  value: string;
  onChange: (tz: string) => void;
  disabled: boolean;
  error?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const timezones = React.useMemo(() => getTimezones(), []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return timezones.slice(0, 50);
    return timezones.filter((t) => t.toLowerCase().includes(q)).slice(0, 50);
  }, [timezones, query]);

  return (
    <div className="relative">
      <input
        value={open ? query : value}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          setQuery("");
        }}
        onBlur={() => {
          // allow click selection
          setTimeout(() => setOpen(false), 120);
        }}
        disabled={disabled}
        placeholder={placeholder}
        className={[
          "w-full px-3.5 py-2.5 rounded-xl border font-semibold text-xs transition-all focus:outline-none",
          disabled
            ? "bg-slate-50 text-slate-400 border-slate-200/60"
            : "bg-slate-50 focus:bg-white text-slate-700 border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]",
          error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "",
        ].join(" ")}
      />

      {!disabled ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            try {
              const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (tz) onChange(tz);
            } catch {
              // ignore
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg"
          title="Use your device timezone"
        >
          Auto
        </button>
      ) : null}

      {open && !disabled ? (
        <div className="absolute z-40 mt-2 w-full max-h-64 overflow-auto bg-white border border-slate-200 rounded-2xl shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs font-semibold text-slate-600">No matches.</div>
          ) : (
            filtered.map((tz) => (
              <button
                type="button"
                key={tz}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(tz);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {tz}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

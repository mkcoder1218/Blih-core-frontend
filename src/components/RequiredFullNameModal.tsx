import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useMe } from "../hooks/useMe";

function nameParts(fullName?: string | null) {
  return String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isCompleteFullName(fullName?: string | null) {
  return nameParts(fullName).length >= 3;
}

export default function RequiredFullNameModal() {
  const me = useMe();
  const queryClient = useQueryClient();
  const fullName = me.data?.data?.user?.fullName || "";
  const parts = useMemo(() => nameParts(fullName), [fullName]);
  const mustCompleteName = Boolean(me.data?.data?.user) && !isCompleteFullName(fullName);
  const [firstName, setFirstName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [grandFatherName, setGrandFatherName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mustCompleteName) return;
    setFirstName(parts[0] || "");
    setFatherName(parts[1] || "");
    setGrandFatherName(parts.slice(2).join(" "));
    setError("");
  }, [mustCompleteName, parts.join(" ")]);

  if (!mustCompleteName) return null;

  const save = async () => {
    const first = firstName.trim();
    const father = fatherName.trim();
    const grandFather = grandFatherName.trim();

    if (!first || !father || !grandFather) {
      setError("First name, father name, and grandfather name are required.");
      return;
    }

    const nextFullName = [first, father, grandFather].join(" ");
    try {
      setSaving(true);
      setError("");
      await api.patch("/api/v1/profiles/me", { fullName: nextFullName });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Could not update your name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-950">Complete Your Full Name</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Please add your grandfather name. Full names must use at least three names, for example: Mikeyas Dereje Wolda.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
              autoFocus
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Father name</span>
            <input
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Grandfather name</span>
            <input
              value={grandFatherName}
              onChange={(e) => setGrandFatherName(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>

        {error && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {saving ? "Saving..." : "Save Full Name"}
          </button>
        </div>
      </div>
    </div>
  );
}

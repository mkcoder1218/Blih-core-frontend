import React, { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { useSelectWorkspace } from "../hooks/useSelectWorkspace";
import type { WorkspaceOption } from "../api/types";

export default function LoginPage() {
  const login = useLogin();
  const selectWorkspace = useSelectWorkspace();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[] | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const err: any = login.error;
  const err2: any = selectWorkspace.error;
  const errorMsg = err2?.response?.data?.message || err2?.message || err?.response?.data?.message || err?.message || "";

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center font-sans p-4 antialiased">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setWorkspaces(null);
          setSelectedBusinessId("");
          const res = await login.mutateAsync({ email, password });
          const data: any = res.data;
          if (data?.requiresWorkspaceSelection) {
            setWorkspaces(data.businesses || []);
          }
        }}
        className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
      >
        <div>
          <h1 className="text-lg font-bold text-slate-900">Sign in</h1>
          <p className="text-xs text-slate-500">Enter your workspace credentials.</p>
        </div>

        {errorMsg ? (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{errorMsg}</div>
        ) : null}

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm"
            placeholder="admin@example.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={login.isPending || selectWorkspace.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold py-2.5 rounded-xl"
        >
          {login.isPending ? "Signing in..." : "Sign in"}
        </button>

        {workspaces?.length ? (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700">Select workspace</div>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Choose...</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.slug})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedBusinessId || selectWorkspace.isPending}
              onClick={() => selectWorkspace.mutate({ businessId: selectedBusinessId, email, password })}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              {selectWorkspace.isPending ? "Continuing..." : "Continue"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

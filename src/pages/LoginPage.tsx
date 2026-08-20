import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLogin } from "../hooks/useLogin";
import { useSelectWorkspace } from "../hooks/useSelectWorkspace";
import type { WorkspaceOption } from "../api/types";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const login = useLogin();
  const selectWorkspace = useSelectWorkspace();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[] | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const err: any = login.error;
  const err2: any = selectWorkspace.error;
  const errorMsg =
    err2?.response?.data?.message ||
    err2?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorkspaces(null);
    setSelectedBusinessId("");
    const res = await login.mutateAsync({ email, password });
    const data: any = res.data;

    if (data?.requiresWorkspaceSelection) {
      setWorkspaces(data.businesses || []);
    } else if (data?.portalUser) {
      navigate("/client-portal", { replace: true });
    }
  };

  const handleSelectWorkspace = (businessId: string) => {
    setSelectedBusinessId(businessId);
    selectWorkspace.mutate({ businessId, email, password });
  };

  const handleBack = () => {
    setWorkspaces(null);
    setSelectedBusinessId("");
    login.reset();
    selectWorkspace.reset();
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4 font-sans antialiased dark:from-[#0b1220] dark:via-[#111827] dark:to-[#0f172a]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_26%),linear-gradient(135deg,#0b1220_0%,#111827_55%,#0f172a_100%)]" />
        <div className="absolute -top-36 right-[-120px] h-80 w-80 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-500/10 dark:blur-[140px]" />
        <div className="absolute -bottom-36 left-[-120px] h-80 w-80 rounded-full bg-indigo-100/35 blur-3xl dark:bg-slate-700/20 dark:blur-[140px]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-200/60 dark:shadow-[0_10px_28px_rgba(37,99,235,0.18)]">
            <Building2 className="h-6 w-6 text-white" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Blih ERP
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {workspaces ? "Choose your workspace" : "Sign in to your account"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {workspaces ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/92 dark:shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
            >
              <div className="border-b border-slate-100 px-6 pb-4 pt-6 dark:border-white/10">
                <button
                  onClick={handleBack}
                  className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Select Workspace
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Your account is linked to {workspaces.length} workspace
                      {workspaces.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="max-h-80 space-y-2 overflow-y-auto p-3">
                {workspaces.map((w) => {
                  const isSelected = selectedBusinessId === w.id;
                  const isLoading = isSelected && selectWorkspace.isPending;
                  const isActive = w.status === "active";

                  return (
                    <button
                      key={w.id}
                      onClick={() => isActive && !selectWorkspace.isPending && handleSelectWorkspace(w.id)}
                      disabled={!isActive || selectWorkspace.isPending}
                      className={`group flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-blue-200 bg-blue-50 ring-1 ring-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:ring-blue-500/20"
                          : isActive
                            ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-slate-800/70 dark:hover:border-white/15 dark:hover:bg-slate-800"
                            : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-white/10 dark:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          {w.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <span className="block text-sm font-medium leading-tight text-slate-900 dark:text-slate-100">
                            {w.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            {w.slug}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                        ) : isSelected ? (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-6 pb-6 pt-2">
                <p className="text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Signed in as <span className="font-semibold text-slate-600 dark:text-slate-300">{email}</span>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/92 dark:shadow-[0_12px_36px_rgba(0,0,0,0.28)]"
            >
              <form onSubmit={handleLogin} className="space-y-5">
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:bg-slate-100/70 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-white/[0.06] dark:focus:border-blue-500 dark:focus:bg-white/[0.07] dark:focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:bg-slate-100/70 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-white/[0.06] dark:focus:border-blue-500 dark:focus:bg-white/[0.07] dark:focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={login.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 dark:shadow-[0_6px_18px_rgba(37,99,235,0.22)] dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
                >
                  {login.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Blih ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
}

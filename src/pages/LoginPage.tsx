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
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center font-sans p-4 antialiased">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Blih ERP</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {workspaces ? "Choose your workspace" : "Sign in to your account"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Workspace picker modal ── */}
          {workspaces ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Select Workspace</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Your account is linked to {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="mx-6 mt-4 flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Workspace list */}
              <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
                {workspaces.map((w) => {
                  const isSelected = selectedBusinessId === w.id;
                  const isLoading = isSelected && selectWorkspace.isPending;
                  const isActive = w.status === "active";

                  return (
                    <button
                      key={w.id}
                      onClick={() => isActive && !selectWorkspace.isPending && handleSelectWorkspace(w.id)}
                      disabled={!isActive || selectWorkspace.isPending}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300"
                          : isActive
                          ? "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm"
                          : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Business avatar */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-slate-200 text-slate-600"
                          }`}
                        >
                          {w.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <span className="text-sm font-bold text-slate-900 block leading-tight">
                            {w.name}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                            {w.slug}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-6 pb-6 pt-2">
                <p className="text-[11px] text-slate-400 font-medium text-center">
                  Signed in as <span className="font-bold text-slate-600">{email}</span>
                </p>
              </div>
            </motion.div>
          ) : (
            /* ── Login form ── */
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 p-8"
            >
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Error */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
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
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white px-4 py-3 pr-11 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={login.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {login.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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

        <p className="text-center text-[11px] text-slate-400 font-medium mt-6">
          © {new Date().getFullYear()} Blih ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
}

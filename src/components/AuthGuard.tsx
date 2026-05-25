import React from "react";
import { useMe } from "../hooks/useMe";

export default function AuthGuard(props: { children: React.ReactNode }) {
  const me = useMe();

  if (me.isLoading) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  if (me.isError) {
    const anyErr: any = me.error;
    const msg = anyErr?.response?.data?.message || anyErr?.message || "Unauthorized";
    return (
      <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-[520px] w-full bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-sm font-semibold text-slate-900">Authentication error</div>
          <div className="text-xs text-slate-600 mt-1">{msg}</div>
        </div>
      </div>
    );
  }

  if (!me.data?.data?.user) return null;

  return <>{props.children}</>;
}


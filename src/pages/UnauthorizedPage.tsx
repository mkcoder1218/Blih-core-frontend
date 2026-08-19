import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function UnauthorizedPage() {
  const location = useLocation();
  const from = (location.state as any)?.from;

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
        <div className="text-sm font-black text-slate-900">Access denied</div>
        <div className="text-xs text-slate-600">
          You don’t have permission to view this page{from ? ` (${from}).` : "."}
        </div>
        <div className="pt-2">
          <Link to="/" className="inline-flex bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

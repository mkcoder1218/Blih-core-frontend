import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";
import { api } from "../api/client";

export default function InterviewResponsePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !action) {
      setStatus("invalid");
      setMessage("Invalid link. Please check your email for the correct link.");
      return;
    }

    if (action !== "accept" && action !== "decline") {
      setStatus("invalid");
      setMessage("Invalid action. Please use the Accept or Decline buttons from your email.");
      return;
    }

    // Call the public endpoint
    api
      .get("/api/v1/hr/public/interviews/respond", { params: { token, action } })
      .then((res) => {
        const data = res.data?.data;
        // Use the actual response status if server says already responded
        const resolvedAction = data?.alreadyResponded ? data.status : action;
        setStatus("success");
        setMessage(res.data?.message || (resolvedAction === "accept" ? "Interview accepted!" : "Interview declined."));
        // Override action display if server returned a different status
        if (data?.alreadyResponded && data.status !== action) {
          searchParams.set("action", data.status);
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Something went wrong.";
        setStatus("error");
        setMessage(msg);
      });
  }, [token, action]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1a1a2e] p-8 text-center">
          <Calendar className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h1 className="text-xl font-black text-white">Interview Response</h1>
        </div>

        <div className="p-10 text-center space-y-6">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-500">Processing your response...</p>
            </>
          )}

          {status === "success" && action === "accept" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Interview Accepted!</h2>
                <p className="text-sm text-slate-500 font-semibold mt-2">{message}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-green-700">
                  The HR team has been notified. Please check your email for further details about the interview schedule.
                </p>
              </div>
            </>
          )}

          {status === "success" && action === "decline" && (
            <>
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-9 h-9 text-slate-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Interview Declined</h2>
                <p className="text-sm text-slate-500 font-semibold mt-2">{message}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-600">
                  Thank you for letting us know. We appreciate your time and wish you the best in your job search.
                </p>
              </div>
            </>
          )}

          {(status === "error" || status === "invalid") && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {status === "invalid" ? "Invalid Link" : "Unable to Process"}
                </h2>
                <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">{message}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-700">
                  If you believe this is an error, please contact the HR team directly.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

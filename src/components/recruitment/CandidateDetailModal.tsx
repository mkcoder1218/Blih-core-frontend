/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  X,
  Briefcase,
  Clock,
  Download,
  Sparkles,
  Eye,
  FileText,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  jobTitle: string;
  onScheduleInterview: () => void;
  onShortlist: () => void;
  onReject: () => void;
}

/** Fetch a file asset using native fetch (bypasses axios interceptors) with the stored Bearer token. */
async function fetchFileBlob(fileId: string): Promise<{ url: string; filename: string }> {
  const { getAccessToken } = await import("../../api/storage");
  const token = getAccessToken();
  const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || "";
  const url = `${baseURL}/api/v1/files/${fileId}/download`;

  console.log(`[fetchFileBlob] fetching: ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (networkErr: any) {
    console.error("[fetchFileBlob] network/CORS error:", networkErr);
    throw new Error(`Network error (possible CORS): ${networkErr?.message ?? networkErr}`);
  }

  console.log(`[fetchFileBlob] response status: ${response.status}, headers:`, {
    "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
    "content-disposition": response.headers.get("content-disposition"),
    "content-type": response.headers.get("content-type"),
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const contentDisposition = response.headers.get("content-disposition") ?? "";
  let filename = "download";
  const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (match?.[1]) filename = decodeURIComponent(match[1].replace(/['"]/g, ""));

  const blob = await response.blob();
  console.log(`[fetchFileBlob] blob size: ${blob.size}, type: ${blob.type}`);
  if (blob.size === 0) throw new Error("Received empty file from server");
  return { url: URL.createObjectURL(blob), filename };
}

export default function CandidateDetailModal({
  isOpen,
  onClose,
  candidate,
  jobTitle,
  onScheduleInterview,
  onShortlist,
  onReject,
}: CandidateDetailModalProps) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  if (!isOpen || !candidate) return null;

  const metadata = candidate.metadata || {};
  const name = candidate.fullName || metadata.fullName || "Anonymous Candidate";
  const email = candidate.email || metadata.email || "N/A";
  const phone = candidate.phone || metadata.phone || "N/A";
  const stage = candidate.stage || metadata.stage || "N/A";
  const source = candidate.source || metadata.source || "N/A";
  const score = candidate.score ?? metadata.score;
  const seniority =
    metadata.seniority || metadata.level || metadata.seniorityLevel;
  const dateApplied = candidate.createdAt
    ? new Date(candidate.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  // Dynamic fields mapping
  const whyJoin =
    metadata.whyJoin || metadata.coverLetter || metadata.message || "";

  // Files / Links handling
  const cvFileId = candidate.cvFileId || metadata.cvFileId;
  const cvUrl = metadata.cvUrl || metadata.resumeUrl || metadata.resume;
  const portfolioFileId = candidate.portfolioFileId || metadata.portfolioFileId;
  const portfolioUrl = metadata.portfolioUrl || metadata.portfolio;

  const cvFileName =
    metadata.cvFileName ||
    metadata.cvFileOriginalName ||
    (cvUrl ? "View Linked Resume" : "Applicant_CV.pdf");
  const portfolioFileName =
    metadata.portfolioFileName ||
    metadata.portfolioOriginalName ||
    (portfolioUrl ? "View Linked Portfolio" : "Portfolio.pdf");

  // Identify additional metadata fields to display dynamically
  const handledKeys = [
    "fullName",
    "email",
    "phone",
    "stage",
    "source",
    "score",
    "seniority",
    "level",
    "seniorityLevel",
    "whyJoin",
    "coverLetter",
    "message",
    "firstName",
    "lastName",
    "cvFileId",
    "cvUrl",
    "resumeUrl",
    "resume",
    "cvFileName",
    "cvFileOriginalName",
    "portfolioFileId",
    "portfolioUrl",
    "portfolio",
    "portfolioFileName",
    "portfolioOriginalName",
  ];

  const additionalFields = Object.entries(metadata).filter(
    ([key]) => !handledKeys.includes(key),
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleView = async (fileId: string) => {
    const key = `view-${fileId}`;
    if (loadingAction === key) return;
    setLoadingAction(key);
    try {
      const { url } = await fetchFileBlob(fileId);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e: any) {
      console.error("[handleView] failed:", e);
      alert(`Could not load file: ${e?.message ?? "Unknown error"}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownload = async (fileId: string, fallbackName: string) => {
    const key = `download-${fileId}`;
    if (loadingAction === key) return;
    setLoadingAction(key);
    try {
      const { url, filename } = await fetchFileBlob(fileId);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || fallbackName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e: any) {
      console.error("[handleDownload] failed:", e);
      alert(`Could not download file: ${e?.message ?? "Unknown error"}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const renderFileAction = (
    fileId: string | null,
    url: string | null,
    colorClass: string,
    fallbackName = "file",
  ) => {
    if (fileId) {
      const isViewing = loadingAction === `view-${fileId}`;
      const isDownloading = loadingAction === `download-${fileId}`;
      return (
        <div className="flex gap-1 pr-1">
          <button
            onClick={() => handleView(fileId)}
            disabled={!!loadingAction}
            className={`p-2 text-slate-400 hover:${colorClass} transition-colors border-none bg-transparent disabled:opacity-50`}
            title="Preview"
          >
            {isViewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleDownload(fileId, fallbackName)}
            disabled={!!loadingAction}
            className={`p-2 text-slate-400 hover:${colorClass} transition-colors border-none bg-transparent disabled:opacity-50`}
            title="Download"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
        </div>
      );
    }
    if (url) {
      return (
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2 text-slate-400 hover:${colorClass} transition-colors flex items-center justify-center mr-2`}
        >
          <LinkIcon className="w-4 h-4" />
        </a>
      );
    }
    return (
      <div className="flex gap-1 pr-1">
        <button disabled className="p-2 text-slate-400 border-none bg-transparent opacity-40">
          <Eye className="w-4 h-4" />
        </button>
        <button disabled className="p-2 text-slate-400 border-none bg-transparent opacity-40">
          <Download className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, pointerEvents: "auto" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
        style={{ pointerEvents: "auto" }}
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white flex flex-col"
        style={{ maxHeight: "90vh", pointerEvents: "auto" }}
        onClick={handleContentClick}
      >
        {/* Fixed Header */}
        <div className="p-6 lg:p-8 border-b border-slate-50 flex items-start justify-between bg-white sticky top-0 z-10 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {jobTitle}
              </h2>
              {seniority && (
                <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-blue-100">
                  {String(seniority)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>{stage}</span>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{source}</span>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{candidate.jobOpeningId || "Job Opening"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {typeof score === "number" && (
              <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-500/30">
                <Sparkles className="w-4 h-4 fill-white" />
                <span className="text-[11px] font-black uppercase tracking-tight">
                  Match {score}%
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer border-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 lg:p-8 overflow-y-auto space-y-8 flex-1 font-sans">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Date Applied
              </span>
              <span className="text-sm font-black text-slate-800">
                {dateApplied}
              </span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Stage
              </span>
              <span className="text-sm font-black text-slate-800">{stage}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Source
              </span>
              <span className="text-sm font-black text-slate-800">
                {source}
              </span>
            </div>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Candidate Name
              </span>
              <p className="text-lg font-black text-slate-900 tracking-tight">
                {name}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Email Address
              </span>
              <p className="text-[13px] font-bold text-slate-600">{email}</p>
            </div>
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Contact Phone
              </span>
              <p className="text-[13px] font-black text-slate-800 font-mono">
                {phone}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Job Opening ID
              </span>
              <p className="text-[13px] font-bold text-slate-600 font-mono break-all">
                {candidate.jobOpeningId || "N/A"}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Application ID
              </span>
              <p className="text-[13px] font-bold text-slate-600 font-mono break-all">
                {candidate.id || "N/A"}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Business ID
              </span>
              <p className="text-[13px] font-bold text-slate-600 font-mono break-all">
                {candidate.businessId || "N/A"}
              </p>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                CV & Resume
              </span>
              <div
                className={`group flex items-center justify-between border rounded-[22px] p-3 transition-all ${
                  cvFileId || cvUrl
                    ? "bg-slate-50 hover:bg-white border-slate-100 hover:border-blue-200 cursor-pointer"
                    : "bg-slate-50/50 border-slate-100 cursor-not-allowed opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-700 truncate max-w-[120px]">
                    {cvFileId || cvUrl ? cvFileName : "No CV uploaded"}
                  </span>
                </div>
                {renderFileAction(cvFileId, cvUrl, "text-blue-600", cvFileName)}
              </div>
            </div>
            <div className="space-y-4">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Portfolio
              </span>
              <div
                className={`group flex items-center justify-between border rounded-[22px] p-3 transition-all ${
                  portfolioFileId || portfolioUrl
                    ? "bg-emerald-50/50 hover:bg-white border-emerald-100 hover:border-emerald-500 cursor-pointer"
                    : "bg-emerald-50/20 border-emerald-100 cursor-not-allowed opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-700 truncate max-w-[120px]">
                    {portfolioFileId || portfolioUrl
                      ? portfolioFileName
                      : "No portfolio uploaded"}
                  </span>
                </div>
                {renderFileAction(
                  portfolioFileId,
                  portfolioUrl,
                  "text-emerald-600",
                  portfolioFileName,
                )}
              </div>
            </div>
          </div>

          {/* Additional Metadata Section */}
          {additionalFields.length > 0 && (
            <div className="space-y-4 pt-4">
              <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">
                Additional Information
              </span>
              <div className="grid grid-cols-2 gap-x-10 gap-y-6 bg-slate-50/30 p-6 rounded-[32px] border border-slate-50">
                {additionalFields.map(([key, value]) => {
                  const label = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase());
                  return (
                    <div key={key} className="space-y-1">
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        {label}
                      </span>
                      <p className="text-[13px] font-bold text-slate-700 break-words">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value || "N/A")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Long Answer Section */}
          <div className="space-y-4 pt-4 pb-4">
            <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Why join our organization?
            </span>
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 relative">
              <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                "{whyJoin || "N/A"}"
              </p>
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-200 shadow-sm">
                <FileText className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 lg:p-8 border-t border-slate-50 bg-white grid grid-cols-3 gap-6 shrink-0 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShortlist();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-[11px] tracking-widest uppercase transition-all shadow-xl shadow-blue-500/20 active:scale-95 cursor-pointer border-none"
          >
            Shortlist
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onScheduleInterview();
            }}
            className="bg-white border-2 border-slate-100 hover:border-blue-500 hover:text-blue-600 text-slate-600 font-black py-4 rounded-2xl text-[11px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-3xs"
          >
            <Clock className="w-4 h-4" />
            <span>Set Interview</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            className="bg-white border border-rose-100 hover:border-rose-500 hover:bg-rose-50 text-rose-500 font-black py-4 rounded-2xl text-[11px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  usePublicJob,
  useApplyJob,
  useIncrementView,
  useUploadResume,
} from "../../hooks/useJobRequests";
import {
  ChevronLeft,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Upload,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function PublicJobApplicationPage() {
  const { businessSlug, jobId } = useParams<{ businessSlug: string; jobId: string }>();
  const { data: job, isLoading } = usePublicJob(businessSlug || "", jobId || "");
  const applyMutation = useApplyJob();
  const inkMutation = useIncrementView();
  const uploadMutation = useUploadResume();
  const viewCounted = useRef(false);

  useEffect(() => {
    if (businessSlug && jobId && !viewCounted.current) {
      inkMutation.mutate({ businessSlug, id: jobId });
      viewCounted.current = true;
    }
  }, [businessSlug, jobId]);

  const [formData, setFormData] = useState<any>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    if (!jobId) return;
    try {
      const result = await uploadMutation.mutateAsync({ jobId, file });
      // result: { fileId, downloadUrl, originalName }
      setFormData((prev: any) => ({
        ...prev,
        cvFileId: result.fileId,
        resumeUrl: result.downloadUrl,
        resume: result.originalName,
      }));
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    applyMutation.mutate(
      { jobId, data: formData },
      {
        onSuccess: () => {
          setIsSubmitted(true);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block">
            Retrieving Role Specifications...
          </span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="text-center space-y-6 max-w-sm px-8 py-12 bg-white rounded-3xl border border-slate-100 shadow-xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Post Not Found
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              The job posting you are looking for may have been closed or moved.
              Please browse our active roles.
            </p>
          </div>
          <Link
            to={`/careers/${businessSlug}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            Browse Careers
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[40px] p-10 text-center shadow-2xl border border-blue-50 space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400" />

          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-12 h-12" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
              Application Received!
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Thank you for applying for the{" "}
              <span className="text-slate-900 font-bold">{job.title}</span>{" "}
              position. Our talent acquisition team will review your application
              and reach out if your profile matches our requirements.
            </p>
          </div>

          <Link
            to={`/careers/${businessSlug}`}
            className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-3xl text-sm transition-all shadow-xl shadow-slate-100"
          >
            Back to Careers
          </Link>
        </motion.div>
      </div>
    );
  }

  const applicationFields: any = job.applicationFields || {};

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-8 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            to={`/careers/${businessSlug}`}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-slate-100" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-black text-slate-900 tracking-tight">
              Product Engineering
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-5 gap-16">
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50 w-fit block">
              {job.department}
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-[0.95]">
              {job.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{job.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Remote Friendly</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2 w-fit">
                Role Overview
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {job.overview}
              </p>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2 w-fit">
                  Requirements
                </h3>
                <ul className="space-y-4">
                  {(job.requirements as string[]).map((req, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-slate-600 font-medium"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Application Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-blue-500/5 p-10 lg:p-12 sticky top-32">
            <div className="flex items-center gap-2 mb-10">
              <Send className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                Apply for this position
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                {/* Standard Core Fields - Responsive to configuration */}
                {applicationFields.firstName?.included &&
                applicationFields.lastName?.included ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        First Name{" "}
                        {applicationFields.firstName.required && (
                          <span className="text-rose-500">*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        required={applicationFields.firstName.required}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        placeholder="Jane"
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Last Name{" "}
                        {applicationFields.lastName.required && (
                          <span className="text-rose-500">*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        required={applicationFields.lastName.required}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        placeholder="Doe"
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      placeholder="Jane Doe"
                      className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                    Email Address{" "}
                    {applicationFields.email?.required !== false && (
                      <span className="text-rose-500">*</span>
                    )}
                  </label>
                  <input
                    type="email"
                    required={applicationFields.email?.required !== false}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {applicationFields.phone?.included && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                      Phone Number{" "}
                      {applicationFields.phone.required && (
                        <span className="text-rose-500">*</span>
                      )}
                    </label>
                    <input
                      type="tel"
                      required={applicationFields.phone.required}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="+251 ..."
                      className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                )}
                {/* Resume Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                    CV / Resume
                  </label>
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <div
                    onClick={() =>
                      !uploadMutation.isPending &&
                      document.getElementById("resume-upload")?.click()
                    }
                    className={`w-full bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center hover:border-blue-200 transition-all cursor-pointer group ${uploadMutation.isPending ? "opacity-50 cursor-wait" : ""}`}
                  >
                    {uploadMutation.isPending ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        <p className="text-[11px] font-bold text-slate-400">
                          Uploading resume...
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload
                          className={`w-6 h-6 mx-auto mb-2 transition-colors ${formData.resume ? "text-emerald-500" : "text-slate-300 group-hover:text-blue-500"}`}
                        />
                        <p className="text-[11px] font-bold text-slate-400">
                          {formData.resume
                            ? `Selected: ${formData.resume}`
                            : "Click to upload doc or pdf"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Dynamic Metadata Fields from Job Request */}
                {Object.entries(applicationFields).map(
                  ([key, config]: [string, any]) => {
                    // Skip core fields that we might handle separately or that are already handled
                    const coreFields = [
                      "email",
                      "phone",
                      "fullName",
                      "firstName",
                      "lastName",
                      "cvFileId",
                      "resumeUrl",
                      "resume",
                    ];
                    if (!config.included || coreFields.includes(key))
                      return null;

                    const label = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase());
                    const isRequired = config.required;

                    return (
                      <div
                        key={key}
                        className="space-y-2 animate-in fade-in slide-in-from-top-2"
                      >
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                          {label}{" "}
                          {isRequired && (
                            <span className="text-rose-500">*</span>
                          )}
                        </label>
                        <input
                          type={
                            key.toLowerCase().includes("date") ? "date" : "text"
                          }
                          required={isRequired}
                          onChange={(e) =>
                            handleInputChange(key, e.target.value)
                          }
                          placeholder={`Enter ${label.toLowerCase()}`}
                          className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    );
                  },
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                    Message to Hiring Manager (Optional)
                  </label>
                  <textarea
                    rows={4}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={applyMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black py-4.5 rounded-[24px] text-sm tracking-widest uppercase transition-all shadow-2xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
              >
                {applyMutation.isPending ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-300 font-medium text-center uppercase tracking-widest">
                Secured by Blih Recruitment Gateway
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

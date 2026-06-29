import React, { useMemo, useState } from "react";
import { ArrowLeft, Briefcase, Calendar, ClipboardList, Download, Eye, FileText, Mail, Pencil, Upload, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

type ProfileTab = "personal" | "professional" | "documents";
type SideTab = "profile" | "attendance" | "performance" | "leave";

interface EmployeeDetailPageProps {
  user?: { name: string; email: string; role: string };
  onBack: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
  targetUserId?: string;
}

const blank = "-";
const display = (value: unknown) => {
  if (value === null || value === undefined) return blank;
  const text = String(value).trim();
  return text ? text : blank;
};

const imageSrc = (path?: string | null) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : blank);
const formatTime = (value?: string | null) => (value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : blank);
const formatMinutes = (value?: number | null) => {
  if (!value && value !== 0) return blank;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
};
const attendanceStatus = (row: any) => {
  const status = String(row?.calculation?.currentStatus || "").toLowerCase();
  if (status.includes("late")) return "Late";
  if (status.includes("leave")) return "Leave";
  if (status.includes("absent") || status.includes("missed")) return "Absent";
  if (row?.events?.checkInAtUtc) return "Present";
  return display(row?.calculation?.currentStatus);
};

function InfoField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
      <p className="text-[13px] font-semibold text-slate-900 break-words">{display(value)}</p>
    </div>
  );
}

function initials(name: string) {
  return display(name)
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function EmployeeDetailPage({ user, onBack, onEdit, readOnly = false, targetUserId }: EmployeeDetailPageProps) {
  const [activeSideTab, setActiveSideTab] = useState<SideTab>("profile");
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>("personal");
  const [attendancePage, setAttendancePage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: targetUserId ? ["employee-profile", targetUserId] : ["my-profile"],
    queryFn: async () => {
      const res = await api.get(targetUserId ? `/api/v1/profiles/user/${targetUserId}` : "/api/v1/profiles/me");
      return res.data.profile;
    },
  });

  const profile = profileQuery.data;
  const settings = profile?.settings || {};
  const profileUser = profile?.User || profile?.user || {};
  const fullName = settings.fullName || profileUser.fullName || user?.name || "";
  const email = settings.email || profile?.workEmail || profileUser.email || user?.email || "";
  const phone = settings.phone || profile?.workPhone || profileUser.phone || "";
  const role = profile?.position?.title || profile?.department?.name || user?.role || "";
  const avatarUrl = imageSrc(settings.profileImageUrl);

  const formDefaults = useMemo(
    () => ({
      fullName: fullName || "",
      phone: phone || "",
      address: settings.address || "",
      city: settings.city || "",
      country: settings.country || "",
      zipCode: settings.zipCode || "",
      dateOfBirth: settings.dateOfBirth || "",
      maritalStatus: settings.maritalStatus || "",
      gender: settings.gender || "",
      nationality: settings.nationality || "",
    }),
    [fullName, phone, settings]
  );
  const [form, setForm] = useState(formDefaults);
  React.useEffect(() => setForm(formDefaults), [formDefaults]);
  const [file, setFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const documentsQuery = useQuery({
    queryKey: targetUserId ? ["employee-profile-documents", targetUserId] : ["my-profile-documents"],
    enabled: activeProfileTab === "documents",
    queryFn: async () => {
      const res = await api.get(targetUserId ? `/api/v1/profiles/user/${targetUserId}/documents` : "/api/v1/profiles/me/documents");
      return res.data.documents || [];
    },
  });

  const attendanceQuery = useQuery({
    queryKey: targetUserId ? ["employee-attendance-history", targetUserId, profile?.employeeRecord?.createdAt, profileUser.createdAt] : ["my-attendance-history"],
    enabled: activeSideTab === "attendance" && (!targetUserId || Boolean(profile)),
    queryFn: async () => {
      if (targetUserId) {
        const today = new Date();
        const createdAt = profile?.attendanceStartDate || profile?.employeeRecord?.createdAt || profileUser.createdAt || profile?.createdAt;
        const start = createdAt ? new Date(createdAt) : new Date(today);
        if (!createdAt) start.setDate(today.getDate() - 30);
        const res = await api.get("/api/v1/attendance/hr/report", {
          params: {
            employeeId: targetUserId,
            startDate: start.toISOString().slice(0, 10),
            endDate: today.toISOString().slice(0, 10),
          },
        });
        return (res.data.data?.rows || []).map((row: any) => ({
          date: row.date,
          events: {
            checkInAtUtc: row.checkInAtUtc,
            checkOutAtUtc: row.checkOutAtUtc,
          },
          calculation: {
            currentStatus: row.currentStatus,
            totalWorkedMinutes: row.totalWorkedMinutes,
          },
        }));
      }
      const res = await api.get("/api/v1/attendance/me/history", { params: { page: 1, size: 30 } });
      return res.data.data?.rows || [];
    },
  });
  React.useEffect(() => setAttendancePage(1), [targetUserId, activeSideTab]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, typeof value === "string" ? value : "");
      });
      if (file) data.append("profileImage", file);
      const res = await api.patch("/api/v1/profiles/me", data, { headers: { "Content-Type": "multipart/form-data" } });
      return res.data.profile;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["my-profile"], updated);
      setEditing(false);
      setFile(null);
      setError("");
    },
    onError: (err: any) => setError(err?.response?.data?.message || err?.message || "Profile update failed"),
  });

  const uploadDocument = useMutation({
    mutationFn: async () => {
      if (!documentFile) return null;
      const data = new FormData();
      data.append("document", documentFile);
      const res = await api.post(targetUserId ? `/api/v1/profiles/user/${targetUserId}/documents` : "/api/v1/profiles/me/documents", data, { headers: { "Content-Type": "multipart/form-data" } });
      return res.data.document;
    },
    onSuccess: () => {
      setDocumentFile(null);
      queryClient.invalidateQueries({ queryKey: targetUserId ? ["employee-profile-documents", targetUserId] : ["my-profile-documents"] });
    },
    onError: (err: any) => setError(err?.response?.data?.message || err?.message || "Document upload failed"),
  });

  const openDocument = async (doc: any, mode: "preview" | "download") => {
    if (doc.fileId) {
      const tokenRes = await api.get(`/api/v1/files/${doc.fileId}/token`);
      const token = tokenRes.data.token;
      const preview = mode === "preview" ? "&preview=1" : "";
      window.open(`${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")}/api/v1/files/${doc.fileId}/download?token=${encodeURIComponent(token)}${preview}`, "_blank");
      return;
    }
    const url = imageSrc(mode === "preview" ? doc.previewUrl || doc.downloadUrl : doc.downloadUrl || doc.previewUrl);
    if (url) window.open(url, "_blank");
  };

  const sideNavItems: { id: SideTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "performance", label: "Performance", icon: ClipboardList },
    { id: "leave", label: "Leave", icon: FileText },
  ];
  const profileTabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "professional", label: "Professional Information", icon: Briefcase },
    { id: "documents", label: "Documents", icon: FileText },
  ];
  const attendanceRows = attendanceQuery.data || [];
  const attendancePageSize = 10;
  const attendanceTotalPages = Math.max(1, Math.ceil(attendanceRows.length / attendancePageSize));
  const visibleAttendanceRows = attendanceRows.slice((attendancePage - 1) * attendancePageSize, attendancePage * attendancePageSize);

  return (
    <div className="min-h-full space-y-6">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition-colors mb-0.5 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-bold">{targetUserId ? "Employee Detail" : "My Profile"}</span>
        </button>
        <p className="text-[12px] text-slate-500 font-medium pl-6">{targetUserId ? "Directory employee information" : "Current employee information"}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-black flex-shrink-0 border border-blue-100 overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials(fullName)}
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight truncate">{display(fullName)}</h3>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Briefcase className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{display(role)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{display(email)}</span>
              </div>
            </div>
          </div>

          {!readOnly && (
            <button onClick={() => targetUserId ? onEdit?.() : setEditing(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
              <Pencil className="w-3.5 h-3.5" />
              {targetUserId ? "Update Record" : "Edit Profile"}
            </button>
          )}
        </div>

        <div className="flex">
          <div className="w-52 flex-shrink-0 border-r border-slate-100 py-4 px-3 space-y-1">
            {sideNavItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveSideTab(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeSideTab === id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0 p-6">
            {profileQuery.isLoading ? (
              <p className="text-xs font-semibold text-slate-400">Loading profile...</p>
            ) : activeSideTab === "profile" ? (
              <>
                <div className="flex items-center gap-6 border-b border-slate-100 mb-6">
                  {profileTabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveProfileTab(id)} className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-all ${activeProfileTab === id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
                {activeProfileTab === "personal" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    <InfoField label="Full Name" value={fullName} />
                    <InfoField label="Email Address" value={email} />
                    <InfoField label="Mobile Number" value={phone} />
                    <InfoField label="Date of Birth" value={settings.dateOfBirth ? formatDate(settings.dateOfBirth) : ""} />
                    <InfoField label="Marital Status" value={settings.maritalStatus} />
                    <InfoField label="Gender" value={settings.gender} />
                    <InfoField label="Nationality" value={settings.nationality} />
                    <InfoField label="Address" value={settings.address} />
                    <InfoField label="City" value={settings.city} />
                    <InfoField label="Country" value={settings.country} />
                    <InfoField label="Zip Code" value={settings.zipCode} />
                  </div>
                )}
                {activeProfileTab === "professional" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                    <InfoField label="Employee Code" value={profile?.employeeCode} />
                    <InfoField label="Department" value={profile?.department?.name} />
                    <InfoField label="Position" value={profile?.position?.title} />
                    <InfoField label="Work Email" value={profile?.workEmail || email} />
                    <InfoField label="Work Phone" value={profile?.workPhone || phone} />
                    <InfoField label="Employee Type" value={profile?.employmentType} />
                    <InfoField label="Joining Date" value={profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : ""} />
                    <InfoField label="Status" value={profile?.status} />
                  </div>
                )}
                {activeProfileTab === "documents" && (
                  <div className="space-y-4">
                    {!readOnly && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-3">
                        <label className="flex flex-1 items-center gap-3 text-xs font-semibold text-slate-600 cursor-pointer min-w-0">
                          <Upload className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{documentFile ? documentFile.name : "Upload employee document"}</span>
                          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx" className="hidden" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                        </label>
                        <button disabled={!documentFile || uploadDocument.isPending} onClick={() => uploadDocument.mutate()} className="px-4 py-2 rounded-lg bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold">
                          {uploadDocument.isPending ? "Uploading..." : "Save Document"}
                        </button>
                      </div>
                    )}
                    {documentsQuery.isLoading ? (
                      <p className="text-xs font-semibold text-slate-400">Loading documents...</p>
                    ) : (documentsQuery.data || []).length === 0 ? (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-6 text-center">
                        <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">No employee documents uploaded yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[11px] font-semibold text-slate-400">
                              <th className="pb-3 pr-4">Name</th>
                              <th className="pb-3 pr-4">Type</th>
                              <th className="pb-3 pr-4">Upload Date</th>
                              <th className="pb-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {(documentsQuery.data || []).map((doc: any) => (
                              <tr key={`${doc.source}-${doc.id}`} className="text-xs font-semibold text-slate-700">
                                <td className="py-3 pr-4">{display(doc.name)}</td>
                                <td className="py-3 pr-4">{display(doc.type)}</td>
                                <td className="py-3 pr-4">{formatDate(doc.uploadedAt)}</td>
                                <td className="py-3">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => openDocument(doc, "preview")} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50" title="Preview PDF">
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => openDocument(doc, "download")} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50" title="Download">
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : activeSideTab === "attendance" ? (
              attendanceQuery.isLoading ? (
                <p className="text-xs font-semibold text-slate-400">Loading attendance records...</p>
              ) : (attendanceQuery.data || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No attendance records found.</p>
                  <p className="text-xs text-slate-400 font-medium">Check-ins, check-outs, status, and working hours will appear here after attendance is recorded.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] font-semibold text-slate-400">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Check In</th>
                        <th className="pb-3 pr-4">Check Out</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Working Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {visibleAttendanceRows.map((row: any) => (
                        <tr key={row.date} className="text-xs font-semibold text-slate-700">
                          <td className="py-3 pr-4 whitespace-nowrap">{formatDate(row.date)}</td>
                          <td className="py-3 pr-4 whitespace-nowrap">{formatTime(row.events?.checkInAtUtc)}</td>
                          <td className="py-3 pr-4 whitespace-nowrap">{formatTime(row.events?.checkOutAtUtc)}</td>
                          <td className="py-3 pr-4 whitespace-nowrap">{attendanceStatus(row)}</td>
                          <td className="py-3 whitespace-nowrap">{formatMinutes(row.calculation?.totalWorkedMinutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-2">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Showing {(attendancePage - 1) * attendancePageSize + 1}-{Math.min(attendancePage * attendancePageSize, attendanceRows.length)} of {attendanceRows.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAttendancePage((page) => Math.max(1, page - 1))}
                        disabled={attendancePage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-bold text-slate-600">{attendancePage} / {attendanceTotalPages}</span>
                      <button
                        onClick={() => setAttendancePage((page) => Math.min(attendanceTotalPages, page + 1))}
                        disabled={attendancePage === attendanceTotalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  {activeSideTab === "performance" ? <ClipboardList className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <p className="text-sm font-bold text-slate-700">No records found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-4">
            <motion.form initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Edit Profile</h3>
                <button type="button" onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              {error && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}
              <label className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3 text-xs font-semibold text-slate-600 cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>{file ? file.name : "Upload profile image"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["fullName", "Full Name"],
                  ["phone", "Phone Number"],
                  ["dateOfBirth", "Date of Birth"],
                  ["maritalStatus", "Marital Status"],
                  ["gender", "Gender"],
                  ["nationality", "Nationality"],
                  ["address", "Address"],
                  ["city", "City"],
                  ["country", "Country"],
                  ["zipCode", "Zip Code"],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                    <input value={(form as any)[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button type="submit" disabled={updateProfile.isPending} className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl">{updateProfile.isPending ? "Saving..." : "Save Changes"}</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

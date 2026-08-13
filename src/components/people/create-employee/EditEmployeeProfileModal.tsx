import React from "react";
import { motion } from "motion/react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Landmark,
  Loader2,
  PhoneCall,
  Save,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../../../api/client";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
} from "../../../constants/employee";
import { UserSearchSelect } from "../UserSearchSelect";
import { FormField } from "./FormField";
import type { CreateEmployeeModalProps } from "./types";

type EditSectionId = "account" | "employment" | "personal" | "emergency" | "documents";

type EditEmployeeData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  employeeCode: string;
  systemRole: string;
  departmentId: string;
  positionId: string;
  reportingTo: string;
  startDate: string;
  contractStartDate: string;
  contractEndDate: string;
  employmentStatus: string;
  employmentType: string;
  monthlySalary: string;
  salaryCurrency: string;
  probationPeriod: string;
  additionalNotes: string;
  internshipProgram: string;
  internshipInstitution: string;
  internshipMentorUserId: string;
  internshipExpectedEndDate: string;
  internshipStatus: string;
  internshipStipendType: string;
  dateOfBirth: string;
  city: string;
  countryOfBirth: string;
  additionalPhone: string;
  bankName: string;
  bankAccountNumber: string;
  emergencyFirstName: string;
  emergencyLastName: string;
  emergencyPhone: string;
  emergencyEmail: string;
  emergencyCity: string;
  emergencyCountry: string;
};

type EditSection = {
  id: EditSectionId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: Array<keyof EditEmployeeData>;
};

const EMPTY_FORM: EditEmployeeData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  employeeCode: "",
  systemRole: "",
  departmentId: "",
  positionId: "",
  reportingTo: "",
  startDate: "",
  contractStartDate: "",
  contractEndDate: "",
  employmentStatus: "",
  employmentType: "",
  monthlySalary: "",
  salaryCurrency: "",
  probationPeriod: "",
  additionalNotes: "",
  internshipProgram: "",
  internshipInstitution: "",
  internshipMentorUserId: "",
  internshipExpectedEndDate: "",
  internshipStatus: "",
  internshipStipendType: "",
  dateOfBirth: "",
  city: "",
  countryOfBirth: "",
  additionalPhone: "",
  bankName: "",
  bankAccountNumber: "",
  emergencyFirstName: "",
  emergencyLastName: "",
  emergencyPhone: "",
  emergencyEmail: "",
  emergencyCity: "",
  emergencyCountry: "",
};

const SECTIONS: EditSection[] = [
  { id: "account", label: "Account", description: "Name and login details", icon: UserRound, fields: ["fullName", "email", "phone", "password"] },
  { id: "employment", label: "Employment", description: "Role, position and salary", icon: BriefcaseBusiness, fields: ["employeeCode", "systemRole", "departmentId", "positionId", "reportingTo", "startDate", "contractStartDate", "contractEndDate", "employmentStatus", "employmentType", "monthlySalary", "salaryCurrency", "probationPeriod", "additionalNotes", "internshipProgram", "internshipInstitution", "internshipMentorUserId", "internshipExpectedEndDate", "internshipStatus", "internshipStipendType"] },
  { id: "personal", label: "Personal & Bank", description: "Personal and payment details", icon: Landmark, fields: ["dateOfBirth", "city", "countryOfBirth", "additionalPhone", "bankName", "bankAccountNumber"] },
  { id: "emergency", label: "Emergency", description: "Emergency contact details", icon: PhoneCall, fields: ["emergencyFirstName", "emergencyLastName", "emergencyPhone", "emergencyEmail", "emergencyCity", "emergencyCountry"] },
  { id: "documents", label: "Documents", description: "Current and replacement files", icon: FileText, fields: [] },
];

const inputClass = "w-full rounded-lg border border-border bg-muted/35 px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10";

const SYSTEM_ROLE_KEYS = new Set(["BUSINESS_ADMIN", "HR_MANAGER", "FINANCE_MANAGER", "CRM_MANAGER", "PROJECT_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE", "CLIENT"]);

const PROFILE_FIELDS: Array<keyof EditEmployeeData> = [
  "employeeCode", "systemRole", "departmentId", "positionId", "reportingTo", "startDate", "contractStartDate", "contractEndDate", "employmentStatus", "employmentType", "monthlySalary", "salaryCurrency", "probationPeriod", "additionalNotes", "internshipProgram", "internshipInstitution", "internshipMentorUserId", "internshipExpectedEndDate", "internshipStatus", "internshipStipendType", "dateOfBirth", "city", "countryOfBirth", "additionalPhone", "emergencyFirstName", "emergencyLastName", "emergencyPhone", "emergencyEmail", "emergencyCity", "emergencyCountry",
];

const DOCUMENTS = [
  { key: "offerLetter", label: "Offer Letter" },
  { key: "contract", label: "Employment Contract" },
  { key: "jobDescription", label: "Job Description" },
  { key: "nationalId", label: "Fayda ID / National ID" },
  { key: "passport", label: "Passport / Clearance" },
] as const;

function dateValue(value: unknown) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function deriveProbationMonths(startValue: unknown, endValue: unknown) {
  if (!startValue || !endValue) return "";
  const start = new Date(String(startValue));
  const end = new Date(String(endValue));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return "";
  const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (months > 0) return String(months);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return days > 0 ? String(Math.max(1, Math.round(days / 30))) : "";
}

function valueChanged(next: unknown, previous: unknown) {
  return String(next ?? "") !== String(previous ?? "");
}

function existingFileName(value: any) {
  return String(value?.originalName || value?.fileName || value?.filename || value?.name || "Attached file");
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="border-b border-border pb-3"><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>;
}

export default function EditEmployeeProfileModal({ isOpen, onClose, showAlert, onSuccess, targetUserId }: CreateEmployeeModalProps) {
  const [activeSection, setActiveSection] = React.useState<EditSectionId>("account");
  const [form, setForm] = React.useState<EditEmployeeData>(EMPTY_FORM);
  const [baseline, setBaseline] = React.useState<EditEmployeeData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [positions, setPositions] = React.useState<any[]>([]);
  const [positionsLoading, setPositionsLoading] = React.useState(false);
  const [systemRoles, setSystemRoles] = React.useState<any[]>([]);
  const [files, setFiles] = React.useState<Record<string, File>>({});
  const [existingUploads, setExistingUploads] = React.useState<Record<string, any>>({});
  const [showPassword, setShowPassword] = React.useState(false);

  const setField = React.useCallback((field: keyof EditEmployeeData, value: string) => setForm((previous) => ({ ...previous, [field]: value })), []);

  const loadPositions = React.useCallback(async (departmentId: string) => {
    if (!departmentId) { setPositions([]); return; }
    try {
      setPositionsLoading(true);
      const response = await api.get(`/api/v1/positions?departmentId=${encodeURIComponent(departmentId)}&page=1&size=1000`);
      setPositions(response.data?.data?.positions || response.data?.rows || response.data?.data || []);
    } catch { setPositions([]); } finally { setPositionsLoading(false); }
  }, []);

  React.useEffect(() => {
    if (!isOpen || !targetUserId) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true); setLoadError(""); setBaseline(null); setForm(EMPTY_FORM); setFiles({}); setExistingUploads({}); setShowPassword(false); setActiveSection("account");
        const [recordResult, userResult, profileResult, departmentsResult, rolesResult] = await Promise.allSettled([
          api.get(`/api/v1/hr/records/${targetUserId}`),
          api.get(`/api/v1/users/${targetUserId}`),
          api.get(`/api/v1/profiles/user/${targetUserId}`),
          api.get("/api/v1/departments?page=1&size=1000"),
          api.get("/api/v1/roles/my-domain"),
        ]);
        if (cancelled) return;
        if (recordResult.status !== "fulfilled") throw recordResult.reason;
        const record = recordResult.value.data?.data?.employeeRecord || recordResult.value.data?.employeeRecord || {};
        const user = userResult.status === "fulfilled" ? userResult.value.data?.user || userResult.value.data?.data?.user || {} : record?.user || {};
        const businessProfile = profileResult.status === "fulfilled" ? profileResult.value.data?.profile || profileResult.value.data?.data?.profile || {} : {};
        const profileSettings = businessProfile?.settings || {};
        const metadata = record?.metadata || {};
        const emergency = record?.emergencyContact || {};
        const salary = record?.salaryInfo || {};
        const internship = metadata?.internship || {};
        const bank = Array.isArray(metadata?.bankDetails) ? metadata.bankDetails[0] : null;
        const roles = Array.isArray(user?.Roles) ? user.Roles : Array.isArray(user?.roles) ? user.roles : [];
        const matchedRole = roles.find((role: any) => SYSTEM_ROLE_KEYS.has(String(role?.key || "").toUpperCase())) || null;
        const next: EditEmployeeData = {
          ...EMPTY_FORM,
          fullName: String(user?.fullName || profileSettings?.fullName || ""),
          email: String(user?.email || businessProfile?.workEmail || profileSettings?.email || ""),
          phone: String(user?.phone || businessProfile?.workPhone || profileSettings?.phone || ""),
          employeeCode: String(record?.employeeCode || businessProfile?.employeeCode || ""),
          systemRole: String(matchedRole?.key || profileSettings?.systemRole || matchedRole?.name || ""),
          departmentId: String(record?.departmentId || businessProfile?.departmentId || ""),
          positionId: String(record?.positionId || businessProfile?.positionId || ""),
          reportingTo: String(record?.managerUserId || ""),
          startDate: dateValue(record?.hireDate || businessProfile?.joinedAt),
          contractStartDate: dateValue(record?.contractStartDate),
          contractEndDate: dateValue(record?.contractEndDate),
          employmentStatus: String(record?.employmentStatus || ""),
          employmentType: String(record?.employmentType || businessProfile?.employmentType || ""),
          monthlySalary: salary?.baseSalary == null ? "" : String(salary.baseSalary),
          salaryCurrency: String(salary?.currency || ""),
          probationPeriod: String(metadata?.probationPeriod || deriveProbationMonths(record?.hireDate, record?.probationEndDate) || ""),
          additionalNotes: String(metadata?.additionalNotes || ""),
          internshipProgram: String(internship?.program || ""),
          internshipInstitution: String(internship?.institution || ""),
          internshipMentorUserId: String(internship?.mentorUserId || ""),
          internshipExpectedEndDate: dateValue(internship?.expectedEndDate),
          internshipStatus: String(internship?.status || ""),
          internshipStipendType: String(internship?.stipendType || ""),
          dateOfBirth: dateValue(metadata?.dateOfBirth || profileSettings?.dateOfBirth),
          city: String(metadata?.city || profileSettings?.city || ""),
          countryOfBirth: String(metadata?.countryOfBirth || profileSettings?.countryOfBirth || profileSettings?.country || ""),
          additionalPhone: String(metadata?.additionalPhone || profileSettings?.additionalPhone || ""),
          bankName: String(bank?.bankName || metadata?.bankName || ""),
          bankAccountNumber: String(bank?.accountNumber || salary?.bankAccount || metadata?.bankAccountNumber || ""),
          emergencyFirstName: String(emergency?.firstName || ""),
          emergencyLastName: String(emergency?.lastName || ""),
          emergencyPhone: String(emergency?.phone || ""),
          emergencyEmail: String(emergency?.email || ""),
          emergencyCity: String(emergency?.city || ""),
          emergencyCountry: String(emergency?.country || ""),
        };
        setForm(next); setBaseline(next);
        setExistingUploads(metadata?.uploads && typeof metadata.uploads === "object" ? metadata.uploads : {});
        setDepartments(departmentsResult.status === "fulfilled" ? departmentsResult.value.data?.data?.departments || departmentsResult.value.data?.rows || departmentsResult.value.data?.data || [] : []);
        setSystemRoles(rolesResult.status === "fulfilled" ? rolesResult.value.data?.data?.roles || rolesResult.value.data?.roles || rolesResult.value.data?.data || [] : []);
        if (next.departmentId) await loadPositions(next.departmentId);
      } catch (error: any) {
        if (cancelled) return;
        const message = error?.response?.data?.message || error?.message || "Failed to load employee profile.";
        setLoadError(message); showAlert(message, "error");
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen, targetUserId, loadPositions, showAlert]);

  const dirtyBySection = React.useMemo(() => {
    const result = new Map<EditSectionId, boolean>();
    for (const section of SECTIONS) {
      const dirty = section.id === "documents" ? Object.keys(files).length > 0 : Boolean(baseline && section.fields.some((field) => valueChanged(form[field], baseline[field])));
      result.set(section.id, dirty);
    }
    return result;
  }, [baseline, files, form]);
  const dirtyCount = Array.from(dirtyBySection.values()).filter(Boolean).length;
  const hasChanges = dirtyCount > 0;

  const uploadFiles = async () => {
    const uploads: Record<string, any> = {};
    for (const [key, file] of Object.entries(files)) {
      const uploadFile = file as File;
      const formData = new FormData();
      formData.append("file", uploadFile, uploadFile.name);
      const response = await api.post("/api/v1/files/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const result = response.data;
      uploads[key] = result?.data?.file || result?.file || result;
    }
    return uploads;
  };

  const save = async () => {
    if (!targetUserId || !baseline || !hasChanges) return;
    if (!form.fullName.trim()) { showAlert("Full name is required.", "error"); setActiveSection("account"); return; }
    if (!form.email.trim()) { showAlert("Email address is required.", "error"); setActiveSection("account"); return; }
    try {
      setSaving(true);
      const account: Record<string, any> = {};
      const profile: Record<string, any> = {};
      if (valueChanged(form.fullName, baseline.fullName)) { account.firstName = form.fullName.trim(); account.lastName = ""; }
      if (valueChanged(form.email, baseline.email)) account.email = form.email.trim();
      if (valueChanged(form.phone, baseline.phone)) account.phone = form.phone.trim();
      if (form.password.trim()) account.password = form.password;
      for (const field of PROFILE_FIELDS) if (valueChanged(form[field], baseline[field])) profile[field] = form[field];
      const bankChanged = valueChanged(form.bankName, baseline.bankName) || valueChanged(form.bankAccountNumber, baseline.bankAccountNumber);
      if (bankChanged) profile.bankDetails = [{ bankName: form.bankName.trim(), accountNumber: form.bankAccountNumber.trim() }];
      const payload: Record<string, any> = {};
      if (Object.keys(account).length) payload.account = account;
      if (Object.keys(profile).length) payload.profile = profile;
      if (Object.keys(files).length) payload.uploads = await uploadFiles();
      if (!Object.keys(payload).length) return;
      await api.patch(`/api/v1/hr/records/${targetUserId}`, payload);
      showAlert("Employee profile updated successfully.", "success"); onSuccess?.(); onClose();
    } catch (error: any) {
      showAlert(error?.response?.data?.message || error?.message || "Failed to update employee profile.", "error");
    } finally { setSaving(false); }
  };

  if (!isOpen) return null;

  const renderAccount = () => <div className="space-y-5"><SectionHeading title="Account" description="Identity and login information." /><div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <FormField label="Full Name" required className="sm:col-span-2"><input value={form.fullName} onChange={(e) => setField("fullName", e.currentTarget.value)} className={inputClass} autoComplete="name" /></FormField>
    <FormField label="Email Address" required><input type="email" value={form.email} onChange={(e) => setField("email", e.currentTarget.value)} className={inputClass} autoComplete="email" /></FormField>
    <FormField label="Phone Number"><input value={form.phone} onChange={(e) => setField("phone", e.currentTarget.value)} className={inputClass} autoComplete="tel" /></FormField>
    <div className="sm:col-span-2">{showPassword ? <FormField label="New Password"><div className="flex flex-col gap-2 sm:flex-row"><input type="password" value={form.password} onChange={(e) => setField("password", e.currentTarget.value)} placeholder="Enter a new password" className={inputClass} autoComplete="new-password" /><Button type="button" variant="outline" onClick={() => { setField("password", ""); setShowPassword(false); }}>Cancel</Button></div></FormField> : <Button type="button" variant="outline" onClick={() => setShowPassword(true)}>Change password</Button>}</div>
  </div></div>;

  const renderEmployment = () => <div className="space-y-6"><SectionHeading title="Employment" description="Role, reporting line, contract and compensation." /><div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <FormField label="Employee Code"><input value={form.employeeCode} onChange={(e) => setField("employeeCode", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="System Role"><select value={form.systemRole} onChange={(e) => setField("systemRole", e.currentTarget.value)} className={inputClass}><option value="">Not set</option>{form.systemRole && !systemRoles.some((r) => String(r.key || r.name || "") === form.systemRole) ? <option value={form.systemRole}>{form.systemRole}</option> : null}{systemRoles.map((r) => <option key={r.id || r.key || r.name} value={r.key || r.name}>{r.name || r.key}</option>)}</select></FormField>
    <FormField label="Department"><select value={form.departmentId} onChange={async (e) => { const departmentId = e.currentTarget.value; setForm((p) => ({ ...p, departmentId, positionId: "" })); await loadPositions(departmentId); }} className={inputClass}><option value="">Not set</option>{form.departmentId && !departments.some((d) => String(d.id) === form.departmentId) ? <option value={form.departmentId}>Current department</option> : null}{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></FormField>
    <FormField label="Job Position"><select value={form.positionId} disabled={!form.departmentId || positionsLoading} onChange={(e) => setField("positionId", e.currentTarget.value)} className={inputClass}><option value="">{positionsLoading ? "Loading positions..." : "Not set"}</option>{form.positionId && !positions.some((p) => String(p.id) === form.positionId) ? <option value={form.positionId}>Current position</option> : null}{positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></FormField>
    <FormField label="Reporting To"><UserSearchSelect value={form.reportingTo} onChange={(id) => setField("reportingTo", id)} placeholder="Search and select manager..." /></FormField>
    <FormField label="Start Date"><input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Employment Type"><select value={form.employmentType} onChange={(e) => setField("employmentType", e.currentTarget.value)} className={inputClass}><option value="">Not set</option>{EMPLOYMENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FormField>
    <FormField label="Employment Status"><select value={form.employmentStatus} onChange={(e) => setField("employmentStatus", e.currentTarget.value)} className={inputClass}><option value="">Not set</option>{EMPLOYMENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FormField>
    <FormField label="Contract Start Date"><input type="date" value={form.contractStartDate} onChange={(e) => setField("contractStartDate", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Contract End Date"><input type="date" value={form.contractEndDate} onChange={(e) => setField("contractEndDate", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Probation Period (Months)"><input type="number" min="1" value={form.probationPeriod} onChange={(e) => setField("probationPeriod", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Monthly Salary"><input inputMode="decimal" value={form.monthlySalary} onChange={(e) => setField("monthlySalary", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Salary Currency"><input value={form.salaryCurrency} onChange={(e) => setField("salaryCurrency", e.currentTarget.value)} className={inputClass} /></FormField>
    {form.employmentType === "intern" ? <div className="sm:col-span-2 grid grid-cols-1 gap-5 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2"><div className="sm:col-span-2 text-sm font-semibold text-foreground">Internship Details</div>
      <FormField label="Program / Track"><input value={form.internshipProgram} onChange={(e) => setField("internshipProgram", e.currentTarget.value)} className={inputClass} /></FormField>
      <FormField label="School / Institution"><input value={form.internshipInstitution} onChange={(e) => setField("internshipInstitution", e.currentTarget.value)} className={inputClass} /></FormField>
      <FormField label="Mentor"><UserSearchSelect value={form.internshipMentorUserId} onChange={(id) => setField("internshipMentorUserId", id)} placeholder="Search and select mentor..." /></FormField>
      <FormField label="Expected End Date"><input type="date" value={form.internshipExpectedEndDate} onChange={(e) => setField("internshipExpectedEndDate", e.currentTarget.value)} className={inputClass} /></FormField>
      <FormField label="Internship Status"><select value={form.internshipStatus} onChange={(e) => setField("internshipStatus", e.currentTarget.value)} className={inputClass}><option value="">Not set</option><option value="active">Active</option><option value="extended">Extended</option><option value="completed">Completed</option><option value="terminated">Terminated</option></select></FormField>
      <FormField label="Stipend"><select value={form.internshipStipendType} onChange={(e) => setField("internshipStipendType", e.currentTarget.value)} className={inputClass}><option value="">Not set</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></FormField>
    </div> : null}
    <FormField label="Additional Notes" className="sm:col-span-2"><textarea rows={4} value={form.additionalNotes} onChange={(e) => setField("additionalNotes", e.currentTarget.value)} className={inputClass} /></FormField>
  </div></div>;

  const renderPersonal = () => <div className="space-y-6"><SectionHeading title="Personal & Bank" description="Personal information and primary bank details." /><div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <FormField label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="City of Residence"><input value={form.city} onChange={(e) => setField("city", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Country of Birth"><input value={form.countryOfBirth} onChange={(e) => setField("countryOfBirth", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Additional Phone"><input value={form.additionalPhone} onChange={(e) => setField("additionalPhone", e.currentTarget.value)} className={inputClass} /></FormField>
    <div className="sm:col-span-2 border-t border-border pt-4 text-sm font-semibold text-foreground">Primary Bank Details</div>
    <FormField label="Bank Name"><input value={form.bankName} onChange={(e) => setField("bankName", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Account Number"><input value={form.bankAccountNumber} onChange={(e) => setField("bankAccountNumber", e.currentTarget.value)} className={inputClass} /></FormField>
  </div></div>;

  const renderEmergency = () => <div className="space-y-6"><SectionHeading title="Emergency Contact" description="Who should be contacted in an emergency." /><div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <FormField label="First Name"><input value={form.emergencyFirstName} onChange={(e) => setField("emergencyFirstName", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Last Name"><input value={form.emergencyLastName} onChange={(e) => setField("emergencyLastName", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Phone Number"><input value={form.emergencyPhone} onChange={(e) => setField("emergencyPhone", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Email Address"><input type="email" value={form.emergencyEmail} onChange={(e) => setField("emergencyEmail", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="City"><input value={form.emergencyCity} onChange={(e) => setField("emergencyCity", e.currentTarget.value)} className={inputClass} /></FormField>
    <FormField label="Country"><input value={form.emergencyCountry} onChange={(e) => setField("emergencyCountry", e.currentTarget.value)} className={inputClass} /></FormField>
  </div></div>;

  const renderDocuments = () => <div className="space-y-5"><SectionHeading title="Documents" description="Existing documents stay untouched unless you replace them." /><div className="space-y-3">{DOCUMENTS.map((document) => { const selected = files[document.key]; const existing = existingUploads[document.key]; return <div key={document.key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"><div className="min-w-0"><p className="text-xs font-semibold text-foreground">{document.label}</p><p className="mt-1 max-w-md truncate text-[11px] text-muted-foreground">{selected ? `New: ${selected.name}` : existing ? `Current: ${existingFileName(existing)}` : "No document uploaded"}</p></div><label className="relative cursor-pointer"><input type="file" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(e) => { const file = e.currentTarget.files?.[0]; if (file) setFiles((p) => ({ ...p, [document.key]: file })); }} /><span className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted">{selected ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Upload className="h-4 w-4" />}{existing ? "Replace" : "Upload"}</span></label></div>; })}</div></div>;

  const sectionContent = activeSection === "account" ? renderAccount() : activeSection === "employment" ? renderEmployment() : activeSection === "personal" ? renderPersonal() : activeSection === "emergency" ? renderEmergency() : renderDocuments();

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
    <button type="button" aria-label="Close employee editor" className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
    <motion.section initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative flex h-[min(90vh,800px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 sm:px-6"><div className="min-w-0"><h2 className="truncate text-base font-semibold text-foreground">{form.fullName ? `Edit ${form.fullName}` : "Edit Employee"}</h2><p className="mt-0.5 truncate text-xs text-muted-foreground">{form.email || "Update employee information"}</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0"><X className="h-4 w-4" /></Button></header>
      {loading ? <div className="flex flex-1 items-center justify-center"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading employee profile...</div></div> : loadError || !baseline ? <div className="flex flex-1 items-center justify-center p-8 text-center"><div><p className="text-sm font-medium text-foreground">Employee profile could not be loaded.</p><p className="mt-1 text-xs text-muted-foreground">{loadError || "Close and try again."}</p></div></div> : <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="shrink-0 border-b border-border bg-muted/15 md:w-52 md:border-b-0 md:border-r"><div className="flex gap-1 overflow-x-auto p-2 md:block md:space-y-1 md:p-3">{SECTIONS.map((section) => { const Icon = section.icon; const active = activeSection === section.id; const dirty = dirtyBySection.get(section.id); return <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} className={`relative flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors md:w-full ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0"><span className="block text-xs font-medium">{section.label}</span><span className={`hidden truncate text-[10px] md:block ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{section.description}</span></span>{dirty ? <span className={`ml-auto h-1.5 w-1.5 rounded-full ${active ? "bg-primary-foreground" : "bg-primary"}`} /> : null}</button>; })}</div></aside>
        <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{sectionContent}</main>
      </div>}
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/10 px-5 py-3 sm:px-6"><span className="text-xs text-muted-foreground">{baseline ? hasChanges ? `${dirtyCount} ${dirtyCount === 1 ? "section" : "sections"} changed` : "No unsaved changes" : ""}</span><div className="flex items-center gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="button" onClick={save} disabled={saving || loading || !baseline || !hasChanges} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saving..." : "Save Changes"}</Button></div></footer>
    </motion.section>
  </div>;
}

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Upload,
  CheckCircle2,
  ChevronDown,
  FilePlus2,
} from "lucide-react";
import { api } from "../../api/client";
import { getOfferLetterTemplates } from "../../api/offerLetters";
import OfferLetterCreateModal from "../offer-letters/OfferLetterCreateModal";
import OfferLetterTemplateModal from "../offer-letters/OfferLetterTemplateModal";
import { CreateDepartmentModal, CreatePositionModal } from "./OrgModals";
import { UserSearchSelect } from "./UserSearchSelect";
import { PlusCircle } from "lucide-react";

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (title: string, type?: "success" | "error" | "info") => void;
  onSuccess?: () => void;
  initialDraftId?: string;
  mode?: "create" | "update";
  targetUserId?: string;
}

const steps = [
  { id: "account", title: "Account Setup" },
  { id: "employment", title: "Employment Details" },
  { id: "personal_bank", title: "Personal & Bank" },
  { id: "emergency", title: "Emergency Contact" },
  { id: "documents", title: "Documents & IDs" },
];

export default function CreateEmployeeModal({
  isOpen,
  onClose,
  showAlert,
  onSuccess,
  initialDraftId,
  mode = "create",
  targetUserId,
}: CreateEmployeeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId || null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(
    null,
  );
  const [existingUploads, setExistingUploads] = useState<Record<string, any>>(
    {},
  );
  const initialUpdateSnapshotRef = useRef<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",

    employeeCode: "",
    systemRole: "EMPLOYEE",
    departmentId: "",
    positionId: "",
    reportingTo: "",
    startDate: "",
    monthlySalary: "",
    probationPeriod: "3",
    employmentType: "full_time",
    additionalNotes: "",

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
  });

  // Store File objects before upload
  const [files, setFiles] = useState<Record<string, File>>({});

  // Organizational Data
  const [departments, setDepartments] = useState<any[]>([]);
  const [allPositions, setAllPositions] = useState<any[]>([]);
  const [systemRoles, setSystemRoles] = useState<any[]>([]);
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [showCreatePos, setShowCreatePos] = useState(false);

  // Offer letter templates for the "Select" dropdown
  const [offerLetterTemplates, setOfferLetterTemplates] = useState<any[]>([]);
  const [selectedOfferTemplate, setSelectedOfferTemplate] =
    useState<string>("");
  const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadOrgData();
    resolveTemplate();
    if (initialDraftId) {
      resumeDraft(initialDraftId);
      return;
    }
    if (mode === "update" && targetUserId) {
      loadEmployeeForUpdate(targetUserId);
    }
  }, [isOpen, initialDraftId, mode, targetUserId]);

  const loadEmployeeForUpdate = async (userId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/hr/records/${userId}`);
      const record = res.data?.data?.employeeRecord || res.data?.employeeRecord;
      const user = record?.user || {};
      const metadata = record?.metadata || {};
      const emergency = record?.emergencyContact || {};
      const salaryInfo = record?.salaryInfo || {};

      const fullName = (user?.fullName || "").toString().trim();
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName =
        parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "";
      const lastName = parts.length > 1 ? parts.slice(-1).join(" ") : "";

      const hireDate = record?.hireDate ? new Date(record.hireDate) : null;
      const probationEnd = record?.probationEndDate
        ? new Date(record.probationEndDate)
        : null;
      let probationPeriod = "";
      if (hireDate && probationEnd) {
        const diffDays = Math.max(
          0,
          Math.round(
            (probationEnd.getTime() - hireDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        probationPeriod = diffDays
          ? String(Math.max(1, Math.round(diffDays / 30)))
          : "";
      }

      const bank0 = Array.isArray(metadata?.bankDetails)
        ? metadata.bankDetails[0]
        : null;

      setExistingUploads(metadata?.uploads || {});
      const nextFormData = {
        ...formData,
        firstName,
        lastName,
        email: user?.email || "",
        phone: user?.phone || "",
        password: "",

        employeeCode: record?.employeeCode || "",
        systemRole: formData.systemRole,
        departmentId: record?.departmentId || "",
        positionId: record?.positionId || "",
        reportingTo: record?.managerUserId || "",
        startDate: record?.hireDate
          ? new Date(record.hireDate).toISOString().slice(0, 10)
          : "",
        monthlySalary: salaryInfo?.baseSalary ?? "",
        probationPeriod: probationPeriod || formData.probationPeriod,
        employmentType: record?.employmentType || formData.employmentType,
        additionalNotes: metadata?.additionalNotes || "",

        dateOfBirth: metadata?.dateOfBirth
          ? new Date(metadata.dateOfBirth).toISOString().slice(0, 10)
          : "",
        city: metadata?.city || "",
        countryOfBirth: metadata?.countryOfBirth || "",
        additionalPhone: metadata?.additionalPhone || "",
        bankName: bank0?.bankName || "",
        bankAccountNumber: bank0?.accountNumber || "",

        emergencyFirstName: emergency?.firstName || "",
        emergencyLastName: emergency?.lastName || "",
        emergencyPhone: emergency?.phone || "",
        emergencyEmail: emergency?.email || "",
        emergencyCity: emergency?.city || "",
        emergencyCountry: emergency?.country || "",
      };

      setFormData(nextFormData);
      initialUpdateSnapshotRef.current = nextFormData;
      setCurrentStep(0);
    } catch (e: any) {
      console.error("Failed to load employee for update", e);
      showAlert(
        e?.response?.data?.message || "Failed to load employee record",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const resolveTemplate = async () => {
    try {
      const res = await api.get("/api/v1/people/profile-templates");
      const templates = res.data?.data?.templates || res.data?.templates || [];
      const basic =
        templates.find((t: any) => t.name.includes("Employee")) || templates[0];
      if (basic) setDefaultTemplateId(basic.id);
    } catch (e) {
      console.error("Failed to resolve template", e);
    }
  };

  const resumeDraft = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/people/profile-drafts/${id}`);
      const draft = res.data?.data?.draft || res.data?.draft;
      if (draft && draft.data) {
        setFormData((prev) => ({ ...prev, ...draft.data }));
        if (draft.data.currentStep !== undefined) {
          setCurrentStep(draft.data.currentStep);
        }
        setDraftId(id);
        if (draft.templateId) setDefaultTemplateId(draft.templateId);
      }
    } catch (e) {
      console.error("Failed to resume draft", e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save draft on step change or form change
  useEffect(() => {
    if (!isOpen) return;
    if (mode === "update") return;

    const timeout = setTimeout(() => {
      syncDraft();
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timeout);
  }, [formData, currentStep, isOpen]);

  const syncDraft = async () => {
    if (mode === "update") return;
    // Only save if we have at least some basic info
    if (!formData.firstName && !formData.lastName && !formData.email) return;

    try {
      setIsSavingDraft(true);

      const payload = {
        templateId: defaultTemplateId,
        data: {
          ...formData,
          currentStep,
        },
        status: "draft",
      };

      if (draftId) {
        // templateId is not required for patch (updateProfileDraftSchema)
        await api.patch(`/api/v1/people/profile-drafts/${draftId}`, {
          data: payload.data,
          status: payload.status,
        });
      } else if (defaultTemplateId) {
        const res = await api.post("/api/v1/people/profile-drafts", payload);
        const newDraft = res.data?.data?.draft || res.data?.draft;
        if (newDraft?.id) {
          setDraftId(newDraft.id);
        }
      }
      setLastSaved(new Date());
    } catch (e) {
      console.error("Auto-save failed", e);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const loadOrgData = async () => {
    try {
      const [deptRes, posRes, roleRes] = await Promise.all([
        api.get("/api/v1/departments"),
        api.get("/api/v1/positions"),
        api.get("/api/v1/roles/my-domain"),
      ]);
      // Backend returns { rows, count } for depts and positions, and { roles } for roles
      setDepartments(
        deptRes.data.data?.departments ||
          deptRes.data.rows ||
          deptRes.data.data ||
          [],
      );
      setAllPositions(
        posRes.data.data?.positions ||
          posRes.data.rows ||
          posRes.data.data ||
          [],
      );
      setSystemRoles(
        roleRes.data.data?.roles ||
          roleRes.data.roles ||
          roleRes.data.data ||
          [],
      );
    } catch (e) {
      console.error("Failed to load org data", e);
    }
  };

  useEffect(() => {
    if (currentStep === 4) {
      getOfferLetterTemplates()
        .then((res) => setOfferLetterTemplates(res.data.data || []))
        .catch(() => {});
    }
  }, [currentStep]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const uploadFile = async (file: File): Promise<any> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("/api/v1/files/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // assuming returns { url, id... }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Upload all files
      const uploadedRefs: Record<string, any> = {};
      for (const [key, file] of Object.entries(files)) {
        const res = await uploadFile(file as File);
        uploadedRefs[key] = res.data?.file || res.file || res;
      }

      const buildCreatePayload = () => ({
        account: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        },
        profile: {
          employeeCode: formData.employeeCode,
          departmentId: formData.departmentId,
          reportingTo: formData.reportingTo,
          positionId: formData.positionId,
          systemRole: formData.systemRole,
          startDate: formData.startDate,
          employmentType: formData.employmentType,
          monthlySalary: formData.monthlySalary,
          probationPeriod: formData.probationPeriod,
          dateOfBirth: formData.dateOfBirth,
          city: formData.city,
          countryOfBirth: formData.countryOfBirth,
          additionalPhone: formData.additionalPhone,
          bankDetails: [
            {
              bankName: formData.bankName,
              accountNumber: formData.bankAccountNumber,
            },
          ],
          additionalNotes: formData.additionalNotes,
          emergencyFirstName: formData.emergencyFirstName,
          emergencyLastName: formData.emergencyLastName,
          emergencyPhone: formData.emergencyPhone,
          emergencyEmail: formData.emergencyEmail,
          emergencyCity: formData.emergencyCity,
          emergencyCountry: formData.emergencyCountry,
        },
        uploads: uploadedRefs,
        offerLetterTemplateId: selectedOfferTemplate,
      });

      const buildUpdatePayload = () => {
        const base = initialUpdateSnapshotRef.current;
        const patch: any = {};

        if (!base) throw new Error("Update baseline not loaded");

        const account: any = {};
        const profile: any = {};

        const setIfChanged = (obj: any, key: string, next: any, prev: any) => {
          const nextNorm = next ?? "";
          const prevNorm = prev ?? "";
          if (String(nextNorm) !== String(prevNorm)) obj[key] = next;
        };

        setIfChanged(account, "firstName", formData.firstName, base.firstName);
        setIfChanged(account, "lastName", formData.lastName, base.lastName);
        setIfChanged(account, "email", formData.email, base.email);
        setIfChanged(account, "phone", formData.phone, base.phone);
        if (formData.password) account.password = formData.password;

        setIfChanged(
          profile,
          "employeeCode",
          formData.employeeCode,
          base.employeeCode,
        );
        setIfChanged(
          profile,
          "departmentId",
          formData.departmentId,
          base.departmentId,
        );
        setIfChanged(
          profile,
          "positionId",
          formData.positionId,
          base.positionId,
        );
        setIfChanged(
          profile,
          "reportingTo",
          formData.reportingTo,
          base.reportingTo,
        );
        setIfChanged(
          profile,
          "systemRole",
          formData.systemRole,
          base.systemRole,
        );
        setIfChanged(profile, "startDate", formData.startDate, base.startDate);
        setIfChanged(
          profile,
          "employmentType",
          formData.employmentType,
          base.employmentType,
        );
        setIfChanged(
          profile,
          "monthlySalary",
          formData.monthlySalary,
          base.monthlySalary,
        );
        setIfChanged(
          profile,
          "probationPeriod",
          formData.probationPeriod,
          base.probationPeriod,
        );
        setIfChanged(
          profile,
          "dateOfBirth",
          formData.dateOfBirth,
          base.dateOfBirth,
        );
        setIfChanged(profile, "city", formData.city, base.city);
        setIfChanged(
          profile,
          "countryOfBirth",
          formData.countryOfBirth,
          base.countryOfBirth,
        );
        setIfChanged(
          profile,
          "additionalPhone",
          formData.additionalPhone,
          base.additionalPhone,
        );
        setIfChanged(
          profile,
          "additionalNotes",
          formData.additionalNotes,
          base.additionalNotes,
        );

        const nextBank = [
          {
            bankName: formData.bankName,
            accountNumber: formData.bankAccountNumber,
          },
        ];
        const prevBank = [
          { bankName: base.bankName, accountNumber: base.bankAccountNumber },
        ];
        if (JSON.stringify(nextBank) !== JSON.stringify(prevBank))
          profile.bankDetails = nextBank;

        setIfChanged(
          profile,
          "emergencyFirstName",
          formData.emergencyFirstName,
          base.emergencyFirstName,
        );
        setIfChanged(
          profile,
          "emergencyLastName",
          formData.emergencyLastName,
          base.emergencyLastName,
        );
        setIfChanged(
          profile,
          "emergencyPhone",
          formData.emergencyPhone,
          base.emergencyPhone,
        );
        setIfChanged(
          profile,
          "emergencyEmail",
          formData.emergencyEmail,
          base.emergencyEmail,
        );
        setIfChanged(
          profile,
          "emergencyCity",
          formData.emergencyCity,
          base.emergencyCity,
        );
        setIfChanged(
          profile,
          "emergencyCountry",
          formData.emergencyCountry,
          base.emergencyCountry,
        );

        if (Object.keys(account).length > 0) patch.account = account;
        if (Object.keys(profile).length > 0) patch.profile = profile;
        if (Object.keys(uploadedRefs).length > 0) patch.uploads = uploadedRefs;

        return patch;
      };

      if (mode === "update") {
        if (!targetUserId) throw new Error("Missing target user id for update");
        const updatePayload = buildUpdatePayload();
        if (Object.keys(updatePayload).length === 0) {
          showAlert("No changes to update.", "info");
          onClose();
          return;
        }
        await api.patch(`/api/v1/hr/records/${targetUserId}`, updatePayload);
        showAlert("Employee Profile successfully updated!", "success");
      } else {
        const createPayload = buildCreatePayload();
        await api.post("/api/v1/hr/records/onboard", createPayload);
        showAlert("Employee Profile successfully created!", "success");

        // Delete draft on success
        if (draftId) {
          await api
            .delete(`/api/v1/people/profile-drafts/${draftId}`)
            .catch(() => {});
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      console.error("error submitting onboard", e);
      showAlert(
        e?.response?.data?.message ||
          (mode === "update"
            ? "Failed to update profile"
            : "Failed to create profile"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {mode === "update"
                ? "Update Employee Profile"
                : "Create New Employee Profile"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500 font-medium">
                Fill in the required information to onboard your employee.
              </p>
              {isSavingDraft && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-blue-500 font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full"
                >
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  Saving...
                </motion.span>
              )}
              {!isSavingDraft && lastSaved && (
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Draft saved
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker Tracker */}
        <div className="px-8 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-100" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-blue-600 transition-all duration-300"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, idx) => (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center gap-2 bg-white px-2"
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-[11px] transition-all
                  ${idx < currentStep ? "bg-blue-600 border-blue-600 text-white" : idx === currentStep ? "bg-white border-blue-600 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-400"}`}
                >
                  {idx < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider absolute -bottom-7 whitespace-nowrap
                  ${idx <= currentStep ? "text-slate-800" : "text-slate-400"}`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 py-10 bg-white custom-scrollbar">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
                    Account Essentials
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Phone Number
                      </label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Initial Password{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create user's first login password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                      <p className="text-[10px] text-slate-400 font-medium">
                        This password will be used to login for the first time.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Employment Details
                    </h3>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateDept(true)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" /> Create Department
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreatePos(true)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" /> Create Position
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Employee Code
                      </label>
                      <input
                        name="employeeCode"
                        value={formData.employeeCode}
                        onChange={handleInputChange}
                        placeholder="Leave empty to auto-generate"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        System Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="systemRole"
                        value={formData.systemRole}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Select System Role</option>
                        {systemRoles?.map((r) => (
                          <option key={r.id || r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Department <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={(e) => {
                          handleInputChange(e);
                          setFormData((prev) => ({ ...prev, positionId: "" })); // Reset position on dept change
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Select Department</option>
                        {departments?.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase flex justify-between">
                        <span>
                          Job Position <span className="text-rose-500">*</span>
                        </span>
                        {!formData.departmentId && (
                          <span className="text-[9px] text-rose-400 normal-case font-medium animate-pulse">
                            Select department first
                          </span>
                        )}
                      </label>
                      <select
                        name="positionId"
                        disabled={!formData.departmentId}
                        value={formData.positionId}
                        onChange={handleInputChange}
                        className={`w-full border rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all
                              ${formData.departmentId ? "bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500" : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"}`}
                      >
                        <option value="">Select Position</option>
                        {allPositions
                          ?.filter(
                            (p) => p.departmentId === formData.departmentId,
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Reporting To
                      </label>
                      <UserSearchSelect
                        value={formData.reportingTo}
                        onChange={(userId) =>
                          setFormData((prev) => ({
                            ...prev,
                            reportingTo: userId,
                          }))
                        }
                        placeholder="Search and select manager..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Probation Period{" "}
                        <span className="text-[9px] text-slate-400 capitalize">
                          (Months)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="probationPeriod"
                        value={formData.probationPeriod}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Employment Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="employmentType"
                        value={formData.employmentType}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contractor">Contractor</option>
                        <option value="intern">Intern</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Monthly Salary
                      </label>
                      <input
                        name="monthlySalary"
                        value={formData.monthlySalary}
                        onChange={handleInputChange}
                        placeholder="e.g. 15000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Additional Notes
                      </label>
                      <textarea
                        name="additionalNotes"
                        value={formData.additionalNotes}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Payment, Role, and Probation notes..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
                    Personal & Bank Information
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        City of Residence
                      </label>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Country of Birth
                      </label>
                      <input
                        name="countryOfBirth"
                        value={formData.countryOfBirth}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Additional Phone
                      </label>
                      <input
                        name="additionalPhone"
                        value={formData.additionalPhone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="col-span-2 pt-4">
                      <h4 className="text-[12px] font-bold text-slate-800">
                        Primary Bank Details
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Bank Name
                      </label>
                      <input
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        placeholder="e.g. Awash Bank"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Account Number
                      </label>
                      <input
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        First Name
                      </label>
                      <input
                        name="emergencyFirstName"
                        value={formData.emergencyFirstName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Last Name
                      </label>
                      <input
                        name="emergencyLastName"
                        value={formData.emergencyLastName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Phone Number
                      </label>
                      <input
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="emergencyEmail"
                        value={formData.emergencyEmail}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        City
                      </label>
                      <input
                        name="emergencyCity"
                        value={formData.emergencyCity}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Country
                      </label>
                      <input
                        name="emergencyCountry"
                        value={formData.emergencyCountry}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex justify-between">
                    <span>Documents & Verifications</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Any format under 5MB
                    </span>
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-end -mb-2">
                      <button
                        type="button"
                        onClick={() => setShowOfferLetterModal(true)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <FilePlus2 className="w-3 h-3" /> Generate New Offer
                        Letter
                      </button>
                    </div>
                    <UploadOrSelectRow
                      label="Offer Letter"
                      docKey="offerLetter"
                      files={files}
                      handleFileChange={handleFileChange}
                      templates={offerLetterTemplates}
                      selectedTemplate={selectedOfferTemplate}
                      onTemplateSelect={(id: string) =>
                        setSelectedOfferTemplate(id)
                      }
                      onGenerateClick={() => setShowOfferLetterModal(true)}
                    />
                    <UploadRow
                      label="Employment Contract"
                      docKey="contract"
                      files={files}
                      handleFileChange={handleFileChange}
                    />
                    <UploadRow
                      label="Job Description"
                      docKey="jobDescription"
                      files={files}
                      handleFileChange={handleFileChange}
                    />
                    <UploadRow
                      label="Fayda ID / National ID"
                      docKey="nationalId"
                      files={files}
                      handleFileChange={handleFileChange}
                    />
                    <UploadRow
                      label="Passport / Clearance"
                      docKey="passport"
                      files={files}
                      handleFileChange={handleFileChange}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-3xl">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all disabled:opacity-30 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-6 py-2.5 rounded-xl text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-xl text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Creating Profile..." : "Create Employee Profile"}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {showOfferLetterModal && (
        <OfferLetterTemplateModal
          isOpen={showOfferLetterModal}
          onClose={() => setShowOfferLetterModal(false)}
          showAlert={showAlert}
          initialData={
            selectedOfferTemplate
              ? offerLetterTemplates.find((t) => t.id === selectedOfferTemplate)
              : {
                  name: `Offer for ${formData.firstName} ${formData.lastName}`.trim(),
                  subject: `Job Offer: ${allPositions.find((p) => p.id === formData.positionId)?.title || ""} - Blih`,
                  bodyHtml: `
                    <div style="font-family: sans-serif; padding: 20px;">
                      <h1>Job Offer</h1>
                      <p>Dear {{name}},</p>
                      <p>We are excited to offer you the position of <strong>{{positionTitle}}</strong> at Blih.</p>
                      <p>Starting Date: {{startDate}}</p>
                      <p>Monthly Salary: {{salary}}</p>
                      <br/>
                      <p><a href="{{acceptUrl}}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Offer</a></p>
                      <br/>
                      <p>Best regards,</p>
                      <p>Blih HR Team</p>
                    </div>
                  `.trim(),
                }
          }
          onSuccess={() => {
            setShowOfferLetterModal(false);
            showAlert(
              "Offer template generated! You can now select it from the dropdown.",
              "success",
            );
            // Refresh templates list
            getOfferLetterTemplates()
              .then((res) => setOfferLetterTemplates(res.data.data || []))
              .catch(() => {});
          }}
        />
      )}

      {showCreateDept && (
        <CreateDepartmentModal
          isOpen={showCreateDept}
          onClose={() => setShowCreateDept(false)}
          showAlert={showAlert}
          onSuccess={(newDept) => {
            loadOrgData();
            setFormData((prev) => ({ ...prev, departmentId: newDept.id }));
          }}
        />
      )}

      {showCreatePos && (
        <CreatePositionModal
          isOpen={showCreatePos}
          onClose={() => setShowCreatePos(false)}
          showAlert={showAlert}
          initialDeptId={formData.departmentId}
          onSuccess={(newPos) => {
            loadOrgData();
            setFormData((prev) => ({
              ...prev,
              departmentId: newPos.departmentId,
              positionId: newPos.id,
            }));
          }}
        />
      )}
    </div>
  );
}

function UploadRow({ label, docKey, files, handleFileChange }: any) {
  return (
    <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
        <Upload className="w-4 h-4 text-slate-400" />
        {label}
      </span>
      <div className="relative">
        <input
          type="file"
          onChange={(e) => handleFileChange(e, docKey)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div
          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all w-[180px] justify-center text-center
           ${files[docKey] ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"}`}
        >
          {files[docKey] ? (
            <>
              <CheckCircle2 className="w-3 h-3" /> Selected
            </>
          ) : (
            "Upload File"
          )}
        </div>
      </div>
    </div>
  );
}

function UploadOrSelectRow({
  label,
  docKey,
  files,
  handleFileChange,
  templates,
  selectedTemplate,
  onTemplateSelect,
  onGenerateClick,
}: any) {
  const hasFile = !!files[docKey];
  const hasTemplate = !!selectedTemplate;
  const resolved = hasFile || hasTemplate;
  const selectedName = templates.find(
    (t: any) => t.id === selectedTemplate,
  )?.name;

  return (
    <div
      className={`flex items-center justify-between p-3.5 border rounded-2xl transition-colors ${resolved ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"}`}
    >
      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
        <Upload className="w-4 h-4 text-slate-400" />
        {label}
        {docKey === "offerLetter" && (
          <button
            type="button"
            onClick={onGenerateClick}
            className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            (Generate)
          </button>
        )}
      </span>

      <div className="flex items-center gap-3">
        {resolved && (
          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mr-2">
            <CheckCircle2 className="w-3 h-3" />
            {hasFile ? files[docKey].name.slice(0, 24) : selectedName}
          </span>
        )}

        <div className="flex items-center gap-3">
          {/* Upload button */}
          <div className="relative">
            <input
              type="file"
              onChange={(e) => {
                onTemplateSelect("");
                handleFileChange(e, docKey);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all
              ${hasFile ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"}`}
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" /> Upload
            </div>
          </div>

          <span className="text-[11px] font-bold text-slate-400">or</span>

          {/* Template Select */}
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  onTemplateSelect(e.target.value);
                }}
                className={`appearance-none pl-4 pr-8 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer outline-none
                  ${hasTemplate ? "bg-emerald-50 border-emerald-200 text-emerald-700 border-blue-400" : "bg-white border-slate-200 text-slate-600 hover:border-blue-400"}`}
              >
                <option value="">Select</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {hasTemplate && (
              <button
                type="button"
                onClick={onGenerateClick}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                title="Edit Template"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

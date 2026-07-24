import React from "react";
import { api } from "../../../api/client";
import { getOfferLetterTemplates } from "../../../api/offerLetters";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { usePositionCompetencies } from "../../../hooks/useProbationCompetencies";
import type { CreateEmployeeModalProps, EmployeeFormController, EmployeeFormData } from "./types";
import { addCalendarMonths, createInitialEmployeeForm } from "./utils";
import { createEmployeeSubmitHandler } from "./useEmployeeSubmit";

export function useCreateEmployeeController(
  props: CreateEmployeeModalProps,
): EmployeeFormController {
  const {
    isOpen, onClose, showAlert, onSuccess, initialDraftId,
    mode = "create", targetUserId, initialEmploymentType,
  } = props;
  const permissions = useMyPermissions();
  const canCreateDepartment = permissions.hasAny("department.create");
  const canCreatePosition = permissions.hasAny("position.create");

  const [currentStep, setCurrentStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<EmployeeFormData>(() =>
    createInitialEmployeeForm(initialEmploymentType),
  );
  const [files, setFiles] = React.useState<Record<string, File>>({});
  const [draftId, setDraftId] = React.useState<string | null>(initialDraftId || null);
  const [defaultTemplateId, setDefaultTemplateId] = React.useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [allPositions, setAllPositions] = React.useState<any[]>([]);
  const [departmentPositions, setDepartmentPositions] = React.useState<any[]>([]);
  const [positionsLoading, setPositionsLoading] = React.useState(false);
  const [systemRoles, setSystemRoles] = React.useState<any[]>([]);
  const [showCreateDept, setShowCreateDept] = React.useState(false);
  const [showCreatePos, setShowCreatePos] = React.useState(false);
  const [offerLetterTemplates, setOfferLetterTemplates] = React.useState<any[]>([]);
  const [selectedOfferTemplate, setSelectedOfferTemplate] = React.useState("");
  const [showOfferLetterModal, setShowOfferLetterModal] = React.useState(false);
  const [requiresProbation, setRequiresProbation] = React.useState(
    mode === "create" && initialEmploymentType !== "intern",
  );
  const [finalApproverUserId, setFinalApproverUserId] = React.useState("");
  const initialUpdateSnapshotRef = React.useRef<EmployeeFormData | null>(null);

  const competencyQuery = usePositionCompetencies(
    formData.positionId || undefined,
    isOpen && mode === "create" && requiresProbation,
  );
  const probationCompetencies = competencyQuery.data || [];
  const probationTotalWeight = probationCompetencies.reduce(
    (sum, competency) => sum + Number(competency.weight || 0),
    0,
  );
  const probationCompetenciesReady =
    probationCompetencies.length > 0 && Math.abs(probationTotalWeight - 100) <= 0.01;
  const probationDurationMonths = Math.max(1, Number(formData.probationPeriod || 0));
  const probationStartDate = formData.startDate || new Date().toISOString().slice(0, 10);
  const probationExpectedEndDate = addCalendarMonths(probationStartDate, probationDurationMonths);
  const isIntern = formData.employmentType === "intern";

  const loadOrgData = React.useCallback(async () => {
    try {
      const [departmentsResponse, rolesResponse] = await Promise.all([
        api.get("/api/v1/departments?page=1&size=1000"),
        api.get("/api/v1/roles/my-domain"),
      ]);
      setDepartments(
        departmentsResponse.data.data?.departments || departmentsResponse.data.rows ||
        departmentsResponse.data.data || [],
      );
      setSystemRoles(
        rolesResponse.data.data?.roles || rolesResponse.data.roles || rolesResponse.data.data || [],
      );
    } catch (error) {
      console.error("Failed to load org data", error);
    }
  }, []);

  const loadPositionsForDepartment = React.useCallback(async (departmentId: string) => {
    try {
      setPositionsLoading(true);
      const response = await api.get(
        `/api/v1/positions?departmentId=${encodeURIComponent(departmentId)}&page=1&size=1000`,
      );
      const rows = response.data.data?.positions || response.data.rows || response.data.data || [];
      setDepartmentPositions(rows);
      setAllPositions((previous) => {
        const merged = new Map(previous.map((position: any) => [position.id, position]));
        rows.forEach((position: any) => merged.set(position.id, position));
        return Array.from(merged.values());
      });
    } catch (error) {
      console.error("Failed to load positions for department", error);
      setDepartmentPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  const resolveTemplate = React.useCallback(async () => {
    try {
      const response = await api.get("/api/v1/people/profile-templates");
      const templates = response.data?.data?.templates || response.data?.templates || [];
      const template = templates.find((item: any) => item.name.includes("Employee")) || templates[0];
      if (template) setDefaultTemplateId(template.id);
    } catch (error) {
      console.error("Failed to resolve template", error);
    }
  }, []);

  const resumeDraft = React.useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/people/profile-drafts/${id}`);
      const draft = response.data?.data?.draft || response.data?.draft;
      if (draft?.data) {
        setFormData((previous) => ({ ...previous, ...draft.data }));
        if (draft.data.currentStep !== undefined) setCurrentStep(draft.data.currentStep);
        setDraftId(id);
        if (draft.templateId) setDefaultTemplateId(draft.templateId);
      }
    } catch (error) {
      console.error("Failed to resume draft", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployeeForUpdate = React.useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/hr/records/${userId}`);
      const record = response.data?.data?.employeeRecord || response.data?.employeeRecord;
      const user = record?.user || {};
      const metadata = record?.metadata || {};
      const internship = metadata?.internship || {};
      const emergency = record?.emergencyContact || {};
      const salary = record?.salaryInfo || {};
      const parts = String(user?.fullName || "").trim().split(/\s+/).filter(Boolean);
      const bank = Array.isArray(metadata?.bankDetails) ? metadata.bankDetails[0] : null;
      const hireDate = record?.hireDate ? new Date(record.hireDate) : null;
      const probationEnd = record?.probationEndDate ? new Date(record.probationEndDate) : null;
      let probationPeriod = formData.probationPeriod;
      if (hireDate && probationEnd) {
        const days = Math.max(0, Math.round((probationEnd.getTime() - hireDate.getTime()) / 86400000));
        probationPeriod = days ? String(Math.max(1, Math.round(days / 30))) : probationPeriod;
      }
      const next: EmployeeFormData = {
        ...createInitialEmployeeForm(initialEmploymentType),
        firstName: parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "",
        lastName: parts.length > 1 ? parts.at(-1) || "" : "",
        email: user?.email || "", phone: user?.phone || "", employeeCode: record?.employeeCode || "",
        departmentId: record?.departmentId || "", positionId: record?.positionId || "",
        reportingTo: record?.managerUserId || "", startDate: record?.hireDate?.slice?.(0, 10) || "",
        contractStartDate: record?.contractStartDate?.slice?.(0, 10) || "",
        contractEndDate: record?.contractEndDate?.slice?.(0, 10) || "",
        employmentStatus: record?.employmentStatus || formData.employmentStatus,
        employmentType: record?.employmentType || formData.employmentType,
        monthlySalary: salary?.baseSalary ?? "", salaryCurrency: salary?.currency || "ETB",
        probationPeriod, additionalNotes: metadata?.additionalNotes || "",
        internshipProgram: internship?.program || "", internshipInstitution: internship?.institution || "",
        internshipMentorUserId: internship?.mentorUserId || "",
        internshipExpectedEndDate: internship?.expectedEndDate?.slice?.(0, 10) || "",
        internshipStatus: internship?.status || "active", internshipStipendType: internship?.stipendType || "paid",
        dateOfBirth: metadata?.dateOfBirth?.slice?.(0, 10) || "", city: metadata?.city || "",
        countryOfBirth: metadata?.countryOfBirth || "", additionalPhone: metadata?.additionalPhone || "",
        bankName: bank?.bankName || "", bankAccountNumber: bank?.accountNumber || "",
        emergencyFirstName: emergency?.firstName || "", emergencyLastName: emergency?.lastName || "",
        emergencyPhone: emergency?.phone || "", emergencyEmail: emergency?.email || "",
        emergencyCity: emergency?.city || "", emergencyCountry: emergency?.country || "",
      };
      setFormData(next);
      initialUpdateSnapshotRef.current = next;
      setCurrentStep(0);
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Failed to load employee record", "error");
    } finally {
      setLoading(false);
    }
  }, [formData.employmentStatus, formData.employmentType, formData.probationPeriod, initialEmploymentType, showAlert]);

  React.useEffect(() => {
    if (!isOpen) return;
    loadOrgData();
    resolveTemplate();
    setRequiresProbation(mode === "create" && initialEmploymentType !== "intern");
    setFinalApproverUserId("");
    if (initialDraftId) resumeDraft(initialDraftId);
    else if (mode === "update" && targetUserId) loadEmployeeForUpdate(targetUserId);
  }, [isOpen, initialDraftId, mode, targetUserId]);

  React.useEffect(() => {
    if (!isOpen || !formData.departmentId) return setDepartmentPositions([]);
    loadPositionsForDepartment(formData.departmentId);
  }, [isOpen, formData.departmentId, loadPositionsForDepartment]);


  const refreshOfferLetterTemplates = React.useCallback(async () => {
    try {
      const response = await getOfferLetterTemplates();
      setOfferLetterTemplates(response.data.data || []);
    } catch {
      setOfferLetterTemplates([]);
    }
  }, []);

  React.useEffect(() => {
    if (currentStep === 4) refreshOfferLetterTemplates();
  }, [currentStep, refreshOfferLetterTemplates]);

  React.useEffect(() => {
    if (!isOpen || mode === "update") return;
    const timer = window.setTimeout(async () => {
      if (!formData.firstName && !formData.lastName && !formData.email) return;
      try {
        setIsSavingDraft(true);
        const data = { ...formData, currentStep };
        if (draftId) await api.patch(`/api/v1/people/profile-drafts/${draftId}`, { data, status: "draft" });
        else if (defaultTemplateId) {
          const response = await api.post("/api/v1/people/profile-drafts", {
            templateId: defaultTemplateId, data, status: "draft",
          });
          const draft = response.data?.data?.draft || response.data?.draft;
          if (draft?.id) setDraftId(draft.id);
        }
        setLastSaved(new Date());
      } catch (error) {
        console.error("Auto-save failed", error);
      } finally {
        setIsSavingDraft(false);
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [formData, currentStep, isOpen, mode, draftId, defaultTemplateId]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = event.target.files?.[0];
    if (file) setFiles((previous) => ({ ...previous, [key]: file }));
  };
  const setInternshipStipendType = (value: "paid" | "unpaid") => setFormData((previous) => ({
    ...previous, internshipStipendType: value,
    bankName: value === "paid" && !previous.bankName.trim() ? "Awash Bank" : previous.bankName,
  }));

  const handleSubmit = createEmployeeSubmitHandler({
    mode, targetUserId, formData, files, selectedOfferTemplate,
    initialUpdateSnapshot: initialUpdateSnapshotRef.current, requiresProbation,
    finalApproverUserId, probationStartDate, probationDurationMonths,
    probationExpectedEndDate, probationCompetenciesReady, draftId,
    setCurrentStep, setLoading, showAlert, onSuccess, onClose,
  });

  return {
    ...props, mode, currentStep, setCurrentStep, loading, formData, setFormData, files, isIntern,
    departments, allPositions, departmentPositions, positionsLoading, systemRoles,
    offerLetterTemplates, selectedOfferTemplate, setSelectedOfferTemplate,
    showOfferLetterModal, setShowOfferLetterModal, showCreateDept, setShowCreateDept,
    showCreatePos, setShowCreatePos, canCreateDepartment, canCreatePosition,
    isSavingDraft, lastSaved, requiresProbation, setRequiresProbation,
    finalApproverUserId, setFinalApproverUserId, probationStartDate,
    probationDurationMonths, probationExpectedEndDate, probationCompetencies,
    probationTotalWeight, probationCompetenciesReady,
    probationCompetenciesLoading: competencyQuery.isLoading,
    handleInputChange, handleFileChange, setInternshipStipendType,
    loadOrgData, loadPositionsForDepartment, refreshOfferLetterTemplates, handleSubmit,
  };
}

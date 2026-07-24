import { React,type Dispatch } from "react";

export type AlertType = "success" | "error" | "info";
export type EmployeeModalMode = "create" | "update";

export interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (title: string, type?: AlertType) => void;
  onSuccess?: () => void;
  initialDraftId?: string;
  mode?: EmployeeModalMode;
  targetUserId?: string;
  initialEmploymentType?: string;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
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
  monthlySalary: string;
  salaryCurrency: string;
  probationPeriod: string;
  employmentType: string;
  additionalNotes: string;
  internshipProgram: string;
  internshipInstitution: string;
  internshipMentorUserId: string;
  internshipExpectedEndDate: string;
  internshipStatus: string;
  internshipStipendType: "paid" | "unpaid";
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
}

export interface EmployeeFormController extends CreateEmployeeModalProps {
  mode: EmployeeModalMode;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  formData: EmployeeFormData;
  setFormData: React.Dispatch<React.SetStateAction<EmployeeFormData>>;
  files: Record<string, File>;
  isIntern: boolean;
  departments: any[];
  allPositions: any[];
  departmentPositions: any[];
  positionsLoading: boolean;
  systemRoles: any[];
  offerLetterTemplates: any[];
  selectedOfferTemplate: string;
  setSelectedOfferTemplate: React.Dispatch<React.SetStateAction<string>>;
  showOfferLetterModal: boolean;
  setShowOfferLetterModal: React.Dispatch<React.SetStateAction<boolean>>;
  showCreateDept: boolean;
  setShowCreateDept: React.Dispatch<React.SetStateAction<boolean>>;
  showCreatePos: boolean;
  setShowCreatePos: React.Dispatch<React.SetStateAction<boolean>>;
  canCreateDepartment: boolean;
  canCreatePosition: boolean;
  isSavingDraft: boolean;
  lastSaved: Date | null;
  requiresProbation: boolean;
  setRequiresProbation: React.Dispatch<React.SetStateAction<boolean>>;
  finalApproverUserId: string;
  setFinalApproverUserId: React.Dispatch<React.SetStateAction<string>>;
  probationStartDate: string;
  probationDurationMonths: number;
  probationExpectedEndDate: string;
  probationCompetencies: any[];
  probationTotalWeight: number;
  probationCompetenciesReady: boolean;
  probationCompetenciesLoading: boolean;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>, key: string) => void;
  setInternshipStipendType: (value: "paid" | "unpaid") => void;
  loadOrgData: () => Promise<void>;
  loadPositionsForDepartment: (departmentId: string) => Promise<void>;
  refreshOfferLetterTemplates: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}

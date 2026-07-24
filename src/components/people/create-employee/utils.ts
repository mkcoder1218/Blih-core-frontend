import {
  DEFAULT_EMPLOYMENT_STATUS,
  DEFAULT_EMPLOYMENT_TYPE,
} from "../../../constants/employee";
import type { EmployeeFormData } from "./types";

export const EMPLOYEE_STEPS = [
  { id: "account", title: "Account Setup" },
  { id: "employment", title: "Employment Details" },
  { id: "personal_bank", title: "Personal & Bank" },
  { id: "emergency", title: "Emergency Contact" },
  { id: "documents", title: "Documents & IDs" },
];

export function createInitialEmployeeForm(initialEmploymentType?: string): EmployeeFormData {
  return {
    firstName: "", lastName: "", email: "", phone: "", password: "",
    employeeCode: "", systemRole: "EMPLOYEE", departmentId: "", positionId: "",
    reportingTo: "", startDate: "", contractStartDate: "", contractEndDate: "",
    employmentStatus: DEFAULT_EMPLOYMENT_STATUS, monthlySalary: "", salaryCurrency: "ETB",
    probationPeriod: "3", employmentType: initialEmploymentType || DEFAULT_EMPLOYMENT_TYPE,
    additionalNotes: "", internshipProgram: "", internshipInstitution: "",
    internshipMentorUserId: "", internshipExpectedEndDate: "", internshipStatus: "active",
    internshipStipendType: "paid", dateOfBirth: "", city: "", countryOfBirth: "",
    additionalPhone: "", bankName: "", bankAccountNumber: "", emergencyFirstName: "",
    emergencyLastName: "", emergencyPhone: "", emergencyEmail: "", emergencyCity: "",
    emergencyCountry: "",
  };
}

export function addCalendarMonths(dateValue: string, months: number): string {
  const source = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(source.getTime())) return dateValue;
  const originalDay = source.getUTCDate();
  source.setUTCDate(1);
  source.setUTCMonth(source.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + 1, 0)).getUTCDate();
  source.setUTCDate(Math.min(originalDay, lastDay));
  return source.toISOString().slice(0, 10);
}

export function extractCreatedUserId(response: any): string {
  return response?.data?.data?.userId || response?.data?.data?.user?.id ||
    response?.data?.data?.employeeRecord?.userId || response?.data?.data?.record?.userId ||
    response?.data?.userId || response?.data?.user?.id || response?.data?.employeeRecord?.userId || "";
}

export function buildCreatePayload(formData: EmployeeFormData, uploads: Record<string, any>, offerLetterTemplateId: string) {
  return {
    account: {
      firstName: formData.firstName, lastName: formData.lastName, email: formData.email,
      phone: formData.phone, password: formData.password,
    },
    profile: {
      employeeCode: formData.employeeCode, departmentId: formData.departmentId,
      reportingTo: formData.reportingTo, positionId: formData.positionId,
      systemRole: formData.systemRole, startDate: formData.startDate,
      contractStartDate: formData.contractStartDate, contractEndDate: formData.contractEndDate,
      employmentStatus: formData.employmentStatus, employmentType: formData.employmentType,
      monthlySalary: formData.monthlySalary, salaryCurrency: formData.salaryCurrency,
      probationPeriod: formData.probationPeriod, internshipProgram: formData.internshipProgram,
      internshipInstitution: formData.internshipInstitution,
      internshipMentorUserId: formData.internshipMentorUserId,
      internshipExpectedEndDate: formData.internshipExpectedEndDate,
      internshipStatus: formData.internshipStatus,
      internshipStipendType: formData.internshipStipendType,
      dateOfBirth: formData.dateOfBirth, city: formData.city,
      countryOfBirth: formData.countryOfBirth, additionalPhone: formData.additionalPhone,
      bankDetails: [{ bankName: formData.bankName, accountNumber: formData.bankAccountNumber }],
      additionalNotes: formData.additionalNotes,
      emergencyFirstName: formData.emergencyFirstName, emergencyLastName: formData.emergencyLastName,
      emergencyPhone: formData.emergencyPhone, emergencyEmail: formData.emergencyEmail,
      emergencyCity: formData.emergencyCity, emergencyCountry: formData.emergencyCountry,
    },
    uploads,
    offerLetterTemplateId,
  };
}

export function buildUpdatePayload(formData: EmployeeFormData, base: EmployeeFormData, uploads: Record<string, any>) {
  const patch: any = {};
  const account: any = {};
  const profile: any = {};
  const setIfChanged = (obj: any, key: string, next: any, prev: any) => {
    if (String(next ?? "") !== String(prev ?? "")) obj[key] = next;
  };

  ["firstName", "lastName", "email", "phone"].forEach((key) =>
    setIfChanged(account, key, (formData as any)[key], (base as any)[key]),
  );
  if (formData.password) account.password = formData.password;

  const profileKeys: Array<keyof EmployeeFormData> = [
    "employeeCode", "departmentId", "positionId", "reportingTo", "systemRole", "startDate",
    "contractStartDate", "contractEndDate", "employmentStatus", "employmentType", "monthlySalary",
    "salaryCurrency", "probationPeriod", "dateOfBirth", "city", "countryOfBirth", "additionalPhone",
    "additionalNotes", "internshipProgram", "internshipInstitution", "internshipMentorUserId",
    "internshipExpectedEndDate", "internshipStatus", "internshipStipendType", "emergencyFirstName",
    "emergencyLastName", "emergencyPhone", "emergencyEmail", "emergencyCity", "emergencyCountry",
  ];
  profileKeys.forEach((key) => setIfChanged(profile, key, formData[key], base[key]));

  const nextBank = [{ bankName: formData.bankName, accountNumber: formData.bankAccountNumber }];
  const prevBank = [{ bankName: base.bankName, accountNumber: base.bankAccountNumber }];
  if (JSON.stringify(nextBank) !== JSON.stringify(prevBank)) profile.bankDetails = nextBank;
  if (Object.keys(account).length) patch.account = account;
  if (Object.keys(profile).length) patch.profile = profile;
  if (Object.keys(uploads).length) patch.uploads = uploads;
  return patch;
}

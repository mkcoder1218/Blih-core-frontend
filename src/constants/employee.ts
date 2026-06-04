export const EMPLOYMENT_STATUSES = [
  "onboarding",
  "active",
  "inactive",
  "on_leave",
  "terminated",
] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contractor",
  "intern",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const DEFAULT_EMPLOYMENT_STATUS: EmploymentStatus = "onboarding";
export const DEFAULT_EMPLOYMENT_TYPE: EmploymentType = "full_time";

export const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contractor", label: "Contractor" },
  { value: "intern", label: "Intern" },
];

export const EMPLOYMENT_STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

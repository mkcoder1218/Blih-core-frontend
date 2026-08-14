export type SideTab = "profile" | "attendance" | "performance" | "leave";
export type EditTab = "personal" | "contact";

export type BasicProfileForm = {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  maritalStatus: string;
  gender: string;
  nationality: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
};

export type AttendancePage = {
  rows: any[];
  count: number;
  page: number;
  size: number;
};

export type LeavePage = {
  rows: any[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
};

export type LeaveBalance = {
  id: string;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
};

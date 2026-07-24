import { api } from "./client";

export type RegistrationApprovalMode =
  | "START_PROBATION"
  | "PERMANENT_EMPLOYEE"
  | "NO_PROBATION";

export interface PendingRegistrant {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;

  status: "pending" | "rejected";

  createdAt: string;
  rejectionReason: string | null;
  rejectedAt: string | null;

  requestedRoleKey: string | null;
  employmentType: string | null;
  hireDate: string | null;

  department: {
    id: string;
    name: string;
  } | null;

  position: {
    id: string;
    title: string;
  } | null;

  financial?: {
    bankName?: string | null;
    bankAccount?: string | null;
    tin?: string | null;

    salaryInputMode?: "base" | "net" | null;

    baseSalary?: number | null;
    netSalary?: number | null;

    transportAllowance?: number | null;
    perDiemAllowance?: number | null;
    perDiemDays?: number | null;
    medicalBenefit?: number | null;
    telecomAllowance?: number | null;
    housingAllowance?: number | null;
    mealAllowance?: number | null;
    otherAllowance?: number | null;

    employeePensionRate?: number | null;
    employerPensionRate?: number | null;

    remarks?: string | null;
  };

  personal: {
    dateOfBirth: string | null;
    gender: string | null;
    maritalStatus: string | null;
    nationality: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    zipCode: string | null;
  };
}

export interface PendingListResponse {
  items: PendingRegistrant[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApprovalFinancialInfo {
  baseSalary?: number;
  netSalary?: number;

  salaryInputMode?: "base" | "net";

  pensionableSalary?: number;
  currency?: string;

  transportAllowance?: number;
  perDiemAllowance?: number;
  perDiemDays?: number;
  medicalBenefit?: number;
  telecomAllowance?: number;
  housingAllowance?: number;
  mealAllowance?: number;
  otherAllowance?: number;

  employeePensionRate?: number;
  employerPensionRate?: number;

  bankAccount?: string;
  tin?: string;

  paymentStatus?: string;
  remarks?: string;
}

export interface ApproveRegistrationPayload {
  financialInfo: ApprovalFinancialInfo;
  approvalMode: RegistrationApprovalMode;
}

export interface ApproveRegistrationResponse {
  approved: boolean;
  userId: string;
  payroll?: unknown;
}

type CompatiblePendingListPayload =
  PendingListResponse & {
    data: PendingListResponse;
  };

type CompatiblePendingListResponse = {
  data: CompatiblePendingListPayload;
};

function normalizePendingListResponse(
  rawResponse: any,
  requestedPage: number,
  requestedSize: number,
): PendingListResponse {
  const payload =
    rawResponse?.data?.data?.data ??
    rawResponse?.data?.data ??
    rawResponse?.data ??
    rawResponse ??
    {};

  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.rows)
      ? payload.rows
      : Array.isArray(payload?.registrations)
        ? payload.registrations
        : [];

  const total = Number(
    payload?.total ??
      payload?.count ??
      items.length,
  );

  const page = Number(
    payload?.page ??
      requestedPage,
  );

  const size = Number(
    payload?.size ??
      payload?.limit ??
      requestedSize,
  );

  const pages = Number(
    payload?.pages ??
      payload?.totalPages ??
      Math.max(
        1,
        Math.ceil(total / Math.max(size, 1)),
      ),
  );

  return {
    items,
    total: Number.isFinite(total)
      ? total
      : items.length,

    page:
      Number.isFinite(page) && page > 0
        ? page
        : requestedPage,

    size:
      Number.isFinite(size) && size > 0
        ? size
        : requestedSize,

    pages:
      Number.isFinite(pages) && pages > 0
        ? pages
        : 1,
  };
}

export const pendingRegistrationsApi = {
  async list(
    status: "pending" | "rejected" = "pending",
    page = 1,
    size = 20,
  ): Promise<CompatiblePendingListResponse> {
    const response = await api.get(
      "/api/v1/hr/pending-registrations",
      {
        params: {
          status,
          page,
          size,
        },
      },
    );

    const normalized =
      normalizePendingListResponse(
        response,
        page,
        size,
      );

    return {
      data: {
        ...normalized,
        data: normalized,
      },
    };
  },

  getOne(userId: string) {
    return api.get(
      `/api/v1/hr/pending-registrations/${userId}`,
    );
  },

  async approve(
    userId: string,
    payload: ApproveRegistrationPayload,
  ): Promise<ApproveRegistrationResponse> {
    const response = await api.post(
      `/api/v1/hr/pending-registrations/${userId}/approve`,
      {
        financialInfo:
          payload.financialInfo,

        financialConfirmation: true,

        approvalMode:
          payload.approvalMode,
      },
    );

    const data =
      response.data?.data?.data ??
      response.data?.data ??
      response.data;

    return data as ApproveRegistrationResponse;
  },

  reject(
    userId: string,
    reason: string,
    templateMessage?: string,
  ) {
    return api.post(
      `/api/v1/hr/pending-registrations/${userId}/reject`,
      {
        reason,
        templateMessage,
      },
    );
  },
};

export const REJECTION_TEMPLATES = [
  {
    id: "incomplete_docs",
    label: "Incomplete Documents",
    message:
      "Your registration could not be approved because the documents you uploaded (National ID) are incomplete or unclear. Please re-upload clear, legible images of both sides of your ID and resubmit.",
  },

  {
    id: "info_mismatch",
    label: "Information Mismatch",
    message:
      "Some of the information you provided does not match our records or contains inconsistencies. Please review and correct your personal and work details before resubmitting.",
  },

  {
    id: "wrong_role",
    label: "Role Not Available",
    message:
      "The role you requested is not currently available for self-registration. Please select a different role or contact HR directly to discuss your position.",
  },

  {
    id: "missing_info",
    label: "Missing Required Information",
    message:
      "Your application is missing some required information. Please complete all required fields and resubmit your application.",
  },

  {
    id: "position_filled",
    label: "Position Already Filled",
    message:
      "The position you applied for has already been filled. Please select a different position or department and resubmit your application.",
  },
];

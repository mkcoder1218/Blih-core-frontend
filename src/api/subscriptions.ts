import { api } from "./client";

export type AccessMode = "full" | "read_only" | "business_admin_only" | "billing_only" | "locked";
export type DowngradePolicy = "block" | "allow_with_warning" | "restrict_new";

export type SubscriptionPolicy = {
  id?: string;
  scopeKey?: string;
  scopeType?: "platform" | "plan" | "business";
  gracePeriodDays?: number | null;
  graceAccessMode?: AccessMode | null;
  expiredAccessMode?: AccessMode | null;
  retentionDays?: number | null;
  downgradePolicy?: DowngradePolicy | null;
  autoRenew?: boolean | null;
  metadata?: Record<string, any>;
};

export type Feature = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isMetered: boolean;
  unitName?: string | null;
};

export type PlanFeature = {
  id: string;
  featureId: string;
  isEnabled: boolean;
  limitValue?: string | number | null;
  limitPeriod?: "daily" | "monthly" | "yearly" | "lifetime" | null;
  overageUnitPrice?: string | number | null;
  feature: Feature;
};

export type PlanModule = {
  id?: string;
  moduleKey: string;
  moduleName: string;
  isEnabled: boolean;
};

export type Plan = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  basePrice: string | number;
  priceMonthly: string | number;
  priceYearly: string | number;
  billingCycle: "monthly" | "yearly";
  includedSeats: number;
  extraSeatPrice: string | number;
  currency: string;
  isActive: boolean;
  status?: string;
  sortOrder?: number;
  modules?: PlanModule[];
  features?: PlanFeature[];
  subscriptionPolicy?: SubscriptionPolicy | null;
};

export type Subscription = {
  id: string;
  businessId: string;
  planId: string;
  status: "pending_payment" | "trialing" | "active" | "past_due" | "suspended" | "canceled" | "expired" | string;
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  startDate?: string;
  endDate?: string | null;
  trialEndsAt?: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null;
  pendingPlanId?: string | null;
  pastDueSince?: string | null;
  creditBalance?: string | number;
  discountPercent?: string | number;
  retentionUntil?: string | null;
  metadata?: Record<string, any>;
  Plan?: Plan;
};

export type Invoice = {
  id: string;
  subscriptionId: string;
  invoiceNumber: string;
  baseAmount: string | number;
  seatAmount: string | number;
  usageAmount: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  amountPaid?: string | number;
  outstandingAmount?: string | number;
  currency: string;
  status: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string | null;
  metadata?: Record<string, any>;
};

export type Payment = {
  id: string;
  invoiceId: string;
  amount: string | number;
  currency: string;
  provider: string;
  providerReference?: string | null;
  paidAt?: string | null;
  status: string;
  metadata?: Record<string, any>;
};

export type Usage = {
  id: string;
  quantity: string | number;
  totalPrice: string | number;
  usageDate: string;
  feature?: Feature;
};

export type AdminOverview = {
  active: number;
  trialing: number;
  pastDue: number;
  pendingPayment: number;
  suspended: number;
  canceled: number;
  expired: number;
  monthlyRevenue: number;
  outstanding: number;
};

export type AdminSubscriptionRow = {
  business: { id: string; name: string; email?: string | null; status: string; planId?: string | null };
  subscription: Subscription | null;
  outstandingAmount: number;
  lastPayment: Payment | null;
};

export type PolicyLayers = {
  platform: SubscriptionPolicy | null;
  plan: SubscriptionPolicy | null;
  business: SubscriptionPolicy | null;
  effective: Required<Pick<SubscriptionPolicy, "gracePeriodDays" | "graceAccessMode" | "expiredAccessMode" | "retentionDays" | "downgradePolicy" | "autoRenew">> & { metadata?: Record<string, any> };
};

export type AdminBusinessDetail = {
  business: { id: string; name: string; email?: string | null; phone?: string | null; status: string; planId?: string | null };
  subscription: Subscription | null;
  plans: Plan[];
  policy: PolicyLayers;
  invoices: Invoice[];
  payments: Payment[];
  usage: Usage[];
  features: PlanFeature[];
  modules: Array<{ id: string; moduleKey: string; moduleName: string; status: string }>;
};

const unwrap = <T>(value: any, key: string): T => value?.data?.[key] ?? value?.[key];

async function downloadBlob(url: string, fallbackName: string) {
  const response = await api.get(url, { responseType: "blob" });
  const contentType = String(response.headers["content-type"] || "application/octet-stream");
  const blob = new Blob([response.data], { type: contentType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  const disposition = String(response.headers["content-disposition"] || "");
  const match = disposition.match(/filename="?([^";]+)"?/i);
  anchor.download = match?.[1] || fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export const subscriptionApi = {
  current: async () => {
    const raw = (await api.get("/api/v1/subscription/current")).data;
    return {
      subscription: unwrap<Subscription | null>(raw, "subscription"),
      policy: unwrap<PolicyLayers | null>(raw, "policy"),
    };
  },
  plans: async () => unwrap<Plan[]>((await api.get("/api/v1/subscription/plans")).data, "plans") || [],
  features: async () => unwrap<PlanFeature[]>((await api.get("/api/v1/subscription/features")).data, "features") || [],
  usage: async () => unwrap<Usage[]>((await api.get("/api/v1/subscription/usage")).data, "usage") || [],
  invoices: async () => unwrap<Invoice[]>((await api.get("/api/v1/subscription/invoices")).data, "invoices") || [],
  payments: async () => unwrap<Payment[]>((await api.get("/api/v1/subscription/payments")).data, "payments") || [],
  changePlan: async (planId: string) => (await api.post("/api/v1/subscription/change-plan", { planId })).data,
  cancel: async () => (await api.post("/api/v1/subscription/cancel")).data,
  reactivate: async () => (await api.post("/api/v1/subscription/reactivate")).data,
  downloadInvoice: (invoiceId: string) => downloadBlob(`/api/v1/subscription/invoices/${invoiceId}/pdf`, `invoice-${invoiceId}.pdf`),
  downloadPaymentReceipt: (paymentId: string) => downloadBlob(`/api/v1/subscription/payments/${paymentId}/pdf`, `receipt-${paymentId}.pdf`),
  downloadOriginalReceipt: (paymentId: string) => downloadBlob(`/api/v1/subscription/payments/${paymentId}/original-receipt`, `payment-receipt-${paymentId}`),

  adminOverview: async () => unwrap<AdminOverview>((await api.get("/api/v1/subscription/admin/overview")).data, "overview"),
  adminBusinesses: async () => unwrap<AdminSubscriptionRow[]>((await api.get("/api/v1/subscription/admin/businesses")).data, "subscriptions") || [],
  adminBusinessDetail: async (businessId: string) => unwrap<AdminBusinessDetail>((await api.get(`/api/v1/subscription/admin/businesses/${businessId}`)).data, "detail"),
  adminAssign: async (businessId: string, payload: { planId: string; billingCycle: "monthly" | "yearly"; trialDays?: number; policy?: SubscriptionPolicy }) =>
    (await api.post(`/api/v1/subscription/admin/businesses/${businessId}/assign`, payload)).data,
  adminChangePlan: async (businessId: string, planId: string, force = false) =>
    (await api.post(`/api/v1/subscription/admin/businesses/${businessId}/change-plan`, { planId, force })).data,
  adminRecordPayment: async (businessId: string, payload: { invoiceId: string; amount: number; paidAt?: string; providerReference?: string; notes?: string; receipt?: File | null }) => {
    const form = new FormData();
    form.append("invoiceId", payload.invoiceId);
    form.append("amount", String(payload.amount));
    if (payload.paidAt) form.append("paidAt", payload.paidAt);
    if (payload.providerReference) form.append("providerReference", payload.providerReference);
    if (payload.notes) form.append("notes", payload.notes);
    if (payload.receipt) form.append("receipt", payload.receipt);
    return (await api.post(`/api/v1/subscription/admin/businesses/${businessId}/payments`, form, { headers: { "Content-Type": "multipart/form-data" } })).data;
  },
  adminExtend: async (businessId: string, days: number) => (await api.post(`/api/v1/subscription/admin/businesses/${businessId}/extend`, { days })).data,
  adminSetDiscount: async (businessId: string, discountPercent: number) => (await api.post(`/api/v1/subscription/admin/businesses/${businessId}/discount`, { discountPercent })).data,
  adminSuspend: async (businessId: string) => (await api.post(`/api/v1/subscription/admin/businesses/${businessId}/suspend`)).data,
  adminReactivate: async (businessId: string) => (await api.post(`/api/v1/subscription/admin/businesses/${businessId}/reactivate`)).data,
  adminSetBusinessPolicy: async (businessId: string, policy: SubscriptionPolicy) => (await api.put(`/api/v1/subscription/admin/businesses/${businessId}/policy`, policy)).data,
  adminPlatformPolicy: async () => unwrap<any>((await api.get("/api/v1/subscription/admin/platform-policy")).data, "policy"),
  adminSetPlatformPolicy: async (policy: SubscriptionPolicy) => (await api.put("/api/v1/subscription/admin/platform-policy", policy)).data,
  adminFeatureOverride: async (businessId: string, featureId: string, payload: { isEnabled: boolean; limitValue?: number | null; limitPeriod?: string | null; overageUnitPrice?: number }) =>
    (await api.put(`/api/v1/subscription/admin/businesses/${businessId}/features/${featureId}`, payload)).data,
  adminModuleOverride: async (businessId: string, moduleKey: string, payload: { enabled: boolean; moduleName?: string }) =>
    (await api.put(`/api/v1/subscription/admin/businesses/${businessId}/modules/${encodeURIComponent(moduleKey)}`, payload)).data,
};

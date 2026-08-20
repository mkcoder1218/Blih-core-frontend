import { api } from "./client";

export type Feature = { id: string; key: string; name: string; isMetered: boolean; unitName?: string | null };
export type PlanFeature = { id: string; isEnabled: boolean; limitValue?: string | number | null; limitPeriod?: string | null; feature: Feature };
export type Plan = { id: string; key: string; name: string; description?: string; basePrice: string | number; billingCycle: "monthly" | "yearly"; includedSeats: number; extraSeatPrice: string | number; currency: string; features?: PlanFeature[] };
export type Subscription = { id: string; planId: string; status: string; currentPeriodStart: string; currentPeriodEnd: string; trialEndsAt?: string | null; cancelAtPeriodEnd: boolean; pendingPlanId?: string | null; Plan?: Plan };
export type Invoice = { id: string; invoiceNumber: string; totalAmount: string | number; currency: string; status: string; dueDate: string; periodStart: string; periodEnd: string };
export type Usage = { id: string; quantity: string | number; totalPrice: string | number; usageDate: string; feature?: Feature };

const unwrap = <T>(value: any, key: string): T => value?.data?.[key] ?? value?.[key];
export const subscriptionApi = {
  current: async () => unwrap<Subscription | null>((await api.get("/api/v1/subscription/current")).data, "subscription"),
  plans: async () => unwrap<Plan[]>((await api.get("/api/v1/subscription/plans")).data, "plans") || [],
  features: async () => unwrap<PlanFeature[]>((await api.get("/api/v1/subscription/features")).data, "features") || [],
  usage: async () => unwrap<Usage[]>((await api.get("/api/v1/subscription/usage")).data, "usage") || [],
  invoices: async () => unwrap<Invoice[]>((await api.get("/api/v1/subscription/invoices")).data, "invoices") || [],
  changePlan: async (planId: string) => (await api.post("/api/v1/subscription/change-plan", { planId })).data,
  cancel: async () => (await api.post("/api/v1/subscription/cancel")).data,
  reactivate: async () => (await api.post("/api/v1/subscription/reactivate")).data,
};

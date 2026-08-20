import type { PlanFeatureConfig, PlanModuleConfig, SubscriptionPolicyInput } from "../../../api/types";

export type CatalogFeature = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isMetered: boolean;
  unitName?: string | null;
};

export type CatalogModule = {
  moduleKey: string;
  moduleName: string;
  description?: string | null;
};

export type DraftFeature = {
  featureId: string;
  isEnabled: boolean;
  limitValue: number | null;
  limitPeriod: "daily" | "monthly" | "yearly" | "lifetime" | null;
  overageUnitPrice: number;
};

export type PlanDraft = {
  name: string;
  key: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  includedSeats: number;
  extraSeatPrice: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  modules: PlanModuleConfig[];
  features: DraftFeature[];
  policy: SubscriptionPolicyInput;
};

export const DEFAULT_POLICY: SubscriptionPolicyInput = {
  gracePeriodDays: 7,
  graceAccessMode: "read_only",
  expiredAccessMode: "billing_only",
  retentionDays: 90,
  downgradePolicy: "block",
  autoRenew: false,
};

export const emptyDraft = (): PlanDraft => ({
  name: "",
  key: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  includedSeats: 10,
  extraSeatPrice: 0,
  currency: "ETB",
  isActive: true,
  sortOrder: 0,
  modules: [],
  features: [],
  policy: { ...DEFAULT_POLICY },
});

export function normalizeModules(catalog: CatalogModule[], source?: PlanModuleConfig[]) {
  const current = new Map((source || []).map((m) => [m.moduleKey, m]));
  const rows = catalog.length ? catalog : (source || []).map((m) => ({ moduleKey: m.moduleKey, moduleName: m.moduleName }));
  return rows.map((m) => ({
    moduleKey: m.moduleKey,
    moduleName: m.moduleName,
    isEnabled: Boolean(current.get(m.moduleKey)?.isEnabled),
  }));
}

export function normalizeFeatures(catalog: CatalogFeature[], source?: PlanFeatureConfig[]) {
  const current = new Map((source || []).map((f) => [f.featureId, f]));
  const rows = catalog.length ? catalog : (source || []).filter((f) => f.feature).map((f) => f.feature as CatalogFeature);
  return rows.map((feature) => {
    const existing = current.get(feature.id);
    return {
      featureId: feature.id,
      isEnabled: Boolean(existing?.isEnabled),
      limitValue: existing?.limitValue == null ? null : Number(existing.limitValue),
      limitPeriod: (existing?.limitPeriod as DraftFeature["limitPeriod"]) || (feature.isMetered ? "monthly" : null),
      overageUnitPrice: Number(existing?.overageUnitPrice || 0),
    } satisfies DraftFeature;
  });
}

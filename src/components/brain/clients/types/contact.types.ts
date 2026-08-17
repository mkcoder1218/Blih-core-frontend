export type ContactKind = "client" | "influencer";

export type ContactOptionType =
  | "field"
  | "behavior"
  | "platform"
  | "client_status"
  | "client_type"
  | "position"
  | "company";

export type ContactOption = {
  id: string;
  businessId?: string;
  type: ContactOptionType;
  label: string;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ContactPhone = {
  id?: string;
  number: string;
  label?: string | null;
};

export type InfluencerPlatformAccount = {
  id?: string;
  platformOptionId: string;
  handle?: string | null;
  profileUrl?: string | null;
  followerCount?: number | null;
  platform?: ContactOption | null;
};

export type BrainContact = {
  id: string;
  businessId?: string;
  kind: ContactKind;
  name: string;
  email?: string | null;
  phones: ContactPhone[];
  fieldOptionId?: string | null;
  behaviorOptionId?: string | null;
  companyOptionId?: string | null;
  positionOptionId?: string | null;
  clientTypeOptionId?: string | null;
  clientStatusOptionId?: string | null;
  field?: ContactOption | null;
  behavior?: ContactOption | null;
  company?: ContactOption | null;
  position?: ContactOption | null;
  clientType?: ContactOption | null;
  clientStatus?: ContactOption | null;
  location?: string | null;
  notes?: string | null;
  profileImageUrl?: string | null;
  platformAccounts: InfluencerPlatformAccount[];
  accountManager?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ContactInput = {
  kind: ContactKind;
  name: string;
  phones: ContactPhone[];
  email?: string | null;
  fieldOptionId?: string | null;
  behaviorOptionId?: string | null;
  companyOptionId?: string | null;
  positionOptionId?: string | null;
  clientTypeOptionId?: string | null;
  clientStatusOptionId?: string | null;
  location?: string | null;
  notes?: string | null;
  profileImageUrl?: string | null;
  platformAccounts?: InfluencerPlatformAccount[];
};

export type ContactListParams = {
  page?: number;
  size?: number;
  search?: string;
  kind?: ContactKind;
  fieldOptionId?: string;
  behaviorOptionId?: string;
  clientStatusOptionId?: string;
};

export type ContactListPage = {
  rows: BrainContact[];
  count: number;
  page: number;
  size: number;
  pages: number;
};

export const BEHAVIOR_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#CA8A04",
  "#16A34A",
  "#059669",
  "#0891B2",
  "#475569",
] as const;

export type UnknownRecord = Record<string, unknown>;
export type BusinessCreatedAt = { seconds?: number } | string | Date;
export type SortBy = 'newest' | 'oldest';
export type OwnerStateFilter = 'all' | 'with_owner' | 'without_owner';
export type OwnerSource = 'ownerUid' | 'legacyOwners' | 'none';

export interface BusinessInfo {
  id: string;
  name?: string;
  address?: string;
  tel?: string;
  email?: string;
  rnc?: string;
  province?: string;
  country?: string;
  businessType?: string;
  createdAt?: BusinessCreatedAt;
  ownerUid?: string | null;
  hasOwner: boolean;
  ownerSource: OwnerSource;
  ownerCandidates: string[];
  subscriptionStatus?: string | null;
  subscriptionPlanId?: string | null;
}

export interface BusinessDoc {
  id: string;
  business: BusinessInfo;
  raw: UnknownRecord;
}

export interface BusinessFilters {
  province: string;
  country: string;
  businessType: string;
  hasRNC: boolean;
  sortBy: SortBy;
  ownerState: OwnerStateFilter;
  subscriptionStatus: string;
}

export interface BusinessFeedState {
  items: BusinessDoc[];
  error: string | null;
  resolvedKey: string | null;
}

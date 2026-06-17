import type { UserRoleLike } from '@/types/users';

export type TimestampLike =
  | number
  | string
  | Date
  | {
      toMillis?: () => number;
      seconds?: number;
      nanoseconds?: number;
    }
  | null;

export type PlanTier = 'demo' | 'basic' | 'plus' | 'pro' | 'legacy';

export type MembershipRole = UserRoleLike | (string & {});

export type MembershipStatus =
  | 'active'
  | 'invited'
  | 'inactive'
  | 'suspended'
  | 'revoked'
  | (string & {});

export interface UserAccessControl {
  businessId: string;
  businessName?: string | null;
  role: MembershipRole;
  status?: MembershipStatus;
  permissions?: string[];
  isOwner?: boolean;
  isPrimary?: boolean;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface Membership {
  id?: string;
  uid?: string;
  userId?: string;
  businessId: string;
  role: MembershipRole;
  status?: MembershipStatus;
  permissions?: string[];
  invitedBy?: string | null;
  email?: string | null;
  displayName?: string | null;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface User {
  id?: string;
  uid?: string;
  name?: string | null;
  realName?: string | null;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  status?: 'active' | 'inactive' | 'suspended' | (string & {});
  active?: boolean;

  // Legacy shape (current app)
  role?: MembershipRole | null;
  businessID?: string | null;
  businessId?: string | null;

  // New shape (multi-business)
  defaultBusinessId?: string | null;
  lastSelectedBusinessId?: string | null;
  accessControl?: UserAccessControl[] | null;
  memberships?: Membership[] | null;

  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export type BusinessStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | (string & {});

export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'scheduled'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'unpaid'
  | 'deprecated'
  | (string & {});

export type BillingCycle = 'monthly' | 'yearly' | (string & {});

export interface SubscriptionLimits {
  maxUsers?: number;
  maxProducts?: number;
  maxMonthlyInvoices?: number;
  maxClients?: number;
  maxSuppliers?: number;
  maxWarehouses?: number;
  maxOpenCashRegisters?: number;
  maxBusinesses?: number;
  reportLookbackDays?: number;
  maxAiInsightsPerMonth?: number;
  maxApiRequestsPerDay?: number;
  maxStorageGb?: number;
  [key: string]: number | undefined;
}

export interface SubscriptionFeatures {
  advancedReports?: boolean;
  salesAnalyticsPanel?: boolean;
  accountsReceivable?: boolean;
  authorizationsPinFlow?: boolean;
  insuranceModule?: boolean;
  apiAccess?: boolean;
  aiInsights?: boolean;
  [key: string]: boolean | undefined;
}

export interface SubscriptionModuleAccess {
  sales?: boolean;
  preorders?: boolean;
  inventory?: boolean;
  orders?: boolean;
  purchases?: boolean;
  expenses?: boolean;
  cashReconciliation?: boolean;
  accountsReceivable?: boolean;
  creditNote?: boolean;
  utility?: boolean;
  authorizations?: boolean;
  taxReceipt?: boolean;
  insurance?: boolean;
  multiBusiness?: boolean;
  api?: boolean;
  ai?: boolean;
  [key: string]: boolean | undefined;
}

export interface SubscriptionUsage {
  users?: number;
  products?: number;
  monthlyInvoices?: number;
  clients?: number;
  suppliers?: number;
  warehouses?: number;
  openCashRegisters?: number;
  businesses?: number;
  aiInsightsThisMonth?: number;
  apiRequestsToday?: number;
  storageGb?: number;
  [key: string]: number | undefined;
}

export interface BusinessSubscription {
  planId?: PlanTier | (string & {}) | null;
  planVersion?: number;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  currency?: string;
  priceMonthly?: number;
  periodStart?: TimestampLike;
  periodEnd?: TimestampLike;
  trialEndsAt?: TimestampLike;
  provider?: string | null;
  providerRef?: string | null;
  limits?: SubscriptionLimits;
  features?: SubscriptionFeatures;
  moduleAccess?: SubscriptionModuleAccess;
  usage?: SubscriptionUsage;
  [key: string]: unknown;
}

export interface BusinessProfile {
  id?: string;
  name?: string;
  businessType?: string | null;
  status?: BusinessStatus;
  owners?: string[];
  billingContactUid?: string | null;
  createdBy?: string | null;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface Business extends BusinessProfile {
  // Current persisted shape often nests business details under `business`
  business?: BusinessProfile | null;
  subscription?: BusinessSubscription | null;
  settings?: Record<string, unknown> | null;
}

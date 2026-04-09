export type UnknownRecord = Record<string, unknown>;
export type ActionKey = 'checkout' | 'portal' | 'reload' | null;
export type ScopeType = 'account' | 'business';
export type DevMaintenanceModalKey =
  | 'assignment'
  | 'payment'
  | 'versioning'
  | 'definition'
  | 'sandbox-checkout'
  | 'sandbox-flow'
  | null;
export type StatusTone = 'green' | 'orange' | 'red';
export type BillingCheckoutResult = 'success' | 'failed' | 'canceled';
export type PlanLifecycleStatus = 'active' | 'deprecated' | 'retired';

export interface SubscriptionViewModel {
    status: string | null;
    planId: string | null;
    displayName: string | null;
    provider: string;
    billingCycle: string;
    currency: string;
    priceMonthly: number | null;
    periodStart: number | null;
    periodEnd: number | null;
    trialEndsAt: number | null;
    noticeWindowDays: number | null;
    limits: UnknownRecord;
    modules: UnknownRecord;
    addons: UnknownRecord;
    features: UnknownRecord;
    moduleAccess: UnknownRecord;
}

export interface SubscriptionPlanOption {
    planCode: string;
    displayName: string;
    priceMonthly: number | null;
    currency: string;
    billingCycle: string;
    limits: UnknownRecord;
    modules: UnknownRecord;
    addons: UnknownRecord;
    isCurrent: boolean;
    isSelectable: boolean;
}

export interface LimitRow {
    key: string;
    label: string;
    limit: number | null;
    usage: number | null;
}

export interface PaymentRow {
    key: string;
    amount: number;
    currency: string;
    provider: string;
    status: string;
    description: string;
    reference?: string | null;
    createdAt: number | null;
}

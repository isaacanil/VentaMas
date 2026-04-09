import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import { resolveBillingCallableErrorMessage } from './callableErrors';

type UnknownRecord = Record<string, unknown>;

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const withSessionToken = <T extends UnknownRecord>(payload: T): T => {
  const { sessionToken } = getStoredSession();
  if (!sessionToken) return payload;
  return {
    ...payload,
    sessionToken,
  };
};

const callBilling = async <TInput extends UnknownRecord, TOutput>(
  callableName: string,
  payload: TInput,
): Promise<TOutput> => {
  const callable = httpsCallable<TInput, TOutput>(functions, callableName);
  try {
    const response = await callable(withSessionToken(payload));
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      resolveBillingCallableErrorMessage(
        error,
        'La funcionalidad de billing aún no está desplegada en backend.',
      ),
    );
  }
};

export interface BillingOverviewPayload {
  businessId: string;
}

export interface BillingOverviewResponse {
  ok?: boolean;
  businessId?: string;
  billingAccountId?: string;
  ownerUid?: string;
  account?: UnknownRecord;
  subscriptions?: UnknownRecord[];
  paymentHistory?: UnknownRecord[];
  usage?: {
    current?: UnknownRecord;
    monthly?: UnknownRecord[];
  };
  activeSubscription?: UnknownRecord;
  availablePlans?: UnknownRecord[];
  providersImplemented?: string[];
}

export const requestBillingOverview = (businessId: string) =>
  callBilling<BillingOverviewPayload, BillingOverviewResponse>('getBillingOverview', {
    businessId,
  });

export interface VerifySubscriptionCheckoutSessionPayload {
  businessId: string;
  orderNumber: string;
}

export interface VerifySubscriptionCheckoutSessionResponse {
  ok?: boolean;
  provider?: string;
  orderNumber?: string;
  status?: string;
  approved?: boolean;
  paymentId?: string | null;
  subscriptionId?: string | null;
  message?: string | null;
}

export const requestVerifySubscriptionCheckoutSession = (
  payload: VerifySubscriptionCheckoutSessionPayload,
) =>
  callBilling<
    VerifySubscriptionCheckoutSessionPayload,
    VerifySubscriptionCheckoutSessionResponse
  >('verifySubscriptionCheckoutSession', payload);

export interface DevAssignSubscriptionPayload {
  billingAccountId: string;
  planCode: string;
  scope?: 'account' | 'business';
  targetBusinessId?: string;
  provider?: string;
  status?: string;
  effectiveAt?: number | string;
  note?: string;
}

export interface DevAssignSubscriptionResponse {
  ok?: boolean;
  billingAccountId?: string;
  subscriptionId?: string;
  scope?: string;
  targetBusinessId?: string | null;
  subscription?: UnknownRecord;
}

export const requestDevAssignSubscription = (payload: DevAssignSubscriptionPayload) =>
  callBilling<DevAssignSubscriptionPayload, DevAssignSubscriptionResponse>(
    'devAssignSubscription',
    payload,
  );

export interface DevListBillingAccountsResponse {
  ok?: boolean;
  accounts?: Array<UnknownRecord>;
}

export const requestDevListBillingAccounts = (limit = 50) =>
  callBilling<{ limit: number }, DevListBillingAccountsResponse>(
    'devListBillingAccounts',
    { limit: toFiniteNumber(limit) || 50 },
  );

export interface DevListPlanCatalogResponse {
  ok?: boolean;
  plans?: Array<UnknownRecord>;
}

export const requestDevListPlanCatalog = () =>
  callBilling<Record<string, never>, DevListPlanCatalogResponse>(
    'devListPlanCatalog',
    {},
  );

export interface DevUpsertPlanCatalogDefinitionPayload {
  planCode: string;
  payload: UnknownRecord;
}

export interface DevUpsertPlanCatalogDefinitionResponse {
  ok?: boolean;
  planCode?: string;
  displayName?: string;
  catalogStatus?: string;
}

export const requestDevUpsertPlanCatalogDefinition = (
  payload: DevUpsertPlanCatalogDefinitionPayload,
) =>
  callBilling<
    DevUpsertPlanCatalogDefinitionPayload,
    DevUpsertPlanCatalogDefinitionResponse
  >('devUpsertPlanCatalogDefinition', payload);

export interface DevUpsertPlanCatalogVersionPayload {
  planCode: string;
  versionId?: string;
  payload: UnknownRecord;
}

export interface DevUpsertPlanCatalogVersionResponse {
  ok?: boolean;
  planCode?: string;
  versionId?: string;
}

export const requestDevUpsertPlanCatalogVersion = (
  payload: DevUpsertPlanCatalogVersionPayload,
) =>
  callBilling<
    DevUpsertPlanCatalogVersionPayload,
    DevUpsertPlanCatalogVersionResponse
  >('devUpsertPlanCatalogVersion', payload);

export interface DevPublishPlanCatalogVersionPayload {
  planCode: string;
  versionId: string;
  effectiveAt?: number | string;
  noticeWindowDays?: 0 | 7 | 15 | 30 | 90;
}

export interface DevPublishPlanCatalogVersionResponse {
  ok?: boolean;
  planCode?: string;
  versionId?: string;
  state?: string;
  effectiveAt?: number;
  noticeWindowDays?: number;
  notifications?: {
    recipientCount?: number;
    delivered?: number;
    skipped?: number;
    failed?: number;
  };
}

export const requestDevPublishPlanCatalogVersion = (
  payload: DevPublishPlanCatalogVersionPayload,
) =>
  callBilling<
    DevPublishPlanCatalogVersionPayload,
    DevPublishPlanCatalogVersionResponse
  >('devPublishPlanCatalogVersion', payload);

export interface DevUpdatePlanCatalogLifecyclePayload {
  planCode: string;
  lifecycleStatus: 'active' | 'deprecated' | 'retired';
  versionId?: string;
}

export interface DevUpdatePlanCatalogLifecycleResponse {
  ok?: boolean;
  scope?: 'plan' | 'version';
  planCode?: string;
  versionId?: string;
  lifecycleStatus?: string;
}

export const requestDevUpdatePlanCatalogLifecycle = (
  payload: DevUpdatePlanCatalogLifecyclePayload,
) =>
  callBilling<
    DevUpdatePlanCatalogLifecyclePayload,
    DevUpdatePlanCatalogLifecycleResponse
  >('devUpdatePlanCatalogLifecycle', payload);

export interface DevDeletePlanCatalogDefinitionPayload {
  planCode: string;
}

export interface DevDeletePlanCatalogDefinitionResponse {
  ok?: boolean;
  planCode?: string;
  deletedVersions?: number;
  deletedAt?: number;
}

export const requestDevDeletePlanCatalogDefinition = (
  payload: DevDeletePlanCatalogDefinitionPayload,
) =>
  callBilling<
    DevDeletePlanCatalogDefinitionPayload,
    DevDeletePlanCatalogDefinitionResponse
  >('devDeletePlanCatalogDefinition', payload);

export interface DevPreviewPlanCatalogImpactPayload {
  planCode: string;
  payload?: UnknownRecord;
}

export interface DevPreviewPlanCatalogImpactResponse {
  ok?: boolean;
  planCode?: string;
  limits?: UnknownRecord;
  evaluated?: UnknownRecord;
  totals?: UnknownRecord;
  violations?: UnknownRecord;
}

export const requestDevPreviewPlanCatalogImpact = (
  payload: DevPreviewPlanCatalogImpactPayload,
) =>
  callBilling<
    DevPreviewPlanCatalogImpactPayload,
    DevPreviewPlanCatalogImpactResponse
  >('devPreviewPlanCatalogImpact', payload);

export interface DevRecordPaymentHistoryPayload {
  billingAccountId: string;
  amount: number;
  currency?: string;
  provider?: string;
  status?: string;
  description?: string;
  reference?: string;
}

export const requestDevRecordPaymentHistoryItem = (
  payload: DevRecordPaymentHistoryPayload,
) =>
  callBilling<DevRecordPaymentHistoryPayload, { ok?: boolean; paymentId?: string }>(
    'devRecordPaymentHistoryItem',
    payload,
  );

export interface MockSubscriptionScenarioPayload {
  businessId: string;
  nextStatus:
    | 'none'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'paused'
    | 'canceled'
    | 'unpaid'
    | 'deprecated'
    | 'scheduled';
  planCode?: string;
  provider?: string;
  scope?: 'account' | 'business';
  targetBusinessId?: string;
  effectiveAt?: number | string;
  note?: string;
  recordPayment?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentStatus?: string;
  paymentDescription?: string;
  paymentReference?: string;
}

export interface MockSubscriptionScenarioResponse {
  ok?: boolean;
  businessId?: string;
  billingAccountId?: string;
  subscriptionId?: string;
  scope?: string;
  targetBusinessId?: string | null;
  previousStatus?: string | null;
  nextStatus?: string;
  activeSubscription?: UnknownRecord;
  paymentId?: string | null;
}

export const requestMockSubscriptionScenario = (
  payload: MockSubscriptionScenarioPayload,
) =>
  callBilling<MockSubscriptionScenarioPayload, MockSubscriptionScenarioResponse>(
    'processMockSubscriptionScenario',
    payload,
  );


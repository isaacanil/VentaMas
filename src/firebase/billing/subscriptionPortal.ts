import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import { resolveBillingCallableErrorMessage } from './callableErrors';

type BillingSessionPayload = {
  businessId: string;
  sessionToken?: string;
  returnUrl?: string;
  planCode?: string;
  provider: 'cardnet';
};

type BillingSessionResponse = {
  ok?: boolean;
  url?: string;
  message?: string;
};

const createCheckoutSessionCallable = httpsCallable<
  BillingSessionPayload,
  BillingSessionResponse
>(functions, 'createSubscriptionCheckoutSession');

const createBillingPortalSessionCallable = httpsCallable<
  BillingSessionPayload,
  BillingSessionResponse
>(functions, 'createSubscriptionBillingPortalSession');

const ACTIVE_SUBSCRIPTION_PROVIDER = 'cardnet' as const;

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const buildReturnUrl = (returnPath?: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const path = toCleanString(returnPath) || window.location.pathname;
  return `${window.location.origin}${path}`;
};

const resolveBillingSessionUrl = async (
  callable: (
    payload: BillingSessionPayload,
  ) => Promise<{ data: BillingSessionResponse }>,
  businessId: string,
  returnPath?: string,
  planCode?: string | null,
): Promise<string> => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new Error('No se pudo resolver el negocio activo.');
  }
  const normalizedPlanCode = toCleanString(planCode);

  const { sessionToken } = getStoredSession();
  const payload: BillingSessionPayload = {
    businessId: normalizedBusinessId,
    ...(sessionToken ? { sessionToken } : {}),
    returnUrl: buildReturnUrl(returnPath),
    provider: ACTIVE_SUBSCRIPTION_PROVIDER,
    ...(normalizedPlanCode ? { planCode: normalizedPlanCode } : {}),
  };

  try {
    const response = await callable(payload);
    const data = response?.data || {};
    const url = toCleanString(data.url);
    if (!url) {
      throw new Error(
        toCleanString(data.message) || 'El backend no devolvió URL de pago.',
      );
    }
    return url;
  } catch (error: unknown) {
    throw new Error(
      resolveBillingCallableErrorMessage(
        error,
        'La integración de pagos aún no está desplegada en backend.',
      ),
    );
  }
};

export const requestSubscriptionCheckoutUrl = (
  businessId: string,
  returnPath?: string,
  planCode?: string | null,
): Promise<string> =>
  resolveBillingSessionUrl(
    createCheckoutSessionCallable,
    businessId,
    returnPath,
    planCode,
  );

export const requestBillingPortalUrl = (
  businessId: string,
  returnPath?: string,
): Promise<string> =>
  resolveBillingSessionUrl(
    createBillingPortalSessionCallable,
    businessId,
    returnPath,
    undefined,
  );

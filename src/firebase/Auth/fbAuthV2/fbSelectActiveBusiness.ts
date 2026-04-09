import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

type SelectActiveBusinessRequest = {
  businessId: string;
  sessionToken?: string | null;
};

type SelectActiveBusinessResponse = {
  ok?: boolean;
  businessId?: string;
  role?: string;
  hasMultipleBusinesses?: boolean;
  message?: string;
};

export type SelectActiveBusinessResult = {
  businessId: string;
  role: string | null;
  hasMultipleBusinesses: boolean | null;
};

const clientSelectActiveBusinessCallable = httpsCallable<
  SelectActiveBusinessRequest,
  SelectActiveBusinessResponse
>(functions, 'clientSelectActiveBusiness');

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'No se pudo cambiar el negocio activo.';
  }

  const typedError = error as { message?: unknown };
  if (
    typeof typedError.message === 'string' &&
    typedError.message.trim().length > 0
  ) {
    return typedError.message;
  }

  return 'No se pudo cambiar el negocio activo.';
};

export const fbSelectActiveBusiness = async (
  businessId: string,
): Promise<SelectActiveBusinessResult> => {
  const cleanBusinessId = toCleanString(businessId);
  if (!cleanBusinessId) {
    throw new Error('Business invalido');
  }

  const { sessionToken } = getStoredSession();

  try {
    const response = await clientSelectActiveBusinessCallable({
      businessId: cleanBusinessId,
      ...(sessionToken ? { sessionToken } : {}),
    });
    const payload = (response.data || {}) as SelectActiveBusinessResponse;

    if (payload.ok === false) {
      throw new Error(payload.message || 'No se pudo cambiar el negocio activo.');
    }

    return {
      businessId: toCleanString(payload.businessId) || cleanBusinessId,
      role: toCleanString(payload.role),
      hasMultipleBusinesses:
        typeof payload.hasMultipleBusinesses === 'boolean'
          ? payload.hasMultipleBusinesses
          : null,
    };
  } catch (error) {
    throw new Error(resolveErrorMessage(error));
  }
};

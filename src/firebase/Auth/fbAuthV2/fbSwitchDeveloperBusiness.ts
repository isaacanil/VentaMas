import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

type BaseRequest = {
  sessionToken?: string | null;
};

type StartBusinessImpersonationRequest = BaseRequest & {
  targetBusinessId: string;
  ttlMinutes?: number;
};

type StopBusinessImpersonationRequest = BaseRequest;
type GetBusinessImpersonationStatusRequest = BaseRequest;

export type DeveloperBusinessImpersonationStatus = {
  ok?: boolean;
  active?: boolean;
  restored?: boolean;
  expired?: boolean;
  currentBusinessId?: string | null;
  originalBusinessId?: string | null;
  overrideBusinessId?: string | null;
  expiresAtMs?: number | null;
  ttlMinutes?: number | null;
  remainingMs?: number | null;
};

const startBusinessImpersonationCallable = createFirebaseCallable<
  StartBusinessImpersonationRequest,
  DeveloperBusinessImpersonationStatus
>('clientStartBusinessImpersonation');

const stopBusinessImpersonationCallable = createFirebaseCallable<
  StopBusinessImpersonationRequest,
  DeveloperBusinessImpersonationStatus
>('clientStopBusinessImpersonation');

const getBusinessImpersonationStatusCallable = createFirebaseCallable<
  GetBusinessImpersonationStatusRequest,
  DeveloperBusinessImpersonationStatus
>('clientGetBusinessImpersonationStatus');

const withSessionToken = (): BaseRequest => {
  const { sessionToken } = getStoredSession();
  return sessionToken ? { sessionToken } : {};
};

const extractErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!error || typeof error !== 'object') return fallback;
  const typed = error as { message?: unknown };
  if (typeof typed.message === 'string' && typed.message.trim()) {
    return typed.message;
  }
  return fallback;
};

export const fbStartDeveloperBusinessImpersonation = async ({
  targetBusinessId,
  ttlMinutes,
}: {
  targetBusinessId: string;
  ttlMinutes?: number;
}): Promise<DeveloperBusinessImpersonationStatus> => {
  try {
    const data = await startBusinessImpersonationCallable({
      targetBusinessId,
      ...(typeof ttlMinutes === 'number' ? { ttlMinutes } : {}),
      ...withSessionToken(),
    });
    return data || {};
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'No se pudo iniciar la impersonación de negocio'),
    );
  }
};

export const fbStopDeveloperBusinessImpersonation = async (): Promise<DeveloperBusinessImpersonationStatus> => {
  try {
    const data = await stopBusinessImpersonationCallable(withSessionToken());
    return data || {};
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'No se pudo detener la impersonación de negocio'),
    );
  }
};

export const fbGetDeveloperBusinessImpersonationStatus = async (): Promise<DeveloperBusinessImpersonationStatus> => {
  try {
    const data =
      await getBusinessImpersonationStatusCallable(withSessionToken());
    return data || {};
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'No se pudo obtener el estado de impersonación'),
    );
  }
};

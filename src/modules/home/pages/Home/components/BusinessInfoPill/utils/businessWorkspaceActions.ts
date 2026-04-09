import { httpsCallable } from 'firebase/functions';

import { fbSelectActiveBusiness } from '@/firebase/Auth/fbAuthV2/fbSelectActiveBusiness';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

type RedeemBusinessInviteRequest = {
  code: string;
  sessionToken?: string;
};

export type RedeemBusinessInviteResponse = {
  ok?: boolean;
  reason?: string;
  businessId?: string;
  role?: string;
  businessName?: string | null;
};

const redeemBusinessInviteCallable = httpsCallable<
  RedeemBusinessInviteRequest,
  RedeemBusinessInviteResponse
>(functions, 'redeemBusinessInvite');

const resolveInviteErrorMessage = (error: unknown): string => {
  const typedError =
    error && typeof error === 'object'
      ? (error as { code?: string; message?: string })
      : null;
  const code = String(typedError?.code || '').toLowerCase();
  const message = String(typedError?.message || '').toLowerCase();

  if (code.includes('unauthenticated')) {
    return 'Tu sesion expiro. Inicia sesion nuevamente.';
  }
  if (
    code.includes('not-found') ||
    message.includes('codigo de invitacion invalido')
  ) {
    return 'El codigo no es valido. Revisa e intenta otra vez.';
  }
  if (code.includes('failed-precondition')) {
    if (message.includes('expirada')) return 'El codigo ya expiro.';
    if (message.includes('utilizada')) return 'El codigo ya fue utilizado.';
    return 'La invitacion ya no esta disponible.';
  }
  return 'No se pudo canjear el codigo. Intenta nuevamente.';
};

const resolveBusinessSelectionErrorMessage = (error: unknown): string => {
  const typedError =
    error && typeof error === 'object'
      ? (error as { code?: string; message?: string })
      : null;
  const code = String(typedError?.code || '').toLowerCase();
  const rawMessage = String(typedError?.message || '').toLowerCase();

  if (
    code.includes('unauthenticated') ||
    code.includes('auth/') ||
    rawMessage.includes('session')
  ) {
    return 'Tu sesion expiro. Vuelve a iniciar sesion e intenta otra vez.';
  }

  if (
    code.includes('permission-denied') ||
    code.includes('forbidden') ||
    rawMessage.includes('permission')
  ) {
    return 'No tienes permisos para acceder a este negocio.';
  }

  if (
    code.includes('unavailable') ||
    code.includes('network') ||
    rawMessage.includes('network') ||
    rawMessage.includes('fetch')
  ) {
    return 'No pudimos cambiar el negocio por un problema de conexion. Intenta de nuevo.';
  }

  if (code.includes('failed-precondition') || rawMessage.includes('inactivo')) {
    return 'Este negocio no esta disponible en este momento.';
  }

  return 'No se pudo cambiar el negocio activo. Intenta nuevamente.';
};

type RedeemInviteResult = {
  errorMessage?: string;
  payload?: RedeemBusinessInviteResponse;
};

type SelectBusinessResult = {
  error?: unknown;
  errorMessage?: string;
  selected?: Awaited<ReturnType<typeof fbSelectActiveBusiness>>;
};

export const redeemBusinessInviteCode = async (
  code: string,
): Promise<RedeemInviteResult> => {
  try {
    const { sessionToken } = getStoredSession();
    const response = await redeemBusinessInviteCallable({
      code,
      ...(sessionToken ? { sessionToken } : {}),
    });

    return {
      payload: (response.data || {}) as RedeemBusinessInviteResponse,
    };
  } catch (error) {
    return {
      errorMessage: resolveInviteErrorMessage(error),
    };
  }
};

export const selectWorkspaceBusiness = async (
  businessId: string,
): Promise<SelectBusinessResult> => {
  try {
    const selected = await fbSelectActiveBusiness(businessId);
    return { selected };
  } catch (error) {
    return {
      error,
      errorMessage: resolveBusinessSelectionErrorMessage(error),
    };
  }
};

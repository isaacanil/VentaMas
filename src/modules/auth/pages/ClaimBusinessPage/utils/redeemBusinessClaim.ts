import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

interface RedeemBusinessOwnershipClaimRequest {
  token: string;
  sessionToken?: string;
}

interface RedeemBusinessOwnershipClaimResponse {
  ok?: boolean;
  message?: string;
  businessId?: string;
  businessName?: string | null;
  membershipRole?: string | null;
  globalRole?: string | null;
  isPlatformDev?: boolean;
}

type RedeemBusinessClaimSuccess = {
  businessId: string | null;
  feedbackMessage: string;
  keepGlobalDevRole: boolean;
  membershipRole: string;
  notificationMessage: string;
  status: 'success';
};

type RedeemBusinessClaimError = {
  errorMessage: string;
  status: 'error';
};

export type RedeemBusinessClaimResult =
  | RedeemBusinessClaimSuccess
  | RedeemBusinessClaimError;

const redeemBusinessOwnershipClaimCallable = httpsCallable<
  RedeemBusinessOwnershipClaimRequest,
  RedeemBusinessOwnershipClaimResponse
>(functions, 'redeemBusinessOwnershipClaimToken');

export const redeemBusinessClaim = async ({
  isPlatformDeveloper,
  normalizedToken,
}: {
  isPlatformDeveloper: boolean;
  normalizedToken: string;
}): Promise<RedeemBusinessClaimResult> => {
  try {
    const { sessionToken } = getStoredSession();
    if (!sessionToken) {
      throw new Error('Tu sesion expiro. Inicia sesion nuevamente.');
    }

    const response = await redeemBusinessOwnershipClaimCallable({
      token: normalizedToken,
      sessionToken,
    });
    const payload = response.data || {};
    if (!payload.ok) {
      throw new Error(payload.message || 'No se pudo reclamar el negocio.');
    }

    const businessId = payload.businessId || null;
    const isPlatformDevResponse =
      payload.isPlatformDev === true || payload.globalRole === 'dev';
    const keepGlobalDevRole = isPlatformDeveloper || isPlatformDevResponse;
    const notificationMessage =
      payload.message || 'El negocio ya quedo a tu nombre.';

    return {
      businessId,
      feedbackMessage: `${payload.message || 'Reclamo completado. Ya tienes acceso de administrador.'} Redirigiendo al inicio...`,
      keepGlobalDevRole,
      membershipRole: payload.membershipRole || 'admin',
      notificationMessage,
      status: 'success',
    };
  } catch (error: unknown) {
    return {
      errorMessage:
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo reclamar el negocio.',
      status: 'error',
    };
  }
};

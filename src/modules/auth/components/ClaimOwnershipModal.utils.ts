import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import ROUTES_PATH from '@/router/routes/routesName';

type CreateOwnershipClaimTokenResponse = {
  ok?: boolean;
  code?: string;
  claimUrl?: string | null;
  expiresAt?: number;
};

type CreateOwnershipClaimTokenRequest = {
  businessId: string;
  sessionToken?: string;
  baseUrl?: string;
};

const createBusinessOwnershipClaimTokenCallable = httpsCallable<
  CreateOwnershipClaimTokenRequest,
  CreateOwnershipClaimTokenResponse
>(functions, 'createBusinessOwnershipClaimToken');

type GenerateClaimLinkSuccess = {
  claimCode: string | null;
  claimExpiresAt: number | null;
  claimUrl: string | null;
  copiedToClipboard: boolean;
  status: 'success';
};

type GenerateClaimLinkError = {
  errorMessage: string;
  status: 'error';
};

export type GenerateClaimLinkResult =
  | GenerateClaimLinkSuccess
  | GenerateClaimLinkError;

export const copyClaimLinkToClipboard = async (
  claimUrl: string,
): Promise<boolean> => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(claimUrl);
    }
    return true;
  } catch {
    return false;
  }
};

export const generateOwnershipClaimLink = async (
  activeBusinessId: string,
): Promise<GenerateClaimLinkResult> => {
  try {
    const { sessionToken } = getStoredSession();
    if (!sessionToken) {
      throw new Error('Sesion no valida. Vuelve a iniciar sesion.');
    }

    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : undefined;
    const response = await createBusinessOwnershipClaimTokenCallable({
      sessionToken,
      businessId: activeBusinessId,
      baseUrl,
    });

    const payload = response?.data || {};
    if (!payload.ok) {
      throw new Error('No se pudo generar el enlace de reclamo para este negocio.');
    }

    const claimUrl =
      payload.claimUrl ||
      (baseUrl && payload.code
        ? `${baseUrl}${ROUTES_PATH.AUTH_TERM.CLAIM_BUSINESS}?token=${encodeURIComponent(payload.code)}`
        : null);

    return {
      claimCode: payload.code || null,
      claimExpiresAt:
        typeof payload.expiresAt === 'number' ? payload.expiresAt : null,
      claimUrl,
      copiedToClipboard:
        claimUrl ? await copyClaimLinkToClipboard(claimUrl) : false,
      status: 'success',
    };
  } catch (error: unknown) {
    return {
      errorMessage:
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo generar el enlace de reclamo.',
      status: 'error',
    };
  }
};

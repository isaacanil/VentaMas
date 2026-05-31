import { createBusinessOwnershipClaimToken } from '../repositories/businessOwnershipClaims.repository';
import { buildOwnershipClaimUrl } from '../utils/businessOwnershipClaim';

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
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : undefined;
    const payload = await createBusinessOwnershipClaimToken({
      businessId: activeBusinessId,
      baseUrl,
    });

    if (!payload.ok) {
      throw new Error(
        'No se pudo generar el enlace de reclamo para este negocio.',
      );
    }

    const claimUrl = buildOwnershipClaimUrl({ baseUrl, payload });

    return {
      claimCode: payload.code || null,
      claimExpiresAt:
        typeof payload.expiresAt === 'number' ? payload.expiresAt : null,
      claimUrl,
      copiedToClipboard: claimUrl
        ? await copyClaimLinkToClipboard(claimUrl)
        : false,
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

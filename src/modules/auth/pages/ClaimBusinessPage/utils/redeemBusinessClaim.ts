import { redeemBusinessOwnershipClaimToken } from '@/modules/auth/repositories/businessOwnershipClaims.repository';
import {
  buildRedeemBusinessClaimSuccess,
  type RedeemBusinessClaimSuccess,
} from '@/modules/auth/utils/businessOwnershipClaim';

type RedeemBusinessClaimError = {
  errorMessage: string;
  status: 'error';
};

export type RedeemBusinessClaimResult =
  | RedeemBusinessClaimSuccess
  | RedeemBusinessClaimError;

export const redeemBusinessClaim = async ({
  isPlatformDeveloper,
  normalizedToken,
}: {
  isPlatformDeveloper: boolean;
  normalizedToken: string;
}): Promise<RedeemBusinessClaimResult> => {
  try {
    const payload = await redeemBusinessOwnershipClaimToken(normalizedToken);
    if (!payload.ok) {
      throw new Error(payload.message || 'No se pudo reclamar el negocio.');
    }

    return buildRedeemBusinessClaimSuccess({ isPlatformDeveloper, payload });
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

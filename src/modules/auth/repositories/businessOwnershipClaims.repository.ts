import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

export type CreateOwnershipClaimTokenResponse = {
  ok?: boolean;
  code?: string;
  claimUrl?: string | null;
  expiresAt?: number;
};

export type RedeemBusinessOwnershipClaimResponse = {
  ok?: boolean;
  message?: string;
  businessId?: string;
  businessName?: string | null;
  membershipRole?: string | null;
  globalRole?: string | null;
  isPlatformDev?: boolean;
};

type CreateOwnershipClaimTokenRequest = {
  businessId: string;
  sessionToken?: string;
  baseUrl?: string;
};

type RedeemBusinessOwnershipClaimRequest = {
  token: string;
  sessionToken?: string;
};

const createBusinessOwnershipClaimTokenCallable = createFirebaseCallable<
  CreateOwnershipClaimTokenRequest,
  CreateOwnershipClaimTokenResponse
>('createBusinessOwnershipClaimToken');

const redeemBusinessOwnershipClaimCallable = createFirebaseCallable<
  RedeemBusinessOwnershipClaimRequest,
  RedeemBusinessOwnershipClaimResponse
>('redeemBusinessOwnershipClaimToken');

export const createBusinessOwnershipClaimToken = async ({
  baseUrl,
  businessId,
}: {
  baseUrl?: string;
  businessId: string;
}): Promise<CreateOwnershipClaimTokenResponse> => {
  const sessionToken = getRequiredSessionToken(
    'Sesion no valida. Vuelve a iniciar sesion.',
  );
  const response = await createBusinessOwnershipClaimTokenCallable({
    sessionToken,
    businessId,
    baseUrl,
  });

  return response || {};
};

export const redeemBusinessOwnershipClaimToken = async (
  token: string,
): Promise<RedeemBusinessOwnershipClaimResponse> => {
  const sessionToken = getRequiredSessionToken(
    'Tu sesion expiro. Inicia sesion nuevamente.',
  );
  const response = await redeemBusinessOwnershipClaimCallable({
    token,
    sessionToken,
  });

  return response || {};
};

const getRequiredSessionToken = (message: string) => {
  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error(message);
  }
  return sessionToken;
};

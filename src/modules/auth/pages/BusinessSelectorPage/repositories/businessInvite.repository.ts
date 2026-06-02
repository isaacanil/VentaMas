import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

import type { BusinessInviteRedemptionResponse } from '../utils/businessInvite';

type RedeemBusinessInviteRequest = {
  code: string;
  sessionToken?: string;
};

const redeemBusinessInviteCallable = createFirebaseCallable<
  RedeemBusinessInviteRequest,
  BusinessInviteRedemptionResponse
>('redeemBusinessInvite');

export const redeemBusinessInvite = async (
  code: string,
): Promise<BusinessInviteRedemptionResponse> => {
  const { sessionToken } = getStoredSession();
  const response = await redeemBusinessInviteCallable({
    code,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response || {};
};

import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

import type { BusinessInviteRedemptionResponse } from '../utils/businessInvite';

type RedeemBusinessInviteRequest = {
  code: string;
  sessionToken?: string;
};

const redeemBusinessInviteCallable = httpsCallable<
  RedeemBusinessInviteRequest,
  BusinessInviteRedemptionResponse
>(functions, 'redeemBusinessInvite');

export const redeemBusinessInvite = async (
  code: string,
): Promise<BusinessInviteRedemptionResponse> => {
  const { sessionToken } = getStoredSession();
  const response = await redeemBusinessInviteCallable({
    code,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data || {};
};

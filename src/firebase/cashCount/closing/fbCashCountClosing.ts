import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

export const fbCashCountChangeState = async (
  cashCount: CashCountRecord,
  user: UserIdentity | null | undefined,
  state: CashCountState,
): Promise<'success' | Error | null> => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId || !cashCount?.id) {
    return null;
  }

  try {
    const { sessionToken } = getStoredSession();
    const changeCashCountStateCallable = httpsCallable<
      {
        businessId: string;
        cashCountId: string;
        state: CashCountState;
        sessionToken?: string;
      },
      { ok: boolean }
    >(functions, 'changeCashCountState');

    await changeCashCountStateCallable({
      businessId,
      cashCountId: String(cashCount.id),
      state,
      ...(sessionToken ? { sessionToken } : {}),
    });
    return 'success';
  } catch (error) {
    console.error('Error changing cash count state: ', error);
    return error as Error;
  }
};

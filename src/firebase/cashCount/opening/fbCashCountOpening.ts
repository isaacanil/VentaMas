import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord } from '@/utils/cashCount/types';
import type { TimestampLike } from '@/utils/date/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

export const fbCashCountOpening = async (
  user: UserIdentity | null | undefined,
  cashCount: CashCountRecord,
  employeeID: string,
  approvalEmployeeID: string,
  openingDate: TimestampLike,
): Promise<'success' | Error | null> => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId) {
    return null;
  }

  try {
    const { sessionToken } = getStoredSession();
    const openCashCountCallable = httpsCallable<
      {
        businessId: string;
        cashCount: CashCountRecord;
        employeeID: string;
        approvalEmployeeID: string;
        openingDate: TimestampLike;
        sessionToken?: string;
      },
      { ok: boolean }
    >(functions, 'openCashCount');

    await openCashCountCallable({
      businessId,
      cashCount,
      employeeID,
      approvalEmployeeID,
      openingDate,
      ...(sessionToken ? { sessionToken } : {}),
    });
    return 'success';
  } catch (error) {
    console.error('Error writing cash count opening document: ', error);
    return error as Error;
  }
};

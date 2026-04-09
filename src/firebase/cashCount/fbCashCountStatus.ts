import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

interface CashCountStatusResult {
  exists: boolean;
  state: CashCountState | null;
}

export const fbGetCashCountState = async (
  user: UserIdentity | null | undefined,
  cashCountID?: string | null,
): Promise<CashCountStatusResult> => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId || !cashCountID) {
    return { exists: false, state: null };
  }
  const cashCountRef = doc(
    db,
    'businesses',
    businessId,
    'cashCounts',
    cashCountID,
  );
  const cashCountDoc = await getDoc(cashCountRef);
  if (!cashCountDoc.exists()) {
    return { exists: false, state: null };
  }
  const cashCountData = cashCountDoc.data() as { cashCount?: CashCountRecord };
  const state = cashCountData?.cashCount?.state ?? null;

  return {
    exists: true,
    state,
  };
};

export const fbCashCountStatus = async (
  user: UserIdentity | null | undefined,
  cashCountID?: string | null,
  state?: CashCountState | null,
): Promise<boolean> => {
  if (!state) {
    return false;
  }

  const { exists, state: currentState } = await fbGetCashCountState(
    user,
    cashCountID,
  );
  return Boolean(exists && currentState === state);
};

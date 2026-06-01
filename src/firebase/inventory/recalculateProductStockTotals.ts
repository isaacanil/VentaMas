import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { UserIdentity } from '@/types/users';

interface RecalculatePayload {
  user: {
    uid: string;
    businessID: string;
  };
}

const recalculateProductStockTotalsCallable = createFirebaseCallable<
  RecalculatePayload,
  unknown
>('recalculateProductStockTotals');

export const fbRecalculateProductStockTotals = async (
  user: UserIdentity | null | undefined,
): Promise<unknown> => {
  if (!user?.businessID) {
    throw new Error('No se encontro el negocio del usuario.');
  }

  const payload: RecalculatePayload = {
    user: {
      uid: user.uid || user.id || '',
      businessID: user.businessID,
    },
  };

  return recalculateProductStockTotalsCallable(payload);
};

export default fbRecalculateProductStockTotals;

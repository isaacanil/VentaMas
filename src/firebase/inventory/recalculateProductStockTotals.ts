import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

const callable = httpsCallable(functions, 'recalculateProductStockTotals');

interface RecalculatePayload {
  user: {
    uid: string;
    businessID: string;
  };
}

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

  const { data } = (await callable(payload)) as HttpsCallableResult<unknown>;
  return data;
};

export default fbRecalculateProductStockTotals;

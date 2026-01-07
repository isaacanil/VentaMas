// @ts-nocheck
import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

const callable = httpsCallable(functions, 'recalculateProductStockTotals');

export const fbRecalculateProductStockTotals = async (user) => {
  if (!user?.businessID) {
    throw new Error('No se encontró el negocio del usuario.');
  }

  const payload = {
    user: {
      uid: user.uid || user.id,
      businessID: user.businessID,
    },
  };

  const { data } = await callable(payload);
  return data;
};

export default fbRecalculateProductStockTotals;

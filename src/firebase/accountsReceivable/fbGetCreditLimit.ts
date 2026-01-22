import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

export function fbGetCreditLimit({
  user,
  clientId,
}: {
  user: UserIdentity | null | undefined;
  clientId: string | null | undefined;
}): Promise<CreditLimitConfig | null> {
  return new Promise((resolve, reject) => {
    if (!user?.businessID || !clientId) {
      reject(new Error('BusinessID o ClientID no proporcionados'));
      return;
    }

    const creditLimitRef = doc(
      db,
      'businesses',
      user.businessID,
      'creditLimit',
      clientId,
    );

    const unsubscribe = onSnapshot(
      creditLimitRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          resolve(docSnapshot.data() as CreditLimitConfig);
        } else {
          resolve(null);
        }
      },
      (error) => {
        reject(error);
      },
    );

    // Retorna la función para cancelar la suscripción
    return unsubscribe;
  });
}

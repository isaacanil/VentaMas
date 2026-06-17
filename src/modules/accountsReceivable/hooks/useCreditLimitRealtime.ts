import { doc, onSnapshot } from 'firebase/firestore';
import type { FirestoreError } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

type BusinessUser =
  | {
      businessID?: string | null;
    }
  | null
  | undefined;

/**
 * Hook personalizado para obtener el límite de crédito en tiempo real usando onSnapshot
 * @param {Object} user - Usuario actual
 * @param {string} clientId - ID del cliente
 * @returns {Object} { creditLimit, isLoading, error }
 */
export const useCreditLimitRealtime = (
  user: BusinessUser,
  clientId: string,
) => {
  const [creditLimit, setCreditLimit] = useState<CreditLimitConfig | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(user?.businessID && clientId),
  );
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    // Si no hay user o clientId, no hacer nada (lazy init ya puso loading=false)
    if (!user?.businessID || !clientId) {
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
        setIsLoading(false);
        if (docSnapshot.exists()) {
          setCreditLimit(docSnapshot.data() as CreditLimitConfig);
        } else {
          setCreditLimit(null);
        }
        setError(null);
      },
      (snapshotError) => {
        setIsLoading(false);
        setError(snapshotError);
        setCreditLimit(null);
        console.error('Error listening to credit limit:', snapshotError);
      },
    );

    // Función de limpieza
    return () => {
      unsubscribe();
    };
  }, [user?.businessID, clientId]);

  return { creditLimit, isLoading, error };
};

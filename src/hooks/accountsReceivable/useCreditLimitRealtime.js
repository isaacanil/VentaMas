import { doc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '@/firebase/firebaseconfig';

/**
 * Hook personalizado para obtener el límite de crédito en tiempo real usando onSnapshot
 * @param {Object} user - Usuario actual
 * @param {string} clientId - ID del cliente
 * @returns {Object} { creditLimit, isLoading, error }
 */
export const useCreditLimitRealtime = (user, clientId) => {
  const [creditLimit, setCreditLimit] = useState(null);
  const [isLoading, setIsLoading] = useState(
    () => Boolean(user?.businessID && clientId),
  );
  const [error, setError] = useState(null);

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
          setCreditLimit(docSnapshot.data());
        } else {
          setCreditLimit(null);
        }
        setError(null);
      },
      (error) => {
        setIsLoading(false);
        setError(error);
        setCreditLimit(null);
        console.error('Error listening to credit limit:', error);
      },
    );

    // Función de limpieza
    return () => {
      unsubscribe();
    };
  }, [user?.businessID, clientId]);

  return { creditLimit, isLoading, error };
};

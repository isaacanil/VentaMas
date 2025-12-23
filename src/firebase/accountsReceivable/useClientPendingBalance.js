import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';

/**
 * Escucha en tiempo real el saldo pendiente que mantiene la
 * Cloud Function (write-time aggregation).
 *
 * @param {object} params
 * @param {object} params.user      Debe incluir businessID
 * @param {string} params.clientId  ID del cliente
 * @returns {number|null}           null mientras carga, luego el saldo
 */
export function useClientPendingBalance({ user, clientId }) {
  const [balance, setBalance] = useState(null); // null = loading

  if ((!user?.businessID || !clientId) && balance !== 0) {
    setBalance(0);
  }

  useEffect(() => {
    // Validación rápida
    if (!user?.businessID || !clientId) {
      return undefined;
    }

    // Referencia al doc businesses/{bid}/clients/{clientId}
    const ref = doc(db, 'businesses', user.businessID, 'clients', clientId);

    // Suscripción en tiempo real
    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.data();
      const pending = data?.client?.pendingBalance ?? data?.pendingBalance ?? 0;
      setBalance(pending);
    });

    // Limpieza al desmontar
    return unsubscribe;
  }, [user?.businessID, clientId]);

  return { balance }; // null | número
}

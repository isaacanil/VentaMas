import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

/**
 * Escucha en tiempo real el saldo pendiente que mantiene la
 * Cloud Function (write-time aggregation).
 *
 * @param {object} params
 * @param {object} params.user      Debe incluir businessID
 * @param {string} params.clientId  ID del cliente
 * @returns {number|null}           null mientras carga, luego el saldo
 */
export function useClientPendingBalance({
  user,
  clientId,
}: {
  user: UserIdentity | null | undefined;
  clientId: string | null | undefined;
}) {
  const [balance, setBalance] = useState<number | null>(null); // null = loading

  useEffect(() => {
    if (!user?.businessID || !clientId) {
      setBalance(0);
    }
  }, [user?.businessID, clientId]);

  useEffect(() => {
    // Validación rápida
    if (!user?.businessID || !clientId) {
      return undefined;
    }

    // Referencia al doc businesses/{bid}/clients/{clientId}
    const ref = doc(db, 'businesses', user.businessID, 'clients', clientId);

    // Suscripción en tiempo real
    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.data() as Record<string, unknown> | undefined;
      const client = data?.client as Record<string, unknown> | undefined;
      const pending =
        (client?.pendingBalance as number | undefined) ??
        (data?.pendingBalance as number | undefined) ??
        0;
      setBalance(Number(pending));
    });

    // Limpieza al desmontar
    return unsubscribe;
  }, [user?.businessID, clientId]);

  return { balance }; // null | número
}

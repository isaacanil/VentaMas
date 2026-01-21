import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

/**
 * Escucha en tiempo real las cuentas por cobrar de un cliente con filtros opcionales.
 *
 * @param {Object} params
 * @param {Object} params.user             - Usuario actual (debe contener businessID)
 * @param {string} params.clientId         - ID del cliente
 * @param {boolean|null} params.isActive   - true: abiertas, false: cerradas, null: todas
 * @param {string} params.orderField       - Campo en Firestore para ordenar
 * @param {'asc'|'desc'} params.orderDirection - Dirección del ordenamiento
 */
interface UseClientAccountsReceivableParams {
  user?: UserIdentity | null;
  clientId?: string | null;
  isActive?: boolean | null;
  orderField?: string;
  orderDirection?: 'asc' | 'desc';
}

export const useClientAccountsReceivable = ({
  user,
  clientId,
  isActive = null,
  orderField = 'numberId',
  orderDirection = 'desc',
}: UseClientAccountsReceivableParams) => {
  const [accounts, setAccounts] = useState<AccountsReceivableDoc[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isReady = Boolean(user?.businessID && clientId);

  const subscriptionKey = useMemo(() => {
    return JSON.stringify({
      businessID: user?.businessID,
      clientId,
      isActive,
      orderField,
      orderDirection,
    });
  }, [user?.businessID, clientId, isActive, orderField, orderDirection]);

  const loading = isReady && loadedKey !== subscriptionKey;

  useEffect(() => {
    // validación mínima
    if (!isReady) return;

    const colRef = collection(
      db,
      'businesses',
      user?.businessID || '',
      'accountsReceivable',
    );

    const clauses: QueryConstraint[] = [where('clientId', '==', clientId)];

    if (isActive !== null) {
      clauses.push(where('isActive', '==', isActive));
    }

    // orderBy debe ir después de where según la API de Firestore v9
    clauses.push(orderBy(orderField, orderDirection));

    const q = query(colRef, ...clauses);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as AccountsReceivableDoc),
        }));
        setAccounts(docs);
        setLoadedKey(subscriptionKey);
      },
      (err) => {
        console.error('useClientAccountsReceivable error:', err);
        setAccounts([]);
        setLoadedKey(subscriptionKey);
      },
    );

    return unsubscribe;
  }, [clientId, isActive, isReady, orderDirection, orderField, subscriptionKey, user?.businessID]);

  return {
    accounts: isReady ? accounts : [],
    loading,
  };
};

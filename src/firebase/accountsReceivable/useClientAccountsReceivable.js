import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseconfig';

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
export const useClientAccountsReceivable = ({
  user,
  clientId,
  isActive = null,
  orderField = 'numberId',
  orderDirection = 'desc',
}) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // validación mínima
    if (!user?.businessID || !clientId) return;

    const colRef = collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivable'
    );

    const clauses = [where('clientId', '==', clientId)];

    if (isActive !== null) {
      clauses.push(where('isActive', '==', isActive));
    }

    // orderBy debe ir después de where según la API de Firestore v9
    clauses.push(orderBy(orderField, orderDirection));

    const q = query(colRef, ...clauses);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAccounts(docs);
        setLoading(false);
      },
      (err) => {
        console.error('useClientAccountsReceivable error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.businessID, clientId, isActive, orderField, orderDirection]);

  return { accounts, loading };
}; 
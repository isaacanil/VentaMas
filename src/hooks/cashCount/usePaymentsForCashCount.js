import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../../firebase/firebaseconfig';

/**
 * Hook to listen for AR payments made by a specific user within a date range.
 * Used for Cash Reconciliation to find "surplus" money coming from debt collections.
 *
 * @param {Object} user - The current user (must have businessID).
 * @param {string|null} targetUserId - The UID of the cashier to filter by.
 * @param {number|null} startDate - Start timestamp (ms).
 * @param {number|null} endDate - End timestamp (ms).
 * @returns {Object} { payments: Array, loading: boolean, error: string|null }
 */
export const usePaymentsForCashCount = (
  user,
  targetUserId,
  startDate,
  endDate,
) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.businessID || !targetUserId || !startDate) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentsRef = collection(
        db,
        'businesses',
        user.businessID,
        'accountsReceivablePayments',
      );

      // Note: Firestore range queries on different fields usually require an index.
      // However, here we might filter in memory if the volume is low,
      // or rely on a composite index (createdUserId + createdAt).
      // For now, we query by user and filter dates client-side if index is missing,
      // or use 'where' for dates if possible.
      // Ideally: where('createdUserId', '==', targetUserId).where('createdAt', '>=', start).where('createdAt', '<=', end)

      // Converting ms to Firestore Timestamp (if stored as Timestamp) or keeping as map?
      // Based on 'addAccountReceivable', createdAt is stored as Timestamp.
      // We need to pass Firestore Timestamp objects for comparison.

      const startTimestamp = new Date(startDate);
      const endTimestamp = endDate ? new Date(endDate) : new Date(); // Default to now if open

      const q = query(
        paymentsRef,
        where('createdUserId', '==', targetUserId),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedPayments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPayments(loadedPayments);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching AR payments for cash count:', err);
          setError(err.message);
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up AR payments listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [user, targetUserId, startDate, endDate]);

  return { payments, loading, error };
};

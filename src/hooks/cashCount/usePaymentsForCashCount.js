import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import { toValidDate } from '@/utils/date/toValidDate';


/**
 * Hook to listen for AR payments made by a specific user within a date range.
 * Used for Cash Reconciliation to find "surplus" money coming from debt collections.
 *
 * @param {Object} user - The current user (must have businessID).
 * @param {string|null} targetUserId - The UID of the cashier to filter by.
 * @param {number|string|Date|Object|null} startDate - Start date (ms, ISO string, Date, Firestore Timestamp, Luxon DateTime).
 * @param {number|string|Date|Object|null} endDate - End date (ms, ISO string, Date, Firestore Timestamp, Luxon DateTime).
 * @returns {Object} { data: Array, payments: Array, loading: boolean, error: string|null }
 */
export const usePaymentsForCashCount = (
  user,
  targetUserId,
  startDate,
  endDate,
) => {
  const businessId = user?.businessID ?? null;

  const startAsDate = useMemo(() => toValidDate(startDate), [startDate]);
  const endAsDate = useMemo(() => toValidDate(endDate), [endDate]);

  const startMs = startAsDate?.getTime?.() ?? null;
  const endMs = endAsDate?.getTime?.() ?? null;

  const queryKey = useMemo(() => {
    if (!businessId || !targetUserId || startMs === null) return null;
    return `${businessId}:${targetUserId}:${startMs}:${endMs ?? 'open'}`;
  }, [businessId, targetUserId, startMs, endMs]);

  const [snapshotState, setSnapshotState] = useState(() => ({
    key: null,
    payments: [],
    error: null,
  }));

  useEffect(() => {
    if (!queryKey) return;

    const paymentsRef = collection(
      db,
      'businesses',
      businessId,
      'accountsReceivablePayments',
    );

    // Note: Firestore range queries on different fields usually require an index.
    // Ideally: where('createdUserId', '==', targetUserId).where('createdAt', '>=', start).where('createdAt', '<=', end)

    const startTimestamp = new Date(startMs);
    const endTimestamp = endMs === null ? new Date() : new Date(endMs); // Default to "now" if open
    const normalizedEnd =
      endTimestamp < startTimestamp ? new Date() : endTimestamp;

    const q = query(
      paymentsRef,
      where('createdUserId', '==', targetUserId),
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<=', normalizedEnd),
    );

    let active = true;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!active) return;
        const loadedPayments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSnapshotState({ key: queryKey, payments: loadedPayments, error: null });
      },
      (err) => {
        if (!active) return;
        console.error('Error fetching AR payments for cash count:', err);
        setSnapshotState({
          key: queryKey,
          payments: [],
          error: err?.message || String(err),
        });
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [businessId, targetUserId, startMs, endMs, queryKey]);

  const invalidStartDate =
    startDate !== null && startDate !== undefined && startAsDate === null;

  const isReady = Boolean(businessId && targetUserId && startMs !== null);
  const hasCurrentSnapshot =
    queryKey !== null && snapshotState.key === queryKey;

  const payments = isReady && hasCurrentSnapshot ? snapshotState.payments : [];
  const loading = isReady && !hasCurrentSnapshot;
  const error = invalidStartDate
    ? 'Invalid start date'
    : isReady && hasCurrentSnapshot
      ? snapshotState.error
      : null;

  return { data: payments, payments, loading, error };
};

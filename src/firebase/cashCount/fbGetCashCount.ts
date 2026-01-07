import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord } from '@/utils/cashCount/types';

interface CashCountDocSnapshot extends DocumentData {
  cashCount?: CashCountRecord;
}

/**
 * Subscribe to Firestore document changes with automatic error handling.
 *
 * @param {string} businessId - The business ID associated with the document.
 * @param {string} docId - The document ID to subscribe to.
 * @param {Function} onChange - Callback function to handle data changes.
 * @param {Function} onError - Callback function to handle errors.
 * @returns {Function} - Unsubscribe function to call on component unmount.
 */
const subscribeToCashCount = (
  businessId: string,
  docId: string,
  onChange: (data: CashCountDocSnapshot | null) => void,
  onError: (error: Error) => void,
) => {
  const cashCountRef = doc(db, 'businesses', businessId, 'cashCounts', docId);
  return onSnapshot(
    cashCountRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onChange(snapshot.data() as CashCountDocSnapshot);
      } else {
        onChange(null);
      }
    },
    onError,
  );
};

/**
 * Custom React hook to fetch and subscribe to the cash count from Firestore.
 *
 * @param {string} id - The document ID to fetch.
 * @returns {Object|null} - The cash count data or null if not available.
 */
export const useFbGetCashCount = (id?: string | null) => {
  const [cashCount, setCashCount] = useState<CashCountDocSnapshot | null>(null);
  const user = useSelector(selectUser) as UserIdentity | null;
  const shouldSubscribe = Boolean(id && user?.businessID);

  useEffect(() => {
    if (!shouldSubscribe) return undefined;

    const onError = (error: Error) => {
      console.error('Error fetching cash count:', error);
      setCashCount(null);
    };

    const unsubscribe = subscribeToCashCount(
      user.businessID,
      id,
      setCashCount,
      onError,
    );

    return unsubscribe;
  }, [id, user?.businessID, shouldSubscribe]);

  return shouldSubscribe ? cashCount : null;
};

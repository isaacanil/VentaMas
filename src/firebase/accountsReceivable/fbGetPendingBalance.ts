import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';

import { db } from '@/firebase/firebaseconfig';

type BalanceCallback = (balance: number) => void;

export function fbGetPendingBalance(
  businessID: string | null | undefined,
  clientId: string | null | undefined,
  callback?: BalanceCallback | null,
) {
  const safeCb =
    typeof callback === 'function'
      ? callback
      : () => {
          /* noop */
        };

  if (!businessID || !clientId) {
    safeCb(0);
    return () => {
      /* noop */
    };
  }

  const accountsReceivableRef = collection(
    db,
    `businesses/${businessID}/accountsReceivable`,
  );
  const q = query(accountsReceivableRef, where('clientId', '==', clientId));

  try {
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        safeCb(0);
        return;
      }
      //
      let totalPendingBalance = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Record<string, unknown>;
        totalPendingBalance += Number(data.arBalance) || 0;
      });

      safeCb(totalPendingBalance);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error getting documents: ', error);
    safeCb(0);
    return () => {
      /* noop */
    };
  }
}

function usePendingBalance(
  businessID: string | null | undefined,
  clientId: string | null | undefined,
  onBalanceChange: BalanceCallback | null = null,
) {
  const [pendingBalance, setPendingBalance] = useState(0);

  const handleBalanceChange = useCallback(
    (balance: number) => {
      setPendingBalance(balance);
      onBalanceChange?.(balance);
    },
    [onBalanceChange],
  );

  useEffect(() => {
    if (!businessID || !clientId) {
      onBalanceChange?.(0);
      return undefined;
    }

    const unsubscribe = fbGetPendingBalance(
      businessID,
      clientId,
      handleBalanceChange,
    );
    return () => unsubscribe();
  }, [businessID, clientId, handleBalanceChange, onBalanceChange]);

  return businessID && clientId ? pendingBalance : 0;
}

export function useGetPendingBalance({
  dependencies = [null, null],
  enabled = true,
  onBalanceChange = null,
}: {
  dependencies?: [string | null | undefined, string | null | undefined];
  enabled?: boolean;
  onBalanceChange?: BalanceCallback | null;
}) {
  const [pendingBalance, setPendingBalance] = useState(0);
  const [businessID, clientId] = dependencies;
  const isActive = Boolean(enabled && businessID && clientId);

  const updateBalance = useCallback(
    (balance: number) => {
      setPendingBalance(balance);
      if (onBalanceChange) {
        onBalanceChange(balance);
      }
    },
    [onBalanceChange],
  );

  useEffect(() => {
    if (!isActive) return undefined;

    const unsubscribe = fbGetPendingBalance(
      businessID,
      clientId,
      updateBalance,
    );
    return () => unsubscribe();
  }, [isActive, businessID, clientId, updateBalance]);

  return isActive ? pendingBalance : 0;
}

export { usePendingBalance };

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';

import { db } from '@/firebase/firebaseconfig';

type BalanceCallback = (balance: number) => void;

export function fbGetPendingBalance(
  businessID: string | null | undefined,
  clientId: string | null | undefined,
  callback?: BalanceCallback | null,
) {
  const safeCb = typeof callback === 'function' ? callback : () => { /* noop */ };

  if (!businessID || !clientId) {
    safeCb(0);
    return () => { /* noop */ };
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
    return () => { /* noop */ };
  }
}

function usePendingBalance(
  businessID: string | null | undefined,
  clientId: string | null | undefined,
  onBalanceChange: BalanceCallback | null = null,
) {
  const [pendingBalance, setPendingBalance] = useState(0);

  useEffect(() => {
    if (!businessID || !clientId) {
      if (pendingBalance !== 0) {
        setPendingBalance(0);
        onBalanceChange?.(0);
      }
    }
  }, [businessID, clientId, onBalanceChange, pendingBalance]);

  useEffect(() => {
    if (!businessID || !clientId) {
      return undefined;
    }

    const unsubscribe = fbGetPendingBalance(
      businessID,
      clientId,
      onBalanceChange,
    );
    return () => unsubscribe();
  }, [businessID, clientId, onBalanceChange]);

  return pendingBalance;
}

export function useGetPendingBalance({
  dependencies = [],
  onBalanceChange = null,
}: {
  dependencies?: [string | null | undefined, string | null | undefined];
  onBalanceChange?: BalanceCallback | null;
}) {
  const [pendingBalance, setPendingBalance] = useState(0);

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
    const unsubscribe = fbGetPendingBalance(...dependencies, updateBalance);
    return () => unsubscribe();
  }, [dependencies, updateBalance]);

  return pendingBalance;
}

export { usePendingBalance };

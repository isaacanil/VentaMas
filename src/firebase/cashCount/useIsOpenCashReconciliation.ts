import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { fbGetDocs } from '@/firebase/firebaseOperations';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';

type CashRegisterStatus = CashCountState | 'loading';

export function useIsOpenCashReconciliation() {
  const [value, setValue] = useState<CashRegisterStatus>('loading');
  const [cashReconciliation, setCashReconciliation] =
    useState<CashCountRecord | null>(null);
  const user = useSelector(selectUser) as UserIdentity | null;

  useEffect(() => {
    if (!user || !user?.businessID) {
      return;
    }
    const cashReconciliationRef = collection(
      db,
      'businesses',
      user?.businessID,
      'cashCounts',
    );
    const q = query(
      cashReconciliationRef,
      where('cashCount.state', 'in', ['open', 'closing']),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const isOpen = querySnapshot.docs.some(
          (docSnap) => docSnap.data().cashCount.state === 'open',
        );
        const isEmpty = querySnapshot.empty;
        const isClosing = querySnapshot.docs.some(
          (docSnap) => docSnap.data().cashCount.state === 'closing',
        );
        const isSameUser = querySnapshot.docs.some(
          (docSnap) => docSnap.data().cashCount.opening.employee.id === user.uid,
        );
        const isOpenForUser = querySnapshot.docs.some((docSnap) => {
          const { cashCount } = docSnap.data();
          return (
            cashCount.state === 'open' &&
            cashCount.opening.employee.id === user.uid
          );
        });
        const isClosingForUser = querySnapshot.docs.some((docSnap) => {
          const { cashCount } = docSnap.data();
          return (
            cashCount.state === 'closing' &&
            cashCount.opening.employee.id === user.uid
          );
        });

        const first = querySnapshot.docs[0];
        setCashReconciliation(first ? (first.data().cashCount as CashCountRecord) : null);

        if (isEmpty) {
          setValue('none');
          return;
        }
        if (isOpenForUser) {
          setValue('open');
        } else if (isClosingForUser || isClosing) {
          setValue('closing');
        } else if (isOpen || isSameUser) {
          setValue('closed');
        } else {
          setValue('closed');
        }
      },
      (error) => {
        console.error('Error en la suscripción a Firestore: ', error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const status = user?.businessID ? value : 'loading';
  const cashCount = user?.businessID ? cashReconciliation : null;

  return { status, cashCount };
}

export async function checkOpenCashReconciliation(user: UserIdentity | null | undefined) {
  try {
    if (!user || !user.businessID || !user.uid) {
      throw new Error('Datos del usuario incompletos');
    }
    const employeeRef = doc(db, 'users', user.uid);

    const cashReconciliationRef = collection(
      db,
      'businesses',
      user.businessID,
      'cashCounts',
    );

    const q = query(
      cashReconciliationRef,
      where('cashCount.state', 'in', ['open', 'closing']),
      where('cashCount.opening.employee', '==', employeeRef),
    );

    const querySnapshot = await fbGetDocs(q);

    if (querySnapshot.empty) {
      return { state: 'none' as CashCountState, cashCount: null };
    }
    const cashCountOpen = (docSnap: { data: () => { cashCount: CashCountRecord } }) =>
      docSnap.data().cashCount.state === 'open';
    const cashCountClosing = (docSnap: { data: () => { cashCount: CashCountRecord } }) =>
      docSnap.data().cashCount.state === 'closing';

    const cashCountDoc = querySnapshot.docs.find(
      (docSnap) => cashCountOpen(docSnap) || cashCountClosing(docSnap),
    );

    if (!cashCountDoc) {
      return { state: 'closed' as CashCountState, cashCount: null };
    }

    if (cashCountOpen(cashCountDoc)) {
      return {
        state: 'open' as CashCountState,
        cashCount: cashCountDoc.data().cashCount as CashCountRecord,
      };
    }
    if (cashCountClosing(cashCountDoc)) {
      return {
        state: 'closing' as CashCountState,
        cashCount: cashCountDoc.data().cashCount as CashCountRecord,
      };
    }

    return { state: 'closed' as CashCountState, cashCount: null };
  } catch (error) {
    console.error('Error al consultar Firestore: ', error);
    throw error;
  }
}

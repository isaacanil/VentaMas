import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { fbGetDocs } from '@/firebase/firebaseOperations';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';
import { resolveCashCountEmployeeId } from '@/utils/cashCount/resolveEmployeeId';
import {
  resolveUserIdentityBusinessId,
  resolveUserIdentityUid,
} from '@/utils/users/userIdentityAccess';

type CashRegisterStatus = CashCountState | 'loading';

export function useIsOpenCashReconciliation() {
  const [value, setValue] = useState<CashRegisterStatus>('loading');
  const [cashReconciliation, setCashReconciliation] =
    useState<CashCountRecord | null>(null);
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = resolveUserIdentityBusinessId(user);
  const userId = resolveUserIdentityUid(user);

  useEffect(() => {
    if (!businessId || !userId) {
      return;
    }
    const cashReconciliationRef = collection(
      db,
      'businesses',
      businessId,
      'cashCounts',
    );
    const q = query(
      cashReconciliationRef,
      where('cashCount.state', 'in', ['open', 'closing']),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const belongsToCurrentUser = (
          docSnap: QueryDocumentSnapshot<DocumentData>,
        ) => {
          const cashCount = (docSnap.data().cashCount || {}) as CashCountRecord;
          const openingEmployee = cashCount?.opening?.employee;
          return resolveCashCountEmployeeId(openingEmployee) === userId;
        };
        const isOpen = querySnapshot.docs.some(
          (docSnap) => docSnap.data().cashCount.state === 'open',
        );
        const isEmpty = querySnapshot.empty;
        const isClosing = querySnapshot.docs.some(
          (docSnap) => docSnap.data().cashCount.state === 'closing',
        );
        const isSameUser = querySnapshot.docs.some(belongsToCurrentUser);
        const isOpenForUser = querySnapshot.docs.some((docSnap) => {
          const { cashCount } = docSnap.data();
          return (
            cashCount.state === 'open' &&
            belongsToCurrentUser(docSnap)
          );
        });
        const isClosingForUser = querySnapshot.docs.some((docSnap) => {
          const { cashCount } = docSnap.data();
          return (
            cashCount.state === 'closing' &&
            belongsToCurrentUser(docSnap)
          );
        });

        const currentUserCashCountDoc = querySnapshot.docs.find((docSnap) =>
          belongsToCurrentUser(docSnap),
        );
        setCashReconciliation(
          currentUserCashCountDoc
            ? ({
                id:
                  (currentUserCashCountDoc.data().cashCount as CashCountRecord)
                    ?.id ?? currentUserCashCountDoc.id,
                ...(currentUserCashCountDoc.data().cashCount as CashCountRecord),
              } satisfies CashCountRecord)
            : null,
        );

        if (isEmpty) {
          setValue('none');
          return;
        }
        if (isOpenForUser) {
          setValue('open');
        } else if (isClosingForUser) {
          setValue('closing');
        } else if (isOpen || isClosing || isSameUser) {
          setValue('closed');
        } else {
          setValue('none');
        }
      },
      (error) => {
        console.error('Error en la suscripción a Firestore: ', error);
        setCashReconciliation(null);
        setValue('none');
      },
    );

    return () => unsubscribe();
  }, [businessId, userId]);

  const status = businessId ? value : 'loading';
  const cashCount = businessId ? cashReconciliation : null;

  return { status, cashCount };
}

export async function checkOpenCashReconciliation(
  user: UserIdentity | null | undefined,
) {
  try {
    const businessId = resolveUserIdentityBusinessId(user);
    const userId = resolveUserIdentityUid(user);
    if (!businessId || !userId) {
      throw new Error('Datos del usuario incompletos');
    }
    const employeeRef = doc(db, 'users', userId);

    const cashReconciliationRef = collection(
      db,
      'businesses',
      businessId,
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
    const cashCountOpen = (
      docSnap: QueryDocumentSnapshot<DocumentData>,
    ): boolean => {
      const cashCount = docSnap.data().cashCount as CashCountRecord | undefined;
      return cashCount?.state === 'open';
    };
    const cashCountClosing = (
      docSnap: QueryDocumentSnapshot<DocumentData>,
    ): boolean => {
      const cashCount = docSnap.data().cashCount as CashCountRecord | undefined;
      return cashCount?.state === 'closing';
    };

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


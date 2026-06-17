import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
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
          return cashCount.state === 'open' && belongsToCurrentUser(docSnap);
        });
        const isClosingForUser = querySnapshot.docs.some((docSnap) => {
          const { cashCount } = docSnap.data();
          return cashCount.state === 'closing' && belongsToCurrentUser(docSnap);
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
                ...(currentUserCashCountDoc.data()
                  .cashCount as CashCountRecord),
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

import { collection, doc, query, where } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { fbGetDocs } from '@/firebase/firebaseOperations';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';
import {
  resolveUserIdentityBusinessId,
  resolveUserIdentityUid,
} from '@/utils/users/userIdentityAccess';

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

    const cashCountQuery = query(
      cashReconciliationRef,
      where('cashCount.state', 'in', ['open', 'closing']),
      where('cashCount.opening.employee', '==', employeeRef),
    );

    const querySnapshot = await fbGetDocs(cashCountQuery);

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

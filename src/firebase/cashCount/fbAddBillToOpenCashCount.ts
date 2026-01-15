import {
  collection,
  query,
  where,
  type DocumentReference,
  type Transaction,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { fbGetDoc, fbGetDocs, fbUpdateDoc } from '@/firebase/firebaseOperations';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord } from '@/utils/cashCount/types';

interface CashCountDocData {
  cashCount: CashCountRecord;
}

export const fbAddBillToOpenCashCount = async (
  user: UserIdentity | null | undefined,
  invoiceRef: DocumentReference,
  transaction?: Transaction,
): Promise<string | void> => {
  if (!user?.businessID || !user?.uid) {
    return;
  }

  const cashCountRef = collection(
    db,
    'businesses',
    user?.businessID,
    'cashCounts',
  );
  const q = query(cashCountRef, where('cashCount.state', '==', 'open'));

  try {
    const querySnapshot = await fbGetDocs(q, transaction);

    if (querySnapshot.empty) {
      return;
    }

    let cashCountDoc: typeof querySnapshot.docs[number] | undefined;

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data() as CashCountDocData;

      const employeeSnapshot = await fbGetDoc(
        data.cashCount.opening?.employee as DocumentReference,
        transaction,
      );

      const employeeData = employeeSnapshot.data() as { user?: UserIdentity };

      if (employeeData.user?.id === user?.uid) {
        cashCountDoc = docSnap;
        break;
      }
    }

    if (!cashCountDoc) {
      console.error(
        'No se encontr? un cuadre de caja abierto para el cajero actual',
      );
      return;
    }

    const { cashCount } = cashCountDoc.data() as CashCountDocData;
    cashCount.sales = [...(cashCount.sales ?? []), invoiceRef];

    await fbUpdateDoc(cashCountDoc.ref, { cashCount }, transaction);

    if (cashCount.id) {
      return cashCount.id;
    }
    console.error('Error al encontrar el id del cuadre');
  } catch (error) {
    console.error('Error al a?adir la factura al cuadre: ', error);
  }
};

import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser } from './types';

type InvoiceWriteData = InvoiceData & {
  date?: InvoiceData['date'] | ReturnType<typeof serverTimestamp>;
};

export async function fbGenerateInvoiceFromPreorder(
  user: UserIdentity | null | undefined,
  preorder: InvoiceData | null | undefined,
): Promise<InvoiceWriteData | undefined> {
  try {
    if (!preorder?.preorderDetails?.isOrWasPreorder || !isInvoiceUser(user)) {
      throw new Error('Preorder details are missing or invalid.');
    }
    const userRef = doc(db, 'users', user?.uid);
    const nextNumberId = await getNextID(user, 'lastInvoiceId');
    const historyEntry = {
      type: 'invoice',
      status: 'completed',
      date: Timestamp.now(), // Se utiliza serverTimestamp para obtener la fecha y hora del servidor
      userID: user.uid,
    };
    const bill: InvoiceWriteData = {
      ...preorder,
      status: 'completed',
      date: serverTimestamp(),
      numberID: nextNumberId,
      userID: user.uid,
      user: userRef,
      history: arrayUnion(historyEntry),
    };

    const billDocRef = doc(
      db,
      'businesses',
      user?.businessID,
      'invoices',
      bill?.id,
    );
    await updateDoc(billDocRef, { data: bill });
    return bill;
  } catch (error) {
    console.error('Error al generar la factura:', error);
    return undefined;
  }
}

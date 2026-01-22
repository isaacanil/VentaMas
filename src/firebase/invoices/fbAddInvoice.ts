import { doc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { fbAddBillToOpenCashCount } from '@/firebase/cashCount/fbAddBillToOpenCashCount';
import { db } from '@/firebase/firebaseconfig';
import { fbSetDoc } from '@/firebase/firebaseOperations';
import { getNextID } from '@/firebase/Tools/getNextID';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { fbGetInvoice } from './fbGetInvoice';
import { isInvoiceUser } from './types';

type InvoiceWriteData = InvoiceData & {
  date?: InvoiceData['date'] | ReturnType<typeof serverTimestamp>;
};

export const fbAddInvoice = async (
  data: InvoiceData,
  user: UserIdentity | null | undefined,
): Promise<InvoiceData | null> => {
  if (!isInvoiceUser(user)) return null;

  try {
    const userRef = doc(db, 'users', user.uid);
    const nextNumberId = await getNextID(user, 'lastInvoiceId');

    const bill: InvoiceWriteData = {
      ...data,
      id: data?.id || nanoid(),
      date: serverTimestamp(),
      numberID: nextNumberId,
      userID: user.uid,
      user: userRef,
    };

    const billRef = doc(db, 'businesses', user.businessID, 'invoices', bill.id);

    await fbSetDoc(billRef, { data: bill });

    await fbAddBillToOpenCashCount(user, billRef);

    const invoice = await fbGetInvoice(user.businessID, bill.id);

    return invoice?.data ?? null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

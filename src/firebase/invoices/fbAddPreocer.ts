/**
 * Guarda una preorden en Firestore.
 * @param {Object} user - Información del usuario.
 * @param {Object} cartData - Datos del carrito de compras.
 * @returns {Promise} - Promesa que resuelve con los datos de la preorden guardada.
 */

import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import { sanitizeFirestoreDocument } from '@/utils/firebase/sanitizeFirestoreDocument';
import type { InvoiceData, InvoicePreorderDetails } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser } from './types';

type PreorderInput = InvoiceData & {
  preorderDetails?: InvoicePreorderDetails | null;
  selectedTaxReceiptType?: string | null;
};

type PreorderWriteData = PreorderInput & {
  date: ReturnType<typeof serverTimestamp> | null;
};

export const fbAddPreOrder = async (
  user: UserIdentity | null | undefined,
  cartData: PreorderInput,
): Promise<PreorderInput | null> => {
  if (!isInvoiceUser(user)) return null;
  try {
    const existingPreorderDetails = cartData?.preorderDetails ?? {};
    const selectedTaxReceiptType =
      existingPreorderDetails?.selectedTaxReceiptType ??
      cartData?.selectedTaxReceiptType ??
      null;
    const preorderNumberId =
      existingPreorderDetails?.numberID ?? (await getNextID(user, 'preorder'));

    const data: PreorderWriteData = {
      ...cartData,
      selectedTaxReceiptType,
      id: nanoid(),
      date: null,
      status: 'pending',
      type: 'preorder',
      preorderDetails: {
        ...existingPreorderDetails,
        date: serverTimestamp(),
        isOrWasPreorder: true,
        numberID: preorderNumberId,
        userID: user.uid,
        paymentStatus: existingPreorderDetails?.paymentStatus || 'unpaid',
        selectedTaxReceiptType,
      },
      history: [
        {
          type: 'preorder',
          status: 'pending',
          date: Timestamp.now(),
          userID: user.uid,
        },
      ],
    };
    const invoiceRef = doc(
      db,
      `businesses/${user.businessID}/invoices/${data.id}`,
    );

    const sanitizedData = sanitizeFirestoreDocument(data) as PreorderInput;
    await setDoc(invoiceRef, { data: sanitizedData });
    return sanitizedData;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    throw new Error(message);
  }
};

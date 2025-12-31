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

export const fbAddPreOrder = async (user, cartData) => {
  try {
    const existingPreorderDetails = cartData?.preorderDetails ?? {};
    const selectedTaxReceiptType =
      existingPreorderDetails?.selectedTaxReceiptType ??
      cartData?.selectedTaxReceiptType ??
      null;
    const preorderNumberId =
      existingPreorderDetails?.numberID ?? (await getNextID(user, 'preorder'));

    const data = {
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

    const sanitizedData = sanitizeFirestoreDocument(data);
    await setDoc(invoiceRef, { data: sanitizedData });
    return sanitizedData;
  } catch (error) {
    throw new Error(error.message);
  }
};

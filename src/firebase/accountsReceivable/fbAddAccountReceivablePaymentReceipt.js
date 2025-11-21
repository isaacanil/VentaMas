import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { fbGetClient } from '../client/fbGetClient';
import { db } from '../firebaseconfig';

export async function fbAddAccountReceivablePaymentReceipt({
  user,
  clientId,
  paymentReceipt,
}) {
  let client = null;

  // Solo intentar obtener el cliente si hay un clientId válido
  if (clientId && typeof clientId === 'string' && clientId.trim() !== '') {
    try {
      client = await fbGetClient(user, clientId);
    } catch (error) {
      console.warn('No se pudo obtener el cliente:', error);
      // Continuar sin los datos del cliente
    }
  } else {
    console.warn('clientId no válido, omitiendo la obtención del cliente');
  }

  const receipt = {
    id: nanoid(),
    client: client || null, // Ensure client is null if falsy
    user: {
      id: user.uid,
      displayName: user.displayName || 'Usuario',
    },
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...paymentReceipt,
  };

  // Helper function to recursively remove undefined values
  const removeUndefined = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(removeUndefined);
    }

    const newObj = {};
    Object.keys(obj).forEach((key) => {
      const value = removeUndefined(obj[key]);
      if (value !== undefined) {
        newObj[key] = value;
      }
    });
    return newObj;
  };

  const sanitizedReceipt = removeUndefined(receipt);

  const paymentReceiptRef = doc(
    db,
    'businesses',
    user.businessID,
    'accountsReceivablePaymentReceipt',
    receipt.id,
  );
  await setDoc(paymentReceiptRef, sanitizedReceipt);
  return receipt;
}

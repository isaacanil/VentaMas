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
    client, // Puede ser null si no se encuentra el cliente
    user: {
      id: user.uid,
      displayName: user.displayName,
    },
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...paymentReceipt,
  };
  const paymentReceiptRef = doc(
    db,
    'businesses',
    user.businessID,
    'accountsReceivablePaymentReceipt',
    receipt.id,
  );
  await setDoc(paymentReceiptRef, receipt);
  return receipt;
}

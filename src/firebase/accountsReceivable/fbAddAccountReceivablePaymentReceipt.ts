import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { fbGetClient } from '@/firebase/client/fbGetClient';
import { db } from '@/firebase/firebaseconfig';
import type { AccountsReceivablePaymentReceipt, ReceivableClient } from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';

type ReceiptParams = {
  user: UserIdentity;
  clientId?: string | null;
  paymentReceipt: Partial<AccountsReceivablePaymentReceipt>;
};

const removeUndefined = (value: unknown): unknown => {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }

  const newObj: Record<string, unknown> = {};
  Object.keys(value).forEach((key) => {
    const rawValue = (value as Record<string, unknown>)[key];
    const sanitized = removeUndefined(rawValue);
    if (sanitized !== undefined) {
      newObj[key] = sanitized;
    }
  });
  return newObj;
};

export async function fbAddAccountReceivablePaymentReceipt({
  user,
  clientId,
  paymentReceipt,
}: ReceiptParams): Promise<AccountsReceivablePaymentReceipt> {
  let client: ReceivableClient | null = null;

  // Solo intentar obtener el cliente si hay un clientId válido
  if (clientId && typeof clientId === 'string' && clientId.trim() !== '') {
    try {
      client = (await fbGetClient(user, clientId)) as ReceivableClient | null;
    } catch (error) {
      console.warn('No se pudo obtener el cliente:', error);
      // Continuar sin los datos del cliente
    }
  } else {
    console.warn('clientId no válido, omitiendo la obtención del cliente');
  }

  const receipt: AccountsReceivablePaymentReceipt = {
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

  const sanitizedReceipt = removeUndefined(receipt) as AccountsReceivablePaymentReceipt;

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

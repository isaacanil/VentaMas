import { Timestamp, doc, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser, type InvoiceDoc, type InvoiceUser } from './types';

const normalizeInvoiceDate = (
  value: InvoiceData['date'],
): InvoiceData['date'] => {
  if (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    typeof value.seconds === 'number'
  ) {
    const nanoseconds =
      'nanoseconds' in value && typeof value.nanoseconds === 'number'
        ? value.nanoseconds
        : 0;
    return new Timestamp(value.seconds, nanoseconds);
  }
  return value;
};

export async function fbAddMultipleInvoices(
  user: UserIdentity | null | undefined,
  invoices: InvoiceDoc[],
): Promise<void> {
  if (!isInvoiceUser(user)) return;

  for (const invoice of invoices) {
    await fbAddInvoiceById(user, invoice);
  }
}

async function fbAddInvoiceById(
  user: InvoiceUser,
  factura: InvoiceDoc,
): Promise<void> {
  try {
    factura.data.date = normalizeInvoiceDate(factura.data.date);

    const facturaRef = doc(
      db,
      'businesses',
      user.businessID,
      'invoices',
      factura.data.id,
    );
    await setDoc(facturaRef, factura);
  } catch (error) {
    console.error(`Error al agregar factura con ID ${factura.data.id}:`, error);
  }
}

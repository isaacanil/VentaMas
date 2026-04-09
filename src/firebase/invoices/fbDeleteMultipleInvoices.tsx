import { deleteDoc, doc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser, type InvoiceDoc } from './types';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export async function fbDeleteMultipleInvoices(
  user: UserIdentity | null | undefined,
  invoices: InvoiceDoc[],
): Promise<void> {
  if (!isInvoiceUser(user)) return;
  const ids = invoices.map(({ data }) => data?.id).filter(isNonEmptyString);

  for (const id of ids) {
    console.log(id);
    try {
      await fbDeleteInvoiceById(user, id);
    } catch (error) {
      console.error(`Error eliminando la factura con ID ${id}:`, error);
    }
  }
}

async function fbDeleteInvoiceById(
  user: UserIdentity,
  ventaID: string,
): Promise<void> {
  if (!isInvoiceUser(user)) return;
  const ventaRef = doc(db, 'businesses', user.businessID, 'invoices', ventaID);
  await deleteDoc(ventaRef);
  console.log(`Venta con ID ${ventaID} eliminada exitosamente`);
}

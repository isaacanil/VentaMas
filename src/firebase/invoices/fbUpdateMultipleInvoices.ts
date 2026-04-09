import { updateDoc, doc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/date/dateUtils';
import type { UserIdentity } from '@/types/users';

import { isInvoiceUser, type InvoiceDoc } from './types';

type InvoiceWithDate = {
  data: InvoiceDoc['data'] & { date?: Date };
};

export async function fbUpdateNCFInvoices(
  user: UserIdentity | null | undefined,
  invoices: InvoiceDoc[],
): Promise<void> {
  if (!isInvoiceUser(user)) return;
  // Convertimos y ordenamos las facturas por fecha de manera ascendente

  const sortedInvoices: InvoiceWithDate[] = invoices
    .map(({ data }) => {
      const millis = toMillis(data?.date);
      return {
        data: {
          ...data,
          date: millis ? new Date(millis) : undefined,
        },
      };
    })
    .sort((a, b) => {
      const aTime = a.data.date?.getTime() ?? 0;
      const bTime = b.data.date?.getTime() ?? 0;
      return aTime - bTime;
    });

  // Número inicial para NCF
  let ncfNumber = 1609;

  for (const invoice of sortedInvoices) {
    console.log(invoice.data.id);
    try {
      await fbUpdateInvoiceNCF(user, invoice.data.id, ncfNumber);
    } catch (error) {
      console.error(
        `Error actualizando la factura con ID ${invoice.data.id}:`,
        error,
      );
    }

    // Incrementamos el número para el próximo NCF
    ncfNumber++;
  }
}

async function fbUpdateInvoiceNCF(
  user: UserIdentity,
  invoiceID: string,
  ncfNumber: number,
): Promise<void> {
  if (!isInvoiceUser(user)) return;

  // Construimos el string NCF usando template string
  const ncfString = `B02${String(ncfNumber).padStart(10, '0')}`;

  const invoiceRef = doc(
    db,
    'businesses',
    user.businessID,
    'invoices',
    invoiceID,
  );
  await updateDoc(invoiceRef, { 'data.NCF': ncfString });
  console.log(
    `Factura con ID ${invoiceID} actualizada exitosamente con NCF ${ncfString}`,
  );
}

import { runTransaction, doc, Timestamp, increment } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { getInvoiceProductQuantity, isInvoiceUser } from './types';

export const fbCancelInvoice = async (
  user: UserIdentity | null | undefined,
  invoice: InvoiceData | null | undefined,
  cancellationReason: string,
): Promise<void> => {
  try {
    if (
      !invoice ||
      !invoice.id ||
      !Array.isArray(invoice.products) ||
      !isInvoiceUser(user)
    ) {
      throw new Error('No se ha podido cancelar la factura. Faltan datos.');
    }
    await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(
        db,
        'businesses',
        user.businessID,
        'invoices',
        invoice.id,
      );

      // Aquí actualizamos cada producto dentro de la transacción
      for (const product of invoice.products) {
        if (!product?.id) continue;
        const quantity = getInvoiceProductQuantity(product);
        if (!quantity) continue;
        const productRef = doc(
          db,
          'businesses',
          user.businessID,
          'products',
          product.id,
        );
        transaction.update(productRef, {
          'product.stock': increment(quantity),
        });
      }

      // Ahora actualizamos los datos de la factura
      transaction.update(invoiceRef, {
        ['data.status']: 'cancelled',
        ['data.cancel']: {
          reason: cancellationReason,
          user: user.uid,
          cancelledAt: Timestamp.now(),
        },
      });
    });
  } catch (error) {
    console.error('Transaction failed: ', error);
    // Puedes elegir manejar el error de una manera específica aquí.
  }
};

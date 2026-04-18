import { runTransaction, doc, Timestamp, increment } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { DGII_608_REASON_CATALOG_VERSION } from '@/utils/fiscal/dgii608ReasonCatalog';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { getInvoiceProductQuantity, isInvoiceUser } from './types';

export interface CancelInvoiceReasonInput {
  reasonCode: string;
  reasonLabel: string;
  note?: string;
}

export const fbCancelInvoice = async (
  user: UserIdentity | null | undefined,
  invoice: InvoiceData | null | undefined,
  cancellation: CancelInvoiceReasonInput,
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
    if (
      typeof cancellation?.reasonCode !== 'string' ||
      !cancellation.reasonCode.trim() ||
      typeof cancellation?.reasonLabel !== 'string' ||
      !cancellation.reasonLabel.trim()
    ) {
      throw new Error('Debe indicar un motivo DGII válido para anular la factura.');
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

      const now = Timestamp.now();
      const reasonLabel = cancellation.reasonLabel.trim();
      const reasonCode = cancellation.reasonCode.trim().padStart(2, '0');
      const note =
        typeof cancellation.note === 'string' && cancellation.note.trim().length
          ? cancellation.note.trim()
          : null;

      // Ahora actualizamos los datos de la factura
      transaction.update(invoiceRef, {
        ['data.status']: 'cancelled',
        ['data.cancel']: {
          reason: reasonLabel,
          reasonCode,
          reasonLabel,
          note,
          user: user.uid,
          cancelledAt: now,
        },
        ['data.voidedAt']: now,
        ['data.voidReason']: reasonLabel,
        ['data.voidReasonCode']: reasonCode,
        ['data.voidReasonLabel']: reasonLabel,
        ['data.voidReasonCatalogVersion']: DGII_608_REASON_CATALOG_VERSION,
        ['data.updatedAt']: now,
      });
    });
  } catch (error) {
    console.error('Transaction failed: ', error);
    throw error instanceof Error
      ? error
      : new Error('No se pudo anular la factura.');
  }
};

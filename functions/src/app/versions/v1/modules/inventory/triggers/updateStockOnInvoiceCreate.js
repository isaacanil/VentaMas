import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { handleUpdateProductsStock } from '../handlers/handleUpdateProductsStock.js';

export const updateStockOnInvoiceCreate = onDocumentCreated(
  { document: 'businesses/{bid}/invoices/{iid}', region: 'us-central1' },
  async (event) => {
    const invoiceSnap = event.data;
    if (!invoiceSnap) return null;

    const invoice = invoiceSnap?.data();
    const { bid: businessID } = event.params;
    logger.log('[updateStockOnInvoiceCreate] invoice received', {
      businessID,
      invoiceId: event.params?.iid,
      hasInvoice: Boolean(invoice),
      stockDone: Boolean(invoice?.stockDone),
    });

    if (!invoice || invoice?.stockDone) return null;

    try {
      await handleUpdateProductsStock({
        businessID,
        sale: invoice.data,
        products: invoice.data.products,
      });

      await invoiceSnap?.ref.update({ stockDone: true });
      return null;
    } catch (error) {
      console.error('[updateStockOnInvoiceCreate]', error);
      throw error;
    }
  },
);

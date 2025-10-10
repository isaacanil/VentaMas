import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/firestore';

import { handleUpdateProductsStock } from '../handlers/handleUpdateProductsStock.js';

export const updateStockOnInvoiceCreate = onDocumentCreated(
    'businesses/{bid}/invoices/{iid}',
    async event => {
        const invoiceSnap = event.data;
        logger.log(
            '[updateStockOnInvoiceCreate] invoiceSnap',
           event
        );
        if (!invoiceSnap) return null;

        const invoice = invoiceSnap?.data();
        logger.log(
            '[updateStockOnInvoiceCreate] invoice',
            invoice
        );
    const { bid: businessID } = event.params;

        if (!invoice || invoice?.stockDone) return null;

        try {
            await handleUpdateProductsStock({
                businessID,
                sale: invoice.data,
                products: invoice.data.products
            });

            await invoiceSnap?.ref.update({ stockDone: true });
            return null;
        } catch (error) {
            console.error('[updateStockOnInvoiceCreate]', error);
            throw error;
        }
    }
);

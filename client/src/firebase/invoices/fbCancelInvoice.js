import { db } from '../firebaseconfig';
import { runTransaction, doc, Timestamp, increment } from 'firebase/firestore';

export const fbCancelInvoice = async (user, invoice, cancellationReason) => {
    
    try {
        if (!invoice || !user || !user.businessID || !invoice.id  || !invoice.products) {
            throw new Error("No se ha podido cancelar la factura. Faltan datos.");
        }
        await runTransaction(db, async (transaction) => {
            const invoiceRef = doc(db, 'businesses', user.businessID, "invoices", invoice.id);

            // Aquí actualizamos cada producto dentro de la transacción
            for (const product of invoice.products) {
                const productRef = doc(db,'businesses', user.businessID, 'products', product.id);
                transaction.update(productRef, { 'product.stock': increment(product.amountToBuy.total) });
            }

            // Ahora actualizamos los datos de la factura
            transaction.update(invoiceRef, {
                ["data.status"]: 'cancelled',
                ["data.cancel"]: {
                    reason: cancellationReason,
                    user: user.uid,
                    cancelledAt: Timestamp.now()
                }
               
            });
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        // Puedes elegir manejar el error de una manera específica aquí.
    }
}

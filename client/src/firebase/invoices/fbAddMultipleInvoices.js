import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';


export async function fbAddMultipleInvoices(user, invoices) {
    if (!user || !user?.businessID) return;

    for (const invoice of invoices) {
        await fbAddInvoiceById(user, invoice);
    }
}

async function fbAddInvoiceById(user, factura) {
    try {
        const { seconds, nanoseconds } = factura.data.date;
        factura.data.date = new Timestamp(seconds, nanoseconds);

        const facturaRef = doc(db, 'businesses', user.businessID, 'invoices', factura.data.id);
        await setDoc(facturaRef, factura);
    } catch (error) {
        console.error(`Error al agregar factura con ID ${factura.data.id}:`, error);
    }
}



import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';


export async function fbAddMultipleInvoices(user, invoices) {
    if (!user || !user?.businessID) return;

    for (const invoice of invoices) {
        await fbAddInvoiceById(user, invoice);
    }

    console.log("Todas las facturas han sido agregadas exitosamente");
}

async function fbAddInvoiceById(user, factura) {
    try {
        // Convertir segundos y nanosegundos a Timestamp
        const { seconds, nanoseconds } = factura.data.date;
        factura.data.date = new Timestamp(seconds, nanoseconds);

        const facturaRef = doc(db, 'businesses', user.businessID, 'invoices', factura.data.id);
        await setDoc(facturaRef, factura);
        console.log(factura);
        console.log(`Factura con ID ${factura.data.id} agregada exitosamente`);
    } catch (error) {
        console.error(`Error al agregar factura con ID ${factura.data.id}:`, error);
    }
}



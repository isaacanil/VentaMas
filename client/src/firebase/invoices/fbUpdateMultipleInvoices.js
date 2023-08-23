import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export async function fbUpdateNCFInvoices(user, invoices) {
    // Convertimos y ordenamos las facturas por fecha de manera ascendente
 
    const sortedInvoices = invoices.map(({ data }) => ({
        data: {
            ...data,
            date: new Date(data.date.seconds * 1000) // Convertimos a objeto de fecha
        }
    })).sort((a, b) => a.data.date - b.data.date);

    // Número inicial para NCF
    let ncfNumber = 1609;

    for (const invoice of sortedInvoices) {
        console.log(invoice.data.id);
        try {
            await fbUpdateInvoiceNCF(user, invoice.data.id, ncfNumber);
        } catch (error) {
            console.error(`Error actualizando la factura con ID ${invoice.data.id}:`, error);
        }

        // Incrementamos el número para el próximo NCF
        ncfNumber++;
    }
}

async function fbUpdateInvoiceNCF(user, invoiceID, ncfNumber) {
    if (!user || !user?.businessID) return;

    // Construimos el string NCF usando template string
    const ncfString = `B02${String(ncfNumber).padStart(10, '0')}`;

    const invoiceRef = doc(db, 'businesses', user.businessID, 'invoices', invoiceID);
    await updateDoc(invoiceRef, { 'data.NCF': ncfString });
    console.log(`Factura con ID ${invoiceID} actualizada exitosamente con NCF ${ncfString}`);
}

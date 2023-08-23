import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export async function fbDeleteMultipleInvoices(user, invoices) {
    const ids = invoices.map(({ data }) => data.id);

    for (const id of ids) {
        console.log(id);
        try {
            await fbDeleteInvoiceById(user, id);
        } catch (error) {
            console.error(`Error eliminando la factura con ID ${id}:`, error);
        }
    }
}


async function fbDeleteInvoiceById(user, ventaID) {
    if(!user || !user?.businessID) return;
    const ventaRef = doc(db, 'businesses', user.businessID, 'invoices', ventaID);
    await deleteDoc(ventaRef);
    console.log(`Venta con ID ${ventaID} eliminada exitosamente`);
}
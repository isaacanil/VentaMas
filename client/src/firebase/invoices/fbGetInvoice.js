import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbGetInvoice = async (businessID, invoiceId) => {
    try {
        const invoiceRef = doc(db, "businesses", businessID, "invoices", invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        if (invoiceSnap.exists()) {
            return invoiceSnap.data(); // Retorna los datos de la factura, no el objeto Snapshot
        } else {
            return null; // O maneja la ausencia de la factura como prefieras
        }
    } catch (error) {
        console.error("Error obteniendo factura:", error);
        return null; // Asegura que la función maneje el error graciosamente
    }
};

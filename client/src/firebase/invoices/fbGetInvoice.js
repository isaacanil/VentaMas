import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbGetInvoice = async (businessID, invoiceId) => {
    try {
        const invoiceRef = doc(db, "businesses", businessID, "invoices", invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        if (invoiceSnap.exists()) {
            console.log("Factura obtenida:", invoiceSnap.data());
            return invoiceSnap.data(); // Retorna los datos de la factura, no el objeto Snapshot
        } else {
            console.log("No se encontró la factura con ID:", invoiceId);
            return null; // O maneja la ausencia de la factura como prefieras
        }
    } catch (error) {
        console.error("Error obteniendo factura:", error);
        return null; // Asegura que la función maneje el error graciosamente
    }
};

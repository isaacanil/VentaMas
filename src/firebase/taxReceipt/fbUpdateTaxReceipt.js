import { collection, doc, writeBatch } from "firebase/firestore";

import { db } from "../firebaseconfig";

export const fbUpdateTaxReceipt = async (user, taxReceiptArray) => {
    if (!user || !user?.businessID) return;
    
    try {
        const { businessID } = user;
        const taxReceiptsRef = collection(db, "businesses", businessID, "taxReceipts");
        const batch = writeBatch(db);

        // Primero, obtener el conjunto de series existentes en la base de datos
        const seriesInFirebase = new Set();
        // Este es un placeholder, en una implementación real necesitarías consultar Firebase
        // para obtener las series existentes

        // Para cada comprobante en el array
        for (const receipt of taxReceiptArray) {
            if (receipt && receipt.data) {
                const { serie } = receipt.data;
                const taxReceiptRef = doc(taxReceiptsRef, serie);
                
                // Establecer los datos del comprobante
                batch.set(taxReceiptRef, {
                    data: {
                        ...receipt.data,
                        id: serie, // Usar la serie como ID para facilitar referencias
                    }
                });
                
                // Marcar esta serie como procesada
                seriesInFirebase.add(serie);
            }
        }

        // Confirmar la transacción por lotes
        await batch.commit();
        console.info("Tax receipts updated successfully");
        
    } catch (error) {
        console.error("Error al actualizar los comprobantes fiscales:", error);
        throw error;
    }
};
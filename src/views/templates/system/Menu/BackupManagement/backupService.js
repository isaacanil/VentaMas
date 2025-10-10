import { collection, getDocs, doc, writeBatch } from "firebase/firestore";

import { db } from "../../../../../firebase/firebaseconfig";

export const createBackup = async (user) => {
    if (!user?.businessID) return;
    const collections = ['products', 'backOrders', 'batches', 'productsStock'];
    const timestamp = new Date().getTime();

    try {
        for (const collectionName of collections) {
            const sourceRef = collection(db, 'businesses', user.businessID, collectionName);
            const snapshot = await getDocs(sourceRef);

            const BATCH_SIZE = 500;
            let batch = writeBatch(db);
            let deleteBatch = writeBatch(db);
            let count = 0;
            let deleteCount = 0;

            for (const sourceDoc of snapshot.docs) {
                const data = sourceDoc.data();

                // Ruta corregida y más organizada:
                // businesses / user.businessID / versions / timestamp / collectionName / documentId
                const backupRef = doc(
                    db,
                    'businesses',
                    user.businessID,
                    'versions',
                    String(timestamp),
                    collectionName,
                    sourceDoc.id
                );

                batch.set(backupRef, data);
                count++;

                deleteBatch.delete(sourceDoc.ref);
                deleteCount++;

                if (count === BATCH_SIZE) {
                    await batch.commit();
                    batch = writeBatch(db);
                    count = 0;
                }

                if (deleteCount === BATCH_SIZE) {
                    await deleteBatch.commit();
                    deleteBatch = writeBatch(db);
                    deleteCount = 0;
                }
            }

            if (count > 0) {
                await batch.commit();
            }

            if (deleteCount > 0) {
                await deleteBatch.commit();
            }
        }

        return {
            success: true,
            timestamp,
            message: "Backup completado exitosamente y datos originales eliminados"
        };
    } catch (error) {
        console.error("Error al crear backup:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

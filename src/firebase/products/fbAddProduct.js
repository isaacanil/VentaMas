import { doc, serverTimestamp, runTransaction } from "firebase/firestore";
import { nanoid } from "nanoid";

import { BatchStatus } from "../../models/Warehouse/Batch";
import { MovementReason, MovementType } from "../../models/Warehouse/Movement";
import { db } from "../firebaseconfig";
import { getNextID, } from "../Tools/getNextID";
import { getDefaultWarehouse } from "../warehouse/warehouseService";

export const fbAddProduct = (data, user) => {
    if (!user?.businessID) return;

    const baseFields = {
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        deletedAt: null,
        deletedBy: null,
        isDeleted: false
    };

    const product = {
        ...data,
        id: nanoid(10)
    }

    return new Promise(async (resolve, reject) => {
        try {
            await runTransaction(db, async (transaction) => {

                const defaultWarehouse = await getDefaultWarehouse(user, transaction);
                if (!defaultWarehouse?.id) throw new Error("No se pudo obtener almacén predeterminado");

                const batchNumber = await getNextID(user, "batches", 1, transaction);
                if (!batchNumber) throw new Error("Error al generar número de lote");

                const productRef = doc(db, "businesses", user.businessID, "products", product.id);
                transaction.set(productRef, product);

                const batch = {
                    ...baseFields,
                    id: nanoid(10),
                    productId: product.id,
                    productName: product.name,
                    numberId: batchNumber,
                    status: BatchStatus.Active,
                    receivedDate: serverTimestamp(),
                    providerId: null,
                    quantity: product.stock,
                    initialQuantity: product.stock,
                };
                const batchRef = doc(db, "businesses", user.businessID, "batches", batch.id);
                transaction.set(batchRef, batch);

                const stock = {
                    ...baseFields,
                    id: nanoid(10),
                    batchId: batch.id,
                    productName: product.name,
                    batchNumberId: batchNumber,
                    location: defaultWarehouse.id,
                    expirationDate: null,
                    status: BatchStatus.Active,
                    productId: product.id,
                    quantity: product.stock,
                    initialQuantity: product.stock,
                };

                const stockRef = doc(db, "businesses", user.businessID, "productsStock", stock.id);
                transaction.set(stockRef, stock);

                const movement = {
                    ...baseFields,
                    id: nanoid(10),
                    batchId: batch.id,
                    productName: product.name,
                    batchNumberId: batchNumber,
                    destinationLocation: defaultWarehouse.id,
                    sourceLocation: null,
                    productId: product.id,
                    quantity: product.stock,
                    movementType: MovementType.Entry,
                    movementReason: MovementReason.InitialStock,
                };

                const movementRef = doc(db, "businesses", user.businessID, "movements", movement.id);
                transaction.set(movementRef, movement);
            });
            resolve();
        } catch (error) {
            console.error('Error en fbAddProduct:', error); // Más descriptivo
            reject(error);
        }
    });
}
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc, writeBatch, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbUploadFiles } from '../img/fbUploadFileAndGetURL';
import { deleteRemovedFiles, findRemovedAttachments } from "./fbUpdatePurchase";
import { createBatch } from "../warehouse/batchService";
import { createProductStock } from "../warehouse/productStockService";
import { getDefaultWarehouse } from "../warehouse/warehouseService";
import { safeTimestamp, updateLocalAttachmentsWithRemoteURLs } from "./fbAddPurchase";
import { getNextID } from "../Tools/getNextID";
import { MovementReason, MovementType } from "../../models/Warehouse/Movement";
import { nanoid } from "nanoid";

const updatePurchaseWarehouseStock = async (user, purchase, defaultWarehouse) => {
    const productBatches = {};

    const baseFields = {
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        deletedAt: null,
        deletedBy: null,
        isDeleted: false
    };

    // Group replenishments by product and expiration date
    for (const replenishment of purchase.replenishments) {
        const key = `${replenishment.id}_${replenishment.expirationDate}`;
        if (!productBatches[key]) {
            productBatches[key] = {
                productId: replenishment.id,
                productName: replenishment.name,
                expirationDate: replenishment.expirationDate,
                items: []
            };
        }
        productBatches[key].items.push(replenishment);
    }

    // Create batch and update stock for each product
    for (const key in productBatches) {
        const batch = productBatches[key];
        const totalStock = batch.items.reduce((acc, item) => acc + item.quantity, 0);
        const batchId = `${purchase.id}_${batch.productId}_${new Date(batch.expirationDate).getTime()}`;

        const productRef = doc(db, "businesses", user.businessID, "products", batch.productId);

        // If stock is 0, update product status to inactive
        const updateProductData = {
            stock: totalStock,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid
        };

        if (totalStock === 0) {
            updateProductData.status = 'inactive';
        }

        await updateDoc(productRef, updateProductData);

        // Create batch for this product
        const batchData = await createBatch(user, {
            ...baseFields,
            productId: batch.productId,
            purchaseId: purchase.id,
            numberId: await getNextID(user, 'batches'),
            shortName: `${batch.productName}_${new Date(batch.expirationDate).toISOString().split('T')[0]}`,
            batchNumber: batchId,
            status: totalStock === 0 ? 'inactive' : 'active',
            receivedDate: new Date(),
            providerId: purchase.provider,
            quantity: totalStock,
            initialQuantity: totalStock,
        });

        // Update product stock
        const productStockData = {
            ...baseFields,
            batchId: batchData.id,
            batchNumberId: batchData.numberId,
            location: `${defaultWarehouse.id}`,
            productId: batch.productId,
            productName: batch.productName,
            quantity: totalStock,
            status: totalStock === 0 ? 'inactive' : 'active',
            initialQuantity: totalStock,
            expirationDate: batch?.expirationDate ? new Date(batch.expirationDate) : null,
        };

        await createProductStock(user, productStockData);

        const movementId = nanoid(); // Genera
        const movementRef = doc(db, "businesses", user.businessID, "movements", movementId);
        const movement = {
            ...baseFields,
            id: movementId,
            batchId: batchData.id,
            productName: batch.productName,
            batchNumberId: batchData.numberId,
            destinationLocation: defaultWarehouse.id,
            sourceLocation: null,
            productId: batch.productId,
            quantity: totalStock,
            movementType: MovementType.Entry,
            movementReason: MovementReason.Purchase,
        };

        await setDoc(movementRef, movement);
   

        // Update back orders if any
        const replenishmentsWithBackOrders = batch.items.filter(item => 
            item.selectedBackOrders && item.selectedBackOrders.length > 0
        );

        if (replenishmentsWithBackOrders.length > 0) {
            const writeBatchOp = writeBatch(db);

            for (const replenishment of replenishmentsWithBackOrders) {
                for (const backOrder of replenishment.selectedBackOrders) {
                    const backOrderRef = doc(db, "businesses", user.businessID, "backOrders", backOrder.id);
                    writeBatchOp.update(backOrderRef, {
                        status: 'completed',
                        completedAt: serverTimestamp(),
                        completedBy: user.uid,
                        completedWithPurchaseId: purchase.id,
                        updatedAt: serverTimestamp(),
                        updatedBy: user.uid,
                        pendingQuantity: 0
                    });
                }
            }

            await writeBatchOp.commit();
        }
    }
};

const handleFileAttachments = async (user, purchase, localFiles) => {
    // Get previous version of purchase
    const purchaseRef = doc(db, "businesses", user.businessID, "purchases", purchase.id);
    const previousPurchaseDoc = await getDoc(purchaseRef);
    const previousPurchase = previousPurchaseDoc.data();

    // Find and delete removed attachments
    if (previousPurchase?.attachmentUrls) {
        const removedAttachments = findRemovedAttachments(
            previousPurchase.attachmentUrls,
            purchase.attachmentUrls || []
        );
        if (removedAttachments.length > 0) {
            await deleteRemovedFiles(removedAttachments);
        }
    }

    let uploadedFiles = [];
    if (localFiles && localFiles.length > 0) {
        const files = localFiles.map(({ file }) => file);
        uploadedFiles = await fbUploadFiles(user, "purchaseAndOrderFiles", files, {
            customMetadata: {
                type: "purchase_attachment",
            },
        });
    }

    const existingAttachments = purchase.attachmentUrls || [];
    const updatedAttachments = updateLocalAttachmentsWithRemoteURLs(
        existingAttachments,
        uploadedFiles
    );

    return updatedAttachments;
};

const generateShortName = (purchase) => {
    const expirationDate = new Date(purchase.replenishments[0].expirationDate);
    const formattedDate = expirationDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    return `${purchase.name}_${formattedDate}`;
};

export const fbCompletePurchase = async ({ user, purchase, localFiles = [], setLoading = () => { } }) => {
    try {
        setLoading(true);
        // Completing purchase process
        const purchaseRef = doc(db, "businesses", user.businessID, "purchases", purchase.id);

        // Ensure default warehouse exists
        const defaultWarehouse = await getDefaultWarehouse(user);

        // Handle file attachments
        const updatedAttachments = await handleFileAttachments(user, purchase, localFiles);

        const updatedData = {
            ...purchase,
            status: 'completed',
            updatedAt: serverTimestamp(),
            deliveryAt: safeTimestamp(purchase.deliveryAt),
            paymentAt: safeTimestamp(purchase.paymentAt),
            completedAt: purchase.completedAt ? safeTimestamp(purchase.completedAt) : null,
            attachmentUrls: updatedAttachments
        };

        await updateDoc(purchaseRef, updatedData);
        await updatePurchaseWarehouseStock(user, purchase, defaultWarehouse);

        setLoading(false);
        return updatedData;
    } catch (error) {
        setLoading(false);
        console.error("Error completing purchase:", error);
        throw error;
    }
};
import { Timestamp, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { nanoid } from 'nanoid';

import { db } from "../firebaseconfig";
import { fbUploadFiles } from '../img/fbUploadFileAndGetURL';
import { getNextID } from '../Tools/getNextID';

import { fbUpdateProdStockForReplenish } from './fbUpdateProdStockForReplenish';

const cleanLocalAttachments = (attachments = []) => {
    return attachments.filter(attachment => attachment.location !== 'local');
};

export const updateLocalAttachmentsWithRemoteURLs = (localAttachments, uploadedFiles) => {
    return localAttachments.map(attachment => {
        if (attachment.location === 'local') {
            const uploadedFile = uploadedFiles.find(uf => uf.name === attachment.name);
            if (uploadedFile) {
                return {
                    ...attachment,
                    location: 'remote',
                    url: uploadedFile.url,
                    size: uploadedFile.size,
                    mimeType: uploadedFile.mimeType
                };
            }
        }
        return attachment;
    });
};



export const safeTimestamp = (date) => {
    if (!date) return Timestamp.now(); // Changed from serverTimestamp()
    const milliseconds = typeof date === 'number' ? date : new Date(date).getTime();
    if (isNaN(milliseconds)) return Timestamp.now(); // Changed from serverTimestamp()
    return Timestamp.fromMillis(milliseconds);
};

export async function addPurchase({ user, purchase, localFiles = [], setLoading = () => { } }) {
    try {
        const id = nanoid();
        const numberId = await getNextID(user, 'lastPurchaseNumberId');
        const purchasesRef = doc(db, "businesses", user.businessID, "purchases", id);

        if (purchase.orderId) {
            const ordersRef = doc(db, "businesses", user.businessID, "orders", purchase.orderId);
            await updateDoc(ordersRef, { status: 'completed' });
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

        // Update replenishments and handle back orders
        const updatedReplenishments = purchase.replenishments?.map(item => ({
            ...item,
            expirationDate: item.expirationDate ? Timestamp.fromMillis(new Date(item.expirationDate).getTime()) : null
        })) || [];

        // Update back orders status to reserved
        const replenishmentsWithBackOrders = updatedReplenishments.filter(item => 
            item.selectedBackOrders && item.selectedBackOrders.length > 0
        );

        if (replenishmentsWithBackOrders.length > 0) {
            const writeBatchOp = writeBatch(db);

            for (const replenishment of replenishmentsWithBackOrders) {
                for (const backOrder of replenishment.selectedBackOrders) {
                    const backOrderRef = doc(db, "businesses", user.businessID, "backOrders", backOrder.id);
                    writeBatchOp.update(backOrderRef, {
                        status: 'reserved',
                        reservedBy: user.uid,
                        reservedAt: serverTimestamp(),
                        purchaseId: id,
                        updatedAt: serverTimestamp(),
                        updatedBy: user.uid
                    });
                }
            }

            await writeBatchOp.commit();
        }

        const data = {
            ...purchase,
            id,
            numberId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            deliveryAt: safeTimestamp(purchase.deliveryAt),
            paymentAt: safeTimestamp(purchase.paymentAt),
            completedAt: purchase.completedAt ? safeTimestamp(purchase.completedAt) : null,
            attachmentUrls: updatedAttachments,
            replenishments: updatedReplenishments
        };
      

        await setDoc(purchasesRef, data);
        setLoading(false);
        return data;
    } catch (error) {
        setLoading(false);
        console.error("Error in addPurchase:", error);
        throw error;
    }
}

export const fbAddPurchase = async (user, purchase, fileList = [], setLoading) => {
    try {
        const id = nanoid(10);
        const purchasesRef = doc(db, "businesses", user.businessID, "purchases", id);
        setLoading({ isOpen: true, message: "Iniciando proceso de registro de Compra" });
        
        const nextID = await getNextID(user, 'lastPurchaseNumberId');
        
        // Convert replenishment expirationDates to Timestamps
        const updatedReplenishments = purchase.replenishments.map(item => ({
            ...item,
            expirationDate: item.expirationDate ? Timestamp.fromMillis(item.expirationDate) : null
        }));

        let data = {
            ...purchase,
            id,
            numberId: nextID,
            deliveryDate: Timestamp.fromMillis(purchase.dates.deliveryDate),
            paymentDate: Timestamp.fromMillis(purchase.dates.paymentDate),
            replenishments: updatedReplenishments
        };

        // ...existing code...
        if (fileList.length > 0) {
            setLoading({ isOpen: true, message: "Subiendo imagen del recibo al servidor..." });
            const files = await fbUploadFiles(user, "purchaseReceipts", fileList);
            data.fileList = [...(data?.fileList || []), ...files]
        }

        setLoading({ isOpen: true, message: "Actualizando stock de productos..." });
        await fbUpdateProdStockForReplenish(user, data.replenishments);

        await setDoc(purchasesRef, { data });
        setLoading({ isOpen: false, message: "" });
        return data;
    } catch (error) {
        setLoading({ isOpen: false, message: "" });
        console.error("Error adding purchase: ", error);
        throw error;
    }
};
import { nanoid } from 'nanoid';
import { Timestamp, doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbAddMultipleFilesAndGetURLs, fbUploadFileAndGetURL } from '../img/fbUploadFileAndGetURL';
import { isImageFile, isPDFFile } from '../../utils/file/isValidFile';

const saveCurrentPurchaseVersion = async (user, currentPurchase) => {
    const purchaseId = currentPurchase.id;
    const previousPurchaseRef = doc(db, 'businesses', user.businessID, "previousPurchases", purchaseId);

    // Guardar la compra actual en la colección 'previousPurchases' con una marca de tiempo
    await setDoc(previousPurchaseRef, { data: { ...currentPurchase, savedAt: Timestamp.now() } });
};

const updateProductsStockFromReplenishments = async (user, newPurchase, previousPurchase) => {
    // Maps para los reabastecimientos de la nueva y la versión anterior de la compra
    const newReplenishmentsMap = new Map(newPurchase.replenishments.map(item => [item.id, item]));
    const previousReplenishmentsMap = previousPurchase ? new Map(previousPurchase.replenishments.map(item => [item.id, item])) : new Map();
    console.log("newPurchase:", newPurchase);
    console.log("previousPurchase:", previousPurchase);
    for (const [productId, newReplenishment] of newReplenishmentsMap) {
        console.log("newReplenishment being processed:", newReplenishment);
        if (previousReplenishmentsMap.has(productId)) {
            const previousReplenishment = previousReplenishmentsMap.get(productId);
            console.log("previousReplenishment for existing product:", previousReplenishment);
            let stockChange = newReplenishment.newStock - previousReplenishment.newStock;
            console.log(`Producto ${productId} (${newReplenishment.productName}): stock anterior ${previousReplenishment.newStock}, stock nuevo ${newReplenishment.newStock}. Cambio: ${stockChange}`);
            await updateProductStock(user, productId, stockChange);
        } else {
            console.log(`Producto nuevo: ${productId} (${newReplenishment.productName}). Stock establecido a ${newReplenishment.newStock}`);
            await updateProductStock(user, productId, newReplenishment.newStock);
        }
    }
    
    // Procesar los productos eliminados en la nueva compra
    for (const [productId, previousReplenishment] of previousReplenishmentsMap) {
        if (!newReplenishmentsMap.has(productId)) {
            // Si un producto anterior ya no está en la nueva compra, reduce el stock
            let stockChange = -previousReplenishment.newStock;
            await updateProductStock(user, productId, stockChange);
        }
    }
};

const updateProductStock = async (user, productId, stockChange) => {
    // Realizar la actualización del stock del producto en la base de datos
    console.log(`Actualizando el stock del producto ${productId} en ${stockChange} unidades.`);

    const productsRef = doc(db, 'businesses', user.businessID, "products", productId);
    // Usa 'increment' para ajustar el stock en lugar de establecer un nuevo valor directamente
    await updateDoc(productsRef, { "product.stock": increment(stockChange) });
};

export const fbUpdatePurchase = async (user, purchase, files, setLoading) => {
    try {
        setLoading({ isOpen: true, message: "Iniciando proceso de actualización de Compra" });

        const purchaseId = purchase.id;
        // Referencia al documento de la compra existente
        const purchaseRef = doc(db, "businesses", user.businessID, "purchases", purchaseId);

        const purchaseSnap = await getDoc(purchaseRef);
        if (purchaseSnap.exists()) {
            const currentPurchase = purchaseSnap.data().data;
            // Guardar la versión actual de la compra
            await saveCurrentPurchaseVersion(user, currentPurchase);

            // Actualizar el stock de los productos
            await updateProductsStockFromReplenishments(user, purchase, currentPurchase);

            let fileToUpload = [];
            if (files && files.length > 0) {
                setLoading({ isOpen: true, message: "Subiendo imagen del recibo actualizada al servidor..." });
                const uploadedFiles = await fbAddMultipleFilesAndGetURLs(user, "purchaseReceipts", files);
                fileToUpload = [...(currentPurchase.fileList || []), ...uploadedFiles];
            }

            const providerRef = doc(db, "businesses", user.businessID, 'providers', purchase.provider.id);
            const data = {
                ...purchase,
                provider: providerRef,
                dates: {
                    ...purchase.dates,
                    createdAt: Timestamp.fromMillis(purchase.dates.createdAt),
                    deliveryDate: Timestamp.fromMillis(purchase.dates.deliveryDate),
                    paymentDate: Timestamp.fromMillis(purchase.dates.paymentDate),
                    updatedAt: Timestamp.fromDate(new Date())
                },
                fileList: fileToUpload
            };

            // Actualiza el documento en Firestore
            await updateDoc(purchaseRef, { data });

            setLoading({ isOpen: false, message: "" });
            return data;
        }
    } catch (error) {
        setLoading({ isOpen: false, message: "" });
        console.error("Error updating purchase: ", error);
        throw error;
    }
};

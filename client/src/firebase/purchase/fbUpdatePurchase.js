import { nanoid } from 'nanoid';
import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbUploadFileAndGetURL } from '../img/fbUploadFileAndGetURL';
import { isImageFile, isPDFFile } from '../../utils/file/isValidFile';


export const fbUpdatePurchase = async (user, purchase, receiptFile, setLoading) => {
    try {
        setLoading({ isOpen: true, message: "Iniciando proceso de actualización de Compra" });
        
        const purchaseId = purchase.id;
        const providerRef = doc(db, "businesses", user.businessID, 'providers', purchase.provider.id);
        const data = {
            ...purchase,
            provider: providerRef,
            dates: {
                ...purchase.dates,
                deliveryDate: Timestamp.fromMillis(purchase.dates.deliveryDate),
                paymentDate: Timestamp.fromMillis(purchase.dates.paymentDate),
                updatedAt: Timestamp.fromDate(new Date())
            }
        };

        if(receiptFile && (isImageFile(receiptFile) || isPDFFile(receiptFile))) {
            setLoading({ isOpen: true, message: "Subiendo imagen del recibo actualizada al servidor..." });
            data.receipt = await fbUploadFileAndGetURL(user, "purchaseReceipts", receiptFile);
        }

        // Referencia al documento de la compra existente
        const purchaseRef = doc(db, "businesses", user.businessID, "purchases", purchaseId);

        // Actualiza el documento en Firestore y espera a que se complete
        await updateDoc(purchaseRef, {data});

        setLoading({ isOpen: false, message: "" });
        return data;
    } catch (error) {
        setLoading({ isOpen: false, message: "" });
        console.error("Error updating purchase: ", error);
        throw error;
    }
};

import { nanoid } from 'nanoid';
import { Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbAddMultipleFilesAndGetURLs, fbUploadFileAndGetURL } from '../img/fbUploadFileAndGetURL';
import { getNextID } from '../Tools/getNextID';
import { isImageFile, isPDFFile } from '../../utils/file/isValidFile';
import { fbUpdateProdStockForReplenish } from './fbUpdateProdStockForReplenish';

export const fbAddPurchase = async (user, purchase, fileList = [], setLoading) => {
    try {
        const id = nanoid(10);
        const purchasesRef = doc(db, "businesses", user.businessID, "purchases", id);
        setLoading({ isOpen: true, message: "Iniciando proceso de registro de Compra" });
        // Completa la información de la compra con un nuevo ID y las fechas actuales
        console.log("purchase------: ", purchase)
        const nextID = await getNextID(user, 'lastOrdersId');
        const providerRef = doc(db, "businesses", user.businessID, 'providers', purchase.provider.id);
        let data = {
            ...purchase,
            id,
            numberId: nextID,
            state: "state_3",
            type: "Direct",
            provider: providerRef,
            dates: {
                ...purchase.dates,
                deliveryDate: Timestamp.fromMillis(purchase.dates.deliveryDate),
                paymentDate: Timestamp.fromMillis(purchase.dates.paymentDate),
            }
        };

        // Sube la imagen al servidor
        if (fileList.length > 0) {
            setLoading({ isOpen: true, message: "Subiendo imagen del recibo al servidor..." });
            const files = await fbAddMultipleFilesAndGetURLs(user, "purchaseReceipts", fileList);
         
            data.fileList = [...(data?.fileList || []), ...files]

        }

        // Actualiza el stock de los productos
        setLoading({ isOpen: true, message: "Actualizando stock de productos..." });
        
        await fbUpdateProdStockForReplenish(user, data.replenishments);


        // Agrega el documento a Firestore y espera a que se complete
        console.log("*************data: ", data)
        await setDoc(purchasesRef, { data });
        // Opcionalmente, podrías devolver algún dato o confirmación
        setLoading({ isOpen: false, message: "" });
        return data;
    } catch (error) {
        setLoading({ isOpen: false, message: "" });
        // Manejar el error como consideres adecuado (e.g., re-lanzarlo, registrar en un log, etc.)
        console.error("Error adding purchase: ", error);
        throw error;
    }
};

import { Timestamp, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbUploadImageAndGetURL } from "../img/fbUploadImageAndGetURL";
import { isImageFile } from "../../utils/file/isValidFile";

const UpdateProducts = async (user, replenishments) => {
    try {
        replenishments.forEach((item) => {
            const productRef = doc(db, "businesses", user.businessID, 'products', item.id)
            const updatedStock = item.newStock + item.stock;
            updateDoc(productRef, {
                "product.stock": Number(updatedStock),
            })
        })

    } catch (error) {
        throw error;
    }
}
const UpdateOrder = async (user, order) => {
    try {
        const orderRef = doc(db, "businesses", user.businessID, 'orders', order.id)
        const providerRef = doc(db, "businesses", user.businessID, 'providers', order.provider.id)
        updateDoc(orderRef, {
            "data.state": 'state_3',
            "data.provider": providerRef,

        })

    } catch (error) {
        throw error;
    }
}
export const fbTransformOrderToPurchase = async (user, data, img, setLoading) => {
    try {
        if (!user || !user.businessID) {
            throw new Error('No user or businessID');
        };

        setLoading({ isOpen: true, message: "Iniciando proceso de registro de Compra" });
        const providerRef = doc(db, 'businesses', user.businessID, 'providers', data.provider.id);
        const purchaseRef = doc(db, 'businesses', user.businessID, 'purchases', data.id);

        let dataModified = {
            ...data,
            state: 'state_3',
            provider: providerRef,
            dates: {
                ...data.dates,
                createdAt: Timestamp.fromMillis(data.dates.createdAt),
                deliveryDate: Timestamp.fromMillis(data.dates.deliveryDate),
                paymentDate: Timestamp.fromMillis(data.dates.paymentDate),
                updatedAt: Timestamp.now(),
            }
        }

        if (isImageFile(img)) {
            setLoading({ isOpen: true, message: "Subiendo imagen del recibo al servidor..." });
            dataModified.receiptImgUrl = await fbUploadImageAndGetURL(user, "purchaseReceiptImg", img);
        }

        setLoading({ isOpen: true, message: "Actualizando stock de productos..." });
        await UpdateProducts(user, data.replenishments);

        setLoading({ isOpen: true, message: "Actualizando estado de orden..." });
        await UpdateOrder(user, data);

        setLoading({ isOpen: true, message: "Registrando detalles de la compra en la base de datos..." });
        await setDoc(purchaseRef, { data: dataModified });

    } catch (error) {
        throw error;
    }
}

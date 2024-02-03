import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbAddMultipleFilesAndGetURLs } from "../img/fbUploadFileAndGetURL";

export const fbUpdateOrder = async (user, order, fileList) => {
   
    try {
        console.log(order)
        if (!user || !user.businessID) return;
        const providerRef = doc(db, 'businesses', user.businessID, 'providers', order.provider.id)
        let data = {
            ...order,
            dates: {
                ...order.dates,
                updatedAt: Timestamp.now(),
                createdAt: Timestamp.fromMillis(order.dates.createdAt),
                deliveryDate: Timestamp.fromMillis(order.dates.deliveryDate),
            },
            provider: providerRef
        }
        const orderRef = doc(db, 'businesses', user.businessID, 'orders', order.id)
        if(fileList && fileList.length > 0){
            const files = await fbAddMultipleFilesAndGetURLs(user, "orderReceipts", fileList);
            console.log("adentro ..............................................", files)
            data.fileList = [...(data?.fileList || []), ...files]
        }
        await updateDoc(orderRef, { data })
    }
    catch (error) {
        console.error("Error updating document: ", error)
    }
}


import { Timestamp, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";
import { getNextID } from "../Tools/getNextID";
import { fbAddMultipleFilesAndGetURLs } from "../img/fbUploadFileAndGetURL";

export const fbAddOrder = async (user, value, fileList = []) => {
    try {
        if (!user || !user.businessID) return;
        const nextID = await getNextID(user, 'lastOrdersId');
        let data = {
            ...value,
            id: nanoid(12),
            numberId: nextID,
            dates: {
                ...value.dates,
                deliveryDate: Timestamp.fromMillis(value.dates.deliveryDate),
                createdAt: Timestamp.now(),
            },
            provider: value.providerId,
            state: 'state_2'
        }
        const OrderRef = doc(db, "businesses", user.businessID, "orders", data.id)
        if (fileList.length > 0) {
            const files = await fbAddMultipleFilesAndGetURLs(user, "orderReceipts", fileList);
            data.fileList = [...(data?.fileList || []), ...files]

        }
        await setDoc(OrderRef, { data })
    } catch (error) {
        console.error("Error adding document: ", error)
    }
}
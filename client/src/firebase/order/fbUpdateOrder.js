import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbUpdateOrder = async (user, order) => {
    console.log(order)
    if (!user || !user.businessID) return;
    const providerRef = doc(db, 'businesses', user.businessID, 'providers', order.provider.id)
    order = {
        ...order,
        dates: {
            ...order.dates,
            updatedAt: Timestamp.now(),
            createdAt: Timestamp.fromMillis(order.dates.createdAt),
            deliveryDate: Timestamp.fromMillis(order.dates.deliveryDate),
        },
        provider: providerRef
    }
    try {
        const orderRef = doc(db, 'businesses', user.businessID, 'orders', order.id)
        await updateDoc(orderRef, { data: order })
    }
    catch (error) {
        console.error("Error updating document: ", error)
    }
}


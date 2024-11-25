import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbDeleteOrder = async (user, id) => {

    if(!user || !user.businessID) return;
    const OrderRef = doc(db, "businesses", user.businessID, "orders", id)
    try {
        await updateDoc(OrderRef, { 'data.state': 'state_4' })
    } catch (error) {
        console.error("Error adding document: ", error)
    }
}
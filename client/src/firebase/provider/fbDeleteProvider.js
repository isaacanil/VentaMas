
import { doc, deleteDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbDeleteProvider = async (id, user) => {
    if (!user || !user?.businessID) return
    const providerRef = doc(db, "businesses", user.businessID, "providers", id)
    try {
        await deleteDoc(providerRef)
        console.log(id)
    } catch (error) {
        console.log(error)
    }
}
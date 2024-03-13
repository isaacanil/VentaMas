import { deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbDeleteProduct = async (user, id) => {
    console.log("fbDeleteProduct", user, id)
    if (!user?.businessID) { return }
    try {
        const docRef = doc(db, "businesses", user.businessID, `products`, id)
        await deleteDoc(docRef);
        console.log("Elimianodo")
    } catch (error) {
        console.log(error)
    }
}
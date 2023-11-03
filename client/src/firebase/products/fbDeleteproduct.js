import { deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbDeleteProduct = (user, id) => {
    console.log("fbDeleteProduct", user, id)
    if (!user || !user?.businessID) { return }
    deleteDoc(doc(db, "businesses", user.businessID, `products`, id));
}
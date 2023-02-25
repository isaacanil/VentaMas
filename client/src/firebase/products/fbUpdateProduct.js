import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbUpdateProduct = async (product) => {
    console.log('product from firebase', product)
    const productRef = doc(db, "products", product.id)
    await updateDoc(productRef, { product })
}
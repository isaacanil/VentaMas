import { doc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from "../firebaseconfig";

export const fbAddProduct = (data) => {
    const product = {
        ...data,
        id:  nanoid(10)
    }
    return new Promise((resolve, reject) => {
        const productRef = doc(db, "products", product.id)
        setDoc(productRef, { product })
            .then(() => {
                console.log('document written', product)
                resolve()
            })
            .catch((error) => {
                console.log('Error adding document:', error)
                reject()
            })
    })
}
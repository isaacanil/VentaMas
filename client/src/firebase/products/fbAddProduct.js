import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbAddProduct = (product) => {
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
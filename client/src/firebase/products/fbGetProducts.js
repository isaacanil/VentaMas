import { db } from "../firebaseconfig"
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore"
export const fbGetProducts = async (setProduct, trackInventory) => {
    const productRef = collection(db, "products")
    const q = query(productRef,
        trackInventory ? where("product.trackInventory", "==", true) : null,
        orderBy("product.productName", "desc"),
        orderBy("product.order", "asc"),)
    //, orderBy("product.order", "asc")
    onSnapshot(q, (snapshot) => {
        let productsArray = snapshot.docs.map(item => item.data())
        setProduct(productsArray)
    })
}
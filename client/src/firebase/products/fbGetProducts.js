import { db } from "../firebaseconfig"
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore"

export const fbGetProducts = async (setProduct, trackInventory, setProductsLoading) => {
    const productRef = collection(db, "products")
   
    const q = query(productRef,
        trackInventory ? where("product.trackInventory", "==", true) : null,
        orderBy("product.productName", "desc"),
        orderBy("product.order", "asc"),)
  
    onSnapshot(q, (snapshot) => {
        if(snapshot.empty) {
            setProduct([])
            setProductsLoading(false)
            return
        }
        let productsArray = snapshot.docs.map(item => item.data())
        setProduct(productsArray)
        setTimeout(() => {
        setProductsLoading(false)
        }, 1000)
    })
}
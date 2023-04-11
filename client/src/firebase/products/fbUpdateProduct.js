import { doc, updateDoc } from "firebase/firestore"
import { toggleLoader } from "../../features/loader/loaderSlice"
import { db } from "../firebaseconfig"

export const fbUpdateProduct = async (data, dispatch) => {
    const product = {
        ...data,
    }
    console.log('product 2 from firebase =>=>=>=>=>=>=>=>=>', product)
    const productRef = doc(db, "products", product.id)
    await updateDoc(productRef, { product })
    setTimeout(() => {
        dispatch(toggleLoader({show: false, message: ''}))
    }, 1000)
}
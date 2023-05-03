import { doc, updateDoc } from "firebase/firestore"
import { toggleLoader } from "../../features/loader/loaderSlice"
import { db } from "../firebaseconfig"

export const fbUpdateProduct = async (data, dispatch, user) => {
    const product = {
        ...data,
    }
    const { businessID } = user
    const productRef = doc(db,"businesses", businessID, "products", product.id)
    await updateDoc(productRef, { product })
    setTimeout(() => {
        dispatch(toggleLoader({show: false, message: ''}))
    }, 1000)
}
import { doc, setDoc } from "firebase/firestore"
import { addNotification } from "../../features/notification/NotificationSlice"
import { db } from "../firebaseconfig"

export const fbAddProductOutFlow = (user, productOutflow, dispatch) => {
    if (!user?.businessID) return
    productOutflow = {
        ...productOutflow,
        productList: productOutflow.productList.map((item) => ({
            ...item,
            currentRemovedQuantity: 0,
        }))
    }
    const productOutFlowRef = doc(db, "businesses", user.businessID,  'productOutflow', productOutflow.id)
    try {
        setDoc(productOutFlowRef, productOutflow)
    } catch (error) {
        dispatch(addNotification({ title: "ADD_PRODUCT_OUT_FLOW_ERROR", message: error, type: 'error' }))
    }
}
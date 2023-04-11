import { doc, setDoc } from "firebase/firestore"
import { addNotification } from "../../features/notification/NotificationSlice"
import { db } from "../firebaseconfig"

export const fbAddProductOutFlow = (productOutflow, dispatch) => {
    productOutflow = {
        ...productOutflow,
        productList: productOutflow.productList.map((item) => ({
            ...item,
            currentRemovedQuantity: 0,
            totalRemovedQuantity: item.currentRemovedQuantity,
        }))
    }
    const productOutFlowRef = doc(db, "productOutflow", productOutflow.id)
    try {
        setDoc(productOutFlowRef, productOutflow)
    } catch (error) {
        dispatch(addNotification({ title: "ADD_PRODUCT_OUT_FLOW_ERROR", message: error, type: 'error' }))
    }
}
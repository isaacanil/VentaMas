import { doc, updateDoc } from "firebase/firestore"
import { toggleLoader } from "../../features/loader/loaderSlice"
import { db } from "../firebaseconfig"
import { addNotification } from "../../features/notification/notificationSlice"

export const fbUpdateProduct = async (data, dispatch, user) => {
    const product = {
        ...data,
    }
    const { businessID } = user
    const productRef = doc(db, "businesses", businessID, "products", product.id)
    await updateDoc(productRef,  product )
        .then(() => {
            dispatch(
                addNotification({
                    title: 'Producto Actualizado',
                    message: 'Producto actualizado correctamente',
                    type: 'success'
                }))
        })
        .catch((error) => {
            dispatch(
                addNotification({
                    title: 'Error al actualizar',
                    message: 'No se pudo actualizar el producto',
                    type: 'error'
                }))
        })
}
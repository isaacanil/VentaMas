import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";


export const fbUpdateStock = async (user, array, addMode = false) => {
    if (!user?.businessID) return
    // Referencia al documento que deseas actualizar
    array.map(async (item) => {
        const id = item?.product?.id
        const miDocRef = doc(db, "businesses", user.businessID, "products", id);
        const quantity = item?.currentRemovedQuantity || item?.totalRemovedQuantity
        // Actualiza el valor de stock en el objeto product
            await updateDoc(miDocRef, {
                "product.stock": increment(Number(addMode ? quantity : -quantity)),
            }); 
    })


}

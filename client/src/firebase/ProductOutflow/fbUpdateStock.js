import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";


export const fbUpdateStock = async (array, addMode = false) => {
    // Referencia al documento que deseas actualizar
    array.map(async (item) => {
        const id = item?.product?.id
        const miDocRef = doc(db, "products", id);
        const quantity = item?.currentRemovedQuantity
        // Actualiza el valor de stock en el objeto product
            await updateDoc(miDocRef, {
                "product.stock": increment(Number(addMode ? quantity : -quantity)),
            }); 
    })


}

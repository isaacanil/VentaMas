import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbUpdateProdStockForReplenish = async (user, replenishments = []) => {
    try {
        replenishments.forEach((item) => {
            const productRef = doc(db, "businesses", user.businessID, 'products', item.id)
            const updatedStock = item.newStock + item.stock;
            updateDoc(productRef, {
                "product.stock": Number(updatedStock),
            })
        })
    } catch (error) {
        throw error;
    }
}
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbUpdateProdStockForReplenish = async (user, replenishments = []) => {
    try {
        replenishments.forEach((item) => {
            const productRef = doc(db, "businesses", user.businessID, 'products', item.id)
            const updatedStock = item.newStock;
            updateDoc(productRef, {
                "product.stock": increment(Number(updatedStock)),
            })
        })
    } catch (error) {
        throw error;
    }
}
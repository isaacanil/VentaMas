import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { validateUser } from "../../utils/userValidation";

export async function fbUpdateProductsStock(products, user) {
    try {
        products.forEach((product) => {
            validateUser(user)
            if (!product?.trackInventory) return;
            const { businessID } = user;
            const productRef = doc(db, "businesses", businessID, "products", product.id);
            const batchId = product?.batch?.id;
            const productStockId = product?.productStock?.id;


            const stockUpdateValue = increment(-Number(product?.amountToBuy));

            updateDoc(productRef, {
                "stock": stockUpdateValue,
            })

            if (product?.hasExpirationDate && batchId && productStockId) {
                const productBatchRef = doc(db, "businesses", businessID, "batches", product?.batch?.id);
                const productStockRef = doc(db, "businesses", businessID, "productsStock", product?.productStock?.id);
                console.log("Updating stock for product with expiration date **********************")
                updateDoc(productBatchRef, {
                    "quantity": stockUpdateValue,
                })
                updateDoc(productStockRef, {
                    "stock": stockUpdateValue,
                })
            }

        })
    } catch (error) {
        throw error
    }
}
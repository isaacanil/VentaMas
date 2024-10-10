import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { validateUser } from "../../utils/userValidation";
import { fbUpdateDoc } from "../firebaseOperations";

export async function fbUpdateProductsStock(products, user) {
    try {
        products.forEach((product) => {
            validateUser(user)
            if(!product?.trackInventory) return;
            const { businessID } = user;
            const productRef = doc(db, "businesses", businessID, "products", product.id);
            const productBatchRef = doc(db, "businesses", businessID,  "batches", product?.batch?.id);
            const productStockRef = doc(db, "businesses", businessID, "productsStock", product?.productStock?.id);
            const stockUpdateValue = increment(-Number(product?.amountToBuy));
        
            updateDoc(productRef, {
                "stock": stockUpdateValue,
            })
            
            if(product?.hasExpirationDate){
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
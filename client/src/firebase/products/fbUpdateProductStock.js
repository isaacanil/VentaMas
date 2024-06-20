import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { validateUser } from "../../utils/userValidation";
import { fbUpdateDoc } from "../firebaseOperations";

export async function fbUpdateProductsStock(products, user, transaction = null) {
    try {
        products.forEach((productData) => {
            validateUser(user)
            const { businessID } = user;
            const productRef = doc(db, "businesses", businessID, "products", productData.id);
            const stockUpdateValue = productData?.trackInventory ? increment(-Number(productData?.amountToBuy)) : increment(0);
            fbUpdateDoc(productRef, {
                "stock": stockUpdateValue,
            })
           
        })
    } catch (error) {
        throw error
    }
}
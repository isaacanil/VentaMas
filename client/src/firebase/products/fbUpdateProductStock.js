import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { validateUser } from "../../utils/userValidation";

export const fbUpdateProductsStock = async (products, user) => {
    products.forEach((productData) => {
        console.log(productData, " --> productData")
        try {
            validateUser(user)
            const { businessID } = user;
            const productRef = doc(db, "businesses", businessID, "products", productData.id);
            const stockUpdateValue = productData?.trackInventory ? increment(-Number(productData?.amountToBuy?.total)) : increment(0);
            updateDoc(productRef, {
                "product.stock": stockUpdateValue,
            })
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    })
}
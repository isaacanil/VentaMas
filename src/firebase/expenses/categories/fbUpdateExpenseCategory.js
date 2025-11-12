
import { Timestamp, doc, updateDoc } from "firebase/firestore";

import { db } from "../../firebaseconfig";


export const fbUpdateExpenseCategory = async (user, category) => {
    console.log(category)
    if (!user || !user.businessID) return false;

    try {
        category = {
            ...category,
            createdAt: Timestamp.fromMillis(category.createdAt),
        }

        const categoriesRef = doc(db, "businesses", user.businessID, "expensesCategories", category.id);

        await updateDoc(categoriesRef, { category });

        console.log("Category update successfully");
        return true;
    } catch (error) {
        console.error("Error updating category: ", error);
        return false;
    }
};

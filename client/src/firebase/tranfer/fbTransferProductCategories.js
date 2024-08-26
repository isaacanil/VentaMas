import { collection, getDocs, writeBatch, doc, Timestamp, query, where, limit as firebaseLimit} from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from "../firebaseconfig";

/**
 * Transfiere categorías de productos de un negocio a otro.
 * 
 * @param {string} businessIdA - ID del negocio de origen.
 * @param {string} businessIdB - ID del negocio de destino.
 */
export const transferProductCategories = async (businessIdA, businessIdB, limit = 0) => {
    const productCategoriesBusinessA = collection(db, `businesses/${businessIdA}/categories`);
    const productCategoriesBusinessB = collection(db, `businesses/${businessIdB}/categories`);

    const categoryQuery = query(productCategoriesBusinessA, firebaseLimit(limit));
    const categorySnapshot = await getDocs(categoryQuery);
    const totalCategories = categorySnapshot.docs.length;

    console.log(`Total categorías encontradas en el negocio origen (${businessIdA}): ${totalCategories}`);

    const batch = writeBatch(db);
    categorySnapshot.docs.forEach(item => {
        const category = item.data();
        const id = nanoid(12);
        const newCategoryRef = doc(productCategoriesBusinessB, id);
        batch.set(newCategoryRef, { ...category, id: id });
    });

    await batch.commit();
    console.log(`Transferencia de categorías de negocio origen (${businessIdA}) a negocio destino (${businessIdB}) completada.`);
};

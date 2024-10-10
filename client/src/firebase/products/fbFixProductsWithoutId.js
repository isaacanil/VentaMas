import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../firebaseconfig";

export async function fbFixProductsWithoutId(user) {
    if (!user?.businessID) return;
    try {
        const productsCollection = collection(db, 'businesses', user?.businessID, 'products');

        const q = query(productsCollection);
        const querySnapshot = await getDocs(q);
        console.log('-------------------- Productos sin ID:', querySnapshot.size);
        const products = querySnapshot.docs.map((doc) => ({...doc.data(), id: doc.id}));

         const BATCH_LIMIT = 500;
        const numBatches = Math.ceil(products?.length / BATCH_LIMIT);

        for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
            const batch = writeBatch(db);
            const start = batchIndex * BATCH_LIMIT;
            const end = start + BATCH_LIMIT;
            const chunk = products.slice(start, end);

            chunk.forEach((product) => {
                const productRef = doc(productsCollection, product.id);
                batch.update(productRef, { id: product.id });
            });

            await batch.commit();
        }

    } catch (error) {
        console.log('Error al corregir productos sin ID:', error);
    }
   
}
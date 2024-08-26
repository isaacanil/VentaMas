import { Timestamp, collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";

/**
 * Transfiere productos de un negocio a otro.
 * 
 * @param {string} businessIdA - ID del negocio de origen.
 * @param {string} businessIdB - ID del negocio de destino.
 * @param {number} [limit=0] - Cantidad de productos a transferir (0 para todos los productos).
 */
export const fbTransferProductsToAnotherBusiness = async (businessIdA, businessIdB, limit = 0) => {
    try {
        const productsBusinessA = collection(db, `businesses/${businessIdA}/products`);
        const productCategoriesBusinessA = collection(db, `businesses/${businessIdA}/categories`);
        const productsBusinessB = collection(db, `businesses/${businessIdB}/products`);
        const productCategoriesBusinessB = collection(db, `businesses/${businessIdB}/categories`);
        
        const querySnapshot = await getDocs(productsBusinessA);
        let totalProducts = querySnapshot.docs.length;
        
        console.log(`Total productos encontrados en el negocio origen (${businessIdA}): ${totalProducts}`);

        if (limit > 0 && limit < totalProducts) {
            totalProducts = limit;
        }

        console.log(`Total productos a transferir: ${totalProducts}`);

        // Dividir los productos en lotes de 500
        const batchSize = 500;
        let batchCount = 0;
        for (let i = 0; i < totalProducts; i += batchSize) {
            const batch = writeBatch(db);
            querySnapshot.docs.slice(i, i + batchSize).forEach(item => {
                const product = item.data();
                const id = nanoid(12);
                const changeProduct = {
                    ...product,
                    stock: 0,
                    createdAt: Timestamp.now(),
                    image: "",
                    id: id
                };
                const newProductRef = doc(productsBusinessB, id);
                batch.set(newProductRef, changeProduct);
            });

            await batch.commit();
            batchCount++;
            console.log(`Lote ${batchCount} de ${Math.ceil(totalProducts / batchSize)} procesado para negocio destino (${businessIdB}).`);
        }
        
        console.log(`Transferencia de productos de negocio origen (${businessIdA}) a negocio destino (${businessIdB}) completada.`);
    } catch (error) {
        console.error(`Error transfiriendo productos de negocio origen (${businessIdA}) a negocio destino (${businessIdB}):`, error);
    }
};

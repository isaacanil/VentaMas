import { collection, getDocs, writeBatch, doc, Timestamp, limit as firebaseLimit, query } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from "../firebaseconfig";

export const transferProducts = async (businessIdA, businessIdB, limit = 0) => {
    const productsBusinessA = collection(db, `businesses/${businessIdA}/products`);
    const productsBusinessB = collection(db, `businesses/${businessIdB}/products`);

    let q = productsBusinessA ;
    
    if(limit) {
        q = query(productsBusinessA, firebaseLimit(limit));      
    }

    const querySnapshot = await getDocs(q);

    let totalProducts = querySnapshot.docs.length;

    console.log(`Total productos encontrados en el negocio origen (${businessIdA}): ${totalProducts}`);

    if (limit > 0 && limit < totalProducts) {
        totalProducts = limit;
    }

    console.log(`Total productos a transferir: ${totalProducts}`);

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
};

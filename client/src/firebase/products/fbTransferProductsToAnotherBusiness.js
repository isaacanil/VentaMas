import { Timestamp, collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";



export const fbTransferProductsToAnotherBusiness = async (businessIdA, businessIdB) => {

    const productsBusinessA = collection(db, `businesses/${businessIdA}/products`);
    const productsBusinessB = collection(db, `businesses/${businessIdB}/products`);

    const querySnapshot = await getDocs(productsBusinessA);

    const totalProducts = querySnapshot.docs.length;
    console.log(`Total productos encontrados: ${totalProducts}`);

    // Dividir los productos en lotes de 500
    const batchSize = 500;
    let batchCount = 0;
    for (let i = 0; i < totalProducts; i += batchSize) {
        const batch = writeBatch(db);
        querySnapshot.docs.slice(i, i + batchSize)
            .forEach(item => {
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
        console.log(`Lote ${batchCount} de ${Math.ceil(totalProducts / batchSize)} procesado.`);
    }
    console.log('Transferencia de productos completada.');
};



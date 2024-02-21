import { Timestamp, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";

export const fbTransferCategoriesToAnotherBusiness = async (businessIdA, businessIdB) => {
    const categoriesBusinessA = collection(db, `businesses/${businessIdA}/categories`);
    const categoriesBusinessB = collection(db, `businesses/${businessIdB}/categories`);
    const querySnapshot = await getDocs(categoriesBusinessA);

    const totalCategories = querySnapshot.docs.length;
    console.log(`Total categorías encontradas: ${totalCategories}`);

    // Dividir las categorías en lotes de 500
    const batchSize = 500;
    let batchCount = 0;
    for (let i = 0; i < totalCategories; i += batchSize) {
        const batch = writeBatch(db);
        querySnapshot.docs.slice(i, i + batchSize).forEach(docSnapshot => {
            const category = docSnapshot.data().category;
            const id = nanoid(12); // Genera un nuevo ID único
            const changeCategory = {
                ...category,
                createdAt: Timestamp.now(),
                id: id // Asegúrate de que el nuevo ID sea el mismo que se usa para la referencia del documento
            };
            const newCategoryRef = doc(categoriesBusinessB, id);
            batch.set(newCategoryRef, {category: changeCategory});
        });

        await batch.commit();
        batchCount++;
        console.log(`Lote ${batchCount} de ${Math.ceil(totalCategories / batchSize)} procesado.`);
    }

    console.log('Transferencia de categorías completada.');
};

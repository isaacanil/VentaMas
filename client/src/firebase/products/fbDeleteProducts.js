import { db } from '../firebaseconfig';
import { collection, query, limit, getDocs, writeBatch } from 'firebase/firestore';

/**
 * Elimina hasta 500 documentos de la subcolección 'products' de un negocio específico.
 * @param {string} businessID El ID del negocio cuyos productos se van a eliminar.
 */
export const fbDeleteProducts = async (user) => {
    // Crear una referencia a la subcolección de productos
    const businessID = user?.businessID
    if(!businessID){
        return
    }
    const productsRef = collection(db, "businesses", "X63aIFwHzk3r0gmT8w6P", "products");
    
    // Crear una consulta para obtener los primeros 500 documentos de la colección
    const q = query(productsRef, limit(25));

    try {
        // Ejecutar la consulta
        const querySnapshot = await getDocs(q);

        // Crear un lote para realizar operaciones de escritura
        const batch = writeBatch(db);

        // Añadir cada documento a ser eliminado al lote
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Comprometer (ejecutar) el lote
        await batch.commit();

        console.log(`${querySnapshot.size} documentos eliminados.`);
    } catch (error) {
        console.error("Error eliminando documentos: ", error);
    }
};

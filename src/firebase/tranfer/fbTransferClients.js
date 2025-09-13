import { collection, getDocs, writeBatch, doc, query, limit as firestoreLimit } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from "../firebaseconfig";

/**
 * Transfiere clientes de un negocio a otro.
 * 
 * @param {string} businessA - ID del negocio de origen.
 * @param {string} businessB - ID del negocio de destino.
 * @param {number} limit - Cantidad de clientes a transferir (0 para todos los clientes).
 */
export const transferClients = async (businessA, businessB, limit = 0) => {
    try {
        const clientBusinessARef = collection(db, `businesses/${businessA}/clients`);
        const clientBusinessBRef = collection(db, `businesses/${businessB}/clients`);

        let clientsQuery = query(clientBusinessARef);
        if (limit > 0) {
            clientsQuery = query(clientBusinessARef, firestoreLimit(limit));
        }

        const querySnapshot = await getDocs(clientsQuery);
        let totalClients = querySnapshot.docs.length;

        console.info(`Found ${totalClients} clients to transfer`);

        if (limit > 0 && limit < totalClients) {
            totalClients = limit;
        }

        // Processing client transfer

        const batchSize = 500;
        let batchCount = 0;

        for (let i = 0; i < totalClients; i += batchSize) {
            const batch = writeBatch(db);
            querySnapshot.docs.slice(i, i + batchSize).forEach(item => {
                const client = item.data();
                const id = nanoid(12);
                const newClientRef = doc(clientBusinessBRef, id);
                batch.set(newClientRef, { ...client, id: id });
            });

            await batch.commit();
            batchCount++;
            // Batch processed
        }

        console.info("Client transfer completed successfully");
    } catch (error) {
        console.error("Error al transferir clientes: ", error);
    }
};

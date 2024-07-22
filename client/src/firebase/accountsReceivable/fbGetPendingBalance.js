import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseconfig";

export async function fbGetPendingBalance(businessID, clientId, callback) {
    const accountsReceivableRef = collection(db, `businesses/${businessID}/accountsReceivable`);

    const q = query(
        accountsReceivableRef,
        where('clientId', '==', clientId),
    );

    try {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) {
                console.log('No matching documents.');
                callback(0); // callback con balance 0 si no hay documentos
                return;
            }

            let totalPendingBalance = 0;
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                totalPendingBalance += data.arBalance;
            });

            callback(totalPendingBalance); // callback con el balance total pendiente
        });

        return unsubscribe; // Devuelve la función de desuscripción para que puedas dejar de escuchar cuando ya no sea necesario
    } catch (error) {
        console.error('Error getting documents: ', error);
        throw new Error('Error getting documents');
    }
}

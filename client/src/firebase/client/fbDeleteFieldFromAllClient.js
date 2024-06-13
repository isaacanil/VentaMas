import { collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';
import { db } from '../firebaseconfig';

export async function fbDeleteFieldFromAllClients(fieldName) {
    const businessesRef = collection(db, "businesses");
    const businessesSnapshot = await getDocs(businessesRef);

    for (const businessDoc of businessesSnapshot.docs) {
        const businessId = businessDoc.id;
        const clientsRef = collection(db, "businesses", businessId, "clients");
        const clientsSnapshot = await getDocs(clientsRef);

        for (const clientDoc of clientsSnapshot.docs) {
            const clientRef = clientDoc.ref;
            await updateDoc(clientRef, {
                [fieldName]: deleteField()
            });
        }
    }

    console.log(`Campo '${fieldName}' eliminado de todos los clientes en cada negocio.`);
}



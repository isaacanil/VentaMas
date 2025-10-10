
import { doc } from "firebase/firestore";

import { compareObjects } from "../../utils/object/compareObject";
import { db } from "../firebaseconfig";
import { fbGetDoc, fbSetDoc, fbUpdateDoc, } from "../firebaseOperations";

export async function fbUpsertClient(user, client, transaction = null) {
    try {
        if (!user || !user.businessID) throw new Error('No user or businessID');
        if (!client) return;
        if (!client.id) return;
        if (client.id === 'GC-0000') return client;
        
        const clientId = client.id
        const clientRef = doc(db, 'businesses', user.businessID, 'clients', clientId);

        const clientSnapshot = await fbGetDoc(clientRef);
        const clientExist = clientSnapshot.exists();
        const clientData = clientSnapshot.data();
        const compareVersion = compareObjects({
            object1: clientData,
            object2: client,
        });

        if (!clientExist) {
            await fbSetDoc(clientRef, { client }, transaction);
        } else {
            if (!compareVersion) {
                await fbUpdateDoc(clientRef, { client }, transaction);
            }
        }

        return client;
    } catch (error) {
        console.error("Error adding document: ", error)
    }
}
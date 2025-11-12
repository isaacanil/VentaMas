import { doc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";

import { db } from "../firebaseconfig";
import { getNextID } from "../Tools/getNextID";

import { buildClientWritePayload } from "./clientNormalizer";

export const fbAddClient = async (user, client) => {
    try {
        if (!user || !user.businessID) throw new Error('No user or businessID');
        // Processing client data
        client = { ...client, 
            id: nanoid(8) ,
            numberId: await getNextID(user, "lastClientId")
        };

        const clientRef = doc(db, 'businesses', user.businessID, 'clients', client.id);

        const { payload, client: normalizedClient } = buildClientWritePayload(client);

        await setDoc(clientRef, payload, { merge: true });
        return normalizedClient;
    } catch (error) {
        console.error("Error adding document: ", error);
    }
};

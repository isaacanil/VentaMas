import { doc, writeBatch } from "firebase/firestore";

import { db } from "../firebaseconfig";

import { clients } from "./clients"
import { buildClientWritePayload } from "./clientNormalizer";

export const fbAAddMultipleClients = (user) => {
    if(!user || !user.businessID) return;
    const batch = writeBatch(db);
    clients.forEach(({client}) => {
        const clientRef = doc(db, 'businesses', user.businessID, 'clients', client.id);
        const { payload } = buildClientWritePayload(client);
        batch.set(clientRef, payload, { merge: true });
    }
    );
    batch.commit();
};

import { collection, doc, setDoc } from "firebase/firestore";

import { buildClientWritePayload, extractNormalizedClient } from "../../../firebase/client/clientNormalizer";
import { db } from "../../../firebase/firebaseconfig";

export async function fbAddMultiClients(user, clientsData) {
    if (!user || !user?.businessID) {
      return;
    }
    const { businessID } = user;
    const clientsCollectionRef = collection(db, "businesses", businessID, "clients");
  
    const promises = clientsData.map((clientData = {}) => {
      const normalized = extractNormalizedClient(clientData);
      const { payload } = buildClientWritePayload(normalized);
      const clientId = normalized?.id || clientData?.client?.id;
      if (!clientId) return Promise.resolve();
      const clientRef = doc(clientsCollectionRef, clientId);
      return setDoc(clientRef, payload, { merge: true });
    });
  
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Error adding multiple clients", error);
    }
  }

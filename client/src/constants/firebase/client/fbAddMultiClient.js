import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseconfig";

export async function fbAddMultiClients(user, clientsData) {
    if (!user || !user?.businessID) {
      return;
    }
    const { businessID } = user;
    const clientsCollectionRef = collection(db, "businesses", businessID, "clients");
  
    const promises = clientsData.map((clientData) => {
      const clientRef = doc(clientsCollectionRef, clientData.client.id);
      return setDoc(clientRef, clientData);
    });
  
    try {
      await Promise.all(promises);
      promises.forEach((promise, index) => {
      });
    } catch (error) {
    }
  }
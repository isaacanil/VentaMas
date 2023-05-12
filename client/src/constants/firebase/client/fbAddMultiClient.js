import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseconfig";

export async function fbAddMultiClients(user, clientsData) {
    if (!user || !user?.businessID) {
      console.log("No business ID found. Please contact support."); //TODO: replace with toast
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
        console.log(`Producto ${index + 1} añadido con ID: ${clientsData[index].client.id}`);
      });
    } catch (error) {
      console.error(`Error al agregar los productos: ${error}`);
    }
  }
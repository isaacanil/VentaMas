import { doc, setDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { nanoid } from "nanoid"
import { getNextID } from "../Tools/getNextID";

export const fbAddClient = async (user, client) => {
    try {
        if (!user || !user.businessID) throw new Error('No user or businessID');
      console.log('cliente', client)
        client = { ...client, 
            id: nanoid(8) ,
            numberId: await getNextID(user, "lastClientId")
        }

        const clientRef = doc(db, 'businesses', user.businessID, 'clients', client.id);

        await setDoc(clientRef, { client });
        return client;
    } catch (error) {
        console.error("Error adding document: ", error)
    }
}


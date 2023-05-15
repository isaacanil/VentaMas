import { doc, setDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { nanoid } from "nanoid"

export const fbAddClient = async (client, user) => {
    if (!user || !user.businessID) return
    console.log(client)
    client = { ...client, id: nanoid(8) }
    try {
        const clientRef = doc(db, 'businesses', user.businessID, 'clients', client.id)
        await setDoc(clientRef, { client })
    } catch (error) {
        console.error("Error adding document: ", error)
    }
}


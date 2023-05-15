import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbUpdateClient = async (client, user) => {
    console.log('user from fbUpdateClient', user)
    if(!user || !user.businessID) return

    const clientRef = doc(db, "businesses", user.businessID, 'clients', client.id)
    await updateDoc(clientRef, { client })
        .then(() => { console.log('product from firebase', client) })
}
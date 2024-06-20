import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbUpdateClient = async (user, client ) => {
    console.log('user from fbUpdateClient', user)
    if(!user || !user.businessID) return

    const clientRef = doc(db, "businesses", user.businessID, 'clients', client.id)
    await updateDoc(clientRef, { client })
}
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbUpdateClient = async (user, client) => {
    console.log('user from fbUpdateClient', client)
    if(!user || !user.businessID) return

    const clientRef = doc(db, "businesses", user.businessID, 'clients', client.id)
    try {
        const docSnap = await getDoc(clientRef)
        if(!docSnap.exists()) {
            console.log('No such document!')
        }
        await updateDoc(clientRef, { client })
    } catch (error) {
        console.error('Error updating document: ', error)
    }
}
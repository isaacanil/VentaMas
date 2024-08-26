import { db } from "../firebaseconfig"
import { doc, deleteDoc } from "firebase/firestore"

export const fbDeleteClient = async (businessID, id) => {
    try {
   
        if (!businessID) throw new Error('No businessID');
        if (!id) throw new Error('No id');
        const clientRef = doc(db, "businesses", businessID, "clients", id)
        await deleteDoc(clientRef);
   
    } catch (error) {
        console.error('Error deleting document: ', error)
    }
}

export const deleteMultipleClients = (array) => {
    array.forEach((id) => {
        fbDeleteClient(id)
    })
}
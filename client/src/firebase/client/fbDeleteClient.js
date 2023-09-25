import { db } from "../firebaseconfig"
import { doc, deleteDoc } from "firebase/firestore"

export const fbDeleteClient = async (user, id) => {
    try {
        console.log(id);
        console.log(user);
        if (!user || !user.businessID) throw new Error('No user or businessID');
        const counterRef = doc(db, "businesses", user.businessID, "clients", id)
        await deleteDoc(counterRef);
   
    } catch (error) {
        console.log(error)
    }
}

export const deleteMultipleClients = (array) => {
    array.forEach((id) => {
        fbDeleteClient(id)
    })
}
import { db } from "../firebaseconfig"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"

export const fbGetProviders = async (setProviders, user) => {
    if(!user || !user?.businessID) return
    const providersRef = collection(db, "businesses", user.businessID, "providers")
    const q = query(providersRef, orderBy("provider.name", "asc"))
    onSnapshot(q, (snapshot) => {
        let providersArray = snapshot.docs.map(item => item.data())
        setProviders(providersArray)
    })
}

import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseconfig'

export const fbUpdateProvider = async (provider, user) => {
    if (!user || !user?.businessID) return
    const providerRef = doc(db, "businesses", user.businessID, 'providers', provider.id)
    await updateDoc(providerRef, { provider })
        .then(() => { console.log('product from firebase', provider) })
}
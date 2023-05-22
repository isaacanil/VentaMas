import { nanoid } from "nanoid"
import { db } from "../firebaseconfig"
import { doc, setDoc } from "firebase/firestore"
export const fbAddProvider = async (provider, user) => {
    if(!user || !user?.businessID) return 
    provider = {
        ...provider,
        id: nanoid(10)
    }
    try {
      const providerRef = doc(db, "businesses", user.businessID, 'providers', provider.id)
      await setDoc(providerRef, { provider })
        console.log("Document written with ID: ", provider.id)
    } catch (error) {
      console.error("Error adding document: ", error)
    }
  }
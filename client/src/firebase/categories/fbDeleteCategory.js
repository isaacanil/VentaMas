import { deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbDeleteCategory = async (id, user) => {
  
  if(!user || !user?.businessID) return
  
  const { businessID } = user
  const categoryRef = doc(db, "businesses", businessID, "categories", id)
  try {
    await deleteDoc(categoryRef)
    console.log(id)
  } catch (error) {
    console.log(error)
  }
}
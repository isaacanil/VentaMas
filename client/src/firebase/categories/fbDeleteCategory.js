import { deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbDeleteCategory = async (user, id) => {

  if (!user || !user?.businessID) return

  const { businessID } = user
  const categoryRef = doc(db, "businesses", businessID, "categories", id)
  try {
    await deleteDoc(categoryRef)
  } catch (error) {
    console.error(error)
  }
}
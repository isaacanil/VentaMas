import { Timestamp, doc, setDoc } from "firebase/firestore"
import { nanoid } from "nanoid"
import { db } from "../firebaseconfig"

export const fbAddCategory = async (user, category) => {
  const { businessID } = user
  if (!businessID) {  return  }

  const id = nanoid(10);
  category = {
    ...category,
    id,
    createdAt: Timestamp.now(),
  }
  let categoryRef = doc(db, "businesses", businessID, 'categories', category.id);
  await setDoc(categoryRef, { category }).then(() => {
  }).catch((error) => {
    console.error(error)
  })
}
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbUpdateCategory = async (category, user) => {

    if (!user || !user?.businessID) {
      return console.log('no tienes permisos para realizar esta acción')
    }
    const { businessID } = user
    const counterRef = doc(db, "businesses", String(businessID), "categories", category.id)
    try {
      updateDoc(counterRef,
        { category }
      );
      console.log('listo, todo bien')
    } catch (err) {
      console.log('todo mal')
    }
  }
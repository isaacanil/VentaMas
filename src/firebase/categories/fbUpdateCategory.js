import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbUpdateCategory = async (category, user) => {

    if (!user || !user?.businessID) {
              return console.warn('No tienes permisos para realizar esta acción')
    }
    const { businessID } = user
    const counterRef = doc(db, "businesses", String(businessID), "categories", category.id)
    try {
      updateDoc(counterRef,
        { category }
      );
              // Category updated successfully
    } catch (err) {
        console.error('Error updating category:', err)
    }
  }
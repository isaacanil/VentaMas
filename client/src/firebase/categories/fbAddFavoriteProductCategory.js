import { arrayUnion, doc, serverTimestamp, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbAddFavoriteProductCategory = async (user, category) => {
    const { businessID, uid } = user;
    if (!businessID) { return }
    if (!uid) { return }
    if (!category) {  return   }

    const categoryId = category.id;
    let favoriteProductCategoryRef = doc(db, "businesses", businessID, 'users', uid, 'productCategories', 'favorite');
    try {
        const docSnapshot = await getDoc(favoriteProductCategoryRef);
        if (docSnapshot.exists()) {
            await updateDoc(favoriteProductCategoryRef, {
                favoriteCategories: arrayUnion(categoryId),
                updatedAt: serverTimestamp()
            });
        } else {
            await setDoc(favoriteProductCategoryRef, {
                favoriteCategories: [categoryId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return;
        }
    } catch (error) {
        console.error('Error al añadir categoría favorita al arreglo: ', error);
    }
}


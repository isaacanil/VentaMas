import { doc, updateDoc, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseconfig";

/**
 * Elimina una categoría de la lista de favoritos de un usuario.
 * 
 * @param {Object} user Objeto del usuario que contiene businessID y uid.
 * @param {String} categoryId El ID de la categoría a eliminar.
 */
export const fbRemoveFavoriteProductCategory = async (user, categoryId) => {
    const { businessID, uid } = user;
    if (!businessID || !uid) {
        return;
    }
    if (!categoryId) {
        return;
    }

    const favoriteProductCategoryRef = doc(db, "businesses", businessID, 'users', uid, 'productCategories', 'favorite');

    try {
        await updateDoc(favoriteProductCategoryRef, {
            favoriteCategories: arrayRemove(categoryId),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error al eliminar categoría de favoritos: ', error);
    }
};

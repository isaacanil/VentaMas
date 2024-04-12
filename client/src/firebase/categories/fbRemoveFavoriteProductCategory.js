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
        console.log('No tienes permisos para realizar esta acción');
        return;
    }
    if (!categoryId) {
        console.log('No se ha proporcionado el ID de la categoría');
        return;
    }

    // Referencia al documento que contiene el arreglo de categorías favoritas
    const favoriteProductCategoryRef = doc(db, "businesses", businessID, 'users', uid, 'productCategories', 'favorite');

    try {
        await updateDoc(favoriteProductCategoryRef, {
            favoriteCategories: arrayRemove(categoryId),
            updatedAt: serverTimestamp()
        });
        console.log('Categoría eliminada de favoritos con éxito');
    } catch (error) {
        console.error('Error al eliminar categoría de favoritos: ', error);
    }
};

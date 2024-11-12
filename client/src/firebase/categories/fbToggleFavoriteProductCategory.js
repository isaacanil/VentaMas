import { arrayUnion, arrayRemove, doc, serverTimestamp, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbToggleFavoriteProductCategory = async (user, category) => {
    const { businessID, uid } = user;
    const categoryId = category?.id;

    if (!businessID || !uid) {
        console.log('No tienes permisos para realizar esta acción');
        return;
    }
    if (!categoryId) {
        console.log('No se ha proporcionado el ID de la categoría');
        return;
    }

    const favoriteProductCategoryRef = doc(db, "businesses", businessID, 'users', uid, 'productCategories', 'favorite');

    try {
        const docSnapshot = await getDoc(favoriteProductCategoryRef);

        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const favoriteCategories = data.favoriteCategories || [];

            if (favoriteCategories.includes(categoryId)) {
                // Si la categoría ya está en favoritos, la eliminamos
                await updateDoc(favoriteProductCategoryRef, {
                    favoriteCategories: arrayRemove(categoryId),
                    updatedAt: serverTimestamp()
                });
                console.log('Categoría eliminada de favoritos con éxito');
            } else {
                // Si no está, la añadimos
                await updateDoc(favoriteProductCategoryRef, {
                    favoriteCategories: arrayUnion(categoryId),
                    updatedAt: serverTimestamp()
                });
                console.log('Categoría añadida a favoritos con éxito');
            }
        } else {
            // Si el documento no existe, lo creamos y añadimos la categoría
            await setDoc(favoriteProductCategoryRef, {
                favoriteCategories: [categoryId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log('Categoría favorita añadida con éxito');
        }
    } catch (error) {
        console.error('Error al alternar categoría favorita: ', error);
    }
};

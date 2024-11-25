import { arrayUnion, arrayRemove, doc, serverTimestamp, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbToggleFavoriteProductCategory = async (user, category) => {
    const { businessID, uid } = user;
    const categoryId = category?.id;

    if (!businessID || !uid) {
        return;
    }
    if (!categoryId) {
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
            } else {
                // Si no está, la añadimos
                await updateDoc(favoriteProductCategoryRef, {
                    favoriteCategories: arrayUnion(categoryId),
                    updatedAt: serverTimestamp()
                });
            }
        } else {
            // Si el documento no existe, lo creamos y añadimos la categoría
            await setDoc(favoriteProductCategoryRef, {
                favoriteCategories: [categoryId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error al alternar categoría favorita: ', error);
    }
};

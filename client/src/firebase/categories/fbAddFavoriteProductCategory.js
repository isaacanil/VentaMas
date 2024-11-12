import { arrayUnion, doc, serverTimestamp, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbAddFavoriteProductCategory = async (user, category) => {
    const { businessID, uid } = user;
    console.log("prueba, ", category)
    if (!businessID) {
        return console.log('no tienes permisos para realizar esta acción');
    }
    if (!uid) {
        return console.log('no tienes permisos para realizar esta acción');
    }
    if (!category) {
        return console.log('no se ha proporcionado la categoría');
    }
    console.log('Añadiendo categoría favorita...', category);

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
            console.log('No se encontraron categorías favoritas, creando nuevo documento...');
            await setDoc(favoriteProductCategoryRef, {
                favoriteCategories: [categoryId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log('Categoría favorita añadida con éxito');
            return;
        }
        console.log('Categoría favorita añadida con éxito');
    } catch (error) {
        console.error('Error al añadir categoría favorita al arreglo: ', error);
    }
}


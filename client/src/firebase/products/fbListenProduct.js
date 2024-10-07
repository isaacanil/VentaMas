import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseconfig";

/**
 * Escucha los cambios en un documento específico de Firestore y actualiza el estado en Redux.
 * @param {string} businessID - ID del negocio.
 * @param {string} productId - ID del producto.
 * @returns {Function} - Función de desuscripción para el listener.
 */
export const listenToProduct = (user, productId, onData, onError) => {
    if(!user?.businessID) return;
        const productRef = doc(db, "businesses", user.businessID, "products", productId);

        const unsubscribe = onSnapshot(
            productRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    onData(docSnap.data());
                } else {
                    onError(new Error('El producto no existe'));
                }
            },
            (error) => {
                onError(error);
            }
        );

        // Retornar la función de desuscripción para poder llamarla cuando sea necesario
        return unsubscribe;
    
};

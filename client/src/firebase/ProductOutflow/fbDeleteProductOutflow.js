// import { deleteDoc, doc } from 'firebase/firestore'
// import React from 'react'
// import { db } from '../firebaseconfig'

// export const fbDeleteProductOutflow = async (user, item) => {
//     const docRef = doc(db, "businesses", user.businessID, "productOutflow", item.id)
//     try {
//         await deleteDoc(docRef)
//         console.log("doc eliminado")
//     } catch (error) {
//         console.log(error)
//     }
// }

import { db } from '../firebaseconfig';
import { doc, deleteDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { fbUpdateStock } from './fbUpdateStock'; // Asegúrate de que esta función pueda manejar el ajuste de stock adecuadamente

export const fbDeleteProductOutflow = async (user, item) => {
    if (!user?.businessID || !item?.id) return;

    const docRef = doc(db, "businesses", user.businessID, "productOutflow", item.id);
    const userRef = doc(db, "users", user.uid);
    try {
        // Paso 1: Obtener la información del documento antes de eliminarlo
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            console.log("Documento no existe, no se puede ajustar el stock ni eliminar.");
            return;
        }
        const productOutflow = docSnap.data();

        // Paso 2: Ajustar el stock para cada producto en la salida de producto
        if (productOutflow.productList && productOutflow.productList.length > 0) {
            const updates = productOutflow.productList.map(product => ({
                product: product.product,

                // Asegúrate de que la cantidad sea positiva para incrementar el stock
                quantityRemoved: product.quantityRemoved // Así reviertes el cambio original
            }));
            await fbUpdateStock(user, updates); // Ajusta el stock basándose en estas "reversiones"
        }

        // Paso 3: Eliminar el documento de la salida de producto
        await updateDoc(docRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(), // Registrar cuándo se marcó como eliminado
            deleteBy: userRef,
            updatedAt: serverTimestamp()
        });
        console.log("Documento eliminado y stock ajustado correctamente.");

    } catch (error) {
        console.error("Error al eliminar la salida de producto:", error);
    }
};


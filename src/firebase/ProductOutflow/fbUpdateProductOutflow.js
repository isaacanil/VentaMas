import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '../firebaseconfig';

import { fbUpdateStock } from './fbUpdateStock'

// Función principal que orquesta la actualización de la salida de productos y el inventario
export const fbUpdateProductOutflow = async (user, newItem) => {

    if (!user?.businessID || !newItem?.id) return;

    const productOutflowRef = doc(db, "businesses", user.businessID, "productOutflow", newItem.id);

    try {
        const currentItem = await getCurrentProductOutflow(productOutflowRef);
        if (!currentItem) {
            console.warn("Product outflow document not found");
            return;
        }

        const updates = calculateDifferences(currentItem.productList, newItem.productList);
        // Applying updates
        await fbUpdateStock(user, updates);
        await updateDoc(productOutflowRef, newItem);
    } catch (error) {
        console.error("Error updating product outflow:", error);
    }
};

// Obtener el documento de salida de producto actual
const getCurrentProductOutflow = async (productOutflowRef) => {
    const docSnap = await getDoc(productOutflowRef);
    return docSnap.exists() ? docSnap.data() : null;
};

// Calcular la diferencia de cantidad para cada producto
const calculateDifferences = (currentItems, newItems) => {
    return newItems.map(newItem => {
        const currentItem = currentItems.find(item => item.id === newItem.id) || {};
        const quantityDifference =  (currentItem.quantityRemoved || 0) - newItem.quantityRemoved;
        return { product: newItem.product, quantityRemoved: quantityDifference };
    });
};




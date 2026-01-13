// Importa las funciones necesarias desde el SDK de Firebase Firestore
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

type UpdateProductItem = {
  name: string;
  barCode: string;
  listPrice: number;
};

/**
 * Función para actualizar el `listPrice` de productos en Firestore de manera paralela.
 * @param {Array} items - Array de objetos con `name`, `barCode`, y `listPrice` para actualizar.
 * @param {string} userBusinessID - ID del negocio del usuario para identificar la ubicación en Firestore.
 */
export async function updateProductListPrices(
  items: UpdateProductItem[],
  userBusinessID: string,
): Promise<void> {
  // Crea un array de promesas para procesar en paralelo
  const updatePromises = items.map(async (item) => {
    try {
      // Buscar el documento del producto usando `name` y `barCode`
      const docSnapshot = await findProductDocument(item, userBusinessID);
      if (docSnapshot) {
        // Actualizar el `listPrice` si se encuentra el documento
        await updateProductListPrice(docSnapshot.id, item, userBusinessID);
      } else {
        // Product not found - could log to a separate system if needed
      }
    } catch (error) {
      console.error(`Error al actualizar el producto ${item.name}:`, error);
    }
  }); // Espera a que todas las actualizaciones se completen
  await Promise.all(updatePromises);
}

/**
 * Busca un documento de producto en Firestore basado en `name` y `barCode`.
 * @param {Object} item - El item que contiene `name` y `barCode` para identificar el producto.
 * @param {string} userBusinessID - ID del negocio del usuario.
 * @returns {DocumentSnapshot|null} - Retorna el documento encontrado o null si no se encuentra.
 */
async function findProductDocument(
  item: UpdateProductItem,
  userBusinessID: string,
): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  const q = query(
    collection(db, `businesses/${userBusinessID}/products`),
    where('name', '==', item.name),
    where('barcode', '==', item.barCode),
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Retorna el primer documento que coincide
    return querySnapshot.docs[0];
  } else {
    return null;
  }
}

/**
 * Actualiza el campo `pricing.listPrice` en un documento de producto de Firestore.
 * @param {string} docId - ID del documento en Firestore.
 * @param {Object} item - El item que contiene `listPrice`.
 * @param {string} userBusinessID - ID del negocio del usuario.
 */
async function updateProductListPrice(
  docId: string,
  item: UpdateProductItem,
  userBusinessID: string,
): Promise<void> {
  const docRef = doc(db, `businesses/${userBusinessID}/products`, docId);

  await updateDoc(docRef, {
    'pricing.listPrice': item.listPrice,
    'pricing.price': item.listPrice, // Actualiza el precio también
  });
}

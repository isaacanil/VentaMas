// import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'; // Importa las funciones necesarias de Firestore
// import { db } from '../firebaseconfig';

// export async function checkDuplicateProducts(businessID) {
//   try {
//     const productsRef = collection(db, 'businesses', businessID, 'products');
//     const productSnapshot = await getDocs(productsRef);
    
//     const products = {};
//     const batch = writeBatch(db); // Prepara un batch para operaciones de escritura agrupadas
    
//     productSnapshot.forEach((doc) => {
//       const product = doc.data().name; // Asume que cada producto tiene un campo 'name'
//       if (products[product]) {
//         // Si el producto ya existe, planifica su eliminación en el batch
//         batch.delete(doc.ref);
//       } else {
//         products[product] = true;
//       }
//     });

//     if (batch._mutations.length > 0) { // Verifica si hay operaciones en el batch
//       await batch.commit(); // Ejecuta las operaciones en el batch
//       console.log(`Eliminados ${batch._mutations.length} productos duplicados.`);
//     }
//   } catch (error) {
//     // Lanza o maneja el error de acuerdo a tu lógica de negocio
//     console.error("Error al procesar productos duplicados:", error);
//     throw new Error("Falló la eliminación de productos duplicados.");
//   }
// }

import { collection, getDocs, writeBatch } from 'firebase/firestore'; // Importa las funciones necesarias de Firestore
import { db } from '../firebaseconfig';


export async function fbCheckDuplicateProducts(businessID) {
  try {
    const productsRef = collection(db, 'businesses', businessID, 'products');
    const productSnapshot = await getDocs(productsRef);
    
    const uniqueProducts = new Map();
    const batch = writeBatch(db);

    productSnapshot.forEach((doc) => {
      const productData = doc.data();
      const productName = productData.name;

      // Si el nombre del producto ya existe en el mapa, se planifica su eliminación
      if (uniqueProducts.has(productName)) {
        batch.delete(doc.ref);
      } else {
        // Si no, se añade al mapa para rastrearlo como único
        uniqueProducts.set(productName, doc.ref);
      }
    });

    // Verifica si hay documentos para eliminar
    if (uniqueProducts.size < productSnapshot.size) { // Corregido aquí
      await batch.commit(); // Ejecuta las operaciones en el batch
      console.log(`Eliminados duplicados, manteniendo ${uniqueProducts.size} productos únicos.`);
    } else {
      console.log("No se encontraron productos duplicados para eliminar.");
    }
  } catch (error) {
    console.error("Error al procesar productos duplicados:", error);
    throw new Error("Falló la eliminación de productos duplicados debido a un error.");
  }
}


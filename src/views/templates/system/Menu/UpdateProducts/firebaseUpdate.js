import { doc, updateDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';

import { db } from '../../../../../firebase/firebaseconfig';

/**
 * Actualiza los campos de pricing de un producto sin modificar el resto de campos
 * @param {Object} user - Usuario actual con businessID
 * @param {string} productID - ID del producto a actualizar
 * @param {Object} newPricing - Objeto con los nuevos valores de pricing
 * @returns {Promise<void>}
 */
export async function updateProductPricing(user, productID, newPricing) {
  if (!user?.businessID) return;
  const businessID = user.businessID;

  const productRef = doc(db, `businesses/${businessID}/products/${productID}`);
  
  // Extraer solo los campos que nos interesan del objeto newPricing
  const { listPrice, minPrice, avgPrice, tax } = newPricing;
  
  const pricingUpdate = {
    'pricing.listPrice': listPrice,
    'pricing.minPrice': minPrice,
    'pricing.avgPrice': avgPrice,
    'pricing.price': listPrice, // price se iguala a listPrice
    'pricing.tax': tax
  };
  
  // Actualiza solo los campos específicos dentro de pricing
  await updateDoc(productRef, pricingUpdate);
};

/**
 * Actualiza los precios de múltiples productos usando Firestore Batch
 * Ahora busca productos por nombre en lugar de ID
 * @param {Object} user - Usuario actual con businessID
 * @param {Array} products - Lista de productos a actualizar
 * @param {Function} progressCallback - Función para reportar el progreso (0-100) y mensajes
 * @returns {Promise<Object>} - Resultados de la operación
 */
export async function updateProductsBatch(user, products, progressCallback = null) {
  if (!user?.businessID || !products?.length) {
    return { total: 0, updated: 0, skipped: 0, errors: [], notFound: 0 };
  }

  const businessID = user.businessID;
  const results = {
    total: products.length,
    updated: 0,
    skipped: 0,
    notFound: 0,
    errors: []
  };

  // Inicializar progreso
  if (progressCallback) {
    progressCallback(0, 'Iniciando búsqueda de productos...');
  }

  // Procesar productos en grupos más pequeños para evitar sobrecargar Firestore
  const PROCESS_CHUNK_SIZE = 100;
  const productsToUpdate = [];

  // Primero, buscar todos los productos por nombre para obtener sus IDs
  for (let i = 0; i < products.length; i += PROCESS_CHUNK_SIZE) {
    const chunk = products.slice(i, i + PROCESS_CHUNK_SIZE);
    
    if (progressCallback) {
      const progress = Math.round((i / products.length) * 50); // 50% del progreso total será para búsqueda
      progressCallback(progress, `Buscando productos ${i+1}-${Math.min(i+PROCESS_CHUNK_SIZE, products.length)} de ${products.length}...`);
    }

    await Promise.all(chunk.map(async (product) => {
      try {
        if (!product.name) {
          results.skipped++;
          results.errors.push({ 
            product: 'Unknown', 
            error: 'Nombre de producto no definido' 
          });
          return;
        }

        // Buscar el producto por nombre
        const productsRef = collection(db, `businesses/${businessID}/products`);
        const q = query(productsRef, where("name", "==", product.name));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          results.notFound++;
          results.errors.push({ 
            product: product.name, 
            error: 'Producto no encontrado en la base de datos' 
          });
          return;
        }

        // Si encontramos el producto, guardamos la referencia y los datos a actualizar
        querySnapshot.forEach(doc => {
          productsToUpdate.push({
            ref: doc.ref,
            id: doc.id,
            name: product.name,
            pricing: product.pricing
          });
        });

      } catch (err) {
        results.skipped++;
        results.errors.push({ 
          product: product.name || 'Unknown', 
          error: err.message 
        });
      }
    }));
  }

  // Ahora actualizar todos los productos encontrados en lotes
  const BATCH_SIZE = 500;
  
  for (let i = 0; i < productsToUpdate.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const currentBatch = productsToUpdate.slice(i, i + BATCH_SIZE);
    
    // Actualizar progreso
    if (progressCallback) {
      const progress = 50 + Math.round(((i / productsToUpdate.length) * 50)); // 50-100% para actualización
      progressCallback(progress, `Actualizando productos ${i+1}-${Math.min(i+BATCH_SIZE, productsToUpdate.length)} de ${productsToUpdate.length}...`);
    }
    
    // Actualizar cada producto en el lote
    currentBatch.forEach(product => {
      try {
        if (!product.pricing) {
          results.skipped++;
          results.errors.push({ 
            product: product.name || 'Unknown', 
            error: 'Información de precios no definida' 
          });
          return;
        }
        
        const { listPrice, minPrice, avgPrice, tax } = product.pricing;
        
        // Actualiza los campos específicos dentro de pricing
        batch.update(product.ref, {
          'pricing.listPrice': listPrice,
          'pricing.minPrice': minPrice,
          'pricing.avgPrice': avgPrice,
          'pricing.price': listPrice, // price se iguala a listPrice
          'pricing.tax': tax
        });
        
        results.updated++;
      } catch (err) {
        results.skipped++;
        results.errors.push({ 
          product: product.name || 'Unknown', 
          error: err.message 
        });
      }
    });
    
    // Ejecutar el lote
    try {
      await batch.commit();
    } catch (err) {
      // Si falla el lote completo, marcamos todos como error
      currentBatch.forEach(product => {
        results.updated--; // Restar los contados previamente
        results.skipped++;
        results.errors.push({ 
          product: product.name || 'Unknown', 
          error: `Error en lote: ${err.message}` 
        });
      });
    }
  }

  // Establecer progreso final al 100%
  if (progressCallback) {
    progressCallback(100, `¡Actualización completada! ${results.updated} productos actualizados, ${results.notFound} no encontrados.`);
  }

  return results;
};
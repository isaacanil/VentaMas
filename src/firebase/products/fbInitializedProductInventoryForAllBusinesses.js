import { serverTimestamp } from 'firebase/firestore';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { BatchStatus } from '@/models/Warehouse/Batch';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import { getDefaultWarehouse } from '@/firebase/warehouse/warehouseService';

import { fbGetProducts } from './fbGetProducts';

const BATCH_SIZE = 166; // Tamaño seguro para procesamiento por lotes

/**
 * Elimina todos los documentos de las colecciones "batches" y "productsStock" de un negocio.
 * IMPORTANTE: Si existen muchos documentos, conviene implementar la eliminación en múltiples lotes.
 *
 * @param {string} businessID - ID del negocio.
 */
async function clearInventoryCollections(businessID) {
  const batchesRef = collection(db, 'businesses', businessID, 'batches');
  const productsStockRef = collection(
    db,
    'businesses',
    businessID,
    'productsStock',
  );

  // Obtener los documentos actuales de ambas colecciones
  const [batchesSnapshot, productsStockSnapshot] = await Promise.all([
    getDocs(batchesRef),
    getDocs(productsStockRef),
  ]);

  const batch = writeBatch(db);
  batchesSnapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  productsStockSnapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
}

/**
 * Procesa un lote de productos para un negocio específico.
 * Crea un batch y un productStock para cada producto que no tenga estos documentos.
 * Si el stock es negativo, crea además un backorder y actualiza el producto a stock 0.
 *
 * @param {Array} products - Productos a procesar.
 * @param {string} businessID - ID del negocio.
 * @param {Object} defaultWarehouse - Almacén predeterminado del negocio.
 * @param {Object} baseRefs - Referencias a las colecciones (batches, productsStock, movements).
 * @param {Function} onProgress - Callback para reportar el progreso.
 * @param {number} startIndex - Índice de inicio en el arreglo de productos.
 */
async function processBatchOfProducts(
  products,
  businessID,
  defaultWarehouse,
  baseRefs,
  onProgress,
  startIndex,
) {
  const batch = writeBatch(db);
  const createdDocs = [];
  const { batchRef, stockRef, movementRef } = baseRefs;

  // Se utiliza un usuario de sistema para las operaciones
  const systemUser = { uid: 'system', businessID };
  // Reservar bloque de IDs para todo el lote
  const startBatchNumber = await getNextID(
    systemUser,
    'batches',
    products.length,
  );

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const globalIndex = startIndex + i;
    const progress = 10 + (globalIndex / products.length) * 90;

    onProgress?.({
      status: `Procesando producto ${globalIndex + 1}/${products.length}: ${product.name}`,
      progress,
      currentProduct: product,
    });

    const baseFields = {
      createdAt: serverTimestamp(),
      createdBy: systemUser.uid,
      updatedAt: serverTimestamp(),
      updatedBy: systemUser.uid,
      deletedAt: null,
      deletedBy: null,
      isDeleted: false,
    };

    // Caso: stock negativo
    if (product.stock < 0) {
      // Crear backorder
      const backOrderDoc = {
        ...baseFields,
        id: nanoid(),
        productId: product.id,
        productName: product.name,
        initialQuantity: Math.abs(product.stock),
        pendingQuantity: Math.abs(product.stock),
        status: 'pending',
        requestedAt: serverTimestamp(),
      };

      batch.set(
        doc(
          collection(db, 'businesses', businessID, 'backOrders'),
          backOrderDoc.id,
        ),
        backOrderDoc,
      );

      // Crear batch y productStock con cantidad 0
      const batchDoc = {
        ...baseFields,
        id: nanoid(),
        productId: product.id,
        productName: product.name,
        numberId: startBatchNumber + i,
        status: BatchStatus.Inactive,
        receivedDate: serverTimestamp(),
        providerId: null,
        quantity: 0,
        initialQuantity: 0,
        backOrderId: backOrderDoc.id,
      };

      const stockDoc = {
        ...baseFields,
        id: nanoid(),
        batchId: batchDoc.id,
        productName: product.name,
        batchNumberId: startBatchNumber + i,
        location: defaultWarehouse.id,
        status: BatchStatus.Inactive,
        expirationDate: null,
        productId: product.id,
        quantity: 0,
        initialQuantity: 0,
        backOrderId: backOrderDoc.id,
      };

      // Actualizar el producto: se fija el stock en 0 y se inactiva
      batch.update(doc(db, 'businesses', businessID, 'products', product.id), {
        stock: 0,
        status: 'inactive',
        updatedAt: serverTimestamp(),
        updatedBy: systemUser.uid,
      });

      createdDocs.push({ batchDoc, stockDoc });
      continue;
    }

    // Caso: stock igual a 0
    if (product.stock === 0) {
      const batchDoc = {
        ...baseFields,
        id: nanoid(),
        productId: product.id,
        productName: product.name,
        numberId: startBatchNumber + i,
        status: BatchStatus.Inactive,
        receivedDate: serverTimestamp(),
        providerId: null,
        quantity: 0,
        initialQuantity: 0,
      };

      const stockDoc = {
        ...baseFields,
        id: nanoid(),
        batchId: batchDoc.id,
        productName: product.name,
        batchNumberId: startBatchNumber + i,
        location: defaultWarehouse.id,
        status: BatchStatus.Inactive,
        expirationDate: null,
        productId: product.id,
        quantity: 0,
        initialQuantity: 0,
      };

      batch.update(doc(db, 'businesses', businessID, 'products', product.id), {
        status: 'inactive',
        updatedAt: serverTimestamp(),
        updatedBy: systemUser.uid,
      });

      createdDocs.push({ batchDoc, stockDoc });
      continue;
    }

    // Caso: stock positivo
    const batchDoc = {
      ...baseFields,
      id: nanoid(),
      productId: product.id,
      productName: product.name,
      numberId: startBatchNumber + i,
      status: BatchStatus.Active,
      receivedDate: serverTimestamp(),
      providerId: null,
      quantity: product.stock,
      initialQuantity: product.stock,
    };

    const stockDoc = {
      ...baseFields,
      id: nanoid(),
      batchId: batchDoc.id,
      productName: product.name,
      batchNumberId: startBatchNumber + i,
      location: defaultWarehouse.id,
      status: BatchStatus.Active,
      expirationDate: null,
      productId: product.id,
      quantity: product.stock,
      initialQuantity: product.stock,
    };

    const movementDoc = {
      ...baseFields,
      id: nanoid(),
      batchId: batchDoc.id,
      productName: product.name,
      batchNumberId: startBatchNumber + i,
      destinationLocation: defaultWarehouse.id,
      sourceLocation: null,
      productId: product.id,
      quantity: product.stock,
      movementType: MovementType.Entry,
      movementReason: MovementReason.InitialStock,
    };

    createdDocs.push({ batchDoc, stockDoc, movementDoc });
  }

  // Escribir todos los documentos en el batch de escritura
  for (const docs of createdDocs) {
    batch.set(doc(batchRef, docs.batchDoc.id), docs.batchDoc);
    batch.set(doc(stockRef, docs.stockDoc.id), docs.stockDoc);
    if (docs.movementDoc) {
      batch.set(doc(movementRef, docs.movementDoc.id), docs.movementDoc);
    }
  }

  await batch.commit();
}

/**
 * Inicializa el inventario de productos para TODOS los negocios.
 * Para cada negocio:
 *   - Se borran (por si acaso) los documentos de las colecciones "batches" y "productsStock".
 *   - Se obtienen los productos y lotes existentes.
 *   - Se filtran los productos que requieren inicialización.
 *   - Se obtiene el almacén predeterminado.
 *   - Se procesan los productos en lotes (batch processing).
 *
 * @param {Function} onProgress - Callback para reportar el progreso.
 */
export async function fbInitializedProductInventoryForAllBusinesses(
  onProgress,
) {
  try {
    // Obtener todos los negocios
    const businessesSnapshot = await getDocs(collection(db, 'businesses'));
    const businesses = businessesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    for (const business of businesses) {
      const businessID = business.id;

      // Excluir los negocios con los IDs indicados
      if (
        businessID === 'MvTYxbYejD1UofAdnFT8' ||
        businessID === 'X63aIFwHzk3r0gmT8w6P'
      ) {
        onProgress?.({
          status: `Negocio ${businessID} omitido`,
          progress: 100,
        });
        continue;
      }

      onProgress?.({
        status: `Procesando negocio: ${businessID}`,
        progress: 0,
      });

      // Borrar los documentos actuales de batches y productsStock
      await clearInventoryCollections(businessID);
      onProgress?.({
        status: `Colecciones limpias para el negocio ${businessID}`,
        progress: 5,
      });

      const baseRefs = {
        batchRef: collection(db, 'businesses', businessID, 'batches'),
        stockRef: collection(db, 'businesses', businessID, 'productsStock'),
        movementRef: collection(db, 'businesses', businessID, 'movements'),
      };

      onProgress?.({
        status: `Obteniendo productos y lotes para el negocio ${businessID}...`,
        progress: 0,
      });

      // Se asume que fbGetProducts y getDefaultWarehouse usan el objeto systemUser
      const systemUser = { uid: 'system', businessID };
      const products = await fbGetProducts(systemUser);
      const batchesSnapshot = await getDocs(baseRefs.batchRef);

      const productsWithBatches = new Set(
        batchesSnapshot.docs.map((doc) => doc.data().productId),
      );

      const productsToProcess = products.filter(
        (product) =>
          product.trackInventory && !productsWithBatches.has(product.id),
      );

      onProgress?.({
        status: `Negocio ${businessID}: Se encontraron ${productsToProcess.length} productos para inicializar`,
        progress: 10,
      });

      const defaultWarehouse = await getDefaultWarehouse(systemUser);

      // Procesar en lotes de BATCH_SIZE
      for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
        const batchProducts = productsToProcess.slice(i, i + BATCH_SIZE);
        await processBatchOfProducts(
          batchProducts,
          businessID,
          defaultWarehouse,
          baseRefs,
          onProgress,
          i,
        );
      }

      onProgress?.({
        status: `Negocio ${businessID}: Proceso completado. Se inicializaron ${productsToProcess.length} productos`,
        progress: 100,
      });
    }

    onProgress?.({
      status: `Proceso completado para todos los negocios`,
      progress: 100,
    });
  } catch (error) {
    onProgress?.({
      status: 'Error: ' + error.message,
      progress: 100,
      error: true,
    });
    console.error(
      'Error initializing product inventory for all businesses:',
      error,
    );
    throw error;
  }
}

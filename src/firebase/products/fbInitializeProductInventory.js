//esta funcion revisara en la coleccion de producto
// todos esos productos que no tienen batch y productStock y les creara
// un batch y un productStock con la cantidad de stock que tiene el producto

import { serverTimestamp } from 'firebase/firestore';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import { getDefaultWarehouse } from '@/firebase/warehouse/warehouseService';
import { BatchStatus } from '@/models/Warehouse/Batch';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { validateUser } from '@/utils/userValidation';

import { fbGetProducts } from './fbGetProducts';

const BATCH_SIZE = 166; // Tamaño seguro para procesamiento por lotes

async function processBatchOfProducts(
  products,
  user,
  defaultWarehouse,
  baseRefs,
  onProgress,
  startIndex,
) {
  const batch = writeBatch(db);
  const createdDocs = [];
  const { batchRef, stockRef, movementRef } = baseRefs;

  // Reservar bloque de IDs para todo el lote
  const startBatchNumber = await getNextID(user, 'batches', products.length);

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
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      deletedAt: null,
      deletedBy: null,
      isDeleted: false,
    };

    // Si el stock es negativo, crear un backorder
    if (product.stock < 0) {
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
          collection(db, 'businesses', user.businessID, 'backOrders'),
          backOrderDoc.id,
        ),
        backOrderDoc,
      );

      // Si es negativo, crear batch y productStock con cantidad 0
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

      // Actualizar el producto a stock 0
      batch.update(
        doc(db, 'businesses', user.businessID, 'products', product.id),
        {
          stock: 0,
          status: 'inactive',
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
      );

      createdDocs.push({ batchDoc, stockDoc });
      continue;
    }

    // Si el stock es 0, solo crear batch y productStock inactivos
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

      batch.update(
        doc(db, 'businesses', user.businessID, 'products', product.id),
        {
          status: 'inactive',
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
      );

      createdDocs.push({ batchDoc, stockDoc });
      continue;
    }

    // Stock positivo - lógica original
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

  // Escribir todos los documentos en el batch
  for (const docs of createdDocs) {
    batch.set(doc(batchRef, docs.batchDoc.id), docs.batchDoc);
    batch.set(doc(stockRef, docs.stockDoc.id), docs.stockDoc);
    if (docs.movementDoc) {
      batch.set(doc(movementRef, docs.movementDoc.id), docs.movementDoc);
    }
  }

  await batch.commit();
}

export async function fbInitializedProductInventory(user, onProgress) {
  try {
    validateUser(user);
    const { businessID } = user;

    const baseRefs = {
      batchRef: collection(db, 'businesses', businessID, 'batches'),
      stockRef: collection(db, 'businesses', businessID, 'productsStock'),
      movementRef: collection(db, 'businesses', businessID, 'movements'),
    };

    onProgress?.({ status: 'Obteniendo productos y lotes...', progress: 0 });

    const [products, batchesSnapshot] = await Promise.all([
      fbGetProducts(user),
      getDocs(baseRefs.batchRef),
    ]);

    const productsWithBatches = new Set(
      batchesSnapshot.docs.map((doc) => doc.data().productId),
    );

    const productsToProcess = products.filter(
      (product) =>
        product.trackInventory && !productsWithBatches.has(product.id),
    );

    onProgress?.({
      status: `Se encontraron ${productsToProcess.length} productos para inicializar`,
      progress: 10,
    });

    const defaultWarehouse = await getDefaultWarehouse(user);

    // Procesar en lotes de BATCH_SIZE
    for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
      const batch = productsToProcess.slice(i, i + BATCH_SIZE);
      await processBatchOfProducts(
        batch,
        user,
        defaultWarehouse,
        baseRefs,
        onProgress,
        i,
      );
    }

    onProgress?.({
      status: `Proceso completado. Se inicializaron ${productsToProcess.length} productos`,
      progress: 100,
    });
  } catch (error) {
    onProgress?.({
      status: 'Error: ' + error.message,
      progress: 100,
      error: true,
    });
    console.error('Error initializing product inventory:', error);
    throw error;
  }
}

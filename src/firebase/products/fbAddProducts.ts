import {
  collection,
  writeBatch,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  WriteBatch,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import { getDefaultWarehouse } from '@/firebase/warehouse/warehouseService';
import { BatchStatus } from '@/models/Warehouse/Batch';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import type { ProductPricing, ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type UserWithBusinessAndUid = UserWithBusiness & { uid: string };

type ProductImport = ProductRecord & {
  id?: string;
  name?: string;
  stock?: number;
  pricing?: ProductPricing;
  category?: string;
  activeIngredients?: string[];
  barcode?: string | number;
};

type NamedData = { name?: string } & Record<string, unknown>;

type NameEntry<T extends NamedData> = {
  docSnapshot: QueryDocumentSnapshot<T> | DocumentReference<T>;
  data: T;
};

type NameMap<T extends NamedData> = Map<string, NameEntry<T>>;

type PreloadedDocMap = Map<string, DocumentSnapshot<ProductImport>>;

type ImportStats = {
  totalProducts: number;
  processedProducts: number;
  updatedProducts: number;
  newProducts: number;
  newCategories: number;
  newIngredients: number;
  updatedIngredients: number;
  batchOperations: number;
};

type WarehouseLike = { id?: string | null } & Record<string, unknown>;

type ImportContext = {
  productsCollection: CollectionReference<ProductImport>;
  categoriesCollection: CollectionReference<NamedData>;
  activeIngredientsCollection: CollectionReference<NamedData>;
  defaultWarehouse?: WarehouseLike | null;
  user: UserWithBusinessAndUid;
  existingProductsByName: NameMap<ProductImport>;
  existingCategoriesByName: NameMap<NamedData>;
  existingActiveIngredientsByName: NameMap<NamedData>;
  preloadedDocs: PreloadedDocMap;
  progress: ImportProgress;
};

class ImportProgress {
  stats: ImportStats;

  constructor() {
    this.stats = {
      totalProducts: 0,
      processedProducts: 0,
      updatedProducts: 0,
      newProducts: 0,
      newCategories: 0,
      newIngredients: 0,
      updatedIngredients: 0,
      batchOperations: 0,
    };
  }

  updateProgress(field: keyof ImportStats, value = 1) {
    this.stats[field] += value;
    this.logProgress();
  }

  logProgress() {
    const { processedProducts, totalProducts } = this.stats;
    if (totalProducts > 0) {
      const _percentage = Math.round((processedProducts / totalProducts) * 100);
      // Processing products
    }
  }

  getSummary() {
    const {
      totalProducts,
      processedProducts,
      updatedProducts,
      newProducts,
      newCategories,
      newIngredients,
      updatedIngredients,
      batchOperations,
    } = this.stats;

    return `
Resumen de importación:
----------------------
Total productos procesados: ${processedProducts}/${totalProducts}
Productos actualizados: ${updatedProducts}
Productos nuevos: ${newProducts}
Categorías nuevas: ${newCategories}
Ingredientes activos nuevos: ${newIngredients}
Ingredientes activos actualizados: ${updatedIngredients}
Total operaciones en batch: ${batchOperations}
    `;
  }
}

/**
 * Valida y ajusta el precio del producto.
 */
export function validateProductPricing(product: ProductImport): ProductImport {
  const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  if (!product.pricing) {
    product.pricing = {
      price: 0,
      listPrice: 0,
      avgPrice: 0,
      minPrice: 0,
      cardPrice: 0,
      offerPrice: 0,
    };
    return product;
  }

  const price = toNumber(product.pricing.price);
  const listPrice = toNumber(product.pricing.listPrice);
  const hasPrice = price > 0;
  const hasListPrice = listPrice > 0;

  const resolvedListPrice = hasListPrice ? listPrice : hasPrice ? price : 0;
  const resolvedPrice = hasPrice ? price : resolvedListPrice;

  product.pricing.listPrice = resolvedListPrice;
  product.pricing.price = resolvedPrice;
  return product;
}

/**
 * Obtiene un Map de documentos existentes en una colección, indexado por el nombre en minúsculas.
 */
async function fetchExistingDocsByName<T extends NamedData>(
  collectionRef: CollectionReference<T>,
): Promise<NameMap<T>> {
  const snapshot = await getDocs(collectionRef);
  const map: NameMap<T> = new Map();
  snapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const lowerName = data.name?.toLowerCase();
    if (lowerName) {
      map.set(lowerName, { docSnapshot, data });
    }
  });
  return map;
}

/**
 * Pre-carga documentos de productos que tienen un id y que no se encontraron por nombre.
 */
async function preloadProductDocs(
  limitedProducts: ProductImport[],
  productsCollection: CollectionReference<ProductImport>,
  existingProductsByName: NameMap<ProductImport>,
): Promise<PreloadedDocMap> {
  const preloadedDocs: PreloadedDocMap = new Map();
  const productsToPreload = limitedProducts.filter(
    (prod) =>
      prod.id &&
      prod.name &&
      !existingProductsByName.has(prod.name.toLowerCase()),
  );
  await Promise.all(
    productsToPreload.map(async (prod) => {
      const prodDocRef = doc(productsCollection, prod.id);
      const docSnap = await getDoc(prodDocRef);
      preloadedDocs.set(prod.id, docSnap);
    }),
  );
  return preloadedDocs;
}

/**
 * Revisa en la colección de productos si hay varios documentos
 * con el mismo "name + barcode".
 * - Deja el primero tal cual.
 * - A los duplicados, intenta buscarles un barcode alternativo
 *   a partir de los datos locales (donde sabes que para ese `name`
 *   hay varios barcodes distintos).
 */
async function fixDuplicatedNameBarcode(
  user: UserWithBusiness,
  localProducts: ProductImport[],
): Promise<void> {
  console.info('Starting duplicate barcode fix process');

  try {
    // Colección de productos
    const productsColl = collection(
      db,
      'businesses',
      user.businessID,
      'products',
    ) as CollectionReference<ProductImport>;

    // 1. Construir un mapa local: para cada `name.toLowerCase()`, guardar Set de barcodes
    const localByName = new Map<string, Set<string>>();
    for (const lp of localProducts) {
      const nameKey =
        typeof lp.name === 'string'
          ? lp.name.trim().toLowerCase()
          : '_sin_nombre_';
      const barcodeKey =
        typeof lp.barcode === 'string'
          ? lp.barcode.trim().toLowerCase()
          : lp.barcode
            ? String(lp.barcode).toLowerCase()
            : '_sin_barcode_';

      if (!localByName.has(nameKey)) localByName.set(nameKey, new Set());
      localByName.get(nameKey).add(barcodeKey);
    }

    // 2. Obtener *todos* los documentos (o podrías filtrar solo los nombres que te interesan).
    // Retrieving products to check for duplicates
    const snapshot = await getDocs(productsColl);
    if (snapshot.empty) {
      console.info('No products found in database');
      return;
    }

    // 2.1 Agrupar en memoria por (nameKey, barcodeKey)
    const byNameBarcode = new Map<
      string,
      Map<string, Array<{ docId: string; data: ProductImport }>>
    >();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ProductImport;
      const docId = docSnap.id;

      const nameKey =
        typeof data.name === 'string'
          ? data.name.trim().toLowerCase()
          : '_sin_nombre_';
      const barcodeKey =
        typeof data.barcode === 'string'
          ? data.barcode.trim().toLowerCase()
          : data.barcode
            ? String(data.barcode).toLowerCase()
            : '_sin_barcode_';

      if (!byNameBarcode.has(nameKey)) byNameBarcode.set(nameKey, new Map());
      const inner = byNameBarcode.get(nameKey);
      if (!inner) return;
      if (!inner.has(barcodeKey)) inner.set(barcodeKey, []);

      inner.get(barcodeKey).push({ docId, data });
    });

    // Processing unique product names

    let batch = writeBatch(db);
    let ops = 0;
    const maxOps = 450;
    let conflicts = 0;

    const commitAndReset = async () => {
      if (ops === 0) return; // nada que guardar
      try {
        await batch.commit();
        // Batch corrections saved
      } catch (err) {
        console.error('Error al guardar lote de correcciones:', err);
        throw err; // propaga para manejo superior
      }
      batch = writeBatch(db); // nuevo batch
      ops = 0; // reinicia contador
    };

    // 3. Recorrer cada (nameKey, barcodeKey) para ver duplicados
    for (const [nameKey, barcodeMap] of byNameBarcode) {
      for (const [barcodeKey, docsArr] of barcodeMap) {
        if (docsArr.length <= 1) continue; // no hay duplicados

        // Si hay 2 o más con el mismo name+barcode => conflicto
        // Conflict detected with duplicate name and barcode
        conflicts++;

        const [, ...duplicates] = docsArr;

        const localBarcodesArr = [...(localByName.get(nameKey) || [])].filter(
          (b) => b !== barcodeKey,
        );
        // Processing alternative barcodes

        let idx = 0;
        for (const dup of duplicates) {
          let newBarcode = localBarcodesArr[idx++] ?? null;

          if (!newBarcode) {
            // No alternative barcode available
            continue;
          }

          const docRef = doc(productsColl, dup.docId);
          batch.update(docRef, {
            barcode: newBarcode,
            updatedAt: serverTimestamp(),
          });
          ops++;
          // Document reassigned to new barcode

          if (ops >= maxOps) await commitAndReset();
        }
      }
    }

    if (ops > 0) {
      console.log(`Guardando lote final de ${ops} correcciones...`);
      try {
        await batch.commit();
        console.log('Lote final guardado exitosamente');
      } catch (batchError) {
        console.error(
          'Error al guardar lote final de correcciones:',
          batchError,
        );
        throw batchError; // Propagar error para manejo superior
      }
    }

    console.log(
      `== Fin de fixDuplicatedNameBarcode. Conflictos detectados: ${conflicts} ==`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('ERROR EN fixDuplicatedNameBarcode:', error);
    console.error('Stack trace:', stack);
    throw new Error(`Error al corregir duplicados: ${message}`);
  }
}

/**
 * Procesa un solo producto de tu lista local: actualiza o crea el producto
 * y agrega operaciones para batch, stock, movimiento, categorías e ingredientes.
 */
function processProduct(
  batch: WriteBatch,
  product: ProductImport,
  batchNumber: number,
  context: ImportContext,
): number {
  let opCount = 0;

  validateProductPricing(product);
  const productNameLowerCase = product.name?.toLowerCase();

  if (productNameLowerCase) {
    // Revisa si existe (por nombre) para actualizarlo
    if (context.existingProductsByName.has(productNameLowerCase)) {
      const existingEntry =
        context.existingProductsByName.get(productNameLowerCase);
      if (!existingEntry) {
        return opCount;
      }
      const { docSnapshot, data: existingData } = existingEntry;
      const docRef = 'ref' in docSnapshot ? docSnapshot.ref : docSnapshot;
      const updatedProduct = { ...product, image: existingData.image };
      batch.update(docRef, updatedProduct);
      opCount++;
      console.log(
        `Producto actualizado (update) y se mantuvo 'image': ${product.name}`,
      );
      context.progress.updateProgress('updatedProducts');
    } else {
      // No existe => crear
      let docRef;
      if (product.id) {
        docRef = doc(context.productsCollection, product.id);
        const docSnapshot = context.preloadedDocs.get(product.id);
        if (!docSnapshot || !docSnapshot.exists()) {
          batch.set(docRef, product);
          opCount++;
        } else {
          const existingData = docSnapshot.data();
          const updatedProduct = { ...product, image: existingData.image };
          batch.update(docRef, updatedProduct);
          opCount++;
          console.log(`Producto actualizado con id: ${product.id}`);
        }
      } else {
        docRef = doc(context.productsCollection);
        product.id = docRef.id;
        batch.set(docRef, product);
        opCount++;
      }
      context.progress.updateProgress('newProducts');
    }

    // Campos base
    const baseFields = {
      createdAt: serverTimestamp(),
      createdBy: context.user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: context.user.uid,
      deletedAt: null,
      deletedBy: null,
      isDeleted: false,
    };

    // Crear Batch
    const batchObj = {
      ...baseFields,
      id: nanoid(10),
      productId: product.id,
      productName: product.name,
      numberId: batchNumber,
      status: BatchStatus.Active,
      receivedDate: serverTimestamp(),
      providerId: null,
      quantity: product.stock || 0,
      initialQuantity: product.stock || 0,
    };
    const batchDocRef = doc(
      db,
      'businesses',
      context.user.businessID,
      'batches',
      batchObj.id,
    );
    batch.set(batchDocRef, batchObj);
    opCount++;

    // Crear Stock
    const stockObj = {
      ...baseFields,
      id: nanoid(10),
      batchId: batchObj.id,
      productName: product.name,
      batchNumberId: batchNumber,
      location: context.defaultWarehouse?.id || null,
      expirationDate: null,
      productId: product.id,
      status: BatchStatus.Active,
      quantity: product.stock || 0,
      initialQuantity: product.stock || 0,
    };
    const stockRef = doc(
      db,
      'businesses',
      context.user.businessID,
      'productsStock',
      stockObj.id,
    );
    batch.set(stockRef, stockObj);
    opCount++;

    // Crear Movimiento
    const movementObj = {
      ...baseFields,
      id: nanoid(10),
      batchId: batchObj.id,
      productName: product.name,
      batchNumberId: batchNumber,
      destinationLocation: context.defaultWarehouse?.id || null,
      sourceLocation: null,
      productId: product.id,
      quantity: product.stock || 0,
      movementType: MovementType.Entry,
      movementReason: MovementReason.InitialStock,
    };
    const movementRef = doc(
      db,
      'businesses',
      context.user.businessID,
      'movements',
      movementObj.id,
    );
    batch.set(movementRef, movementObj);
    opCount++;

    // Categorías
    if (typeof product.category === 'string' && product.category.trim()) {
      const categoryNameLowerCase = product.category.trim().toLowerCase();
      if (!context.existingCategoriesByName.has(categoryNameLowerCase)) {
        const categoryDocRef = doc(context.categoriesCollection);
        const category = {
          id: categoryDocRef.id,
          name: product.category,
          createdAt: serverTimestamp(),
        };
        batch.set(categoryDocRef, category);
        opCount++;
        context.existingCategoriesByName.set(categoryNameLowerCase, {
          docSnapshot: categoryDocRef,
          data: category,
        });
        console.log(`Categoría agregada: ${product.category}`);
        context.progress.updateProgress('newCategories');
      }
    }

    // Ingredientes activos
    if (Array.isArray(product.activeIngredients)) {
      for (const ingredient of product.activeIngredients) {
        if (typeof ingredient !== 'string') continue;
        const ingredientNameLowerCase = ingredient.toLowerCase();
        if (
          !context.existingActiveIngredientsByName.has(ingredientNameLowerCase)
        ) {
          const ingredientDocRef = doc(context.activeIngredientsCollection);
          const activeIngredient = {
            id: ingredientDocRef.id,
            name: ingredient,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          batch.set(ingredientDocRef, activeIngredient);
          opCount++;
          context.existingActiveIngredientsByName.set(ingredientNameLowerCase, {
            docSnapshot: ingredientDocRef,
            data: activeIngredient,
          });
          console.log(`Ingrediente activo agregado: ${ingredient}`);
          context.progress.updateProgress('newIngredients');
        } else {
          const existingEntry =
            context.existingActiveIngredientsByName.get(
              ingredientNameLowerCase,
            );
          if (!existingEntry) continue;
          const { docSnapshot } = existingEntry;
          const ingredientRef =
            'ref' in docSnapshot ? docSnapshot.ref : docSnapshot;
          batch.update(ingredientRef, { updatedAt: serverTimestamp() });
          opCount++;
          console.log(`Ingrediente activo actualizado: ${ingredient}`);
          context.progress.updateProgress('updatedIngredients');
        }
      }
    }
  } else {
    console.log(`Producto omitido: no se proporcionó nombre.`);
  }

  context.progress.updateProgress('batchOperations', opCount);
  context.progress.updateProgress('processedProducts');
  return opCount;
}

/**
 * Función principal para subir productos, categorías e ingredientes
 * a Firestore en lotes, **corrigiendo antes los duplicados** de
 * (name+barcode) que pudieran existir en la base.
 */
export const fbAddProducts = async (
  user: UserWithBusinessAndUid,
  products: ProductImport[],
  maxProducts = 10000,
  onProgress?: (progress: ImportProgress) => void,
): Promise<void> => {
  const progress = new ImportProgress();
  const maxBatchSize = 500;
  const maxAllowedProducts = 10000;

  // 1. Limitamos la lista local
  const limitedProducts = products.slice(
    0,
    Math.min(maxProducts, maxAllowedProducts),
  );
  progress.stats.totalProducts = limitedProducts.length;
  console.log(
    `Iniciando procesamiento de ${progress.stats.totalProducts} productos`,
  );
  //mostremos los primeros 10 productos
  console.log(
    `Primeros 10 productos: ${limitedProducts
      .slice(0, 100)
      .map((p) => p.name)
      .join(', ')}`,
  );

  // 2. Antes de importar, reparamos posibles duplicados en la DB
  await fixDuplicatedNameBarcode(user, limitedProducts);

  // 3. Referencias a colecciones
  const productsCollection = collection(
    db,
    'businesses',
    user.businessID,
    'products',
  ) as CollectionReference<ProductImport>;
  const categoriesCollection = collection(
    db,
    'businesses',
    user.businessID,
    'categories',
  ) as CollectionReference<NamedData>;
  const activeIngredientsCollection = collection(
    db,
    'businesses',
    user.businessID,
    'activeIngredients',
  ) as CollectionReference<NamedData>;

  // 4. Obtener el almacén por defecto
  const defaultWarehouse = await getDefaultWarehouse(user);

  try {
    // 5. Obtener documentos existentes de productos, categorías e ingredientes (relee después de la corrección)
    console.log('Cargando productos existentes...');
    const existingProductsByName =
      await fetchExistingDocsByName(productsCollection);
    console.log(
      `${existingProductsByName.size} productos existentes encontrados`,
    );

    console.log('Cargando categorías existentes...');
    const existingCategoriesByName =
      await fetchExistingDocsByName(categoriesCollection);
    console.log(
      `${existingCategoriesByName.size} categorías existentes encontradas`,
    );

    console.log('Cargando ingredientes activos existentes...');
    const existingActiveIngredientsByName = await fetchExistingDocsByName(
      activeIngredientsCollection,
    );
    console.log(
      `${existingActiveIngredientsByName.size} ingredientes activos encontrados`,
    );

    // 6. Pre-cargar documentos de productos (para evitar múltiples getDoc)
    const preloadedDocs = await preloadProductDocs(
      limitedProducts,
      productsCollection,
      existingProductsByName,
    );

    // 7. Reservar un bloque de números de lote (IDs) en una sola transacción
    const startBatchNumber = (await getNextID(
      user,
      'batches',
      limitedProducts.length,
    )) as number;
    const batchNumbers = Array.from(
      { length: limitedProducts.length },
      (_, i) => startBatchNumber + i,
    );

    // 8. Configuración para la escritura en batch
    const batchCommits: Array<Promise<void>> = [];
    let batch = writeBatch(db);
    let operationCount = 0;

    // 9. Contexto
    const context = {
      productsCollection,
      categoriesCollection,
      activeIngredientsCollection,
      defaultWarehouse,
      user,
      existingProductsByName,
      existingCategoriesByName,
      existingActiveIngredientsByName,
      preloadedDocs,
      progress,
    };

    // 9.1 Callback de progreso
    if (onProgress) {
      const originalUpdateProgress = progress.updateProgress.bind(progress);
      progress.updateProgress = (field: keyof ImportStats, value = 1) => {
        originalUpdateProgress(field, value);
        onProgress(progress);
      };
    }

    // 10. Procesar cada producto y agregar operaciones al batch
    for (let i = 0; i < limitedProducts.length; i++) {
      const product = limitedProducts[i];
      const batchNumber = batchNumbers[i];

      operationCount += processProduct(batch, product, batchNumber, context);

      if (operationCount >= maxBatchSize) {
        batchCommits.push(batch.commit());
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      batchCommits.push(batch.commit());
    }

    await Promise.all(batchCommits);

    // 11. Resumen final
    console.log(progress.getSummary());
    console.log(
      'Todos los productos, categorías e ingredientes activos fueron subidos exitosamente.',
    );
  } catch (error) {
    console.error(
      'Error al subir los productos, categorías e ingredientes activos:',
      error,
    );
    console.log('Estado al momento del error:', progress.getSummary());
  }
};

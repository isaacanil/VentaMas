// src/inventory/utils/inventoryQueries.js
import { https } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { resolveInventoryBaseQuantity } from '../utils/saleUnitQuantity.util.js';
import {
  buildComboComponentInventoryLine,
  getComboComponents,
  isComponentTrackedCombo,
} from '../utils/comboInventoryLines.util.js';

const normalizeId = (value) => {
  if (value == null) return '';
  return String(value).trim();
};

const hasSelectedPhysicalStock = (product) =>
  Boolean(
    normalizeId(product?.productStockId) && normalizeId(product?.batchId),
  );

const isServiceItemType = (value) =>
  ['service', 'services', 'servicio', 'servicios'].includes(
    normalizeId(value).toLowerCase(),
  );

const isServiceInventoryLine = (product, catalogProduct = {}) =>
  isServiceItemType(product?.itemType) ||
  isServiceItemType(product?.type) ||
  isServiceItemType(catalogProduct?.itemType) ||
  isServiceItemType(catalogProduct?.type);

const shouldResolveInventoryLine = (product) =>
  !isServiceInventoryLine(product) &&
  (Boolean(product?.trackInventory) || hasSelectedPhysicalStock(product));

const shouldReadCatalogForInventoryPolicy = (product) => {
  const itemType = normalizeId(product?.itemType);
  return itemType !== 'service' && Boolean(normalizeId(product?.id));
};

const getPhysicalStockQuantity = (data = {}) => {
  const rawQuantity = data.quantity;
  const quantity = Number(rawQuantity);
  if (
    rawQuantity !== undefined &&
    rawQuantity !== null &&
    Number.isFinite(quantity)
  ) {
    return Math.max(quantity, 0);
  }

  const legacyStock = Number(data.stock);
  return Number.isFinite(legacyStock) ? Math.max(legacyStock, 0) : 0;
};

const sanitizeDocIdPart = (value, fallback = 'none') => {
  const raw = normalizeId(value) || fallback;
  return raw.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 90) || fallback;
};

const resolveInventoryLineId = (product, index) =>
  normalizeId(product?.lineId) ||
  normalizeId(product?.cid) ||
  normalizeId(product?.cartLineId) ||
  `line-${index}`;

const buildInventorySideEffectId = ({
  type,
  saleId,
  product,
  index,
  productStockId,
  batchId,
}) =>
  [
    type,
    saleId,
    resolveInventoryLineId(product, index),
    product?.id,
    productStockId || 'no-stock',
    batchId || 'no-batch',
  ]
    .map((part) => sanitizeDocIdPart(part))
    .join('__');

const readSideEffectPrereqs = async (
  tx,
  { businessID, saleId, product, index, productStockId, batchId },
) => {
  if (!saleId) return {};

  const movementId = buildInventorySideEffectId({
    type: 'movement',
    saleId,
    product,
    index,
    productStockId,
    batchId,
  });
  const backorderId = buildInventorySideEffectId({
    type: 'backorder',
    saleId,
    product,
    index,
    productStockId,
    batchId,
  });
  const movementRef = db.doc(`businesses/${businessID}/movements/${movementId}`);
  const backorderRef = db.doc(
    `businesses/${businessID}/backOrders/${backorderId}`,
  );
  const [movementSnap, backorderSnap] = await Promise.all([
    tx.get(movementRef),
    tx.get(backorderRef),
  ]);

  return {
    movementId,
    movementRef,
    movementSnap,
    backorderId,
    backorderRef,
    backorderSnap,
  };
};

const readSnapshotId = (snapshot, ...fieldPaths) => {
  for (const fieldPath of fieldPaths) {
    const value = snapshot?.get?.(fieldPath);
    const normalized = normalizeId(value);
    if (normalized) return normalized;
  }

  return '';
};

const assertMatchingInventoryRefs = ({
  productId,
  productStockId,
  productStockSnap,
  batchId,
  batchSnap,
}) => {
  const normalizedProductId = normalizeId(productId);
  const normalizedBatchId = normalizeId(batchId);
  const stockProductId = readSnapshotId(
    productStockSnap,
    'productId',
    'productID',
    'idProduct',
  );
  const stockBatchId = readSnapshotId(productStockSnap, 'batchId');
  const batchProductId = readSnapshotId(
    batchSnap,
    'productId',
    'productID',
    'idProduct',
  );

  if (stockProductId && stockProductId !== normalizedProductId) {
    throw new https.HttpsError(
      'failed-precondition',
      `El stock ${productStockId} no pertenece al producto ${productId}.`,
    );
  }

  if (stockBatchId && normalizedBatchId && stockBatchId !== normalizedBatchId) {
    throw new https.HttpsError(
      'failed-precondition',
      `El stock ${productStockId} no pertenece al lote ${batchId}.`,
    );
  }

  if (batchProductId && batchProductId !== normalizedProductId) {
    throw new https.HttpsError(
      'failed-precondition',
      `El lote ${batchId} no pertenece al producto ${productId}.`,
    );
  }
};

/**
 * Devuelve el DocumentSnapshot del producto dentro de la transacción.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} productId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getProductDocFromTx(tx, businessID, productId) {
  if (!productId) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere el identificador del producto',
    );
  }
  const ref = db.doc(`businesses/${businessID}/products/${productId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError(
      'not-found',
      `Producto ${productId} no encontrado`,
    );
  }
  return snap;
}

/**
 * Devuelve el DocumentSnapshot de un registro de productsStock dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} productStockId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getProductStockRecordFromTx(
  tx,
  businessID,
  productStockId,
) {
  if (!productStockId) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere el identificador del registro de stock',
    );
  }
  const ref = db.doc(
    `businesses/${businessID}/productsStock/${productStockId}`,
  );
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError(
      'not-found',
      `Registro de stock ${productStockId} no encontrado`,
    );
  }
  return snap;
}

/**
 * Devuelve el DocumentSnapshot de un lote dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} batchId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getBatchDocFromTx(tx, businessID, batchId) {
  if (!batchId) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere el identificador del lote',
    );
  }
  const ref = db.doc(`businesses/${businessID}/batches/${batchId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError('not-found', `Lote ${batchId} no encontrado`);
  }
  return snap;
}

const getInventory = {
  getProductDocFromTx,
  getProductStockRecordFromTx,
  getBatchDocFromTx,
};
export default getInventory;

/**
 * Recoge los DocumentSnapshot necesarios (producto, productsStock y batch)
 * para cada línea del carrito que requiera control de inventario.
 *
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @param {Array<{ id:string; trackInventory:boolean; productStockId?:string; batchId?:string; restrictSaleWithoutStock?:boolean }>} products
 * @returns {Promise<Array<{ index:number; prod:object; skipped?:boolean; reason?:string; productSnap?:DocumentSnapshot; productStockSnap?:DocumentSnapshot; batchSnap?:DocumentSnapshot }>>}
 */
export async function collectInventoryPrereqs(tx, { user, products, saleId }) {
  if (!user?.businessID) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere el businessID del usuario para resolver inventario',
    );
  }
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const prereqs = [];
  const productCache = new Map();
  const batchCache = new Map();
  const stockCache = new Map();
  const inventoryLines = [];

  const readProductSnap = async (productId, { required = true } = {}) => {
    let productSnap = productCache.get(productId);
    if (!productSnap) {
      try {
        productSnap = await getProductDocFromTx(tx, user.businessID, productId);
      } catch (error) {
        if (!required && error?.code === 'not-found') {
          return null;
        }
        throw error;
      }
      productCache.set(productId, productSnap);
    }
    return productSnap;
  };

  const expandComboLine = async ({
    prod,
    index,
    productData = {},
  }) => {
    const parentLineId = resolveInventoryLineId(prod, index);
    const components = getComboComponents(prod, productData);
    for (
      let componentIndex = 0;
      componentIndex < components.length;
      componentIndex += 1
    ) {
      const component = components[componentIndex];
      const componentProductSnap = await readProductSnap(component.productId);
      inventoryLines.push({
        index: `combo-${index}-${componentIndex}`,
        prod: buildComboComponentInventoryLine({
          comboLine: prod,
          comboProductData: productData,
          component,
          componentIndex,
          componentProductData: componentProductSnap.data?.() || {},
          parentLineId,
        }),
        productSnap: componentProductSnap,
      });
    }
  };

  for (let index = 0; index < products.length; index += 1) {
    const prod = products[index];
    const productId = normalizeId(prod?.id);
    const resolvesFromPayload = shouldResolveInventoryLine(prod);
    if (!productId) {
      if (isComponentTrackedCombo(prod, null)) {
        await expandComboLine({ prod, index });
        continue;
      }
      if (!resolvesFromPayload) continue;
      throw new https.HttpsError(
        'invalid-argument',
        'Todos los productos con inventario deben tener un id',
      );
    }

    let productSnap = null;
    let productData = {};
    if (
      resolvesFromPayload ||
      shouldReadCatalogForInventoryPolicy(prod)
    ) {
      productSnap = await readProductSnap(productId, {
        required: resolvesFromPayload,
      });
      productData = productSnap?.data?.() || {};
    }

    if (isComponentTrackedCombo(prod, productData)) {
      await expandComboLine({ prod, index, productData });
      continue;
    }

    if (isServiceInventoryLine(prod, productData)) {
      continue;
    }

    const resolvesFromCatalog = productData.trackInventory === true;
    if (!resolvesFromPayload && !resolvesFromCatalog) continue;

    inventoryLines.push({
      index,
      prod: resolvesFromCatalog ? { ...prod, trackInventory: true } : prod,
      productSnap,
    });
  }

  for (const inventoryLine of inventoryLines) {
    const { index, prod, productSnap } = inventoryLine;
    const productId = prod.id;

    const restrictSale =
      Boolean(prod?.restrictSaleWithoutStock) ||
      Boolean(productSnap.get('restrictSaleWithoutStock'));

    let productStockId = prod.productStockId;
    let batchId = prod.batchId;

    if (!productStockId || !batchId) {
      try {
        const stockQuery = db
          .collection(`businesses/${user.businessID}/productsStock`)
          .where('productId', '==', productId)
          .where('status', '==', 'active')
          .limit(5); // Fetch a few to filter in memory

        const stockSnap = await tx.get(stockQuery);
        // Ideally sort by createdAt ASC for FIFO, but we avoid extra index dependencies here.
        const validStock = stockSnap.docs.find((doc) => {
          const data = doc.data();
          return (
            !data.isDeleted &&
            getPhysicalStockQuantity(data) > 0 &&
            data.batchId
          );
        });

        if (validStock) {
          const data = validStock.data();
          productStockId = validStock.id;
          batchId = data.batchId;
          stockCache.set(productStockId, validStock);
        }
      } catch (err) {
        console.warn(
          `[collectInventoryPrereqs] Failed to auto-resolve stock for ${productId}`,
          err,
        );
      }
    }

    if (!productStockId || !batchId) {
      if (restrictSale) {
        throw new https.HttpsError(
          'failed-precondition',
          `El producto ${
            prod?.name || productId
          } requiere seleccionar una existencia física antes de facturar.`,
        );
      }

      const sideEffects = await readSideEffectPrereqs(tx, {
        businessID: user.businessID,
        saleId,
        product: prod,
        index,
        productStockId: null,
        batchId: null,
      });

      prereqs.push({
        index,
        prod: { ...prod, restrictSaleWithoutStock: restrictSale },
        skipped: true,
        reason: 'missing-stock-reference',
        ...sideEffects,
      });
      continue;
    }

    let productStockSnap = stockCache.get(productStockId);
    if (!productStockSnap) {
      productStockSnap = await getProductStockRecordFromTx(
        tx,
        user.businessID,
        productStockId,
      );
      stockCache.set(productStockId, productStockSnap);
    }

    let batchSnap = batchCache.get(batchId);
    if (!batchSnap) {
      batchSnap = await getBatchDocFromTx(tx, user.businessID, batchId);
      batchCache.set(batchId, batchSnap);
    }

    assertMatchingInventoryRefs({
      productId,
      productStockId,
      productStockSnap,
      batchId,
      batchSnap,
    });

    if (restrictSale) {
      const requestedQuantity = resolveInventoryBaseQuantity({
        ...prod,
        productStockId,
        batchId,
      });
      const availableQuantity = getPhysicalStockQuantity(
        productStockSnap.data?.() || {},
      );
      if (requestedQuantity > availableQuantity) {
        throw new https.HttpsError(
          'failed-precondition',
          `Stock insuficiente para ${
            prod?.name || productId
          }. Disponible ${availableQuantity}, solicitado ${requestedQuantity}.`,
        );
      }
    }

    const sideEffects = await readSideEffectPrereqs(tx, {
      businessID: user.businessID,
      saleId,
      product: prod,
      index,
      productStockId,
      batchId,
    });

    prereqs.push({
      index,
      prod: {
        ...prod,
        productStockId,
        batchId,
        restrictSaleWithoutStock: restrictSale,
      },
      productSnap,
      productStockSnap,
      batchSnap,
      ...sideEffects,
    });
  }

  return prereqs;
}

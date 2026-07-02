import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue } from '../../../core/config/firebase.js';
import {
  getNextIDTransactional,
} from '../../../core/utils/getNextID.js';
import {
  getDefaultWarehouse,
} from '../../warehouse/services/defaultWarehouse.service.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../../versions/v2/billing/services/usage.service.js';
import { prepareLimitedCreateOperation } from '../../../versions/v2/billing/utils/limitedCreateOperation.util.js';

const sanitizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const cleanStringValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
};

const roundQuantity = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 1_000_000) / 1_000_000;

const normalizeComboInventoryPolicy = (value) => {
  const normalized = cleanStringValue(value).toLowerCase();
  return normalized === 'self' ? 'self' : 'components';
};

const normalizeProductItemType = (value, rawType) => {
  for (const source of [value, rawType]) {
    const normalized = cleanStringValue(source).toLowerCase();
    if (!normalized) continue;
    if (['servicio', 'servicios', 'service', 'services'].includes(normalized)) {
      return 'service';
    }
    if (
      ['combo', 'combos', 'combinado', 'combinados', 'kit', 'bundle'].includes(
        normalized,
      ) ||
      normalized.includes('kit') ||
      normalized.includes('combo')
    ) {
      return 'combo';
    }
    if (['producto', 'productos', 'product', 'products'].includes(normalized)) {
      return 'product';
    }
  }

  return 'product';
};

const parseBooleanValue = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['sí', 'si', 'yes', 'true', '1'].includes(normalized)) return true;
    if (['no', 'false', '0'].includes(normalized)) return false;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return null;
};

const normalizeProductInventoryRole = (value, itemType) => {
  if (itemType !== 'product') return null;
  const normalized = cleanStringValue(value).toLowerCase().replace(/[\s-]+/g, '_');
  if (
    ['raw_material', 'materia_prima', 'insumo', 'ingredient'].includes(
      normalized,
    )
  ) {
    return 'raw_material';
  }
  return null;
};

const normalizeComboComponents = (components) => {
  if (!Array.isArray(components)) return [];

  const normalizedComponents = components
    .map((component) => {
      const record = asRecord(component);
      const productId = cleanStringValue(record.productId ?? record.idProduct);
      const quantity = sanitizeNumber(record.quantity, 0);
      if (!productId || quantity <= 0) return null;

      const normalized = {
        productId,
        quantity,
      };
      const id = cleanStringValue(record.id);
      const productName = cleanStringValue(
        record.productName ?? record.name ?? record.label,
      );
      const unitName = cleanStringValue(record.unitName);
      if (id) normalized.id = id;
      if (productName) normalized.productName = productName;
      if (unitName) normalized.unitName = unitName;
      if (record.sku !== undefined && record.sku !== null) {
        normalized.sku = record.sku;
      }
      return normalized;
    })
    .filter(Boolean);

  const componentsByProductId = new Map();
  for (const component of normalizedComponents) {
    const existing = componentsByProductId.get(component.productId);
    if (!existing) {
      componentsByProductId.set(component.productId, { ...component });
      continue;
    }

    existing.quantity = roundQuantity(existing.quantity + component.quantity);
    if (!existing.id && component.id) existing.id = component.id;
    if (!existing.productName && component.productName) {
      existing.productName = component.productName;
    }
    if (!existing.unitName && component.unitName) {
      existing.unitName = component.unitName;
    }
    if (existing.sku === undefined && component.sku !== undefined) {
      existing.sku = component.sku;
    }
  }

  return [...componentsByProductId.values()];
};

const normalizeComboForPersistence = (rawCombo) => {
  const combo = asRecord(rawCombo);
  const inventoryPolicy = normalizeComboInventoryPolicy(combo.inventoryPolicy);

  return {
    ...combo,
    enabled: true,
    inventoryPolicy,
    components: normalizeComboComponents(combo.components),
  };
};

const isComponentTrackedCombo = (product) =>
  product.itemType === 'combo' &&
  product.combo?.inventoryPolicy === 'components';

const isServiceProduct = (product) => product.itemType === 'service';

const applyServiceDefaults = (product) => {
  product.inventoryRole = null;
  product.isSellable = true;
  product.stock = 0;
  product.trackInventory = false;
  product.restrictSaleWithoutStock = false;
  product.totalUnits = null;
  product.packSize = 1;
  product.saleUnits = [];
  product.selectedSaleUnit = null;
  product.selectedSaleUnitId = null;
  product.productStockId = null;
  product.batchId = null;
  product.batchInfo = null;
  product.weightDetail = { isSoldByWeight: false };
  product.combo = null;
  return product;
};

const applyRawMaterialDefaults = (product) => {
  product.itemType = 'product';
  product.inventoryRole = 'raw_material';
  product.isSellable = false;
  product.isVisible = false;
  product.trackInventory = true;
  product.restrictSaleWithoutStock = true;
  product.saleUnits = [];
  product.selectedSaleUnit = null;
  product.selectedSaleUnitId = null;
  product.combo = null;
  product.qrcode = '';
  product.qrCode = '';
  product.barcode = '';
  product.weightDetail = {
    ...asRecord(product.weightDetail),
    isSoldByWeight: false,
  };
  product.warranty = {
    ...asRecord(product.warranty),
    status: false,
  };
  if (product.pricing) {
    product.pricing = {
      ...asRecord(product.pricing),
      price: 0,
      listPrice: 0,
      avgPrice: 0,
      minPrice: 0,
      cardPrice: 0,
      offerPrice: 0,
      listPriceEnable: false,
      avgPriceEnable: false,
      minPriceEnable: false,
    };
  }
  return product;
};

const normalizePricingForPersistence = (rawPricing) => {
  const pricing = asRecord(rawPricing);
  if (!Object.keys(pricing).length) return pricing;

  const price = sanitizeNumber(pricing.price, 0);
  const listPrice = sanitizeNumber(pricing.listPrice, 0);
  const canonicalListPrice =
    listPrice > 0 ? listPrice : price > 0 ? price : 0;

  return {
    ...pricing,
    listPrice: canonicalListPrice,
    price: canonicalListPrice,
  };
};

const normalizeProductPricingForPersistence = (product) => {
  if (product.pricing) {
    product.pricing = normalizePricingForPersistence(product.pricing);
  }

  if (Array.isArray(product.saleUnits)) {
    product.saleUnits = product.saleUnits.map((unit) => {
      const normalizedUnit = { ...asRecord(unit) };
      if (normalizedUnit.pricing) {
        normalizedUnit.pricing = normalizePricingForPersistence(
          normalizedUnit.pricing,
        );
      }
      return normalizedUnit;
    });
  }

  if (product.selectedSaleUnit) {
    product.selectedSaleUnit = { ...asRecord(product.selectedSaleUnit) };
    if (product.selectedSaleUnit.pricing) {
      product.selectedSaleUnit.pricing = normalizePricingForPersistence(
        product.selectedSaleUnit.pricing,
      );
    }
  }

  return product;
};

const buildBaseAuditFields = (userId) => ({
  createdAt: FieldValue.serverTimestamp(),
  createdBy: userId,
  updatedAt: FieldValue.serverTimestamp(),
  updatedBy: userId,
  deletedAt: null,
  deletedBy: null,
  isDeleted: false,
});

const buildCreateProductPayload = (rawProduct, businessId) => {
  const product = {
    ...asRecord(rawProduct),
    id: nanoid(10),
    businessID: businessId,
  };

  product.stock = sanitizeNumber(product.stock, 0);
  product.itemType = normalizeProductItemType(product.itemType, product.type);
  product.inventoryRole = normalizeProductInventoryRole(
    product.inventoryRole,
    product.itemType,
  );
  product.isSellable =
    product.inventoryRole === 'raw_material'
      ? false
      : (parseBooleanValue(product.isSellable) ?? true);
  if (product.itemType === 'combo') {
    product.inventoryRole = null;
    product.isSellable = true;
    product.combo = normalizeComboForPersistence(product.combo);
    if (product.combo.inventoryPolicy === 'components') {
      if (product.combo.components.length === 0) {
        throw new HttpsError(
          'invalid-argument',
          'Un combo por componentes requiere al menos un producto en la receta.',
        );
      }
      product.stock = 0;
    }
  } else if (product.itemType === 'service') {
    applyServiceDefaults(product);
  } else if (product.inventoryRole === 'raw_material') {
    applyRawMaterialDefaults(product);
  } else if (product.combo !== undefined) {
    product.inventoryRole = null;
    product.combo = null;
  }
  return normalizeProductPricingForPersistence(product);
};

export const createProduct = onCall(async (request) => {
  const {
    authUid,
    businessId,
    input: productInput,
    metricKey,
    incrementBy,
  } = await prepareLimitedCreateOperation({
    request,
    inputKey: 'product',
    operation: LIMIT_OPERATION_KEYS.PRODUCT_CREATE,
    inputBusinessIdKeys: ['businessID'],
  });

  const user = { uid: authUid, businessID: businessId };
  const product = buildCreateProductPayload(productInput, businessId);
  const shouldCreateInitialPhysicalInventory =
    !isComponentTrackedCombo(product) && !isServiceProduct(product);
  let defaultWarehouse = null;

  if (shouldCreateInitialPhysicalInventory) {
    defaultWarehouse = await getDefaultWarehouse(user);
    if (!defaultWarehouse?.id) {
      throw new HttpsError(
        'failed-precondition',
        'No se pudo obtener almacén predeterminado',
      );
    }
  }

  await db.runTransaction(async (transaction) => {
    const productRef = db.doc(`businesses/${businessId}/products/${product.id}`);
    transaction.set(productRef, product);

    if (!shouldCreateInitialPhysicalInventory) {
      await incrementBusinessUsageMetric({
        businessId,
        metricKey,
        incrementBy,
        tx: transaction,
      });
      return;
    }

    const batchNumber = await getNextIDTransactional(
      transaction,
      user,
      'batches',
      1,
    );
    if (!batchNumber) {
      throw new HttpsError(
        'internal',
        'Error al generar número de lote',
      );
    }

    const baseFields = buildBaseAuditFields(authUid);
    const batch = {
      ...baseFields,
      id: nanoid(10),
      productId: product.id,
      productName: product.name || null,
      numberId: batchNumber,
      status: 'active',
      receivedDate: FieldValue.serverTimestamp(),
      providerId: null,
      quantity: product.stock,
      initialQuantity: product.stock,
    };
    const batchRef = db.doc(`businesses/${businessId}/batches/${batch.id}`);
    transaction.set(batchRef, batch);

    const stock = {
      ...baseFields,
      id: nanoid(10),
      batchId: batch.id,
      productName: product.name || null,
      batchNumberId: batchNumber,
      location: defaultWarehouse.id,
      expirationDate: null,
      status: 'active',
      productId: product.id,
      quantity: product.stock,
      initialQuantity: product.stock,
    };
    const stockRef = db.doc(`businesses/${businessId}/productsStock/${stock.id}`);
    transaction.set(stockRef, stock);

    const movement = {
      ...baseFields,
      id: nanoid(10),
      batchId: batch.id,
      productName: product.name || null,
      batchNumberId: batchNumber,
      destinationLocation: defaultWarehouse.id,
      sourceLocation: null,
      productId: product.id,
      quantity: product.stock,
      movementType: 'in',
      movementReason: 'initial_stock',
    };
    const movementRef = db.doc(`businesses/${businessId}/movements/${movement.id}`);
    transaction.set(movementRef, movement);

    await incrementBusinessUsageMetric({
      businessId,
      metricKey,
      incrementBy,
      tx: transaction,
    });
  });

  return {
    ok: true,
    productId: product.id,
    businessId,
  };
});

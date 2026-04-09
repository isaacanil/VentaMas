/*
  Script: importProductsFromExcel.js

  Purpose:
    Importa productos desde un .xlsx (como "Matriz Inventario Ventamax.xlsx")
    a un negocio específico (businesses/{businessId}) creando:
      - products
      - categories (si aplica)
      - batches
      - productsStock
      - movements (entrada inicial)
      - counters/batches (para reservar numberId)

  Uso (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\<service-account>.json"
    node functions/scripts/importProductsFromExcel.js --businessId bsFc_2l2NKnQ0S6-hiiYf --file "C:\\Users\\jonat\\Downloads\\Matriz Inventario Ventamax.xlsx" --dry-run
    node functions/scripts/importProductsFromExcel.js --businessId bsFc_2l2NKnQ0S6-hiiYf --file "C:\\Users\\jonat\\Downloads\\Matriz Inventario Ventamax.xlsx" --write

  Flags:
    --businessId <id>   Requerido.
    --file <path>       Requerido.
    --projectId <id>    Opcional (default: usa el del service account / ADC).
    --actorUid <uid>    Opcional (default: 'script_import').
    --dry-run           Default. No escribe, solo valida y muestra resumen.
    --write             Aplica cambios.
*/

import process from 'process';
import admin from 'firebase-admin';
import ExcelJS from 'exceljs';
import { nanoid } from 'nanoid';

let db = null;
let FieldValue = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalizeHeaderKey = (value) => {
  if (value === null || value === undefined) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const HEADER_ALIASES_ES = {
  codigo: 'codigo de barras',
  'codigo de barra': 'codigo de barras',
  'nombre del producto': 'nombre',
  facturable: 'es visible',
  inventariable: 'rastreo de inventario',
  'precio medio': 'precio promedio',
};

const resolveNormalizedHeader = (value) => {
  const normalized = normalizeHeaderKey(value);
  if (!normalized) return '';
  return HEADER_ALIASES_ES[normalized] ?? normalized;
};

const toCleanString = (value) => {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return s;
};

const getCategoryNameFromDocument = (data) => {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.name === 'string') return data.name.trim();
  if (typeof data.category?.name === 'string') return data.category.name.trim();
  return '';
};

const toInt = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

const parseCurrency = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const raw = typeof value === 'string' ? value : String(value);
  const cleaned = raw
    .replace(/[$€£¥₩₹₽]/g, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseBooleanSiNo = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['sí', 'si', 'yes', 'true', '1'].includes(normalized)) return true;
  if (['no', 'false', '0'].includes(normalized)) return false;
  return fallback;
};

const parseTax = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['sí', 'si', 'yes', 'true', '1'].includes(normalized)) return 18;
    if (['no', 'false', '0', 'exento', 'exenta'].includes(normalized)) return 0;
  }
  // soporta: 18, 18%, 0.18
  const raw = typeof value === 'string' ? value.replace('%', '') : String(value);
  const parsed = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(parsed)) return 0;
  const adjusted = parsed > 0 && parsed < 1 ? parsed * 100 : parsed;
  return Number.isFinite(adjusted) ? Number(adjusted.toFixed(2)) : 0;
};

const getFlag = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const hasFlag = (args, name) => args.includes(name);

const args = process.argv.slice(2);
const businessId = getFlag(args, '--businessId');
const filePath = getFlag(args, '--file');
const projectId =
  getFlag(args, '--projectId') ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  null;
const actorUid = getFlag(args, '--actorUid') || 'script_import';
const isWrite = hasFlag(args, '--write');
const isDryRun = !isWrite || hasFlag(args, '--dry-run');

if (!businessId || !filePath) {
  console.error(
    'Missing required args. Example:\n' +
      '  node functions/scripts/importProductsFromExcel.js --businessId <id> --file "<path.xlsx>" --dry-run\n' +
      '  node functions/scripts/importProductsFromExcel.js --businessId <id> --file "<path.xlsx>" --write',
  );
  process.exit(1);
}

const isRetryableGrpcError = (error) => {
  const code = typeof error?.code === 'number' ? error.code : null;
  // gRPC status codes we typically want to retry for Firestore commits.
  // 4: DEADLINE_EXCEEDED, 10: ABORTED, 14: UNAVAILABLE
  return code === 4 || code === 10 || code === 14;
};

const commitWithRetry = async (batchToCommit, { attempts = 6 } = {}) => {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await batchToCommit.commit();
      return;
    } catch (error) {
      lastError = error;
      if (!isRetryableGrpcError(error) || i === attempts - 1) throw error;
      const backoff = Math.min(30000, 800 * 2 ** i) + Math.floor(Math.random() * 250);
      console.warn(
        `[Import] commit retry ${i + 1}/${attempts} after ${backoff}ms (code=${error?.code ?? 'n/a'})`,
      );
      await sleep(backoff);
    }
  }
  throw lastError;
};

const getDefaultWarehouseId = async (bid) => {
  const warehousesRef = db.collection('businesses').doc(bid).collection('warehouses');
  const snap = await warehousesRef.where('defaultWarehouse', '==', true).limit(10).get();
  if (snap.empty) return null;
  const doc = snap.docs.find((d) => d.data()?.isDeleted !== true) ?? snap.docs[0];
  const data = doc.data() || {};
  return data.id || doc.id || null;
};

const reserveBatchNumbers = async (bid, quantity) => {
  if (quantity < 1) throw new Error('quantity must be >= 1');
  const counterRef = db.collection('businesses').doc(bid).collection('counters').doc('batches');
  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const currentValue = snap.exists ? (snap.data()?.value ?? 0) : 0;
    const nextValue = currentValue + quantity;
    if (snap.exists) tx.update(counterRef, { value: nextValue });
    else tx.set(counterRef, { value: quantity });
    return currentValue + 1;
  });
};

const readMatrixExcel = async (xlsxPath) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('No worksheets found');

  // Buscar la fila de headers (match >= 2)
  const expected = new Set(
    [
      'nombre',
      'categoria',
      'stock',
      'impuesto',
      'codigo de barras',
      'costo',
      'precio de lista',
      'precio minimo',
      'precio promedio',
      'es visible',
      'rastreo de inventario',
    ].map((h) => normalizeHeaderKey(h)),
  );

  let headerRowNum = null;
  let headers = null;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (headerRowNum !== null) return;
    const values = (row.values || []).slice(1);
    const normalized = values.map((v) => resolveNormalizedHeader(v));
    const matchCount = normalized.reduce((acc, v) => (expected.has(v) ? acc + 1 : acc), 0);
    if (matchCount >= 2) {
      headerRowNum = rowNumber;
      headers = values;
    }
  });

  if (!headerRowNum || !headers) {
    throw new Error('No se detectaron headers en el Excel (match insuficiente).');
  }

  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNum) return;
    const values = (row.values || []).slice(1);
    const obj = {};
    headers.forEach((h, idx) => {
      const key = toCleanString(h);
      if (!key) return;
      obj[key] = values[idx];
    });
    rows.push(obj);
  });

  return rows;
};

const mapRowsToProducts = (rows) => {
  return rows
    .map((raw) => {
      const byNorm = new Map();
      for (const [k, v] of Object.entries(raw)) {
        const norm = resolveNormalizedHeader(k);
        if (!norm) continue;
        byNorm.set(norm, v);
      }

      const name = toCleanString(byNorm.get('nombre') ?? '');
      const category = toCleanString(byNorm.get('categoria') ?? '');
      const size = toCleanString(byNorm.get('tamano') ?? '');
      const netContent = toCleanString(byNorm.get('contenido neto') ?? '');
      const stock = toInt(byNorm.get('stock'), 0);
      const barcodeRaw = byNorm.get('codigo de barras');
      const barcode =
        typeof barcodeRaw === 'string' || typeof barcodeRaw === 'number'
          ? barcodeRaw
          : barcodeRaw === null || barcodeRaw === undefined
            ? ''
            : String(barcodeRaw);

      const isVisible = parseBooleanSiNo(byNorm.get('es visible'), true);
      const trackInventory = parseBooleanSiNo(byNorm.get('rastreo de inventario'), null);

      const pricing = {
        cost: parseCurrency(byNorm.get('costo')),
        listPrice: parseCurrency(byNorm.get('precio de lista')),
        minPrice: parseCurrency(byNorm.get('precio minimo')),
        avgPrice: parseCurrency(byNorm.get('precio promedio')),
        tax: parseTax(byNorm.get('impuesto')),
      };

      return {
        name,
        category,
        size,
        netContent,
        stock,
        barcode,
        isVisible,
        trackInventory,
        pricing,
      };
    })
    .filter((p) => p.name && p.name.trim());
};

const validatePricing = (product) => {
  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const pricing = product.pricing ?? {};
  const price = toNumber(pricing.price);
  const listPrice = toNumber(pricing.listPrice);

  const hasPrice = price > 0;
  const hasListPrice = listPrice > 0;
  const resolvedListPrice = hasListPrice ? listPrice : hasPrice ? price : 0;
  const resolvedPrice = hasPrice ? price : resolvedListPrice;

  return {
    ...product,
    pricing: {
      price: resolvedPrice,
      listPrice: resolvedListPrice,
      avgPrice: toNumber(pricing.avgPrice),
      minPrice: toNumber(pricing.minPrice),
      cost: toNumber(pricing.cost),
      tax: toNumber(pricing.tax),
    },
  };
};

const normalizeLookupValue = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const normalizeBarcodeValue = (value) => {
  if (typeof value === 'string') return value.trim().toLowerCase();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value).trim().toLowerCase();
  }
  return '';
};

const buildNameBarcodeLookupKey = (name, barcode) => {
  const normalizedName = normalizeLookupValue(name);
  const normalizedBarcode = normalizeBarcodeValue(barcode);
  if (!normalizedName || !normalizedBarcode) return null;
  return `${normalizedName}::${normalizedBarcode}`;
};

const createProductLookup = () => ({
  byId: new Map(),
  byName: new Map(),
  byNameBarcode: new Map(),
  ambiguousNames: new Set(),
});

const registerProductLookupEntry = (lookup, entry) => {
  const resolvedId =
    normalizeLookupValue(entry.data?.id) || normalizeLookupValue(entry.ref?.id);
  if (resolvedId) {
    lookup.byId.set(resolvedId, entry);
  }

  const normalizedName = normalizeLookupValue(entry.data?.name);
  if (normalizedName) {
    if (lookup.byName.has(normalizedName)) {
      lookup.byName.delete(normalizedName);
      lookup.ambiguousNames.add(normalizedName);
    } else if (!lookup.ambiguousNames.has(normalizedName)) {
      lookup.byName.set(normalizedName, entry);
    }
  }

  const nameBarcodeKey = buildNameBarcodeLookupKey(
    entry.data?.name,
    entry.data?.barcode,
  );
  if (nameBarcodeKey) {
    lookup.byNameBarcode.set(nameBarcodeKey, entry);
  }
};

const findExistingProductEntry = (product, lookup) => {
  const normalizedId = normalizeLookupValue(product.id);
  if (normalizedId && lookup.byId.has(normalizedId)) {
    return lookup.byId.get(normalizedId);
  }

  const nameBarcodeKey = buildNameBarcodeLookupKey(product.name, product.barcode);
  if (nameBarcodeKey && lookup.byNameBarcode.has(nameBarcodeKey)) {
    return lookup.byNameBarcode.get(nameBarcodeKey);
  }

  const normalizedName = normalizeLookupValue(product.name);
  if (!normalizedName || lookup.ambiguousNames.has(normalizedName)) return null;

  const uniqueByName = lookup.byName.get(normalizedName) || null;
  if (!uniqueByName) return null;

  const incomingBarcode = normalizeBarcodeValue(product.barcode);
  const existingBarcode = normalizeBarcodeValue(uniqueByName.data?.barcode);
  if (incomingBarcode && existingBarcode && incomingBarcode !== existingBarcode) {
    return null;
  }

  return uniqueByName;
};

const shouldCreateInitialInventory = (product) =>
  product.trackInventory === true && toInt(product.stock, 0) > 0;

const run = async () => {
  console.log('[Import] businessId:', businessId);
  console.log('[Import] file:', filePath);
  console.log('[Import] mode:', isDryRun ? 'dry-run' : 'write');

  const rawRows = await readMatrixExcel(filePath);
  const products = mapRowsToProducts(rawRows).map(validatePricing);

  if (!products.length) {
    console.error('[Import] No se detectaron productos válidos (name vacío).');
    process.exit(1);
  }

  console.log('[Import] products detected:', products.length);
  console.log(
    '[Import] sample:',
    products.slice(0, 3).map((p) => ({
      name: p.name,
      stock: p.stock,
      barcode: p.barcode,
      tax: p.pricing?.tax,
      listPrice: p.pricing?.listPrice,
      isVisible: p.isVisible,
      trackInventory: p.trackInventory,
    })),
  );

  if (isDryRun) {
    console.log('[Import] Dry-run: no writes performed.');
    return;
  }

  // Firestore is only needed in write mode.
  if (!admin.apps.length) {
    admin.initializeApp(projectId ? { projectId } : undefined);
  }
  db = admin.firestore();
  ({ FieldValue } = admin.firestore);

  const defaultWarehouseId = await getDefaultWarehouseId(businessId);
  console.log('[Import] defaultWarehouseId:', defaultWarehouseId ?? '(none)');

  const productsCol = db.collection('businesses').doc(businessId).collection('products');
  const categoriesCol = db.collection('businesses').doc(businessId).collection('categories');
  const batchesCol = db.collection('businesses').doc(businessId).collection('batches');
  const stockCol = db.collection('businesses').doc(businessId).collection('productsStock');
  const movementsCol = db.collection('businesses').doc(businessId).collection('movements');

  console.log('[Import] loading existing products...');
  const existingProductsSnap = await productsCol.get();
  const existingProductLookup = createProductLookup();
  for (const docSnap of existingProductsSnap.docs) {
    const data = docSnap.data() || {};
    registerProductLookupEntry(existingProductLookup, {
      ref: docSnap.ref,
      data: {
        ...data,
        id: data.id || docSnap.id,
      },
    });
  }
  console.log('[Import] existing products:', existingProductLookup.byId.size);

  console.log('[Import] loading existing categories...');
  const existingCategoriesSnap = await categoriesCol.get();
  const existingCategoriesByName = new Map();
  for (const docSnap of existingCategoriesSnap.docs) {
    const data = docSnap.data() || {};
    const name = getCategoryNameFromDocument(data).toLowerCase();
    if (!name) continue;
    existingCategoriesByName.set(name, { ref: docSnap.ref, data });
  }
  console.log('[Import] existing categories:', existingCategoriesByName.size);

  console.log('[Import] scanning existing initial stock movements...');
  const existingInitialMovementProductIds = new Set();
  try {
    const movementSnap = await movementsCol.where('movementReason', '==', 'initial_stock').get();
    for (const docSnap of movementSnap.docs) {
      const data = docSnap.data() || {};
      const pid = typeof data.productId === 'string' ? data.productId : null;
      if (pid) existingInitialMovementProductIds.add(pid);
    }
  } catch (error) {
    console.warn('[Import] movement scan failed (continuing without resume safety):', error?.message ?? error);
  }

  console.log('[Import] scanning existing productsStock...');
  const existingStockProductIds = new Set();
  try {
    const stockSnap = await stockCol.get();
    for (const docSnap of stockSnap.docs) {
      const data = docSnap.data() || {};
      const pid = typeof data.productId === 'string' ? data.productId : null;
      if (pid) existingStockProductIds.add(pid);
    }
  } catch (error) {
    console.warn('[Import] productsStock scan failed:', error?.message ?? error);
  }

  const requiresDefaultWarehouse = products.some((input) => {
    const existing = findExistingProductEntry(input, existingProductLookup);
    const existingHasInventory = existing
      ? existingStockProductIds.has(existing.ref.id) ||
        existingInitialMovementProductIds.has(existing.ref.id)
      : false;
    return shouldCreateInitialInventory(input) && (!existing || !existingHasInventory);
  });
  if (requiresDefaultWarehouse && !defaultWarehouseId) {
    throw new Error(
      'No existe un almacén predeterminado para crear inventario inicial.',
    );
  }

  // Batch number reservation:
  // Reserve in chunks as needed so retries/resumes do not inflate the counter too much.
  console.log('[Import] reserving batch numbers in chunks...');
  const batchNumberPool = [];
  const reserveChunk = async (quantity) => {
    const start = await reserveBatchNumbers(businessId, quantity);
    for (let i = 0; i < quantity; i += 1) batchNumberPool.push(start + i);
  };
  const getNextBatchNumber = async () => {
    if (!batchNumberPool.length) {
      await reserveChunk(200);
    }
    return batchNumberPool.shift();
  };

  const baseFields = {
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actorUid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorUid,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
  };

  const maxBatchOps = 200; // smaller batches reduce commit latency/timeouts
  let batch = db.batch();
  let opCount = 0;
  let commitCount = 0;

  const flushIfNeeded = async () => {
    if (opCount >= maxBatchOps) {
      commitCount += 1;
      console.log(`[Import] committing batch ${commitCount}...`);
      await commitWithRetry(batch);
      batch = db.batch();
      opCount = 0;
    }
  };

  let created = 0;
  let updated = 0;
  let createdCategories = 0;
  let skippedInitialStock = 0;

  for (let i = 0; i < products.length; i += 1) {
    const input = products[i];
    const existing = findExistingProductEntry(input, existingProductLookup);
    const existingHasInventory = existing
      ? existingStockProductIds.has(existing.ref.id) ||
        existingInitialMovementProductIds.has(existing.ref.id)
      : false;
    const shouldSeedInventory =
      shouldCreateInitialInventory(input) && (!existing || !existingHasInventory);

    let productRef;
    if (existing) {
      productRef = existing.ref;
      const updatePayload = {
        ...input,
        id: existing.data?.id || productRef.id,
        businessID: businessId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
        image: existing.data?.image,
        stock: shouldSeedInventory
          ? toInt(input.stock, 0)
          : Number(existing.data?.stock || 0),
      };
      if (updatePayload.image === undefined) {
        delete updatePayload.image;
      }
      batch.update(productRef, updatePayload);
      opCount += 1;
      updated += 1;
    } else {
      productRef = productsCol.doc();
      const createdProduct = {
        ...input,
        id: productRef.id,
        businessID: businessId,
        stock: shouldSeedInventory ? toInt(input.stock, 0) : 0,
        ...baseFields,
      };
      batch.set(productRef, createdProduct);
      registerProductLookupEntry(existingProductLookup, {
        ref: productRef,
        data: createdProduct,
      });
      opCount += 1;
      created += 1;
    }
    await flushIfNeeded();

    // category upsert (best-effort)
    if (typeof input.category === 'string' && input.category.trim()) {
      const catKey = input.category.trim().toLowerCase();
      if (!existingCategoriesByName.has(catKey)) {
        const catRef = categoriesCol.doc();
        batch.set(catRef, {
          category: {
            id: catRef.id,
            name: input.category,
            createdAt: FieldValue.serverTimestamp(),
          },
        });
        opCount += 1;
        existingCategoriesByName.set(catKey, {
          ref: catRef,
          data: {
            category: {
              id: catRef.id,
              name: input.category,
            },
          },
        });
        createdCategories += 1;
        await flushIfNeeded();
      }
    }

    if (!shouldSeedInventory) {
      skippedInitialStock += 1;
      continue;
    }

    if (!defaultWarehouseId) {
      throw new Error(
        'No existe un almacén predeterminado para crear inventario inicial.',
      );
    }

    // Batch + stock + movement (initial stock)
    const qty = toInt(input.stock, 0);
    const batchNumber = await getNextBatchNumber();
    const batchId = nanoid(10);
    const stockId = nanoid(10);
    const movementId = nanoid(10);

    const batchesRef = batchesCol.doc(batchId);
    batch.set(batchesRef, {
      ...baseFields,
      id: batchId,
      productId: productRef.id,
      productName: input.name,
      numberId: batchNumber,
      status: 'active',
      receivedDate: FieldValue.serverTimestamp(),
      providerId: null,
      quantity: qty,
      initialQuantity: qty,
    });
    opCount += 1;
    await flushIfNeeded();

    const stockRef = stockCol.doc(stockId);
    batch.set(stockRef, {
      ...baseFields,
      id: stockId,
      batchId,
      productName: input.name,
      batchNumberId: batchNumber,
      location: defaultWarehouseId,
      expirationDate: null,
      productId: productRef.id,
      status: 'active',
      quantity: qty,
      initialQuantity: qty,
    });
    opCount += 1;
    await flushIfNeeded();

    const movementsRef = movementsCol.doc(movementId);
    batch.set(movementsRef, {
      ...baseFields,
      id: movementId,
      batchId,
      productName: input.name,
      batchNumberId: batchNumber,
      destinationLocation: defaultWarehouseId,
      sourceLocation: null,
      productId: productRef.id,
      quantity: qty,
      movementType: 'in',
      movementReason: 'initial_stock',
    });
    opCount += 1;
    await flushIfNeeded();

    existingStockProductIds.add(productRef.id);
    existingInitialMovementProductIds.add(productRef.id);
  }

  if (opCount > 0) {
    commitCount += 1;
    console.log(`[Import] committing batch ${commitCount}...`);
    await commitWithRetry(batch);
  }

  console.log('[Import] Done.');
  console.log('[Import] created products:', created);
  console.log('[Import] updated products:', updated);
  console.log('[Import] created categories:', createdCategories);
  console.log('[Import] skipped initial stock (resume):', skippedInitialStock);
};

run().catch((error) => {
  console.error('[Import] Failed:', error);
  process.exit(1);
});

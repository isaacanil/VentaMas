/**
 * Export a business data "pack" (sanitized by default) into a folder structure
 * to audit schemas and invariants across modules:
 * - invoices / preorders
 * - accounts receivable (CxC) + payments + installments
 * - credit notes + applications
 * - cash counts (cash reconciliation)
 *
 * This is intended for local analysis, not for committing to git.
 *
 * Usage:
 *   cd functions
 *   node scripts/data-audit/export-business-data.mjs --keyPath=C:\path\service-account.json --businessId=BUSINESS_ID
 *
 * Optional:
 *   --outDir=C:\some\folder
 *   --outDirBase=C:\base\folder   (creates <base>\<YYYYMMDD-HHMMSS>\raw)
 *   --includeSensitive=1   (default 0; exports full docs)
 *   --limitInvoices=200 --limitAR=200 --limitARPayments=500 --limitCashCounts=50 --limitCreditNotes=200
 *   --withExpenses=1 --withInventory=1 --withInvoicesV2=1 (default 0)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .map((raw) => raw.split('='))
      .map(([k, v]) => [k.replace(/^--/, ''), v ?? '']),
  );

  const readNum = (k, fallback) => {
    if (!args[k]) return fallback;
    const n = Number(args[k]);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  const readBool = (k) => args[k] === '1' || args[k] === 'true';

  return {
    keyPath: args.keyPath || '',
    projectId: args.projectId || '',
    businessId: args.businessId || '',
    outDir: args.outDir || '',
    outDirBase: args.outDirBase || '',
    includeSensitive: args.includeSensitive === '1',
    withExpenses: readBool('withExpenses'),
    withInventory: readBool('withInventory'),
    withInvoicesV2: readBool('withInvoicesV2'),
    limitInvoices: readNum('limitInvoices', 200),
    limitInvoicesV2: readNum('limitInvoicesV2', 200),
    limitAR: readNum('limitAR', 200),
    limitARPayments: readNum('limitARPayments', 500),
    limitCashCounts: readNum('limitCashCounts', 50),
    limitCreditNotes: readNum('limitCreditNotes', 200),
    limitCreditNoteApplications: readNum('limitCreditNoteApplications', 200),
    limitExpenses: readNum('limitExpenses', 200),
    limitProducts: readNum('limitProducts', 500),
    limitProductsStock: readNum('limitProductsStock', 2000),
    limitBatches: readNum('limitBatches', 2000),
    limitBackOrders: readNum('limitBackOrders', 500),
    limitInventorySessions: readNum('limitInventorySessions', 100),
    limitInventorySessionCounts: readNum('limitInventorySessionCounts', 2000),
  };
};

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const roundToTwoDecimals = (v) => {
  const n = safeNumber(v);
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

const isoStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    String(d.getFullYear()) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
};

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const safeFilename = (raw, fallback = 'doc') => {
  const s = String(raw || '').trim();
  const base = s.length ? s : fallback;
  // Windows reserved chars: < > : " / \ | ? * and control chars
  // Also avoid trailing dots/spaces.
  const cleaned = base
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 180);
  return cleaned.length ? cleaned : fallback;
};

const writeJson = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
};

const asPlainForJson = (value) => {
  // Timestamps and references are not JSON-native.
  if (value instanceof admin.firestore.Timestamp) {
    return { __type: 'Timestamp', iso: value.toDate().toISOString() };
  }
  if (value instanceof admin.firestore.GeoPoint) {
    return {
      __type: 'GeoPoint',
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }
  if (value && typeof value === 'object') {
    // DocumentReference check (best-effort; avoids pulling in internal classes)
    if ('path' in value && 'id' in value && typeof value.path === 'string') {
      return { __type: 'DocRef', path: value.path };
    }
  }
  if (typeof value === 'bigint') return String(value);
  return value;
};

const deepJsonSafe = (value) => {
  const v = asPlainForJson(value);
  if (v === null) return null;
  if (Array.isArray(v)) return v.map(deepJsonSafe);
  if (v && typeof v === 'object' && !v.__type) {
    const out = {};
    for (const [k, child] of Object.entries(v)) out[k] = deepJsonSafe(child);
    return out;
  }
  return v;
};

const KEEP_STRING_KEYS = new Set([
  'status',
  'paymentStatus',
  'type',
  'method',
  'sourceOfPurchase',
  'NCF',
  'comprobante',
  'ncf',
  'comment',
  'invoiceComment',
]);

const shapeOnly = (value, keyHint = '') => {
  const v = asPlainForJson(value);

  if (v === null) return null;
  if (Array.isArray(v)) return v.map((item) => shapeOnly(item, keyHint));

  const t = typeof v;
  if (t === 'number' || t === 'boolean') return v;
  if (t === 'string') {
    // Keep important semantic strings for analysis, redact everything else.
    return KEEP_STRING_KEYS.has(keyHint) ? v : '<string>';
  }
  if (t !== 'object') return `<${t}>`;

  const out = {};
  for (const [k, child] of Object.entries(v)) {
    out[k] = shapeOnly(child, k);
  }
  return out;
};

const resolveRepoRoot = () => {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url)); // functions/scripts/data-audit
  return path.resolve(scriptDir, '..', '..', '..'); // repo root
};

const tryQuery = async ({ colRef, orderByFields, limit }) => {
  // Prefer ordering if possible; fall back to plain limit if the field doesn't exist.
  let ref = colRef;
  if (Array.isArray(orderByFields) && orderByFields.length > 0) {
    for (const f of orderByFields) {
      // eslint-disable-next-line no-await-in-loop
      try {
        ref = ref.orderBy(f, 'desc');
      } catch {
        // ignore and keep the current ref
      }
    }
  }
  try {
    return await ref.limit(limit).get();
  } catch {
    return await colRef.limit(limit).get();
  }
};

const collectDocs = async ({ colRef, limit, orderByFields }) => {
  const snap = await tryQuery({ colRef, limit, orderByFields });
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const classifyInvoice = (invoiceDoc) => {
  const data = invoiceDoc?.data || {};
  const isPreorder =
    data?.type === 'preorder' || data?.preorderDetails?.isOrWasPreorder === true;
  return { isPreorder };
};

const resolveInvoiceTotals = (invoiceDoc) => {
  const data = invoiceDoc?.data || {};
  const total = safeNumber(data?.totalPurchase?.value ?? data?.totalAmount ?? 0);
  const paymentGross = safeNumber(data?.payment?.value ?? 0);
  const changeGross = safeNumber(data?.change?.value ?? 0);
  const posPaid = Math.max(0, paymentGross - changeGross);
  const accumulatedPaid = safeNumber(data?.accumulatedPaid);
  const balanceDue = safeNumber(data?.balanceDue);
  return {
    total: roundToTwoDecimals(total),
    posPaid: roundToTwoDecimals(posPaid),
    accumulatedPaid: roundToTwoDecimals(accumulatedPaid),
    balanceDue: roundToTwoDecimals(balanceDue),
    lifecycleStatus: data?.status ?? null,
    paymentStatus: data?.paymentStatus ?? null,
    isAddedToReceivables: data?.isAddedToReceivables ?? null,
    collectedViaReceivables: data?.collectedViaReceivables ?? null,
  };
};

const collectSchema = (schema, value, prefix = '') => {
  const v = asPlainForJson(value);
  const type =
    v === null
      ? 'null'
      : Array.isArray(v)
        ? 'array'
        : typeof v === 'object'
          ? v.__type
            ? `object:${v.__type}`
            : 'object'
          : typeof v;

  const key = prefix || '(root)';
  schema[key] = schema[key] || { types: {}, keys: {} };
  schema[key].types[type] = (schema[key].types[type] || 0) + 1;

  if (v && typeof v === 'object' && !Array.isArray(v) && !v.__type) {
    for (const k of Object.keys(v)) {
      schema[key].keys[k] = (schema[key].keys[k] || 0) + 1;
      collectSchema(schema, v[k], prefix ? `${prefix}.${k}` : k);
    }
  }
  if (Array.isArray(v)) {
    for (const item of v) collectSchema(schema, item, `${key}[]`);
  }
};

const main = async () => {
  const {
    keyPath,
    projectId,
    businessId,
    outDir,
    outDirBase,
    includeSensitive,
    withExpenses,
    withInventory,
    withInvoicesV2,
    limitInvoices,
    limitInvoicesV2,
    limitAR,
    limitARPayments,
    limitCashCounts,
    limitCreditNotes,
    limitCreditNoteApplications,
    limitExpenses,
    limitProducts,
    limitProductsStock,
    limitBatches,
    limitBackOrders,
    limitInventorySessions,
    limitInventorySessionCounts,
  } = parseArgs();

  if (!keyPath) throw new Error('Missing --keyPath=SERVICE_ACCOUNT.json');
  if (!businessId) throw new Error('Missing --businessId=BUSINESS_ID');

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const resolvedProjectId = projectId || serviceAccount?.project_id || undefined;
    if (resolvedProjectId && !process.env.GOOGLE_CLOUD_PROJECT) {
      process.env.GOOGLE_CLOUD_PROJECT = resolvedProjectId;
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: resolvedProjectId,
    });
  }

  const db = admin.firestore();

  const repoRoot = resolveRepoRoot();
  const resolvedOutDir =
    outDir ||
    (outDirBase
      ? path.resolve(outDirBase, isoStamp(), 'raw')
      : path.resolve(repoRoot, '.tmp', 'data-audit', businessId, isoStamp()));
  ensureDir(resolvedOutDir);

  const col = (name) => db.collection(`businesses/${businessId}/${name}`);

  const schema = {};
  const anomalies = {
    invoices: [],
  };

  // Fetch core collections
  const invoices = await collectDocs({
    colRef: col('invoices'),
    limit: limitInvoices,
    orderByFields: ['data.date', 'data.numberID'],
  });

  const invoicesV2 = withInvoicesV2
    ? await collectDocs({
        colRef: col('invoicesV2'),
        limit: limitInvoicesV2,
        orderByFields: ['createdAt', 'snapshot.createdAt', 'snapshot.date'],
      })
    : [];

  const accountsReceivable = await collectDocs({
    colRef: col('accountsReceivable'),
    limit: limitAR,
    orderByFields: ['date', 'createdAt'],
  });
  const accountsReceivablePayments = await collectDocs({
    colRef: col('accountsReceivablePayments'),
    limit: limitARPayments,
    orderByFields: ['date', 'createdAt'],
  });
  const accountsReceivableInstallments = await collectDocs({
    colRef: col('accountsReceivableInstallments'),
    limit: limitAR,
    orderByFields: ['date', 'createdAt'],
  });
  const accountsReceivableInstallmentPayments = await collectDocs({
    colRef: col('accountsReceivableInstallmentPayments'),
    limit: limitARPayments,
    orderByFields: ['date', 'createdAt'],
  });
  const accountsReceivablePaymentReceipt = await collectDocs({
    colRef: col('accountsReceivablePaymentReceipt'),
    limit: Math.min(limitARPayments, 200),
    orderByFields: ['date', 'createdAt'],
  });

  const creditNotes = await collectDocs({
    colRef: col('creditNotes'),
    limit: limitCreditNotes,
    orderByFields: ['createdAt', 'date'],
  });
  const creditNoteApplications = await collectDocs({
    colRef: col('creditNoteApplications'),
    limit: limitCreditNoteApplications,
    orderByFields: ['createdAt', 'date'],
  });
  const cashCounts = await collectDocs({
    colRef: col('cashCounts'),
    limit: limitCashCounts,
    orderByFields: ['cashCount.opening.date', 'cashCount.opening.openAt', 'date'],
  });

  const expenses = withExpenses
    ? await collectDocs({
        colRef: col('expenses'),
        limit: limitExpenses,
        orderByFields: ['date', 'createdAt', 'expense.date'],
      })
    : [];

  const inventoryCollections = withInventory
    ? {
        products: await collectDocs({
          colRef: col('products'),
          limit: limitProducts,
          orderByFields: ['updatedAt', 'createdAt'],
        }),
        productsStock: await collectDocs({
          colRef: col('productsStock'),
          limit: limitProductsStock,
          orderByFields: ['updatedAt', 'createdAt'],
        }),
        batches: await collectDocs({
          colRef: col('batches'),
          limit: limitBatches,
          orderByFields: ['updatedAt', 'createdAt'],
        }),
        backOrders: await collectDocs({
          colRef: col('backOrders'),
          limit: limitBackOrders,
          orderByFields: ['updatedAt', 'createdAt'],
        }),
        inventorySessions: await collectDocs({
          colRef: col('inventorySessions'),
          limit: limitInventorySessions,
          orderByFields: ['updatedAt', 'createdAt', 'date'],
        }),
      }
    : {
        products: [],
        productsStock: [],
        batches: [],
        backOrders: [],
        inventorySessions: [],
      };

  // Organize output folders
  const folders = {
    invoices: path.resolve(resolvedOutDir, 'factura', 'invoices'),
    preorders: path.resolve(resolvedOutDir, 'preventa', 'preorders'),
    ar: path.resolve(resolvedOutDir, 'cuentas-por-cobrar', 'accountsReceivable'),
    arPayments: path.resolve(
      resolvedOutDir,
      'pagos',
      'accountsReceivablePayments',
    ),
    arInstallments: path.resolve(
      resolvedOutDir,
      'cuentas-por-cobrar',
      'accountsReceivableInstallments',
    ),
    arInstallmentPayments: path.resolve(
      resolvedOutDir,
      'pagos',
      'accountsReceivableInstallmentPayments',
    ),
    arReceipts: path.resolve(
      resolvedOutDir,
      'pagos',
      'accountsReceivablePaymentReceipt',
    ),
    creditNotes: path.resolve(resolvedOutDir, 'nota-de-credito', 'creditNotes'),
    creditNoteApplications: path.resolve(
      resolvedOutDir,
      'nota-de-credito',
      'creditNoteApplications',
    ),
    cashCounts: path.resolve(resolvedOutDir, 'cuadre-de-caja', 'cashCounts'),
    expenses: path.resolve(resolvedOutDir, 'gastos', 'expenses'),
    invoicesV2: path.resolve(resolvedOutDir, 'factura', 'invoicesV2'),
    products: path.resolve(resolvedOutDir, 'inventario', 'products'),
    productsStock: path.resolve(resolvedOutDir, 'inventario', 'productsStock'),
    batches: path.resolve(resolvedOutDir, 'inventario', 'batches'),
    backOrders: path.resolve(resolvedOutDir, 'inventario', 'backOrders'),
    inventorySessions: path.resolve(resolvedOutDir, 'inventario', 'inventorySessions'),
    inventorySessionCounts: path.resolve(
      resolvedOutDir,
      'inventario',
      'inventorySessionCounts',
    ),
  };
  Object.values(folders).forEach(ensureDir);

  const sanitize = (doc) =>
    includeSensitive ? deepJsonSafe(doc) : shapeOnly(doc);

  const index = {
    businessId,
    projectId:
      admin.app().options.projectId ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      null,
    outDir: resolvedOutDir,
    includeSensitive,
    limits: {
      invoices: limitInvoices,
      invoicesV2: limitInvoicesV2,
      accountsReceivable: limitAR,
      accountsReceivablePayments: limitARPayments,
      cashCounts: limitCashCounts,
      creditNotes: limitCreditNotes,
      expenses: limitExpenses,
      inventory: {
        products: limitProducts,
        productsStock: limitProductsStock,
        batches: limitBatches,
        backOrders: limitBackOrders,
        inventorySessions: limitInventorySessions,
        inventorySessionCounts: limitInventorySessionCounts,
      },
    },
    flags: {
      withExpenses,
      withInventory,
      withInvoicesV2,
      outDirBase: outDirBase || null,
    },
    exported: {},
  };

  // Export invoices (split into invoices vs preorders)
  let preorderCount = 0;
  const invoiceSummary = [];

  for (const doc of invoices) {
    const { isPreorder } = classifyInvoice(doc);
    const folder = isPreorder ? folders.preorders : folders.invoices;
    if (isPreorder) preorderCount++;

    const totals = resolveInvoiceTotals(doc);
    invoiceSummary.push({ id: doc.id, ...totals });

    if (totals.lifecycleStatus !== null && typeof totals.lifecycleStatus !== 'string') {
      anomalies.invoices.push({
        id: doc.id,
        kind: 'invalid_lifecycle_status_type',
        status: totals.lifecycleStatus,
        statusType:
          totals.lifecycleStatus === null ? 'null' : typeof totals.lifecycleStatus,
      });
    }
    if (
      totals.lifecycleStatus !== null &&
      typeof totals.lifecycleStatus === 'string' &&
      !['pending', 'completed', 'cancelled'].includes(totals.lifecycleStatus)
    ) {
      anomalies.invoices.push({
        id: doc.id,
        kind: 'invalid_lifecycle_status_value',
        status: totals.lifecycleStatus,
      });
    }
    if (totals.balanceDue < 0) {
      anomalies.invoices.push({ id: doc.id, kind: 'negative_balanceDue' });
    }

    collectSchema(schema, doc, 'invoices[]');
    writeJson(path.resolve(folder, `${safeFilename(doc.id)}.json`), sanitize(doc));
  }

  index.exported.invoices = invoices.length;
  index.exported.preorders = preorderCount;

  const exportList = (items, folder, tag) => {
    for (const doc of items) {
      collectSchema(schema, doc, `${tag}[]`);
      writeJson(path.resolve(folder, `${safeFilename(doc.id)}.json`), sanitize(doc));
    }
    index.exported[tag] = items.length;
  };

  exportList(accountsReceivable, folders.ar, 'accountsReceivable');
  exportList(accountsReceivablePayments, folders.arPayments, 'accountsReceivablePayments');
  exportList(accountsReceivableInstallments, folders.arInstallments, 'accountsReceivableInstallments');
  exportList(
    accountsReceivableInstallmentPayments,
    folders.arInstallmentPayments,
    'accountsReceivableInstallmentPayments',
  );
  exportList(
    accountsReceivablePaymentReceipt,
    folders.arReceipts,
    'accountsReceivablePaymentReceipt',
  );
  exportList(creditNotes, folders.creditNotes, 'creditNotes');
  exportList(
    creditNoteApplications,
    folders.creditNoteApplications,
    'creditNoteApplications',
  );
  exportList(cashCounts, folders.cashCounts, 'cashCounts');

  if (withExpenses) exportList(expenses, folders.expenses, 'expenses');
  if (withInvoicesV2) exportList(invoicesV2, folders.invoicesV2, 'invoicesV2');

  if (withInventory) {
    exportList(inventoryCollections.products, folders.products, 'products');
    exportList(
      inventoryCollections.productsStock,
      folders.productsStock,
      'productsStock',
    );
    exportList(inventoryCollections.batches, folders.batches, 'batches');
    exportList(inventoryCollections.backOrders, folders.backOrders, 'backOrders');
    exportList(
      inventoryCollections.inventorySessions,
      folders.inventorySessions,
      'inventorySessions',
    );

    // Export inventorySessions/{id}/counts (best-effort; may not exist in older schemas)
    let exportedCounts = 0;
    for (const session of inventoryCollections.inventorySessions) {
      // eslint-disable-next-line no-await-in-loop
      let snap = null;
      try {
        // eslint-disable-next-line no-await-in-loop
        snap = await db
          .collection(`businesses/${businessId}/inventorySessions/${session.id}/counts`)
          .limit(limitInventorySessionCounts)
          .get();
      } catch {
        snap = null;
      }

      if (!snap) continue;
      const folder = path.resolve(folders.inventorySessionCounts, session.id);
      ensureDir(folder);
      for (const d of snap.docs) {
        exportedCounts++;
        collectSchema(schema, { id: d.id, ...d.data() }, 'inventorySessionCounts[]');
        writeJson(
          path.resolve(folder, `${safeFilename(d.id)}.json`),
          sanitize({ id: d.id, ...d.data() }),
        );
      }
    }
    index.exported.inventorySessionCounts = exportedCounts;
  }

  // Lightweight join stats (exported sample only)
  const arByInvoiceId = {};
  for (const ar of accountsReceivable) {
    const invoiceId = ar?.invoiceId || ar?.invoiceID || null;
    if (!invoiceId) continue;
    arByInvoiceId[invoiceId] = (arByInvoiceId[invoiceId] || 0) + 1;
  }
  const invoiceJoinStats = {
    invoicesWithAR: invoiceSummary.filter((i) => Boolean(arByInvoiceId[i.id])).length,
    totalInvoices: invoiceSummary.length,
  };

  writeJson(path.resolve(resolvedOutDir, 'index.json'), index);
  writeJson(path.resolve(resolvedOutDir, 'schema-summary.json'), schema);
  writeJson(path.resolve(resolvedOutDir, 'invoice-summary.json'), invoiceSummary);
  writeJson(path.resolve(resolvedOutDir, 'join-stats.json'), invoiceJoinStats);
  writeJson(path.resolve(resolvedOutDir, 'anomalies.json'), anomalies);

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        outDir: resolvedOutDir,
        exported: index.exported,
        invoiceJoinStats,
        anomalies: { invoices: anomalies.invoices.length },
      },
      null,
      2,
    ),
  );
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

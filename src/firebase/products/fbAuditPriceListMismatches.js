// src/lib/price-audit-export.js
import {
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  query,
  orderBy,
  startAfter,
  limit as qLimit,
  documentId,
  writeBatch,
  serverTimestamp,
  getCountFromServer,
  doc,
} from 'firebase/firestore';
import { db } from '../firebaseconfig';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/* ───────────────────────────── Números seguros ───────────────────────────── */
/** Parser estricto de dinero: null si el texto es ambiguo o malformado. */
const parseMoneyStrict = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;

  let s = v.trim();
  if (!s) return null;

  // deja solo dígitos, coma, punto, signo
  s = s.replace(/[^\d.,\-]/g, '');

  // patrones corruptos típicos
  if (/(?:,,|\.\.|,\.|\. ,|^,|^\.|^-?[,\.]$|--)/.test(s)) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot   = s.lastIndexOf('.');

  let decSep = '';
  if (lastComma > lastDot) decSep = ',';
  else if (lastDot > lastComma) decSep = '.';

  let intPart = s, fracPart = '';
  if (decSep) {
    const i = s.lastIndexOf(decSep);
    intPart  = s.slice(0, i);
    fracPart = s.slice(i + 1);
    if (!/^\d*$/.test(fracPart)) return null; // parte decimal solo dígitos
  }

  // quita separadores de miles de la parte entera
  intPart = intPart.replace(/[.,\s]/g, '');
  if (!/^-?\d+$/.test(intPart)) return null;

  const normalized = fracPart ? `${intPart}.${fracPart}` : intPart;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const MAX_PRICE = 1e9; // ajusta si necesitas otro tope
const isRealPrice = (n) =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_PRICE;

const toNumber = (v) => parseMoneyStrict(v);
const almostEqual = (a, b, eps = 0.005) => Math.abs(a - b) <= eps;

/** Sólo fija cuando listPrice es real y price falta/no es real o difiere más que eps. */
const shouldFix = (lp, p) => isRealPrice(lp) && (!isRealPrice(p) || !almostEqual(lp, p));

/* ───────────────────────────── Helpers comunes ───────────────────────────── */
const resolveProductName = (data) =>
  data?.name ?? data?.title ?? data?.product?.name ?? data?.description ?? '';

/* ───────────────────────────── CSV ───────────────────────────── */
const csvEscape = (value) => {
  if (value == null) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Construye CSV con BOM UTF-8 (Excel-friendly) y CRLF. */
const buildCSVFromObjects = (rows, headers, delimiter = ',', withBOM = true) => {
  const head = headers.map(csvEscape).join(delimiter);
  const body = rows
    .map((r) => headers.map((h) => csvEscape(r[h])).join(delimiter))
    .join('\r\n');
  const csv = head + '\r\n' + body;
  return (withBOM ? '\ufeff' : '') + csv;
};

const downloadBytes = (bytes, mime, filename) => {
  const blob = typeof bytes === 'string'
    ? new Blob([bytes], { type: mime })
    : new Blob([bytes], { type: mime });
  if (typeof window !== 'undefined') {
    try { saveAs(blob, filename); }
    catch {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }
  }
  return blob;
};

/* ╔══════════════════════════╗
   ║  1) AUDITAR (resumen)    ║
   ╚══════════════════════════╝ */
export async function fbAuditAllBusinessesPriceVsList(pageSize = 1000) {
  const resultsMap = new Map(); // businessID -> { businessID, total, equal, mismatch, unknown }
  let cursor = null;

  while (true) {
    const constraints = [orderBy(documentId()), qLimit(pageSize)];
    if (cursor) constraints.push(startAfter(cursor));
    const qy = query(collectionGroup(db, 'products'), ...constraints);
    const snap = await getDocs(qy);
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      const data = docSnap.data() || {};
      const businessID = docSnap.ref.parent?.parent?.id ?? 'unknown';
      const lp = toNumber(data?.pricing?.listPrice);
      const p  = toNumber(data?.pricing?.price);

      const entry = resultsMap.get(businessID) || { businessID, total: 0, equal: 0, mismatch: 0, unknown: 0 };
      if (!isRealPrice(lp) || !isRealPrice(p)) {
        entry.unknown += 1;
      } else {
        entry.total += 1;
        if (almostEqual(lp, p)) entry.equal += 1; else entry.mismatch += 1;
      }
      resultsMap.set(businessID, entry);
    }

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) break;
  }

  return Array.from(resultsMap.values()).map((r) => {
    const audited = r.total + r.unknown || 1;
    return {
      ...r,
      pctEqual: +(r.equal / audited * 100).toFixed(2),
      pctMismatch: +(r.mismatch / audited * 100).toFixed(2),
      pctUnknown: +(r.unknown / audited * 100).toFixed(2),
    };
  });
}

/* ╔══════════════════════════╗
   ║  2) ARREGLAR (global)    ║
   ╚══════════════════════════╝ */
export async function fbFixAllPricesToListPrice(
  { pageSize = 500, dryRun = true, batchSize = 450, unknownStrategy = 'none', onProgress } = {}
) {
  let cursor = null;
  let totalScanned = 0, totalUpdated = 0, totalSkipped = 0, totalUnknown = 0;

  let totalCount = null;
  try {
    const countSnap = await getCountFromServer(query(collectionGroup(db, 'products')));
    totalCount = countSnap.data().count;
  } catch {}

  const progressStep = 200;

  while (true) {
    const constraints = [orderBy(documentId()), qLimit(pageSize)];
    if (cursor) constraints.push(startAfter(cursor));
    const qy = query(collectionGroup(db, 'products'), ...constraints);
    const snap = await getDocs(qy);
    if (snap.empty) break;

    let batch = dryRun ? null : writeBatch(db);
    let inBatch = 0;

    for (const docSnap of snap.docs) {
      totalScanned += 1;
      const data = docSnap.data() || {};
      const lpRaw = data?.pricing?.listPrice;
      const pRaw  = data?.pricing?.price;
      const lp = toNumber(lpRaw);
      const p  = toNumber(pRaw);
      const basePricing = (data && typeof data.pricing === 'object') ? data.pricing : {};

      if (!isRealPrice(lp)) {
        totalUnknown += 1;

        // Opcional: tratamiento unknown
        if (!dryRun && unknownStrategy === 'mark') {
          batch.set(docSnap.ref, { pricing: { ...basePricing, needsReview: true } }, { merge: true });
          inBatch++;
        } else if (!dryRun && unknownStrategy === 'copyPriceToList' && isRealPrice(p)) {
          batch.set(docSnap.ref, { pricing: { ...basePricing, listPrice: p, price: p, syncedFromListAt: serverTimestamp() } }, { merge: true });
          inBatch++; totalUpdated++;
        }

        if (!dryRun && inBatch >= batchSize) { await batch.commit(); batch = writeBatch(db); inBatch = 0; }
        if (onProgress && totalScanned % progressStep === 0) onProgress({ totalScanned, totalUpdated, totalSkipped, totalUnknown, total: totalCount });
        continue;
      }

      if (shouldFix(lp, p)) {
        totalUpdated += 1;
        if (!dryRun) {
          batch.set(docSnap.ref, { pricing: { ...basePricing, price: lp, syncedFromListAt: serverTimestamp() } }, { merge: true });
          inBatch++;
          if (inBatch >= batchSize) { await batch.commit(); batch = writeBatch(db); inBatch = 0; }
        }
      } else {
        totalSkipped += 1;
      }

      if (onProgress && totalScanned % progressStep === 0) onProgress({ totalScanned, totalUpdated, totalSkipped, totalUnknown, total: totalCount });
    }

    if (!dryRun && inBatch > 0) await batch.commit();

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) break;
  }

  return { dryRun, totalScanned, totalUpdated, totalSkipped, totalUnknown, total: totalCount };
}

/* ╔══════════════════════════════════════╗
   ║  3) ARREGLAR (por lista de negocios) ║
   ╚══════════════════════════════════════╝ */
export async function fbFixPricesForBusinesses(
  businessIDs = [],
  { dryRun = true, concurrency = 6, batchSize = 450, onProgress } = {}
) {
  if (!Array.isArray(businessIDs) || businessIDs.length === 0) return [];

  let totalEstimated = 0, scannedSoFar = 0, updatedSoFar = 0, skippedSoFar = 0, unknownSoFar = 0;
  const progressStep = 100;

  const runBusiness = async (businessID) => {
    try {
      const bizIdStr = String(businessID);
      const bizRef = doc(db, 'businesses', bizIdStr);
      const bizSnap = await getDoc(bizRef);
      const businessName = bizSnap.exists() ? (bizSnap.data()?.business?.name ?? bizSnap.data()?.name ?? null) : null;

      const productsRef = collection(db, 'businesses', bizIdStr, 'products');
      const snap = await getDocs(productsRef);

      totalEstimated += snap.size;
      onProgress?.({ scope: 'list', phase: 'scanning', businessID: bizIdStr, businessName, scanned: scannedSoFar, updated: updatedSoFar, skipped: skippedSoFar, unknown: unknownSoFar, total: totalEstimated, dryRun });

      let scanned = 0, updated = 0, skipped = 0, unknown = 0;
      let batch = dryRun ? null : writeBatch(db);
      let inBatch = 0;

      for (const docSnap of snap.docs) {
        scanned += 1; scannedSoFar += 1;
        const data = docSnap.data() || {};
        const lp = toNumber(data?.pricing?.listPrice);
        const p  = toNumber(data?.pricing?.price);
        const basePricing = (data && typeof data.pricing === 'object') ? data.pricing : {};

        if (!isRealPrice(lp)) {
          unknown += 1; unknownSoFar += 1;
          if (onProgress && (scannedSoFar % progressStep === 0)) onProgress({ scope: 'list', phase: 'scanning', businessID: bizIdStr, businessName, scanned: scannedSoFar, updated: updatedSoFar, skipped: skippedSoFar, unknown: unknownSoFar, total: totalEstimated, dryRun });
          continue;
        }

        if (shouldFix(lp, p)) {
          updated += 1; updatedSoFar += 1;
          if (!dryRun) {
            batch.set(docSnap.ref, { pricing: { ...basePricing, price: lp, syncedFromListAt: serverTimestamp() } }, { merge: true });
            inBatch += 1;
            if (inBatch >= batchSize) { await batch.commit(); batch = writeBatch(db); inBatch = 0; }
          }
        } else {
          skipped += 1; skippedSoFar += 1;
        }

        if (onProgress && (scannedSoFar % progressStep === 0)) {
          onProgress({ scope: 'list', phase: 'scanning', businessID: bizIdStr, businessName, scanned: scannedSoFar, updated: updatedSoFar, skipped: skippedSoFar, unknown: unknownSoFar, total: totalEstimated, dryRun });
        }
      }

      if (!dryRun && inBatch > 0) await batch.commit();

      onProgress?.({ scope: 'list', phase: 'business-done', businessID: bizIdStr, businessName, scanned: scannedSoFar, updated: updatedSoFar, skipped: skippedSoFar, unknown: unknownSoFar, total: totalEstimated, dryRun });

      return { businessID: bizIdStr, businessName, scanned, updated, skipped, unknown, dryRun };
    } catch (e) {
      onProgress?.({ scope: 'list', phase: 'error', businessID: String(businessID), error: e?.message });
      return { businessID: String(businessID), businessName: null, scanned: 0, updated: 0, skipped: 0, unknown: 0, dryRun, error: String(e?.message || e) };
    }
  };

  const results = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, businessIDs.length) }, async () => {
    while (i < businessIDs.length) results.push(await runBusiness(businessIDs[i++]));
  });
  await Promise.all(workers);
  return results;
}

/* ╔══════════════════════════════╗
   ║  4) Recolección de problemas ║
   ╚══════════════════════════════╝ */
async function getBusinessNameCached(id, cache) {
  if (cache.has(id)) return cache.get(id);
  try {
    const bSnap = await getDoc(doc(db, 'businesses', id));
    const name = bSnap.exists() ? (bSnap.data()?.business?.name ?? bSnap.data()?.name ?? '') : '';
    cache.set(id, name);
    return name;
  } catch { cache.set(id, ''); return ''; }
}

async function collectProblemProductsAll({ pageSize = 1000, includeBusinessName = true, onProgress } = {}) {
  const businessNameCache = new Map();
  const rows = [];
  let cursor = null, scanned = 0;

  while (true) {
    const constraints = [orderBy(documentId()), qLimit(pageSize)];
    if (cursor) constraints.push(startAfter(cursor));
    const qy = query(collectionGroup(db, 'products'), ...constraints);
    const snap = await getDocs(qy);
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      scanned += 1;
      const data = docSnap.data() || {};
      const productID = docSnap.id;
      const productName = resolveProductName(data);

      const lpRaw = data?.pricing?.listPrice;
      const pRaw  = data?.pricing?.price;
      const lp = toNumber(lpRaw);
      const p  = toNumber(pRaw);

      const businessID = docSnap.ref.parent?.parent?.id ?? '';

      if (!isRealPrice(lp)) {
        const businessName = includeBusinessName ? await getBusinessNameCached(businessID, businessNameCache) : undefined;
        rows.push({ businessID, businessName, productID, productName, listPrice_raw: lpRaw ?? '', price_raw: pRaw ?? '', status: 'LISTPRICE_UNKNOWN' });
        continue;
      }
      if (!isRealPrice(p) || !almostEqual(lp, p)) {
        const businessName = includeBusinessName ? await getBusinessNameCached(businessID, businessNameCache) : undefined;
        rows.push({ businessID, businessName, productID, productName, listPrice_raw: lpRaw ?? '', price_raw: pRaw ?? '', status: 'MISMATCH' });
      }
      if (onProgress && scanned % 1000 === 0) onProgress({ scanned, collected: rows.length });
    }

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) break;
  }

  const headers = includeBusinessName
    ? ['businessID', 'businessName', 'productID', 'productName', 'listPrice_raw', 'price_raw', 'status']
    : ['businessID', 'productID', 'productName', 'listPrice_raw', 'price_raw', 'status'];

  return { rows, headers };
}

/* ╔══════════════════════════════╗
   ║  5) Export: CSV / XLSX / ambos ║
   ╚══════════════════════════════╝ */
export async function fbExportProblemProductsAll({
  format = 'xlsx',              // 'csv' | 'xlsx' | 'both'
  filenameBase = 'problem-products',
  includeBusinessName = true,
  pageSize = 1000,
  onProgress,
} = {}) {
  const { rows, headers } = await collectProblemProductsAll({ pageSize, includeBusinessName, onProgress });
  const exported = {};

  if (format === 'csv' || format === 'both') {
    const csv = buildCSVFromObjects(rows, headers);
    exported.csvBlob = downloadBytes(csv, 'text/csv;charset=utf-8', `${filenameBase}.csv`);
  }

  if (format === 'xlsx' || format === 'both') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'VentaMax';
    wb.created = new Date();
    const ws = wb.addWorksheet('Problem products', { views: [{ state: 'frozen', ySplit: 1 }] });

    // Columnas con numFmt para columnas numéricas calculadas
    const cols = includeBusinessName
      ? [
          { header: 'businessID', key: 'businessID', width: 24 },
          { header: 'businessName', key: 'businessName', width: 32 },
          { header: 'productID', key: 'productID', width: 26 },
          { header: 'productName', key: 'productName', width: 42 },
          { header: 'listPrice_raw', key: 'listPrice_raw', width: 16 },
          { header: 'price_raw', key: 'price_raw', width: 16 },
          { header: 'listPrice', key: 'listPrice', width: 14, style: { numFmt: '#,##0.00' } },
          { header: 'price', key: 'price', width: 14, style: { numFmt: '#,##0.00' } },
          { header: 'status', key: 'status', width: 18 },
        ]
      : [
          { header: 'businessID', key: 'businessID', width: 24 },
          { header: 'productID', key: 'productID', width: 26 },
          { header: 'productName', key: 'productName', width: 42 },
          { header: 'listPrice_raw', key: 'listPrice_raw', width: 16 },
          { header: 'price_raw', key: 'price_raw', width: 16 },
          { header: 'listPrice', key: 'listPrice', width: 14, style: { numFmt: '#,##0.00' } },
          { header: 'price', key: 'price', width: 14, style: { numFmt: '#,##0.00' } },
          { header: 'status', key: 'status', width: 18 },
        ];
    ws.columns = cols;

    // Encabezado
    ws.getRow(1).font = { bold: true };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };

    // Filas + zebra + color por estado
    for (const r of rows) {
      const row = ws.addRow({
        ...r,
        listPrice: toNumber(r.listPrice_raw),
        price:     toNumber(r.price_raw),
      });
      const idx = row.number;
      if (idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F7' } };
      }
      if (r.status === 'MISMATCH') {
        row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5E5' } };
      } else {
        row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9DB' } };
      }
    }

    const buf = await wb.xlsx.writeBuffer();
    exported.xlsxBlob = downloadBytes(
      buf,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `${filenameBase}.xlsx`
    );
  }

  return { count: rows.length, ...exported };
}

/* ╔══════════════════════════════════════╗
   ║  6) CSV clásico (si sólo quieres CSV) ║
   ╚══════════════════════════════════════╝ */
export async function fbCSVProblemProductsAll({
  pageSize = 1000,
  includeBusinessName = true,
  includeHeaders = true,
  filename = 'problem-products.csv',
  download = false,
  onProgress,
} = {}) {
  const { rows, headers } = await collectProblemProductsAll({ pageSize, includeBusinessName, onProgress });
  const usedHeaders = includeHeaders ? headers : [];
  const csv = buildCSVFromObjects(rows, usedHeaders);
  if (download) downloadBytes(csv, 'text/csv;charset=utf-8', filename);
  return { csv, count: rows.length };
}

/* ╔══════════════════════════════════════════╗
   ║  7) CSV por lista de negocios            ║
   ╚══════════════════════════════════════════╝ */
export async function fbCSVProblemProductsForBusinesses(
  businessIDs = [],
  { includeBusinessName = true, includeHeaders = true, filename = 'problem-products-list.csv', download = false, onProgress } = {}
) {
  if (!Array.isArray(businessIDs) || businessIDs.length === 0) {
    const headers = includeBusinessName
      ? ['businessID', 'businessName', 'productID', 'productName', 'listPrice_raw', 'price_raw', 'status']
      : ['businessID', 'productID', 'productName', 'listPrice_raw', 'price_raw', 'status'];
    return { csv: includeHeaders ? buildCSVFromObjects([], headers) : '', count: 0 };
  }

  const rows = [];
  let scanned = 0;

  for (const businessIDRaw of businessIDs) {
    const businessID = String(businessIDRaw);
    let businessName = '';
    if (includeBusinessName) {
      try {
        const bSnap = await getDoc(doc(db, 'businesses', businessID));
        businessName = bSnap.exists() ? (bSnap.data()?.business?.name ?? bSnap.data()?.name ?? '') : '';
      } catch {}
    }

    try {
      const productsRef = collection(db, 'businesses', businessID, 'products');
      const snap = await getDocs(productsRef);

      for (const docSnap of snap.docs) {
        scanned += 1;
        const data = docSnap.data() || {};
        const productID = docSnap.id;
        const productName = resolveProductName(data);

        const lpRaw = data?.pricing?.listPrice;
        const pRaw  = data?.pricing?.price;
        const lp = toNumber(lpRaw);
        const p  = toNumber(pRaw);

        if (!isRealPrice(lp)) {
          rows.push([businessID, businessName, productID, productName, String(lpRaw ?? ''), String(pRaw ?? ''), 'LISTPRICE_UNKNOWN']);
          continue;
        }
        if (!isRealPrice(p) || !almostEqual(lp, p)) {
          rows.push([businessID, businessName, productID, productName, String(lpRaw ?? ''), String(pRaw ?? ''), 'MISMATCH']);
        }

        if (onProgress && scanned % 1000 === 0) onProgress({ scope: 'list-csv', businessID, businessName, scanned, collected: rows.length });
      }
    } catch (e) {
      onProgress?.({ scope: 'list-csv', businessID, businessName, error: String(e?.message || e), scanned, collected: rows.length });
    }
  }

  const headers = includeBusinessName
    ? ['businessID', 'businessName', 'productID', 'productName', 'listPrice_raw', 'price_raw', 'status']
    : ['businessID', 'productID', 'productName', 'listPrice_raw', 'price_raw', 'status'];

  const csv = buildCSVFromObjects(
    rows.map(r => ({
      businessID: r[0],
      businessName: includeBusinessName ? r[1] : undefined,
      productID: includeBusinessName ? r[2] : r[1],
      productName: includeBusinessName ? r[3] : r[2],
      listPrice_raw: includeBusinessName ? r[4] : r[3],
      price_raw: includeBusinessName ? r[5] : r[4],
      status: includeBusinessName ? r[6] : r[5],
    })),
    includeHeaders ? headers : []
  );

  if (download) downloadBytes(csv, 'text/csv;charset=utf-8', filename);
  return { csv, count: rows.length };
}

/* ╔══════════════════════════════════════╗
   ║  8) Orquestador auditar → (fix) → export ║
   ╚══════════════════════════════════════╝ */
export async function fbAuditFixAndExport({
  doFix = false,
  dryRun = true,
  includeBusinessName = true,
  exportFormat = 'xlsx',                // 'csv' | 'xlsx' | 'both' | 'none'
  beforeFilename = 'problem-products-before',
  afterFilename  = 'problem-products-after',
} = {}) {
  // 1) Auditoría ANTES + export (opcional)
  const before = await fbAuditAllBusinessesPriceVsList(1000);
  let exportsBefore = {};
  if (exportFormat !== 'none') {
    exportsBefore = await fbExportProblemProductsAll({
      includeBusinessName,
      format: exportFormat === 'both' ? 'both' : exportFormat,
      filenameBase: beforeFilename,
    });
  }

  // 2) Fix (opcional)
  let fixTotals = null;
  if (doFix) fixTotals = await fbFixAllPricesToListPrice({ dryRun });

  // 3) Auditoría DESPUÉS + export (opcional)
  const after = await fbAuditAllBusinessesPriceVsList(1000);
  let exportsAfter = {};
  if (exportFormat !== 'none') {
    exportsAfter = await fbExportProblemProductsAll({
      includeBusinessName,
      format: exportFormat === 'both' ? 'both' : exportFormat,
      filenameBase: afterFilename,
    });
  }

  return { before, after, fixTotals, exportsBefore, exportsAfter };
}

// stockAlertsDailyDigest.js
// =============================================================
// Envia un resumen diario (horario configurable; ver STOCK_ALERT_DIGEST_CRON / default actual en código)
// de productos en estado de stock BAJO o CRÍTICO para cada negocio que:
//   - Tiene billing.stockAlertsEnabled = true
//   - Tiene billing.stockAlertEmail configurado
// Umbrales tomados de billing (mismos que trigger onWrite).
// Modo envío: reutiliza nodemailer (sendMail) o la extensión Trigger Email
// según STOCK_ALERT_USE_EXTENSION (misma lógica que stockAlertsOnWrite).
// Se limita a un máximo de N negocios por ejecución (paginable) para evitar
// sobrecarga si la base crece: configurable con DIGEST_BUSINESS_LIMIT.
// =============================================================

import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
  MAIL_SECRETS,
  DIGEST_CRON as PARAM_DIGEST_CRON,
  DIGEST_TZ as PARAM_DIGEST_TZ,
  ALLOWED_DOMAINS as PARAM_ALLOWED_DOMAINS,
  DIGEST_VERBOSE as PARAM_DIGEST_VERBOSE,
  STOCK_ALERT_DEBUG as PARAM_STOCK_ALERT_DEBUG,
  STOCK_ALERT_DRY_RUN as PARAM_STOCK_ALERT_DRY_RUN,
  DIGEST_BUSINESS_LIMIT as PARAM_DIGEST_BUSINESS_LIMIT,
  DIGEST_BUSINESS_ORDER_FIELD as PARAM_DIGEST_BUSINESS_ORDER_FIELD,
} from '../../../core/config/secrets.js';
import { logger } from 'firebase-functions';
import { db, storage } from '../../../core/config/firebase.js';
import { sendMail } from '../../../core/config/mailer.js';
import ExcelJS from 'exceljs';

// Helper para obtener valor de param (defineString / defineSecret) con fallback a process.env
function val(paramDef, envName, def) {
  try {
    if (paramDef && typeof paramDef.value === 'function') {
      const v = paramDef.value();
      if (v !== undefined && v !== null && String(v).length) return v;
    }
  } catch (_) { /* noop */ }
  const env = process.env[envName];
  if (env !== undefined && env !== null && String(env).length) return env;
  return def;
}

// Importante: para evitar warnings de "param.value() invoked during deployment", pasamos
// directamente los objetos Param (defineString) en la configuración del schedule.
// El consumo de .value() se hace dentro del handler para el resto de flags/valores.
export const stockAlertsDailyDigest = onSchedule({
  secrets: MAIL_SECRETS,
  // Usamos directamente los Param definidos (Firebase Functions v2 admite Param en config)
  schedule: PARAM_DIGEST_CRON,
  timeZone: PARAM_DIGEST_TZ,
  region: 'us-central1',
  timeoutSeconds: 300,
  memory: '512MiB'
}, async () => {
  const startedAt = Date.now();
  logger.info('[stockDigest] Inicio ejecución');

  // Flags de control
  const verbose = /^true$/i.test(val(PARAM_DIGEST_VERBOSE, 'DIGEST_VERBOSE', 'false'));
  const debug = /^true$/i.test(val(PARAM_STOCK_ALERT_DEBUG, 'STOCK_ALERT_DEBUG', 'false'));
  const dryRun = /^true$/i.test(val(PARAM_STOCK_ALERT_DRY_RUN, 'STOCK_ALERT_DRY_RUN', 'false'));
  if (debug) logger.info('[stockDigest] Debug activado', { dryRun });

  const businessLimit = Number(val(PARAM_DIGEST_BUSINESS_LIMIT, 'DIGEST_BUSINESS_LIMIT', '100')) || 100;
  // Campo preferido para ordenar (negocios más antiguos primero). Por requerimiento debe ser 'business.createdAt'.
  // Si existe un env para cambiarlo se respeta. Fallback: sin orderBy.
  const orderField = val(PARAM_DIGEST_BUSINESS_ORDER_FIELD, 'DIGEST_BUSINESS_ORDER_FIELD', 'business.createdAt');
  let snapshot;
  try {
    snapshot = await db.collection('businesses')
      .orderBy(orderField, 'asc')
      .limit(businessLimit)
      .get();
  } catch (err) {
    logger.warn('[stockDigest] Fallback sin orderBy (campo faltante o índice no creado)', { orderField, error: err.message });
    snapshot = await db.collection('businesses')
      .limit(businessLimit)
      .get();
  }

  if (debug) logger.info('[stockDigest] Negocios obtenidos', { fetched: snapshot.size, orderField, businessLimit });

  if (snapshot.empty) {
    logger.info('[stockDigest] No hay negocios');
    return;
  }

  // Dominio permitido (mismo mecanismo que onWrite)
  const allowedDomainsEnv = val(PARAM_ALLOWED_DOMAINS, 'STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS', '*');
  const allowedDomains = allowedDomainsEnv.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
  const unrestricted = allowedDomains.includes('*') || allowedDomains.length === 0;

  let processedBusinesses = 0;
  let emailsQueued = 0;
  // Contadores diagnósticos
  let cNoBilling = 0;
  let cDisabled = 0;
  let cNoEmails = 0;
  let cNoProducts = 0;
  let cEmptyAfterClass = 0;
  // Listas (solo si debug/verbose). Evitamos crecer sin límite; cortamos a 200.
  const idsNoBilling = [];
  const idsDisabled = [];
  const idsNoEmails = [];
  const idsNoProducts = [];
  const idsEmptyAfterClass = [];

  let skippedNoCreatedAt = 0;

  for (const bizDoc of snapshot.docs) {
    const bid = bizDoc.id;

    // Validar que el documento tenga el campo anidado si usamos business.createdAt
    const data = bizDoc.data() || {};
    const businessName = data?.business?.name || data?.name || data?.displayName || bid;
    if (orderField === 'business.createdAt') {
      const bizCreatedAt = data?.business?.createdAt;
      // Permitimos continuar aunque no tenga (solo contamos para diagnóstico), pero podrías elegir saltarlo totalmente:
      if (!bizCreatedAt) {
        skippedNoCreatedAt++;
        // Opcional: continue;  (si prefieres ignorar negocios sin fecha)
      }
    }

    // Cargar billing
    const billingRef = db.doc(`businesses/${bid}/settings/billing`);
    const billingSnap = await billingRef.get();
    if (!billingSnap.exists) {
      cNoBilling++;
      if ((verbose || debug) && idsNoBilling.length < 200) idsNoBilling.push(bid);
      if (verbose || debug) logger.info('[stockDigest] Skip negocio sin billing settings', { bid });
      continue;
    }
    const billing = billingSnap.data() || {};
    if (!billing.stockAlertsEnabled) {
      cDisabled++;
      if ((verbose || debug) && idsDisabled.length < 200) idsDisabled.push(bid);
      if (verbose || debug) logger.info('[stockDigest] Skip negocio con alertas deshabilitadas', { bid });
      continue;
    }

    const toRaw = (billing.stockAlertEmail || '').trim();
    if (!toRaw) {
      cNoEmails++;
      if ((verbose || debug) && idsNoEmails.length < 200) idsNoEmails.push(bid);
      if (verbose || debug) logger.info('[stockDigest] Skip negocio sin correos configurados', { bid });
      continue;
    }
    const recipients = toRaw.split(',').map(r => r.trim()).filter(Boolean);
    const filteredRecipients = unrestricted ? recipients : recipients.filter(r => allowedDomains.includes(r.split('@').pop().toLowerCase()));
    if (filteredRecipients.length === 0) {
      logger.warn('[stockDigest] Todos los correos filtrados por dominios no permitidos', { bid, toRaw });
      continue;
    }

    const low = Number.isFinite(billing.stockLowThreshold) ? billing.stockLowThreshold : 20;
    const critical = Number.isFinite(billing.stockCriticalThreshold) ? billing.stockCriticalThreshold : 10;

    // Query productos con quantity <= low (incluye críticos)
    // Evitar 'in' con null: Firestore puede rechazarlo. Hacemos dos queries y fusionamos.
    const colRef = db.collection(`businesses/${bid}/productsStock`);
    let combinedDocs = new Map();
    try {
      const [activeSnap, nullSnap] = await Promise.all([
        colRef.where('quantity', '<=', low).where('status', '==', 'active').limit(500).get(),
        colRef.where('quantity', '<=', low).where('status', '==', null).limit(500).get(),
      ]);
      activeSnap.forEach(d => combinedDocs.set(d.id, d));
      nullSnap.forEach(d => combinedDocs.set(d.id, d));
    } catch (err) {
      // Posible falta de índice o rechazo del comparador; hacemos fallback a una sola query por cantidad
      logger.warn('[stockDigest] Fallback de query de productos (verifica índices y filtros)', { bid, error: err.message });
      const fallbackSnap = await colRef.where('quantity', '<=', low).limit(500).get();
      fallbackSnap.forEach(d => combinedDocs.set(d.id, d));
    }

    if (combinedDocs.size === 0) {
      cNoProducts++;
      if ((verbose || debug) && idsNoProducts.length < 200) idsNoProducts.push(bid);
      if (verbose || debug) logger.info('[stockDigest] Negocio sin productos bajo umbral', { bid, low });
      continue;
    }

    const lowList = [];
    const criticalList = [];

    combinedDocs.forEach(doc => {
      const d = doc.data();
      const qty = d.quantity;
      const name = d.productName || d.productId || doc.id;
      // Si existe campo status y no es 'active' ni null, filtramos en memoria en el fallback
      if (d?.status && d.status !== 'active') return;
      if (qty <= critical) {
        criticalList.push({ name, qty });
      } else {
        lowList.push({ name, qty });
      }
    });

    if (lowList.length === 0 && criticalList.length === 0) {
      cEmptyAfterClass++;
      if ((verbose || debug) && idsEmptyAfterClass.length < 200) idsEmptyAfterClass.push(bid);
      if (verbose || debug) logger.info('[stockDigest] Lista filtrada vacía tras clasificación', { bid });
      continue;
    }

    if (verbose || debug) logger.info('[stockDigest] Procesando negocio con alertas', { bid, criticalCount: criticalList.length, lowCount: lowList.length });

    const subjectBase = `[Stock Crítico] ${businessName}`;

    const rows = (arr, label) => arr.map(item => `<tr><td>${label}</td><td>${item.name}</td><td style="text-align:right">${item.qty}</td></tr>`).join('');
    // 2) Productos estrictos + tracking, solo críticos (qty <= critical), por ubicación/lote/expiración
    /* eliminado: definición antigua buildStrictCriticalRows() que devolvía HTML */
    /*
    async function buildStrictCriticalRows() {
      try {
        // 2.1) Obtener productos estrictos+tracked
        const prodSnap = await db.collection(`businesses/${bid}/products`)
          .where('restrictSaleWithoutStock', '==', true)
          .where('trackInventory', '==', true)
          .limit(500)
          .get();
        if (prodSnap.empty) return '';
        const products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const prodIds = products.map(p => p.id);

        // 2.2) Traer productsStock por chunks de 10 ids (límite de 'in')
        const chunks = [];
        for (let i = 0; i < prodIds.length; i += 10) chunks.push(prodIds.slice(i, i + 10));
        const stockDocs = [];
        for (const ids of chunks) {
          const snap = await db.collection(`businesses/${bid}/productsStock`)
            .where('productId', 'in', ids)
            .where('isDeleted', '==', false)
            .where('status', '==', 'active')
            .get();
          snap.forEach(d => stockDocs.push({ id: d.id, ...d.data() }));
        }
        if (!stockDocs.length) return '';

        // 2.3) Resolver nombres de almacén (primer segmento del location)
        const uniqueWarehouseIds = new Set();
        const parseLoc = (val) => {
          if (!val) return [];
          const s = String(val);
          return s.split('/').filter(Boolean);
        };
        for (const s of stockDocs) {
          const parts = parseLoc(s.location);
          if (parts[0]) uniqueWarehouseIds.add(parts[0]);
        }
        const warehouseMap = new Map();
        if (uniqueWarehouseIds.size) {
          const refs = Array.from(uniqueWarehouseIds).map(id => db.doc(`businesses/${bid}/warehouses/${id}`));
          // Admin SDK permite getAll, pero usamos fallback secuencial si no
          try {
            const snaps = await Promise.all(refs.map(r => r.get()));
            snaps.forEach((snap) => {
              if (snap.exists) {
                warehouseMap.set(snap.id, snap.data().name || snap.data().shortName || snap.id);
              }
            });
          } catch (_) {
            // ignorar
          }
        }

        const fmtDate = (d) => {
          try {
            let dt;
            if (!d) return '';
            if (d.toDate) dt = d.toDate();
            else if (typeof d.seconds === 'number') dt = new Date(d.seconds * 1000);
            else dt = new Date(d);
            if (!dt || Number.isNaN(dt.getTime())) return '';
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            return `${y}-${m}-${dd}`;
          } catch { return '' }
        };

        // 2.4) Construir filas
        const prodById = new Map(products.map(p => [p.id, p]));
        const rows = [];
        for (const s of stockDocs) {
          const p = prodById.get(s.productId);
          if (!p) continue;
          const qty = Number(s.quantity ?? s.stock ?? 0) || 0;
          if (qty <= 0) continue;
          const locParts = parseLoc(s.location);
          const whName = locParts[0] ? (warehouseMap.get(locParts[0]) || locParts[0]) : '';
          const restPath = locParts.slice(1).join(' / ');
          const locLabel = [whName, restPath].filter(Boolean).join(' / ');
          rows.push({
            productName: p.name || p.productName || s.productName || 'Producto',
            batchNo: s.batchNumberId ?? '',
            exp: fmtDate(s.expirationDate),
            location: locLabel || String(s.location || ''),
            qty,
          });
        }
        if (!rows.length) return '';
        rows.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
        const tr = rows.map(r => `<tr>
            <td>${r.productName}</td>
            <td>${r.batchNo || '—'}</td>
            <td>${r.exp || '—'}</td>
            <td>${r.location || '—'}</td>
            <td style=\"text-align:right\">${r.qty}</td>
          </tr>`).join('');
        return `
          <h3 style=\"margin:16px 0 8px\">Stock estricto por ubicación</h3>
          <table border=\"1\" cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse;font-family:Arial, sans-serif;font-size:13px;\">
            <thead>
              <tr style=\"background:#f2f2f2\"><th>Producto</th><th>Lote</th><th>Vencimiento</th><th>Ubicación</th><th>Cantidad</th></tr>
            </thead>
            <tbody>${tr}</tbody>
          </table>`;
      } catch (e) {
        logger.warn('[stockDigest] Strict section error', { bid, error: e.message });
        return '';
      }
    }
    */

    // Generar fila de críticos estrictos, Excel en Storage y enviar correo solo con esa tabla
    async function buildStrictCriticalRows() {
      try {
        const prodSnap = await db.collection(`businesses/${bid}/products`)
          .where('restrictSaleWithoutStock', '==', true)
          .where('trackInventory', '==', true)
          .limit(500)
          .get();
        if (prodSnap.empty) return [];
        const products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const prodIds = products.map(p => p.id);
        const chunks = [];
        for (let i = 0; i < prodIds.length; i += 10) chunks.push(prodIds.slice(i, i + 10));
        const stockDocs = [];
        for (const ids of chunks) {
          const snap = await db.collection(`businesses/${bid}/productsStock`)
            .where('productId', 'in', ids)
            .where('isDeleted', '==', false)
            .where('status', '==', 'active')
            .get();
          snap.forEach(d => stockDocs.push({ id: d.id, ...d.data() }));
        }
        if (!stockDocs.length) return [];
        const uniqueWarehouseIds = new Set();
        const parseLoc = (val) => { if (!val) return []; const s = String(val); return s.split('/').filter(Boolean); };
        for (const s of stockDocs) { const parts = parseLoc(s.location); if (parts[0]) uniqueWarehouseIds.add(parts[0]); }
        const warehouseMap = new Map();
        if (uniqueWarehouseIds.size) {
          const refs = Array.from(uniqueWarehouseIds).map(id => db.doc(`businesses/${bid}/warehouses/${id}`));
          try { const snaps = await Promise.all(refs.map(r => r.get())); snaps.forEach(snap => { if (snap.exists) warehouseMap.set(snap.id, snap.data().name || snap.data().shortName || snap.id); }); } catch {}
        }
        const fmtDate = (d) => { try { let dt; if (!d) return ''; if (d.toDate) dt = d.toDate(); else if (typeof d.seconds === 'number') dt = new Date(d.seconds * 1000); else dt = new Date(d); if (!dt || Number.isNaN(dt.getTime())) return ''; const y = dt.getFullYear(); const m = String(dt.getMonth() + 1).padStart(2, '0'); const dd = String(dt.getDate()).padStart(2, '0'); return `${y}-${m}-${dd}`; } catch { return '' } };
        const prodById = new Map(products.map(p => [p.id, p]));
        const rows = [];

        // Caches para niveles adicionales
        const shelfMap = new Map(); // key: `${warehouseId}/${shelfId}` -> name
        const rowMap = new Map();   // key: `${warehouseId}/${shelfId}/${rowId}` -> name
        const segmentMap = new Map(); // key: `${warehouseId}/${shelfId}/${rowId}/${segmentId}` -> name

        async function resolveShelf(businessId, warehouseId, shelfId) {
          if (!shelfId) return '';
            const key = `${warehouseId}/${shelfId}`;
            if (shelfMap.has(key)) return shelfMap.get(key);
            let name = '';
            try {
              // Ruta jerárquica principal
              const snap = await db.doc(`businesses/${businessId}/warehouses/${warehouseId}/shelves/${shelfId}`).get();
              if (snap.exists) {
                const data = snap.data() || {}; name = data.name || data.shortName || data.title || '';
              } else {
                // Fallback a colección directa si existiera
                const fb = await db.doc(`businesses/${businessId}/shelves/${shelfId}`).get();
                if (fb.exists) { const d = fb.data() || {}; name = d.name || d.shortName || d.title || ''; }
              }
            } catch(_) { /* noop */ }
            if (debug) logger.debug?.('[stockDigest] shelf resolved', { bid: businessId, warehouseId, shelfId, name });
            shelfMap.set(key, name || shelfId);
            return shelfMap.get(key);
        }

        async function resolveRow(businessId, warehouseId, shelfId, rowId) {
          if (!rowId) return '';
          const key = `${warehouseId}/${shelfId}/${rowId}`;
          if (rowMap.has(key)) return rowMap.get(key);
          let name = '';
          try {
            const snap = await db.doc(`businesses/${businessId}/warehouses/${warehouseId}/shelves/${shelfId}/rows/${rowId}`).get();
            if (snap.exists) { const data = snap.data() || {}; name = data.name || data.shortName || data.title || ''; }
            else {
              const fb = await db.doc(`businesses/${businessId}/rows/${rowId}`).get();
              if (fb.exists) { const d = fb.data() || {}; name = d.name || d.shortName || d.title || ''; }
            }
          } catch(_) { /* noop */ }
          if (debug) logger.debug?.('[stockDigest] row resolved', { bid: businessId, warehouseId, shelfId, rowId, name });
          rowMap.set(key, name || rowId);
          return rowMap.get(key);
        }

        async function resolveSegment(businessId, warehouseId, shelfId, rowId, segmentId) {
          if (!segmentId) return '';
          const key = `${warehouseId}/${shelfId}/${rowId}/${segmentId}`;
          if (segmentMap.has(key)) return segmentMap.get(key);
          let name = '';
          try {
            const snap = await db.doc(`businesses/${businessId}/warehouses/${warehouseId}/shelves/${shelfId}/rows/${rowId}/segments/${segmentId}`).get();
            if (snap.exists) { const data = snap.data() || {}; name = data.name || data.shortName || data.title || ''; }
            else {
              const fb = await db.doc(`businesses/${businessId}/segments/${segmentId}`).get();
              if (fb.exists) { const d = fb.data() || {}; name = d.name || d.shortName || d.title || ''; }
            }
          } catch(_) { /* noop */ }
          if (debug) logger.debug?.('[stockDigest] segment resolved', { bid: businessId, warehouseId, shelfId, rowId, segmentId, name });
          segmentMap.set(key, name || segmentId);
          return segmentMap.get(key);
        }

        for (const s of stockDocs) {
          const p = prodById.get(s.productId); if (!p) continue;
          const qty = Number(s.quantity ?? s.stock ?? 0) || 0; if (!(qty <= critical)) continue;
          const parts = parseLoc(s.location);
          const warehouseId = parts[0];
          const shelfId = parts[1];
          const rowId = parts[2];
          const segmentId = parts[3];

          const whName = warehouseId ? (warehouseMap.get(warehouseId) || warehouseId) : '';
          // Resolver niveles inferiores secuencialmente (pocos docs; coste aceptable)
          let shelfName = '';
          let rowName = '';
          let segmentName = '';
          if (shelfId) shelfName = await resolveShelf(bid, warehouseId, shelfId);
          if (rowId) rowName = await resolveRow(bid, warehouseId, shelfId, rowId);
          if (segmentId) segmentName = await resolveSegment(bid, warehouseId, shelfId, rowId, segmentId);

          const locLabel = [whName, shelfName, rowName, segmentName].filter(Boolean).join(' / ');
          rows.push({ productName: p.name || p.productName || s.productName || 'Producto', batchNo: s.batchNumberId ?? '', exp: fmtDate(s.expirationDate), location: locLabel || String(s.location || ''), qty });
        }
        rows.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
        return rows;
      } catch (e) { logger.warn('[stockDigest] StrictCritical builder error', { bid, error: e.message }); return [] }
    }

    // Productos con vencimiento dentro de los próximos 3 meses
    async function buildExpiringSoonRows() {
      try {
        const now = new Date();
        const end = new Date(now.getTime());
        end.setMonth(end.getMonth() + 3);

        const colRef = db.collection(`businesses/${bid}/productsStock`);
        let stockDocs = [];
        try {
          const [activeSnap, nullSnap] = await Promise.all([
            colRef.where('status', '==', 'active').where('isDeleted', '==', false).where('expirationDate', '>=', now).where('expirationDate', '<=', end).limit(500).get(),
            colRef.where('status', '==', null).where('isDeleted', '==', false).where('expirationDate', '>=', now).where('expirationDate', '<=', end).limit(500).get(),
          ]);
          activeSnap.forEach(d => stockDocs.push({ id: d.id, ...d.data() }));
          nullSnap.forEach(d => stockDocs.push({ id: d.id, ...d.data() }));
        } catch (err) {
          logger.warn('[stockDigest] Fallback de query de vencimientos (verifica índices)', { bid, error: err.message });
          const fbSnap = await colRef.where('expirationDate', '<=', end).limit(500).get();
          fbSnap.forEach(d => stockDocs.push({ id: d.id, ...d.data() }));
          stockDocs = stockDocs
            .filter(s => s && s.expirationDate)
            .filter(s => !s.isDeleted)
            .filter(s => (s.status === 'active' || s.status == null))
            .filter(s => {
              try {
                const v = s.expirationDate;
                const dt = v?.toDate ? v.toDate() : (typeof v?.seconds === 'number' ? new Date(v.seconds * 1000) : new Date(v));
                return dt && !Number.isNaN(dt.getTime()) && dt >= now && dt <= end;
              } catch { return false }
            });
        }

        if (!stockDocs.length) return [];

        const parseLoc = (val) => { if (!val) return []; const s = String(val); return s.split('/').filter(Boolean); };
        const uniqueWarehouseIds = new Set();
        for (const s of stockDocs) { const parts = parseLoc(s.location); if (parts[0]) uniqueWarehouseIds.add(parts[0]); }
        const warehouseMap = new Map();
        if (uniqueWarehouseIds.size) {
          const refs = Array.from(uniqueWarehouseIds).map(id => db.doc(`businesses/${bid}/warehouses/${id}`));
          try { const snaps = await Promise.all(refs.map(r => r.get())); snaps.forEach(snap => { if (snap.exists) warehouseMap.set(snap.id, snap.data().name || snap.data().shortName || snap.id); }); } catch {}
        }

        // Caches de niveles inferiores
        const shelfMap = new Map();
        const rowMap = new Map();
        const segmentMap = new Map();

        async function resolveShelf(businessId, warehouseId, shelfId) {
          if (!shelfId) return '';
          const key = `${warehouseId}/${shelfId}`;
          if (shelfMap.has(key)) return shelfMap.get(key);
          let name = '';
          try {
            const snap = await db.doc(`businesses/${businessId}/warehouses/${warehouseId}/shelves/${shelfId}`).get();
            if (snap.exists) { const data = snap.data() || {}; name = data.name || data.shortName || data.title || ''; }
            else { const fb = await db.doc(`businesses/${businessId}/shelves/${shelfId}`).get(); if (fb.exists) { const d = fb.data() || {}; name = d.name || d.shortName || d.title || ''; } }
          } catch(_) {}
          shelfMap.set(key, name || shelfId);
          return shelfMap.get(key);
        }

        async function resolveRow(businessId, warehouseId, shelfId, rowId) {
          if (!rowId) return '';
          const key = `${warehouseId}/${shelfId}/${rowId}`;
          if (rowMap.has(key)) return rowMap.get(key);
          let name = '';
          try {
            const snap = await db.doc(`businesses/${businessId}/warehouses/${warehouseId}/shelves/${shelfId}/rows/${rowId}`).get();
            if (snap.exists) { const data = snap.data() || {}; name = data.name || data.shortName || data.title || ''; }
            else { const fb = await db.doc(`businesses/${businessId}/rows/${rowId}`).get(); if (fb.exists) { const d = fb.data() || {}; name = d.name || d.shortName || d.title || ''; } }
          } catch(_) {}
          rowMap.set(key, name || rowId);
          return rowMap.get(key);
        }

        async function resolveSegment(businessId, warehouseId, shelfId, rowId, segmentId) {
          if (!segmentId) return '';
          const key = `${warehouseId}/${shelfId}/${rowId}/${segmentId}`;
          if (segmentMap.has(key)) return segmentMap.get(key);
          let name = '';
          try {
            const snap = await db.doc(`businesses/${businessId}/warehouses/${warehouseId}/shelves/${shelfId}/rows/${rowId}/segments/${segmentId}`).get();
            if (snap.exists) { const data = snap.data() || {}; name = data.name || data.shortName || data.title || ''; }
            else { const fb = await db.doc(`businesses/${businessId}/segments/${segmentId}`).get(); if (fb.exists) { const d = fb.data() || {}; name = d.name || d.shortName || d.title || ''; } }
          } catch(_) {}
          segmentMap.set(key, name || segmentId);
          return segmentMap.get(key);
        }

        const fmtDate = (d) => { try { let dt; if (!d) return ''; if (d.toDate) dt = d.toDate(); else if (typeof d.seconds === 'number') dt = new Date(d.seconds * 1000); else dt = new Date(d); if (!dt || Number.isNaN(dt.getTime())) return ''; const y = dt.getFullYear(); const m = String(dt.getMonth() + 1).padStart(2, '0'); const dd = String(dt.getDate()).padStart(2, '0'); return `${y}-${m}-${dd}`; } catch { return '' } };

        const rows = [];
        for (const s of stockDocs) {
          const qty = Number(s.quantity ?? s.stock ?? 0) || 0;
          const parts = parseLoc(s.location);
          const warehouseId = parts[0];
          const shelfId = parts[1];
          const rowId = parts[2];
          const segmentId = parts[3];
          const whName = warehouseId ? (warehouseMap.get(warehouseId) || warehouseId) : '';
          let shelfName = '';
          let rowName = '';
          let segmentName = '';
          if (shelfId) shelfName = await resolveShelf(bid, warehouseId, shelfId);
          if (rowId) rowName = await resolveRow(bid, warehouseId, shelfId, rowId);
          if (segmentId) segmentName = await resolveSegment(bid, warehouseId, shelfId, rowId, segmentId);
          const locLabel = [whName, shelfName, rowName, segmentName].filter(Boolean).join(' / ');
          rows.push({ productName: s.productName || s.productId || 'Producto', batchNo: s.batchNumberId ?? '', exp: fmtDate(s.expirationDate), location: locLabel || String(s.location || ''), qty });
        }

        rows.sort((a, b) => {
          const ad = a.exp || '';
          const bd = b.exp || '';
          if (ad !== bd) return ad.localeCompare(bd);
          return (a.productName || '').localeCompare(b.productName || '');
        });
        return rows;
      } catch (e) { logger.warn('[stockDigest] ExpiringSoon builder error', { bid, error: e.message }); return [] }
    }

    const strictRows = await buildStrictCriticalRows();
    if (!strictRows.length) { cEmptyAfterClass++; if ((verbose || debug) && idsEmptyAfterClass.length < 200) idsEmptyAfterClass.push(bid); if (verbose || debug) logger.info('[stockDigest] Sin productos críticos estrictos', { bid }); continue; }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Críticos');
    ws.columns = [ { header: 'Producto', key: 'productName', width: 40 }, { header: 'Lote', key: 'batchNo', width: 12 }, { header: 'Vencimiento', key: 'exp', width: 14 }, { header: 'Ubicación', key: 'location', width: 40 }, { header: 'Cantidad', key: 'qty', width: 12 } ];
    strictRows.forEach(r => ws.addRow(r)); ws.getRow(1).font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    const bucket = storage.bucket();
    const nowStr = new Date().toISOString().slice(0,16).replace(/[:T]/g, '-');
    const filePath = `reports/stock-digest/${bid}/${nowStr}_critical_strict.xlsx`;
    const file = bucket.file(filePath);
    await file.save(Buffer.from(buffer), { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', resumable: false, public: false });
    const [link] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 48 });

    const subject = `${subjectBase} - ${strictRows.length} items`;
    const tr = strictRows.map(r => `<tr><td>${r.productName}</td><td>${r.batchNo || '-'}</td><td>${r.exp || '-'}</td><td>${r.location || '-'}</td><td style=\"text-align:right\">${r.qty}</td></tr>`).join('');
    // Sección adicional: próximos a vencer (<= 3 meses)
    const expRows = await buildExpiringSoonRows();
    const expTr = (expRows || []).map(r => `<tr><td>${r.productName}</td><td>${r.batchNo || '-'}</td><td>${r.exp || '-'}</td><td>${r.location || '-'}</td><td style=\"text-align:right\">${r.qty}</td></tr>`).join('');
    const expSection = (expRows && expRows.length)
      ? `\n      <h3 style=\"margin:16px 0 8px\">Proximos a vencer (<= 3 meses)</h3>\n      <table border=\"1\" cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse;font-family:Arial, sans-serif;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f2f2f2\"><th>Producto</th><th>Lote</th><th>Vencimiento</th><th>Ubicacion</th><th>Cantidad</th></tr>\n        </thead>\n        <tbody>${expTr}</tbody>\n      </table>`
      : `\n      <h3 style=\"margin:16px 0 8px\">Proximos a vencer (<= 3 meses)</h3>\n      <p style=\"font-size:13px;color:#555\">No hay productos con vencimiento dentro de los proximos 90 dias.</p>`;
    const html = `\n      <h2>Stock crítico (estricto) — ${businessName}</h2>\n      <p>Umbral crítico: ${critical}</p>\n      <p><a href=\"${link}\" target=\"_blank\" rel=\"noopener\">Descargar Excel</a></p>\n      <table border=\"1\" cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse;font-family:Arial, sans-serif;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f2f2f2\"><th>Producto</th><th>Lote</th><th>Vencimiento</th><th>Ubicación</th><th>Cantidad</th></tr>\n        </thead>\n        <tbody>${tr}</tbody>\n      </table>\n      <p style=\"font-size:11px;color:#555\">Generado: ${new Date().toLocaleString('es-DO', { hour12:false })}</p>\n    `;
    const text = `Stock crítico (estricto) — ${businessName}\\nItems: ${strictRows.length}`;

    try {
      if (dryRun) { logger.info('[stockDigest] DRY RUN - se omite envío', { bid, businessName, recipients: filteredRecipients.length, subject }); }
      else { if (debug) logger.info('[stockDigest] Enviando correo', { bid, businessName, recipients: filteredRecipients }); await sendMail({ to: filteredRecipients, subject, html: (expRows && expRows.length ? (html + expSection) : html), text }); logger.info('[stockDigest] Correo enviado', { bid, businessName, count: strictRows.length }); emailsQueued++; }
    } catch (err) { logger.error('[stockDigest] Error enviando resumen', { bid, error: err.message }); }
    processedBusinesses++;
  }

  const summary = {
    ms: Date.now() - startedAt,
    orderField,
    processedBusinesses,
    emailsQueued,
    skippedNoCreatedAt,
    skips: {
      noBillingSettings: cNoBilling,
      alertsDisabled: cDisabled,
      noEmails: cNoEmails,
      noProductsBelowThreshold: cNoProducts,
      emptyAfterClassification: cEmptyAfterClass,
    },
    dryRun,
    debug,
    verbose,
    // Solo incluir arrays si debug/verbose para no llenar logs en producción.
    details: (debug || verbose) ? {
      idsNoBilling,
      idsDisabled,
      idsNoEmails,
      idsNoProducts,
      idsEmptyAfterClass,
    } : undefined,
  };
  if (processedBusinesses === 0) {
    logger.info('[stockDigest] Fin ejecución (sin negocios con alertas)', summary);
  } else {
    logger.info('[stockDigest] Fin ejecución', summary);
  }
});

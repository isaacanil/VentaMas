/**
 * patch-invoices-normalized-fields.mjs
 *
 * Migración one-shot: lee todas las facturas del negocio X63aIFwHzk3r0gmT8w6P
 * en el emulador y escribe los campos que el validador DGII 607 necesita:
 *   - data.client.id / data.client.rnc  (si el cliente está vacío)
 *   - data.NCF                          (si no tiene comprobante)
 *
 * Usa el Admin SDK (firebase-admin) con FIRESTORE_EMULATOR_HOST para saltarse
 * las security rules. Corre desde la carpeta functions/ donde está el SDK.
 *
 * Uso (desde la raíz del repo):
 *   cd functions && node ../scripts/patch-invoices-normalized-fields.mjs [--dry-run] [--business-id=X63...]
 *
 * Flags:
 *   --dry-run      Muestra qué cambiaría sin escribir nada.
 *   --business-id  Sobreescribe el business ID.
 */

// Must be set BEFORE importing firebase-admin
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';

import admin from 'firebase-admin';

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_BUSINESS_ID = 'X63aIFwHzk3r0gmT8w6P';
const TEST_CLIENT_ID      = 'YOv-qMbE';           // existing test client
const TEST_CLIENT_RNC     = '101234567';           // 9-digit test RNC (DR format)
const NCF_PREFIX          = 'B01';                 // Factura de Crédito Fiscal
// Sequence starts BELOW the existing ones (970→B0100000144, 971→B0100000145)
const NCF_START_SEQ       = 101;

const args           = process.argv.slice(2);
const isDryRun       = args.includes('--dry-run');
const bizArg         = args.find((a) => a.startsWith('--business-id='));
const BUSINESS_ID    = bizArg ? bizArg.split('=')[1] : DEFAULT_BUSINESS_ID;

// ── Admin SDK init ────────────────────────────────────────────────────────────

admin.initializeApp({ projectId: 'ventamaxpos' });
const db = admin.firestore();

// ── Helpers ───────────────────────────────────────────────────────────────────

const toCleanStr = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

const toFinite = (v) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') { const n = Number(v); return Number.isFinite(n) ? n : null; }
  return null;
};

const padNcfSeq = (n) => `${NCF_PREFIX}${String(n).padStart(8, '0')}`;

// ── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  console.log(`Business : ${BUSINESS_ID}`);
  console.log(`Mode     : ${isDryRun ? 'DRY-RUN (no writes)' : 'LIVE'}`);
  console.log(`Emulator : ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log('');

  const snap = await db
    .collection(`businesses/${BUSINESS_ID}/invoices`)
    .get();

  console.log(`Invoices found: ${snap.size}\n`);

  // Sort by numberID so NCF sequence is predictable
  const sorted = [...snap.docs].sort((a, b) => {
    const na = Number(a.data()?.data?.numberID ?? 0);
    const nb = Number(b.data()?.data?.numberID ?? 0);
    return na - nb;
  });

  let ncfSeq    = NCF_START_SEQ;
  let patched   = 0;
  let skipped   = 0;
  let errors    = 0;

  for (const docSnap of sorted) {
    const docId      = docSnap.id;
    const raw        = docSnap.data();
    const invoiceData = raw?.data ?? {};
    const client      = invoiceData?.client ?? {};
    const numberID    = invoiceData?.numberID ?? docId;

    const existingClientId  = toCleanStr(client.id);
    const existingRnc       = toCleanStr(client.rnc) ?? toCleanStr(client.personalID);
    const existingNcf       = toCleanStr(invoiceData?.NCF);
    const existingTotal     = toFinite(invoiceData?.totalPurchase?.value
                                       ?? invoiceData?.totalPurchase);
    const existingTax       = toFinite(invoiceData?.totalTaxes?.value
                                       ?? invoiceData?.totalTaxes);

    const needsClient = !existingClientId;
    const needsRnc    = !existingRnc;
    const needsNcf    = !existingNcf;
    const needsTotal  = existingTotal == null;
    const needsTax    = existingTax == null;

    if (!needsClient && !needsRnc && !needsNcf && !needsTotal && !needsTax) {
      console.log(`  SKIP  #${numberID} (${docId}) — ya completo`);
      skipped++;
      continue;
    }

    const patch = {};
    const changes = [];

    if (needsClient) {
      patch['data.client.id'] = TEST_CLIENT_ID;
      changes.push(`client.id → "${TEST_CLIENT_ID}"`);
    }
    if (needsRnc) {
      patch['data.client.rnc'] = TEST_CLIENT_RNC;
      changes.push(`client.rnc → "${TEST_CLIENT_RNC}"`);
    }
    if (needsNcf) {
      const ncf = padNcfSeq(ncfSeq++);
      patch['data.NCF'] = ncf;
      changes.push(`NCF → "${ncf}"`);
    }
    if (needsTotal) {
      // Use accumulatedPaid as a proxy if available, otherwise a safe default
      const fallbackTotal = toFinite(invoiceData?.accumulatedPaid) ?? 100.00;
      patch['data.totalPurchase'] = { value: fallbackTotal };
      changes.push(`totalPurchase.value → ${fallbackTotal}`);
    }
    if (needsTax) {
      const baseTotal = toFinite(patch['data.totalPurchase']?.value
                                 ?? invoiceData?.totalPurchase?.value
                                 ?? invoiceData?.accumulatedPaid) ?? 100.00;
      const taxAmount = Math.round(baseTotal * 0.18 * 100) / 100;
      patch['data.totalTaxes'] = { value: taxAmount };
      changes.push(`totalTaxes.value → ${taxAmount}`);
    }

    console.log(`  PATCH #${numberID} (${docId})`);
    changes.forEach((c) => console.log(`        ${c}`));

    if (!isDryRun) {
      try {
        await db.doc(`businesses/${BUSINESS_ID}/invoices/${docId}`).update(patch);
        console.log(`        ✓ escrito`);
        patched++;
      } catch (err) {
        console.error(`        ✗ ERROR: ${err.message}`);
        errors++;
      }
    } else {
      patched++;
    }
    console.log('');
  }

  console.log('─'.repeat(52));
  console.log(`Resultado — Patched: ${patched}  Skipped: ${skipped}  Errors: ${errors}`);
  if (isDryRun) console.log('(dry-run — no se escribió nada)');

  process.exit(errors > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

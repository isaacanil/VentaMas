/**
 * patch-invoice-missing-fields-prod.mjs
 *
 * Parcha invoices específicas que fallan la validación DGII 607 por carecer de
 * NCF y datos del comprador (ventas a consumidor final sin comprobante asignado).
 *
 * ¿Qué hace?
 *   - Asigna NCF tipo B02 (Factura para Consumidor Final) a las invoices indicadas.
 *   - Asigna identificación estándar de consumidor final: `00000000000` (11 ceros).
 *   - No sobreescribe campos que ya tengan valor.
 *
 * Uso (PowerShell, desde functions/):
 *   # Simulacro (sin escribir):
 *   node scripts/patch-invoice-missing-fields-prod.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P `
 *     --numberIds=953,954
 *
 *   # Escritura real:
 *   node scripts/patch-invoice-missing-fields-prod.mjs `
 *     --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
 *     --businessId=X63aIFwHzk3r0gmT8w6P `
 *     --numberIds=953,954 --write
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

// ── Config fija para este negocio ─────────────────────────────────────────────

const NCF_PREFIX           = 'B02';
const NCF_NEXT_SEQ         = 770;      // la última usada fue B0200000769 (inv #817)
const CONSUMIDOR_FINAL_ID  = 'consumidor-final';
const CONSUMIDOR_FINAL_RNC = '00000000000'; // DGII estándar para consumidor anónimo

// ── Parse args ────────────────────────────────────────────────────────────────

const parseArgs = () => {
  const rawArgs = process.argv.slice(2);
  const args = Object.fromEntries(
    rawArgs
      .map((raw) => raw.split('='))
      .map(([key, ...rest]) => [key.replace(/^--/, ''), rest.join('=') ?? '']),
  );
  const hasFlag = (f) => rawArgs.includes(f);
  return {
    keyPath: args.keyPath || '',
    projectId: args.projectId || 'ventamaxpos',
    businessId: args.businessId || 'X63aIFwHzk3r0gmT8w6P',
    numberIds: args.numberIds
      ? args.numberIds.split(',').map((n) => Number(n.trim())).filter(Number.isFinite)
      : [],
    write: hasFlag('--write') || args.write === '1',
  };
};

const toClean = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

const padNcf = (n) => `${NCF_PREFIX}${String(n).padStart(8, '0')}`;

// ── Main ──────────────────────────────────────────────────────────────────────

const main = async () => {
  const { keyPath, projectId, businessId, numberIds, write } = parseArgs();

  if (!numberIds.length) {
    console.error('Error: pasa --numberIds=953,954');
    process.exit(1);
  }

  // Admin SDK init
  if (keyPath) {
    const credential = admin.credential.cert(
      JSON.parse(fs.readFileSync(keyPath, 'utf8')),
    );
    admin.initializeApp({ credential, projectId });
  } else {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  const collPath = `businesses/${businessId}/invoices`;

  console.log(`\nBusiness : ${businessId}`);
  console.log(`Mode     : ${write ? '⚠️  WRITE (producción)' : '🔍 DRY-RUN (sin escritura)'}`);
  console.log(`NumberIDs: ${numberIds.join(', ')}\n`);

  // Ordena para asignar NCFs en orden ascendente de numberID
  const sortedIds = [...numberIds].sort((a, b) => a - b);

  let ncfSeq = NCF_NEXT_SEQ;
  let patched = 0;
  let skipped = 0;

  for (const numberID of sortedIds) {
    const snap = await db
      .collection(collPath)
      .where('data.numberID', '==', numberID)
      .limit(1)
      .get();

    if (snap.empty) {
      console.log(`  #${numberID} — ❌ NO ENCONTRADA en Firestore`);
      continue;
    }

    const docSnap = snap.docs[0];
    const raw = docSnap.data();
    const d = raw?.data ?? {};
    const client = (d?.client && typeof d.client === 'object') ? d.client : {};

    const existingClientId = toClean(client.id);
    const existingRnc = toClean(client.rnc) ?? toClean(client.personalID);
    const existingNcf = toClean(d?.NCF) ?? toClean(d?.comprobante);

    const patch = {};
    const changes = [];

    if (!existingClientId) {
      patch['data.client.id'] = CONSUMIDOR_FINAL_ID;
      changes.push(`client.id → "${CONSUMIDOR_FINAL_ID}"`);
    }

    if (!existingRnc) {
      patch['data.client.personalID'] = CONSUMIDOR_FINAL_RNC;
      changes.push(`client.personalID → "${CONSUMIDOR_FINAL_RNC}" (consumidor final)`);
    }

    if (!existingNcf) {
      const ncf = padNcf(ncfSeq++);
      patch['data.NCF'] = ncf;
      changes.push(`NCF → "${ncf}"`);
    } else {
      // NCF ya existe, no incrementar el secuencial
      console.log(`  #${numberID} — NCF ya tiene valor (${existingNcf}), se omite NCF.`);
    }

    if (!changes.length) {
      console.log(`  #${numberID} (${docSnap.id}) — SKIP, ya completo`);
      skipped++;
      continue;
    }

    console.log(`  #${numberID} (${docSnap.id})`);
    changes.forEach((c) => console.log(`    → ${c}`));

    if (write) {
      await docSnap.ref.update(patch);
      console.log(`    ✅ Escrito`);
      patched++;
    } else {
      console.log(`    ℹ️  (dry-run, no escrito)`);
    }
  }

  console.log(`\n── Resumen ──────────────────────────────────────────────`);
  console.log(`  Parcheadas : ${write ? patched : `${patched + (sortedIds.length - skipped)} (pendiente --write)`}`);
  console.log(`  Omitidas   : ${skipped}`);
  if (!write) {
    console.log(`\n  Para aplicar, agrega --write al comando.`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

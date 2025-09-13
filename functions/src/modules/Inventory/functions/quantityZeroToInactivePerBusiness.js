// quantity-zero-to-inactive-per-business.js
// Cron: si status === 'active' y quantity === 0 (o <= 0 opcional) => inactive
// Scope: businesses/*/(batches|productsStock) usando collectionGroup
//
// NOTA DE ÍNDICES (Firestore):
// - Para queries con quantity == 0: índice compuesto (Collection group) en la colección objetivo con:
//     status Asc, [businessId Asc si lo filtras], quantity Asc
// - Para queries con quantity <= 0 (INCLUDE_NEGATIVES=true): el compuesto anterior es imprescindible por la desigualdad.
// Repite el índice para cada collection group usado (batches, productsStock).

import { db, FieldValue } from '../../../core/config/firebase.js'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'

// ==== CONFIGURACIÓN ====
const TIME_ZONE = process.env.QUANTITY_CRON_TIME_ZONE || 'America/Santo_Domingo'
// Ejecutar a la 1:00 AM hora local configurada (minuto 0 de la hora 1)
const CRON_EXPR = process.env.QUANTITY_CRON_CRON || '0 1 * * *' // 1:00 AM
const INCLUDE_NEGATIVES = /^true$/i.test(process.env.QUANTITY_CRON_INCLUDE_NEGATIVES || 'false')
const TARGET_COLLECTIONS = (process.env.QUANTITY_CRON_TARGETS || 'batches,productsStock')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const DRY_RUN = /^true$/i.test(process.env.QUANTITY_CRON_DRY_RUN || 'false')

// Opcional: limitar el scan a un business específico si tus docs tienen 'businessId'
const BUSINESS_ID = (process.env.QUANTITY_CRON_BUSINESS_ID || '').trim() || null

function buildPayload(fieldMatched) {
  // Firestore restriction: FieldValue.serverTimestamp() no puede ir dentro de un elemento de array
  // (arrayUnion / array literal). Usamos serverTimestamp para campos top-level y Date para el historial.
  const serverNow = FieldValue.serverTimestamp()
  const jsNow = new Date() // Hora aproximada del servidor Cloud Functions
  return {
    status: 'inactive',
    updatedAt: serverNow,
    updatedBy: 'system',
    inactiveMeta: { by: 'system', reason: 'no_quantity_cron', at: serverNow, field: fieldMatched },
    stateHistory: FieldValue.arrayUnion({
      field: 'status',
      from: 'active',
      to: 'inactive',
      at: jsNow,
      by: 'system',
      reason: 'no_quantity_cron',
      quantityField: fieldMatched,
    }),
  }
}

async function scanAndUpdateCollectionGroup(writer, collectionId) {
  let scanned = 0
  let eligible = 0
  let scheduledUpdates = 0

  try {
    let q = db.collectionGroup(collectionId).where('status', '==', 'active')
    if (BUSINESS_ID) q = q.where('businessId', '==', BUSINESS_ID)
    q = INCLUDE_NEGATIVES ? q.where('quantity', '<=', 0) : q.where('quantity', '==', 0)

    const stream = q.stream()
    for await (const doc of stream) {
      scanned++
      const data = doc.data() || {}

      if (data?.isDeleted === true) continue

      const v = data?.quantity
      if (typeof v !== 'number') continue
      if (!INCLUDE_NEGATIVES && v !== 0) continue
      if (INCLUDE_NEGATIVES && v > 0) continue

      eligible++
      if (!DRY_RUN) {
        writer.update(doc.ref, buildPayload('quantity'))
        scheduledUpdates++
      }
    }

    return { scanned, eligible, scheduledUpdates }
  } catch (err) {
    // Propaga error con contexto para que el caller lo loggee
    err.__scanContext = { collectionId, businessId: BUSINESS_ID, includeNegatives: INCLUDE_NEGATIVES }
    throw err
  }
}

export const quantityZeroToInactivePerBusiness = onSchedule(
  { schedule: CRON_EXPR, timeZone: TIME_ZONE, region: 'us-central1', timeoutSeconds: 540, memory: '512MiB' },
  async () => {
    const writer = db.bulkWriter()

    let hadErrors = false
    let updatedOkTotal = 0

    writer.onWriteError((err) => {
      // reintenta una vez
      if (err.failedAttempts < 2) return true
      logger.error('BulkWriter error', {
        path: err.documentRef?.path,
        code: err.code,
        msg: err.message,
        stack: err.stack,
      })
      return false
    })

    writer.onWriteResult((ref /*, result*/) => {
      // Cuenta escrituras confirmadas por Firestore
      if (!DRY_RUN) updatedOkTotal++
    })

    let scannedTotal = 0
    let eligibleTotal = 0
    let scheduledTotal = 0

    for (const col of TARGET_COLLECTIONS) {
      try {
        const { scanned, eligible, scheduledUpdates } = await scanAndUpdateCollectionGroup(writer, col)
        scannedTotal += scanned
        eligibleTotal += eligible
        scheduledTotal += scheduledUpdates

        logger.info('Scan summary', {
          collection: col,
          scanned,
          eligible,
          scheduledUpdates,
          includeNegatives: INCLUDE_NEGATIVES,
          dryRun: DRY_RUN,
          businessId: BUSINESS_ID || undefined,
        })
      } catch (err) {
        hadErrors = true
        logger.error('Scan failed', {
          collection: col,
          code: err?.code,
          message: err?.message,
          details: String(err),
          stack: err?.stack,
          scanContext: err?.__scanContext,
        })
      }
    }

    await writer.close()

    logger.info('quantityZeroToInactivePerBusiness done', {
      scanned: scannedTotal,
      eligible: eligibleTotal,
      scheduledUpdates: scheduledTotal,
      updatedOk: updatedOkTotal,
      includeNegatives: INCLUDE_NEGATIVES,
      dryRun: DRY_RUN,
      collections: TARGET_COLLECTIONS,
      businessId: BUSINESS_ID || undefined,
    })

    // Si falló alguna colección, marca la ejecución como error (útil para alertas)
    if (hadErrors) {
      throw new Error('One or more collection scans failed')
    }
  }
)

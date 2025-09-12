import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { db, FieldValue, Timestamp } from '../../../../../core/config/firebase.js'
import { MovementReason, MovementType } from '../../inventoryMovements/types/inventoryMovements.js'
import { createBatch } from '../../batch/services/batch.service.js'
import { ensureDefaultWarehouse } from '../../warehouse/services/warehouse.service.js'
import { getNextID } from '../../../../../core/utils/getNextID.js'

function commitChunked(applyFns = [], chunkSize = 450) {
  if (!applyFns?.length) return Promise.resolve()
  const chunks = []
  for (let i = 0; i < applyFns.length; i += chunkSize) {
    chunks.push(applyFns.slice(i, i + chunkSize))
  }
  return chunks.reduce(async (p, fns) => {
    await p
    const batch = db.batch()
    for (const fn of fns) fn(batch)
    await batch.commit()
  }, Promise.resolve())
}

export const finalizeInventorySession = onCall(async (req) => {
  try {
    const { user, sessionId, groups = [], counts = {}, stocks = [], countsMeta = {} } = req.data || {}
    if (!user?.businessID || !user?.uid) {
      throw new HttpsError('invalid-argument', 'user.businessID y user.uid son requeridos')
    }
    if (req?.auth?.uid && req.auth.uid !== user.uid) {
      logger.warn('UID del auth no coincide con UID de payload', { authUid: req.auth.uid, uid: user.uid })
    }
    if (!sessionId) throw new HttpsError('invalid-argument', 'sessionId requerido')

    const businessID = user.businessID
    const now = FieldValue.serverTimestamp()

  const stockById = new Map(stocks.map(s => [s.id, s]))
    const adjustments = []
    const expirationUpdates = []
    const affectedProducts = new Set()
    const affectedBatches = new Set()
    const syntheticCreations = []
  // Backorders a crear por producto (cuando el conteo del usuario tiene números negativos)
  const negBackorderByProduct = new Map()
  let backOrdersCreated = 0

  const productDelta = new Map()
    const batchDelta = new Map()

    const addDelta = (map, key, d) => {
      if (!key || !d) return
      map.set(key, (map.get(key) || 0) + d)
    }

    const toLocalNoonTimestamp = (dateStr) => {
      if (!dateStr) return null
      try {
        const [y, m, d] = String(dateStr).split('-').map(n => parseInt(n, 10))
        if (!y || !m || !d) return null
        const dt = new Date(Date.UTC(y, m - 1, d, 16, 0, 0))
        return Timestamp.fromDate(dt)
      } catch (e) {
        logger.error('[finalizeInventorySession] Fecha de expiración inválida', { dateStr, e })
        return null
      }
    }

    const planAdjustmentsForSources = (sourceIds, targetTotal) => {
      const sourceStocks = sourceIds.map(id => stockById.get(id)).filter(Boolean)
      const currentTotal = sourceStocks.reduce((acc, s) => acc + Number(s.quantity ?? s.stock ?? 0), 0)
      const delta = Number(targetTotal) - Number(currentTotal)
      if (!delta || Math.abs(delta) < 1e-9) return
      if (delta > 0) {
        const first = sourceStocks[0]
        if (!first) return
        const fromQty = Number(first?.quantity ?? 0)
        const toQty = fromQty + delta
        adjustments.push({
          productStockId: first.id,
          fromQty,
          toQty: Math.max(0, toQty),
          delta,
          productId: first.productId,
          productName: first.productName || '',
          batchId: first.batchId,
          batchNumberId: first.batchNumberId || first.batchNumber || null,
          location: first.location || ''
        })
        affectedProducts.add(first.productId)
        if (first.batchId) affectedBatches.add(first.batchId)
        addDelta(productDelta, first.productId, delta)
        addDelta(batchDelta, first.batchId, delta)
      } else {
        let remaining = -delta
        for (const s of sourceStocks) {
          if (remaining <= 0) break
          const current = Number(s.quantity ?? 0)
          if (current <= 0) continue
          const take = Math.min(current, remaining)
          const toQty = current - take
          adjustments.push({
            productStockId: s.id,
            fromQty: current,
            toQty,
            delta: -take,
            productId: s.productId,
            productName: s.productName || '',
            batchId: s.batchId,
            batchNumberId: s.batchNumberId || s.batchNumber || null,
            location: s.location || ''
          })
          affectedProducts.add(s.productId)
          if (s.batchId) affectedBatches.add(s.batchId)
          addDelta(productDelta, s.productId, -take)
          addDelta(batchDelta, s.batchId, -take)
          remaining -= take
        }
      }
    }

    // 1) Planificar ajustes y cambios de expiración
    for (const g of groups || []) {
      for (const child of g?._children || []) {
        const key = child?.key
        const sourceIds = child?.sourceIds || []
        const sources = sourceIds.map(id => stockById.get(id)).filter(Boolean)
        // Fallback de conteo: si no hay conteo para la clave del child (p.ej. noexp:<pid>),
        // intenta con claves alternativas derivadas de sus sources (batchGroup:stock:<sourceId>)
        const altCountKeys = (sourceIds || []).map(id => `batchGroup:stock:${id}`)
        // Guardamos el valor "crudo" del conteo para detectar negativos y crear backorders
        let rawTarget
        if (Object.hasOwn(counts, key)) {
          rawTarget = Number(counts[key])
        } else {
          for (const ak of altCountKeys) {
            if (Object.hasOwn(counts, ak)) { rawTarget = Number(counts[ak]); break }
          }
          if (rawTarget === undefined) rawTarget = Number(child?.real ?? child?.stock ?? 0)
        }
        // Si el usuario registró un número negativo, planificamos un backorder para ese producto
        if (isFinite(rawTarget) && rawTarget < 0) {
          const qty = Math.abs(rawTarget)
          const pid = g?.productId
          if (pid && qty > 0) negBackorderByProduct.set(pid, (negBackorderByProduct.get(pid) || 0) + qty)
        }
        // Usamos el target "sanitizado" para los ajustes físicos
        let target = rawTarget
        if (!isFinite(target) || target < 0) target = 0

        const isSyntheticGroup = sourceIds.length > 0 && sources.length === 0 && (
          key?.startsWith?.('noexp:') || key?.startsWith?.('batchGroup:stock:')
        )
        if (isSyntheticGroup) {
          // Fallback: si el child proviene de una reclasificación (noexp -> batchGroup:stock)
          // usa el conteo de la clave noexp: del mismo producto si el target está vacío o cero.
          let finalTarget = Number(target)
          if (!isFinite(finalTarget) || finalTarget <= 0) {
            const pKey = g?.productKey || (g?.productId || g?.productName || '')
            const altNoexpKey = pKey ? `noexp:${pKey}` : null
            if (altNoexpKey && Object.hasOwn(counts || {}, altNoexpKey)) {
              const altVal = Number(counts[altNoexpKey])
              if (isFinite(altVal) && altVal > 0) finalTarget = altVal
            }
          }
          if (finalTarget > 0) {
            // Fecha manual: clave del child -> claves alternativas por source -> clave noexp por producto -> fecha original
            let manualExp = countsMeta?.[key]?.manualExpirationDate ?? null
            if (manualExp === null || manualExp === undefined) {
              for (const ak of altCountKeys) {
                const v = countsMeta?.[ak]?.manualExpirationDate
                if (v !== undefined) { manualExp = v; break }
              }
            }
            if ((manualExp === null || manualExp === undefined)) {
              const pKey = g?.productKey || (g?.productId || g?.productName || '')
              const altNoexpKey = pKey ? `noexp:${pKey}` : null
              if (altNoexpKey && Object.hasOwn(countsMeta || {}, altNoexpKey)) {
                manualExp = countsMeta[altNoexpKey]?.manualExpirationDate ?? manualExp
              }
            }
            if ((manualExp === null || manualExp === undefined) && child?.expirationDate) {
              // child.expirationDate puede venir como string 'YYYY-MM-DD' desde el cliente
              manualExp = child.expirationDate
            }
            syntheticCreations.push({
              productId: g?.productId,
              productName: g?.productName || '',
              quantity: finalTarget,
              expirationDate: manualExp && manualExp !== '__REMOVE__' ? manualExp : null,
              location: sources?.[0]?.location || null,
              reason: 'inventory-finalization'
            })
            addDelta(productDelta, g?.productId, finalTarget)
          }
          continue
        }

        // Plan de ajuste de cantidades
        planAdjustmentsForSources(sourceIds, target)

        // Cambios de expiración por grupo
        const meta = countsMeta?.[key]
        if (meta && Object.hasOwn(meta, 'manualExpirationDate')) {
          let newVal = meta.manualExpirationDate
          if (newVal === '__REMOVE__') newVal = null
          else if (newVal) newVal = toLocalNoonTimestamp(newVal)
          for (const s of sources) {
            const current = s?.expirationDate ?? null
            const currTS = current?.toDate ? current.toDate().toISOString().slice(0,10) : current
            const willTS = newVal?.toDate ? newVal.toDate().toISOString().slice(0,10) : newVal
            const differs = (currTS || null) !== (willTS || null)
            if (!differs) continue
            expirationUpdates.push({ productStockId: s.id, from: current, to: newVal, productId: s.productId, batchId: s.batchId })
          }
        }
      }
    }

    // Declaración anticipada para evitar referencia antes de inicialización
    let defaultWarehouseId = null

    // 2) Persistir ajustes (cantidad + movimientos) y expiraciones
    const writes = []
    for (const adj of adjustments) {
      const stockRef = db.doc(`businesses/${businessID}/productsStock/${adj.productStockId}`)
      writes.push(b => b.update(stockRef, {
        quantity: adj.toQty,
        stock: adj.toQty,
        status: adj.toQty > 0 ? 'active' : 'inactive',
        updatedAt: now,
        updatedBy: user.uid,
      }))

      if (adj.batchId) {
        const batchRef = db.doc(`businesses/${businessID}/batches/${adj.batchId}`)
        writes.push(b => b.update(batchRef, {
          quantity: FieldValue.increment(adj.delta),
          updatedAt: now,
          updatedBy: user.uid,
        }))
      }

      const mvRef = db.collection(`businesses/${businessID}/movements`).doc()
      const isEntry = adj.delta > 0
      // Durante esta fase aún no resolvemos almacén por defecto; usamos location si existe
      const resolvedLocation = adj.location || null
      const movement = {
        id: mvRef.id,
        createdAt: now,
        createdBy: user.uid,
        productId: adj.productId,
        productName: adj.productName || '',
        productStockId: adj.productStockId,
        batchId: adj.batchId || null,
        batchNumberId: adj.batchNumberId || null,
        sourceLocation: isEntry ? 'adjustment' : resolvedLocation,
        destinationLocation: isEntry ? resolvedLocation : 'adjustment',
        movementType: isEntry ? MovementType.Entry : MovementType.Exit,
        movementReason: MovementReason.Adjustment,
        quantity: Math.abs(adj.delta),
        notes: `Ajuste inventario sesión ${sessionId}`,
        isDeleted: false,
      }
      writes.push(b => b.set(mvRef, movement, { merge: false }))
    }

    for (const exp of expirationUpdates) {
      const stockRef = db.doc(`businesses/${businessID}/productsStock/${exp.productStockId}`)
      writes.push(b => b.update(stockRef, {
        expirationDate: exp.to ?? null,
        updatedAt: now,
        updatedBy: user.uid,
      }))
    }

    if (writes.length) {
      try { await commitChunked(writes) } catch (e) { logger.error('[finalizeInventorySession] Error commit ajustes:', e) }
    }

    // 3) Crear batches y stocks sintéticos si aplica
    try {
      if (syntheticCreations.length) {
        const dw = await ensureDefaultWarehouse(user)
        defaultWarehouseId = dw?.id || null
      }
    } catch (e) {
      logger.warn('[finalizeInventorySession] No se pudo obtener/crear almacén por defecto', e)
    }
    const synthWrites = []
    for (const sc of syntheticCreations) {
      try {
        const numberId = await getNextID(user, 'batches')
        const batchShortName = `${sc.productName || 'Producto'}_INV_${new Date().toISOString().slice(0,10)}`
        const batchNumber = `INV_${sessionId}_${sc.productId}_${Date.now()}`
        const batch = await createBatch(user, {
          productId: sc.productId,
          numberId,
          batchNumber,
          shortName: batchShortName,
          purchaseId: null,
          providerId: null,
          quantity: sc.quantity,
          initialQuantity: sc.quantity,
          receivedDate: new Date(),
          // Usar mediodía UTC relativo para evitar desfases por zona horaria
          expirationDate: sc.expirationDate ? toLocalNoonTimestamp(sc.expirationDate) : null,
          status: sc.quantity > 0 ? 'active' : 'inactive'
        })
        affectedBatches.add(batch.id)

        const psRef = db.collection(`businesses/${businessID}/productsStock`).doc()
        const newPs = {
          id: psRef.id,
          productId: sc.productId,
          productName: sc.productName || '',
          quantity: sc.quantity,
          stock: sc.quantity,
          batchId: batch.id,
          batchNumberId: batch.numberId || numberId,
          expirationDate: batch.expirationDate || null,
          location: defaultWarehouseId || sc.location || null,
          status: sc.quantity > 0 ? 'active' : 'inactive',
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
          createdBy: user.uid,
          updatedBy: user.uid,
          source: sc.reason || 'inventory-finalization'
        }
        synthWrites.push(b => b.set(psRef, newPs))

        const mvRef = db.collection(`businesses/${businessID}/movements`).doc()
        synthWrites.push(b => b.set(mvRef, {
          id: mvRef.id,
          createdAt: now,
          createdBy: user.uid,
          productId: sc.productId,
          productName: sc.productName || '',
          productStockId: psRef.id,
          batchId: batch.id,
          batchNumberId: batch.numberId || numberId,
          sourceLocation: 'adjustment',
          destinationLocation: defaultWarehouseId || sc.location || 'adjustment',
          movementType: MovementType.Entry,
          movementReason: MovementReason.Adjustment,
          quantity: sc.quantity,
          notes: `Creación de lote por inventario sesión ${sessionId}`,
          isDeleted: false,
        }, { merge: false }))

        sc.createdBatchId = batch.id
        sc.batchNumberId = batch.numberId || numberId
        addDelta(productDelta, sc.productId, sc.quantity)
      } catch (e) {
        logger.error('[finalizeInventorySession] Error creando lote sintético', e)
      }
    }
    if (synthWrites.length) {
      try { await commitChunked(synthWrites) } catch (e) { logger.error('[finalizeInventorySession] Error commit sintéticos:', e) }
    }

    // 3.1) Crear backorders por números negativos ingresados por el usuario
    try {
      const boWrites = []
      for (const [productId, qty] of negBackorderByProduct) {
        if (!productId || !qty || qty <= 0) continue
        const boRef = db.collection(`businesses/${businessID}/backOrders`).doc()
        boWrites.push(b => b.set(boRef, {
          id: boRef.id,
          productId,
          initialQuantity: qty,
          pendingQuantity: qty,
          status: 'pending',
          inventorySessionId: sessionId,
          origin: 'inventory-finalization',
          createdAt: now,
          updatedAt: now,
        }, { merge: false }))
        backOrdersCreated += 1
      }
      if (boWrites.length) {
        await commitChunked(boWrites)
      }
    } catch (e) {
      logger.error('[finalizeInventorySession] Error creando backorders por negativos', e)
    }

    // 4) Actualizar agregados de productos y batches
    const aggWrites = []
    for (const [batchId, d] of batchDelta) {
      if (!batchId) continue
      const bref = db.doc(`businesses/${businessID}/batches/${batchId}`)
      aggWrites.push(b => b.update(bref, { quantity: FieldValue.increment(d), updatedAt: now, updatedBy: user.uid }))
    }
    if (aggWrites.length) {
      try { await commitChunked(aggWrites) } catch (e) { logger.error('[finalizeInventorySession] Error agregados increment()', e) }
    }

    // 4.1) Asegurar que product.stock no quede negativo (clamp a 0) y actualizar con transacciones
    try {
      await Promise.all(
        Array.from(productDelta.entries()).map(([productId, d]) =>
          db.runTransaction(async (tx) => {
            const pref = db.doc(`businesses/${businessID}/products/${productId}`)
            const snap = await tx.get(pref)
            const curr = Number(snap?.data()?.stock ?? 0)
            let next = curr + Number(d || 0)
            if (!isFinite(next)) next = curr
            if (next < 0) next = 0
            tx.update(pref, { stock: next, updatedAt: now, updatedBy: user.uid })
          })
        )
      )
    } catch (e) {
      logger.error('[finalizeInventorySession] Error actualizando product.stock con clamp a 0', e)
    }

    // 4.2) Reconciliar product.stock = suma de productsStock activos (defensa ante drift histórico)
    try {
      const sums = []
      for (const productId of affectedProducts) {
        if (!productId) continue
        const col = db.collection('businesses').doc(businessID).collection('productsStock')
        const q = col
          .where('productId', '==', productId)
          .where('isDeleted', '==', false)
          .where('status', '==', 'active')
        // Ejecutar lecturas en paralelo pero limitar memoria: recolectamos promesas
        sums.push(
          q.get().then(snap => ({
            productId,
            sum: snap.docs.reduce((acc, d) => acc + Number(d.data()?.quantity ?? 0), 0)
          }))
        )
      }
      const results = await Promise.all(sums)
      const recWrites = []
      for (const { productId, sum } of results) {
        if (!isFinite(sum)) continue
        const pref = db.doc(`businesses/${businessID}/products/${productId}`)
        recWrites.push(b => b.update(pref, { stock: Math.max(0, sum), updatedAt: now, updatedBy: user.uid }))
      }
      if (recWrites.length) {
        try { await commitChunked(recWrites) } catch (e) { logger.error('[finalizeInventorySession] Error commit reconciliación product.stock', e) }
      }
    } catch (e) {
      logger.error('[finalizeInventorySession] Error reconciliando product.stock por suma de productsStock', e)
    }

    // 5) Congelar snapshot (con lo que tenía el cliente al momento de finalizar)
    const frozenChildrenStock = {}
    const frozenProductTotals = {}
    try {
      for (const g of (groups || [])) {
        let sum = 0
        for (const child of (g?._children || [])) {
          const key = child?.key
          if (!key) continue
          const baselineStock = Number(child?.stock ?? 0)
          const frozen = isFinite(baselineStock) ? Math.max(0, baselineStock) : 0
          frozenChildrenStock[key] = frozen
          sum += frozen
        }
        const productKey = g?.productId || g?.productName || 'unknown'
        frozenProductTotals[productKey] = sum
      }
    } catch (e) {
      logger.error('[finalizeInventorySession] Error congelando snapshot', e)
    }

    // 6) Cerrar sesión
    const sessionRef = db.doc(`businesses/${businessID}/inventorySessions/${sessionId}`)
    const snapshotPayload = { frozenChildrenStock, frozenProductTotals }
    const approxBytes = Buffer.from(JSON.stringify(snapshotPayload), 'utf8').length

    const baseUpdate = {
      status: 'closed',
      closedAt: now,
      closedBy: user.uid,
      frozenAt: now,
      finalizeSummary: {
        productsUpdated: affectedProducts.size,
        batchesUpdated: affectedBatches.size,
        adjustments: adjustments.length,
        expirationUpdates: expirationUpdates.length,
        backOrdersCreated,
      },
    }

    if (approxBytes > 800_000) {
      const frozenRef = sessionRef.collection('snapshots').doc()
      await frozenRef.set(snapshotPayload)
      await sessionRef.update({ ...baseUpdate, frozenSnapshotPath: frozenRef.path })
    } else {
      await sessionRef.update({ ...baseUpdate, ...snapshotPayload })
    }

    logger.info('[finalizeInventorySession] Finalización completada', { businessID, sessionId, adjustments: adjustments.length, expirationUpdates: expirationUpdates.length })
    return {
      adjustments,
      expirationUpdates,
      productsUpdated: affectedProducts.size,
      batchesUpdated: affectedBatches.size,
      syntheticCreations,
      backOrdersCreated,
    }
  } catch (e) {
    logger.error('[finalizeInventorySession] Error general', e)
    throw e instanceof HttpsError ? e : new HttpsError('internal', e?.message || 'Error finalizando inventario')
  }
})

// Construcción de grupos de inventario (pura) extraída de InventoryControl.jsx
// Acepta colecciones y estados necesarios y devuelve la misma estructura que esperaba la tabla.

import { sum, buildLocations, getLocationKey } from './inventoryHelpers'

/**
 * Devuelve la fecha de vencimiento efectiva para un item considerando ediciones en memoria.
 * Prioridad:
 * 1. Edición directa por ID de stock
 * 2. Edición por clave de grupo (batchGroup:* o noexp:*)
 * 3. Fecha original del item
 */
function getEffectiveExpirationDate(item, expirationEdits, countsMeta) {
  if (!item) return item?.expirationDate
  const edits = expirationEdits || {}
  const meta = countsMeta || {}
  const itemId = item.id

  // 1) Edición directa por ID de stock
  if (itemId && Object.prototype.hasOwnProperty.call(edits, itemId)) {
    const editValue = edits[itemId]
    if (editValue === '__REMOVE__') return null
    if (editValue) return editValue
  }
  // 1.b) Persistido: por ID de stock (si alguna vez lo guardamos en counts)
  if (itemId && meta[itemId] && Object.prototype.hasOwnProperty.call(meta[itemId], 'manualExpirationDate')) {
    const saved = meta[itemId].manualExpirationDate
    if (saved === '__REMOVE__') return null
    if (saved) return saved
  }

  // 2) Edición por clave de grupo
  const productKey = item.productId || `name:${(item.productName || '').toLowerCase()}`
  const itemKey = `noexp:${productKey}`
  const byIdKey = item.batchId ? `batchGroup:${item.batchId}` : null
  const byNumberKey = (item.batchNumberId !== undefined && item.batchNumberId !== null)
    ? `batchGroup:bn:${item.batchNumberId}`
    : null
  const fallbackKey = itemId ? `batchGroup:stock:${itemId}` : null

  const candidateKeys = [itemKey, byIdKey, byNumberKey, fallbackKey].filter(Boolean)
  for (const k of candidateKeys) {
    if (!Object.prototype.hasOwnProperty.call(edits, k)) continue
    const editValue = edits[k]
    if (editValue === '__REMOVE__') return null
    if (editValue) return editValue
  }

  // 2.b) Persistido por clave de grupo (countsMeta)
  for (const k of candidateKeys) {
    if (!meta[k] || !Object.prototype.hasOwnProperty.call(meta[k], 'manualExpirationDate')) continue
    const saved = meta[k].manualExpirationDate
    if (saved === '__REMOVE__') return null
    if (saved) return saved
  }

  // 3) Fecha original del item
  return item.expirationDate
}

/**
 * Construye los grupos de inventario.
 * @returns {Array} groups
 */
export function buildInventoryGroups({
  items, // array filtrado base
  counts,
  serverCounts,
  locationNames,
  stockFilter,
  sortDir,
  searchTerm,
  session,
  expirationEdits,
  countsMeta,
}) {
  if (!Array.isArray(items)) return []

  // Agrupar por producto
  const byProduct = new Map()
  for (const s of items) {
    const pid = s.productId || s.productID || s.product?.id || s.idProduct || null
    const pName = s.productName || ''
    const productKey = pid || `name:${(pName || '').toLowerCase()}`
    const arr = byProduct.get(productKey) || []
    arr.push(s)
    byProduct.set(productKey, arr)
  }

  const out = []

  for (const [productKey, groupedItems] of byProduct) {
    const productName = groupedItems[0]?.productName || 'Producto'
    const productId = groupedItems[0]?.productId || groupedItems[0]?.productID || groupedItems[0]?.product?.id || groupedItems[0]?.idProduct || null

    const noExpItems = groupedItems.filter(it => !getEffectiveExpirationDate(it, expirationEdits, countsMeta))
    const expItems = groupedItems.filter(it => !!getEffectiveExpirationDate(it, expirationEdits, countsMeta))

    const children = []

    if (noExpItems.length > 0) {
      let stock = sum(noExpItems.map(x => x.quantity ?? x.stock ?? 0))
      const key = `noexp:${productKey}`
      const legacySum = sum(noExpItems.map(x => counts[x.id] ?? 0))
      const real = (key in counts) ? counts[key] : (legacySum || stock)
      if (session?.status === 'closed' && session?.frozenChildrenStock && Object.prototype.hasOwnProperty.call(session.frozenChildrenStock, key)) {
        stock = Number(session.frozenChildrenStock[key] ?? stock)
      }
      children.push({
        key,
        type: 'noexp',
        productId,
        productName,
        stock,
        real,
        diff: (real ?? 0) - stock,
        expirationDate: null,
        locations: buildLocations(noExpItems, locationNames),
        sourceIds: noExpItems.map(x => x.id),
        sources: noExpItems.map(x => ({
          id: x.id,
          quantity: Number(x.quantity ?? x.stock ?? 0) || 0,
          batchNumberId: x.batchNumberId ?? null,
          batchId: x.batchId ?? null,
          expirationDate: getEffectiveExpirationDate(x, expirationEdits, countsMeta),
          location: getLocationKey(x.location) || x.location || '',
        })),
      })
    }

    if (expItems.length > 0) {
      const byBatch = new Map()
      for (const it of expItems) {
        const byId = it.batchId && String(it.batchId)
        const byNumber = (it.batchNumberId !== undefined && it.batchNumberId !== null) ? `bn:${String(it.batchNumberId)}` : null
        const fallback = it.id ? `stock:${String(it.id)}` : 'batch-unknown'
        const bKey = byId || byNumber || fallback
        const arr = byBatch.get(bKey) || []
        arr.push(it)
        byBatch.set(bKey, arr)
      }
      for (const [bKey, arr] of byBatch) {
        let stock = sum(arr.map(x => x.quantity ?? x.stock ?? 0))
        const key = `batchGroup:${bKey}`
        const legacySum = sum(arr.map(x => counts[x.id] ?? 0))
        const real = (key in counts) ? counts[key] : (legacySum || stock)
        if (session?.status === 'closed' && session?.frozenChildrenStock) {
          const sample = arr[0]
          const altKeys = [key]
          const byId = sample?.batchId && String(sample.batchId)
          const byNumber = (sample?.batchNumberId !== undefined && sample?.batchNumberId !== null) ? `bn:${String(sample.batchNumberId)}` : null
          const fallbackKeys = arr.map(x => x.id ? `batchGroup:stock:${String(x.id)}` : null).filter(Boolean)
            if (byId) altKeys.push(`batchGroup:${byId}`)
          if (byNumber) altKeys.push(`batchGroup:${byNumber}`)
          altKeys.push(...fallbackKeys)
          const foundKey = altKeys.find(k => Object.prototype.hasOwnProperty.call(session.frozenChildrenStock, k))
          if (foundKey) {
            stock = Number(session.frozenChildrenStock[foundKey] ?? stock)
          }
        }
        const sample = arr[0]
        children.push({
          key,
          type: 'batch',
          productId,
          productName,
          batchId: sample?.batchId,
          batchNumberId: sample?.batchNumberId,
          expirationDate: getEffectiveExpirationDate(sample, expirationEdits, countsMeta),
          stock,
          real,
          diff: (real ?? 0) - stock,
          locations: buildLocations(arr, locationNames),
          sourceIds: arr.map(x => x.id),
          sources: arr.map(x => ({
            id: x.id,
            quantity: Number(x.quantity ?? x.stock ?? 0) || 0,
            batchNumberId: x.batchNumberId ?? null,
            batchId: x.batchId ?? null,
            expirationDate: getEffectiveExpirationDate(x, expirationEdits, countsMeta),
            location: getLocationKey(x.location) || x.location || '',
          })),
        })
      }
    }

    // Ajuste real/diff si existen ediciones por source
    for (const child of children) {
      if (Array.isArray(child.sources) && child.sources.length) {
        const hasSourceEdits = child.sources.some(src => Object.prototype.hasOwnProperty.call(counts, src.id || src.key))
        if (hasSourceEdits) {
          const sumSourcesReal = child.sources.reduce((s, src) => s + Number(counts[src.id || src.key] ?? src.real ?? src.stock ?? 0), 0)
          child.real = sumSourcesReal
          child.diff = Number(sumSourcesReal ?? 0) - Number(child.stock ?? 0)
        }
      }
    }

    let totalStock = sum(children.map(c => c.stock))
    if (session?.status === 'closed' && session?.frozenProductTotals) {
      const frozenKey = productId || productName || 'unknown'
      if (Object.prototype.hasOwnProperty.call(session.frozenProductTotals, frozenKey)) {
        totalStock = Number(session?.frozenProductTotals[frozenKey] ?? totalStock)
      }
    }
    const totalReal = sum(children.map(c => {
      if (Array.isArray(c.sources) && c.sources.length) {
        const hasSourceEdits = c.sources.some(src => Object.prototype.hasOwnProperty.call(counts, src.id || src.key))
          || (!Object.prototype.hasOwnProperty.call(counts, c.key) && c.sources.some(src => Object.prototype.hasOwnProperty.call(serverCounts || {}, src.id || src.key)))
        if (hasSourceEdits) {
          return c.sources.reduce((s, src) => s + Number(counts[src.id || src.key] ?? src.real ?? src.stock ?? 0), 0)
        }
      }
      return counts[c.key] ?? c.real ?? c.stock
    }))
    const totalDiff = (totalReal ?? 0) - (totalStock ?? 0)

    let canEditAtTop = false
    let topKey = undefined
    if (children.length === 1) {
      canEditAtTop = true
      topKey = children[0].key
    }

    out.push({ productId, productKey, productName, totalStock, totalReal, totalDiff, _children: children, canEditAtTop, topKey })
  }

  const sorted = [...out].sort((a, b) => {
    const an = (a.productName || '').toLowerCase()
    const bn = (b.productName || '').toLowerCase()
    if (an < bn) return sortDir === 'asc' ? -1 : 1
    if (an > bn) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  let filteredOut = sorted
  if (stockFilter === 'with') filteredOut = sorted.filter(g => Number(g.totalStock ?? 0) > 0)
  else if (stockFilter === 'without') filteredOut = sorted.filter(g => Number(g.totalStock ?? 0) <= 0)

  const term = (searchTerm || '').trim().toLowerCase()
  if (!term) return filteredOut
  return filteredOut.filter(g =>
    (g.productName || '').toLowerCase().includes(term) ||
    g._children?.some(c => String(c.batchNumberId ?? '').toLowerCase().includes(term))
  )
}

export default buildInventoryGroups

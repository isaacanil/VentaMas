// Helper utilities extracted from InventoryControl.jsx for reuse and to reduce file size
// Pure / side-effect free helpers or helpers that only depend on Firestore SDK directly

import { doc, getDoc } from 'firebase/firestore'

import { db } from '../../../../firebase/firebaseconfig'

export function sum(arr) {
  return (arr || []).reduce((acc, n) => acc + Number(n ?? 0), 0)
}

export function getLocationKey(location) {
  if (!location) return ''
  if (typeof location === 'string') return location
  const { warehouse, shelf, row, segment } = location || {}
  return [warehouse, shelf, row, segment].filter(Boolean).join('/')
}

export function buildLocations(items, locationNamesMap = {}) {
  const map = new Map()
  for (const it of items || []) {
    const raw = it.location || it.warehouseId || ''
    const locKey = getLocationKey(raw)
    const qty = Number(it.quantity ?? it.stock ?? 0)
    if (!locKey || !isFinite(qty) || qty <= 0) continue
    const prev = map.get(locKey) || 0
    map.set(locKey, prev + qty)
  }
  return Array.from(map.entries())
    .filter(([, quantity]) => quantity > 0)
    .map(([locKey, quantity]) => ({ location: locationNamesMap[locKey] || locKey, quantity }))
}

export function normalizeDateKey(d) {
  if (!d) return 'no-date'
  try {
    let date
    if (d instanceof Date) {
      date = d
    } else if (d?.toDate) {
      date = d.toDate()
    } else if (typeof d === 'object' && typeof d.seconds === 'number') {
      date = new Date(d.seconds * 1000)
    } else {
      date = new Date(d)
    }
    if (Number.isNaN(date.getTime())) return 'no-date'
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch { return 'no-date' }
}

export function findChildByKey(groups, key) {
  if (!Array.isArray(groups)) return null
  for (const g of groups) {
    const found = g._children?.find(c => c.key === key)
    if (found) return found
  }
  return null
}

export async function resolveLocationLabel(businessID, locKey) {
  try {
    if (!locKey) return ''
    const ids = String(locKey).split('/').filter(Boolean)
    const [warehouseId, shelfId, rowId, segmentId] = ids
    const parts = []

    if (warehouseId) {
      const name = await fetchFriendlyName(businessID, ['warehouses', warehouseId])
      parts.push(name || abbreviateUnknown(warehouseId))
    }

    if (shelfId) {
      let name = await fetchFriendlyName(businessID, ['warehouses', warehouseId, 'shelves', shelfId])
      if (!name) name = await fetchFriendlyName(businessID, ['shelves', shelfId])
      parts.push(name || abbreviateUnknown(shelfId))
    }

    if (rowId) {
      let name = await fetchFriendlyName(businessID, ['warehouses', warehouseId, 'shelves', shelfId, 'rows', rowId])
      if (!name) name = await fetchFriendlyName(businessID, ['rows', rowId])
      parts.push(name || abbreviateUnknown(rowId))
    }

    if (segmentId) {
      let name = await fetchFriendlyName(businessID, ['warehouses', warehouseId, 'shelves', shelfId, 'rows', rowId, 'segments', segmentId])
      if (!name) name = await fetchFriendlyName(businessID, ['segments', segmentId])
      parts.push(name || abbreviateUnknown(segmentId))
    }

    return parts.filter(Boolean).join(' / ')
  } catch (e) {
    return locKey
  }
}

async function fetchFriendlyName(businessID, pathParts) {
  try {
    const ref = doc(db, 'businesses', businessID, ...pathParts)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data() || {}
    return data.name || data.shortName || data.title || null
  } catch {
    return null
  }
}

function isLikelyRandomId(str) {
  if (!str || typeof str !== 'string') return false
  return /^[A-Za-z0-9_-]{10,}$/.test(str)
}

function abbreviateUnknown(str) {
  if (!str) return ''
  return isLikelyRandomId(str) ? `${str.slice(0, 6)}…` : str
}

export default {
  sum,
  buildLocations,
  normalizeDateKey,
  findChildByKey,
  getLocationKey,
  resolveLocationLabel,
}

import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp, deleteField } from 'firebase/firestore'
import { sum, findChildByKey } from '../utils/inventoryHelpers'

/**
 * Maneja snapshot de counts de la sesión, metadatos y lógica de guardado.
 * Expone counts/serverCounts/countsMeta/expirationEdits y utilidades.
 */
export function useInventoryCounts({ db, user, sessionId }) {
  const [counts, setCounts] = useState({})
  const [serverCounts, setServerCounts] = useState({})
  const [countsMeta, setCountsMeta] = useState({})
  const [expirationEdits, setExpirationEdits] = useState({})
  const [saving, setSaving] = useState(false)

  // Snapshot de counts
  useEffect(() => {
    if (!db || !sessionId || !user?.businessID) return
    const countsRef = collection(db, 'businesses', user.businessID, 'inventorySessions', sessionId, 'counts')
    const unsub = onSnapshot(countsRef, (snap) => {
      const savedCounts = {}
      const meta = {}
      snap.docs.forEach(docSnap => {
        const data = docSnap.data() || {}
        if (!data.productStockId) return
        // Backward compatibility: prefer English key, fallback to legacy Spanish
        savedCounts[data.productStockId] = (data.realCount ?? data.conteoReal)
        meta[data.productStockId] = {
          updatedBy: data.updatedBy ?? null,
          updatedByName: data.updatedByName ?? null,
          updatedAt: data.updatedAt ?? null,
          manualExpirationDate: data.manualExpirationDate ?? null,
        }
      })
      if (process.env.NODE_ENV !== 'production') {
        try { console.debug('[useInventoryCounts] Counts docs:', snap.size, 'keys:', Object.keys(savedCounts).length) } catch {}
      }
      setCounts(savedCounts)
      setServerCounts(savedCounts)
      setCountsMeta(meta)
    }, (error) => { try { console.error('[useInventoryCounts] Error listener counts:', error) } catch {} })
    return () => unsub()
  }, [db, sessionId, user?.businessID])

  // Cambios locales vs baseline del servidor
  const hasChanges = useMemo(() => {
    const keys = new Set([...Object.keys(counts), ...Object.keys(serverCounts)])
    for (const k of keys) if ((counts[k] ?? null) !== (serverCounts[k] ?? null)) return true
    // Detectar cambios de vencimiento: considerar claves de grupo y también IDs de stock (sources)
    for (const key of Object.keys(expirationEdits)) {
      const editedVal = expirationEdits[key] ?? null
      const storedVal = countsMeta[key]?.manualExpirationDate ?? null
      if (editedVal !== storedVal) return true
    }
    return false
  }, [counts, serverCounts, expirationEdits, countsMeta])

  // Guardado parcial de counts (solo modificados) + metadata
  const saveCounts = async ({ groups, stocks, currentUserResolvedName }) => {
    if (!db || !sessionId || !user?.businessID) return

    const keysCountChanged = Object.keys(counts).filter(k => (counts[k] ?? null) !== (serverCounts[k] ?? null))
    // Cambios de vencimiento: incluir tanto claves de grupo como IDs de stock
    const expirationChanged = Object.keys(expirationEdits).filter(k => {
      const editedVal = expirationEdits[k] ?? null
      const storedVal = countsMeta[k]?.manualExpirationDate ?? null
      return editedVal !== storedVal
    })
    let keysToSave = Array.from(new Set([...keysCountChanged, ...expirationChanged]))
    // De-duplicar: si existen ambos noexp:<pid> y batchGroup:stock:productOnly:<pid>,
    // guardamos solo la clave batchGroup y omitimos la noexp.
    const present = new Set(keysToSave)
    const noexpToBatchMap = new Map()
    for (const k of keysToSave) {
      if (k.startsWith('batchGroup:stock:productOnly:')) {
        const pid = k.slice('batchGroup:stock:productOnly:'.length)
        const noexpKey = pid ? `noexp:${pid}` : null
        if (noexpKey && present.has(noexpKey)) noexpToBatchMap.set(noexpKey, k)
      }
    }
    if (noexpToBatchMap.size) {
      keysToSave = keysToSave.filter(k => !(k.startsWith('noexp:') && noexpToBatchMap.has(k)))
    }
    if (keysToSave.length === 0) return { saved: 0 }

    setSaving(true)
    try {
      const countsData = []
      for (const key of keysToSave) {
        const conteoReal = (() => {
          if (Object.prototype.hasOwnProperty.call(counts, key)) return counts[key]
          if (key.startsWith('batchGroup:stock:productOnly:')) {
            const pid = key.slice('batchGroup:stock:productOnly:'.length)
            const noexpAlt = pid ? `noexp:${pid}` : null
            if (noexpAlt && Object.prototype.hasOwnProperty.call(counts, noexpAlt)) return counts[noexpAlt]
          }
          return counts[key]
        })()

        if (key.startsWith('noexp:')) {
          // Nota: al asignar una fecha manual, los items pueden dejar de ser "noexp"
          // y el child ya no existir en groups (porque se re-clasifican como batch).
          // Hacemos fallback a detectar por productKey directamente.
          const child = findChildByKey(groups, key)
          let subset = []
          let productName = ''
          if (child) {
            const sourceIds = child.sourceIds || []
            subset = stocks.filter(s => sourceIds.includes(s.id))
            productName = child.productName ?? subset[0]?.productName ?? ''
          } else {
            const productKey = String(key).slice('noexp:'.length)
            subset = stocks.filter(s => {
              const pid = s.productId || s.productID || s.product?.id || s.idProduct || null
              const pKey = pid || `name:${(s.productName || '').toLowerCase()}`
              return String(pKey) === productKey
            })
            productName = subset[0]?.productName || ''
          }
          const stockSistema = sum(subset.map(s => s.quantity ?? s.stock ?? 0))
          const diferencia = Number(conteoReal ?? stockSistema) - stockSistema
          let manualExpirationDate
          if (Object.prototype.hasOwnProperty.call(expirationEdits, key)) {
            manualExpirationDate = (expirationEdits[key] === '__REMOVE__') ? '__REMOVE__' : (expirationEdits[key] ?? null)
          } else if (countsMeta[key]?.manualExpirationDate !== undefined) {
            manualExpirationDate = countsMeta[key].manualExpirationDate
          }
          const payload = {
            productStockId: key,
            productName,
            // New English keys
            systemStock: stockSistema,
            realCount: Number(conteoReal ?? stockSistema),
            difference: diferencia,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid || user.id,
            updatedByName: currentUserResolvedName || user.displayName || user.name || user.email || 'Usuario'
          }
          // Remove legacy Spanish keys in the same write
          payload.stockSistema = deleteField()
          payload.conteoReal = deleteField()
          payload.diferencia = deleteField()
          if (manualExpirationDate !== undefined) payload.manualExpirationDate = manualExpirationDate
          countsData.push(payload)
          continue
        }

        if (key.startsWith('batchGroup:')) {
          const child = findChildByKey(groups, key)
          let subset = []
          let productName = ''
          if (child) {
            const sourceIds = child.sourceIds || []
            subset = stocks.filter(s => sourceIds.includes(s.id))
            productName = child.productName ?? subset[0]?.productName ?? ''
          } else {
            // Fallback: derivar subset por batchId/batchNumberId/stockId del key
            const bKey = String(key).slice('batchGroup:'.length)
            if (bKey.startsWith('bn:')) {
              const bn = bKey.slice(3)
              subset = stocks.filter(s => String(s.batchNumberId ?? '') === String(bn))
            } else if (bKey.startsWith('stock:')) {
              const sid = bKey.slice(6)
              subset = stocks.filter(s => String(s.id ?? '') === String(sid))
            } else {
              const batchId = bKey
              subset = stocks.filter(s => String(s.batchId ?? '') === String(batchId))
            }
            productName = subset[0]?.productName || ''
          }
          const stockSistema = sum(subset.map(s => s.quantity ?? s.stock ?? 0))
          const diferencia = Number(conteoReal ?? stockSistema) - stockSistema
          let manualExpirationDate
          if (Object.prototype.hasOwnProperty.call(expirationEdits, key)) {
            manualExpirationDate = (expirationEdits[key] === '__REMOVE__') ? '__REMOVE__' : (expirationEdits[key] ?? null)
          } else if (countsMeta[key]?.manualExpirationDate !== undefined) {
            manualExpirationDate = countsMeta[key].manualExpirationDate
          } else if (key.startsWith('batchGroup:stock:productOnly:')) {
            const pid = key.slice('batchGroup:stock:productOnly:'.length)
            const noexpAlt = pid ? `noexp:${pid}` : null
            if (noexpAlt) {
              if (Object.prototype.hasOwnProperty.call(expirationEdits, noexpAlt)) {
                manualExpirationDate = (expirationEdits[noexpAlt] === '__REMOVE__') ? '__REMOVE__' : (expirationEdits[noexpAlt] ?? null)
              } else if (countsMeta[noexpAlt]?.manualExpirationDate !== undefined) {
                manualExpirationDate = countsMeta[noexpAlt].manualExpirationDate
              }
            }
          } else {
            manualExpirationDate = null
          }
          const payload = {
            productStockId: key,
            productName,
            // New English keys
            systemStock: stockSistema,
            realCount: Number(conteoReal ?? stockSistema),
            difference: diferencia,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid || user.id,
            updatedByName: currentUserResolvedName || user.displayName || user.name || user.email || 'Usuario'
          }
          // Remove legacy Spanish keys in the same write
          payload.stockSistema = deleteField()
          payload.conteoReal = deleteField()
          payload.diferencia = deleteField()
          if (manualExpirationDate !== undefined) payload.manualExpirationDate = manualExpirationDate
          countsData.push(payload)
          continue
        }

        // default: id de stock fuente
        const stockId = key
        const item = stocks.find(s => String(s.id) === String(stockId))
        const stockSistema = Number(item?.quantity ?? item?.stock ?? 0) || 0
        const diferencia = Number(conteoReal ?? stockSistema) - stockSistema
        // Manejar fecha manual para IDs de stock individuales (sources)
        let manualExpirationDate
        if (Object.prototype.hasOwnProperty.call(expirationEdits, key)) {
          manualExpirationDate = (expirationEdits[key] === '__REMOVE__') ? '__REMOVE__' : (expirationEdits[key] ?? null)
        } else if (countsMeta[key]?.manualExpirationDate !== undefined) {
          manualExpirationDate = countsMeta[key].manualExpirationDate
        }
        const payload = {
          productStockId: stockId,
          productName: item?.productName || '',
          // New English keys
          systemStock: stockSistema,
          realCount: conteoReal ?? stockSistema,
          difference: diferencia,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid || user.id,
          updatedByName: currentUserResolvedName || user.displayName || user.name || user.email || 'Usuario'
        }
        // Remove legacy Spanish keys in the same write
        payload.stockSistema = deleteField()
        payload.conteoReal = deleteField()
        payload.diferencia = deleteField()
        if (manualExpirationDate !== undefined) payload.manualExpirationDate = manualExpirationDate
        countsData.push(payload)
      }

      // Persistir modificados
      for (const count of countsData) {
        const id = String(count.productStockId)
        const countRef = doc(db, 'businesses', user.businessID, 'inventorySessions', sessionId, 'counts', id)
        await setDoc(countRef, count, { merge: true })
      }

      // Actualizar baseline local
      setServerCounts(prev => {
        const next = { ...prev }
        for (const key of keysToSave) {
          if (Object.prototype.hasOwnProperty.call(counts, key)) {
            next[key] = counts[key]
          }
        }
        return next
      })

      // Actualizar metadata local
      setCountsMeta(prev => {
        const clone = { ...prev }
        for (const key of keysToSave) {
          const hasManualChange = Object.prototype.hasOwnProperty.call(expirationEdits, key)
          if (key.startsWith('batchGroup:') || key.startsWith('noexp:') || hasManualChange) {
            const existingMeta = clone[key] || {}
            clone[key] = {
              ...existingMeta,
              updatedBy: user.uid || user.id,
              updatedByName: currentUserResolvedName || user.displayName || user.name || user.email || 'Usuario',
              updatedAt: new Date(),
              ...(hasManualChange ? { manualExpirationDate: expirationEdits[key] ?? null } : {})
            }
            // Propagar manualExpirationDate desde noexp:<pid> a batchGroup:stock:productOnly:<pid> si no se guardó la noexp
            if (key.startsWith('batchGroup:stock:productOnly:')) {
              const pid = key.slice('batchGroup:stock:productOnly:'.length)
              const noexpAlt = pid ? `noexp:${pid}` : null
              if (noexpAlt && Object.prototype.hasOwnProperty.call(expirationEdits, noexpAlt)) {
                const curr = clone[key] || {}
                clone[key] = { ...curr, manualExpirationDate: expirationEdits[noexpAlt] ?? null }
              }
            }
          }
        }
        return clone
      })

      // Limpiar expirationEdits de claves guardadas (y su noexp alterno si aplica)
      setExpirationEdits(prev => {
        const clone = { ...prev }
        for (const k of keysToSave) {
          delete clone[k]
          if (k.startsWith('batchGroup:stock:productOnly:')) {
            const pid = k.slice('batchGroup:stock:productOnly:'.length)
            const noexpAlt = pid ? `noexp:${pid}` : null
            if (noexpAlt) delete clone[noexpAlt]
          }
        }
        return clone
      })

      // Limpiar counts de noexp deduplicados para evitar persistencias dobles posteriores
      if (noexpToBatchMap.size) {
        try {
          const delKeys = Array.from(noexpToBatchMap.keys())
          setCounts(prev => {
            const c = { ...prev }
            for (const dk of delKeys) delete c[dk]
            return c
          })
        } catch {}
      }

      // Touch presence del usuario en la sesión
      try {
        const sessionEditorRef = doc(db, 'businesses', user.businessID, 'inventorySessions', sessionId, 'editingUsers', user.uid || user.id)
        await setDoc(sessionEditorRef, {
          uid: user.uid || user.id,
          displayName: currentUserResolvedName || user.displayName || user.name || user.email || 'Usuario',
          photoURL: user.photoURL || null,
          lastActiveAt: serverTimestamp(),
        }, { merge: true })
      } catch {}

      return { saved: keysToSave.length }
    } catch (error) {
      try { console.error('[useInventoryCounts] Error guardando conteos:', error) } catch {}
      throw error
    } finally {
      setSaving(false)
    }
  }

  return {
    counts,
    setCounts,
    serverCounts,
    setServerCounts,
    countsMeta,
    setCountsMeta,
    expirationEdits,
    setExpirationEdits,
    hasChanges,
    saving,
    saveCounts,
  }
}

export default useInventoryCounts

import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
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
        savedCounts[data.productStockId] = data.conteoReal
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
    const keysToSave = Array.from(new Set([...keysCountChanged, ...expirationChanged]))
    if (keysToSave.length === 0) return { saved: 0 }

    setSaving(true)
    try {
      const countsData = []
      for (const key of keysToSave) {
        const conteoReal = counts[key]

        if (key.startsWith('noexp:')) {
          const child = findChildByKey(groups, key)
          if (!child) continue
          const sourceIds = child.sourceIds || []
          const subset = stocks.filter(s => sourceIds.includes(s.id))
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
            productName: child.productName ?? subset[0]?.productName ?? '',
            stockSistema,
            conteoReal: Number(conteoReal ?? stockSistema),
            diferencia,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid || user.id,
            updatedByName: currentUserResolvedName || user.displayName || user.name || user.email || 'Usuario'
          }
          if (manualExpirationDate !== undefined) payload.manualExpirationDate = manualExpirationDate
          countsData.push(payload)
          continue
        }

        if (key.startsWith('batchGroup:')) {
          const child = findChildByKey(groups, key)
          if (!child) continue
          const sourceIds = child.sourceIds || []
          const subset = stocks.filter(s => sourceIds.includes(s.id))
          const stockSistema = sum(subset.map(s => s.quantity ?? s.stock ?? 0))
          const diferencia = Number(conteoReal ?? stockSistema) - stockSistema
          let manualExpirationDate
          if (Object.prototype.hasOwnProperty.call(expirationEdits, key)) {
            manualExpirationDate = (expirationEdits[key] === '__REMOVE__') ? '__REMOVE__' : (expirationEdits[key] ?? null)
          } else if (countsMeta[key]?.manualExpirationDate !== undefined) {
            manualExpirationDate = countsMeta[key].manualExpirationDate
          } else {
            manualExpirationDate = null
          }
          const payload = {
            productStockId: key,
            productName: child.productName ?? subset[0]?.productName ?? '',
            stockSistema,
            conteoReal: Number(conteoReal ?? stockSistema),
            diferencia,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid || user.id,
            updatedByName: currentUserResolvedName || user.displayName || user.name || user.email || 'Usuario'
          }
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
          stockSistema,
          conteoReal: conteoReal ?? stockSistema,
          diferencia,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid || user.id,
          updatedByName: currentUserResolvedName || user.displayName || user.name || user.email || 'Usuario'
        }
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
          }
        }
        return clone
      })

      // Limpiar expirationEdits de claves guardadas, excepto noexp (se mantienen hasta refresco)
      setExpirationEdits(prev => {
        const clone = { ...prev }
        for (const k of keysToSave) {
          if (!k.startsWith('noexp:')) delete clone[k]
        }
        return clone
      })

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


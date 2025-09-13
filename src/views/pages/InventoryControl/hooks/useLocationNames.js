import { useEffect, useState } from 'react'
import { getLocationKey, resolveLocationLabel } from '../utils/inventoryHelpers'

/**
 * Resuelve etiquetas legibles de ubicaciones para un conjunto de items filtrados.
 */
export function useLocationNames({ businessID, filteredItems }) {
  const [locationNames, setLocationNames] = useState({})
  const [resolvingLocations, setResolvingLocations] = useState({})

  useEffect(() => {
    if (!businessID) return
    const uniqueKeys = new Set()
    for (const it of filteredItems || []) {
      const key = getLocationKey(it?.location)
      if (key) uniqueKeys.add(key)
    }
    const keys = Array.from(uniqueKeys)
    if (keys.length === 0) {
      setLocationNames({})
      return
    }

    let cancelled = false
    const cache = { ...locationNames }
    const run = async () => {
      const toLoad = keys.filter(k => !cache[k])
      if (toLoad.length) {
        setResolvingLocations(prev => ({
          ...prev,
          ...Object.fromEntries(toLoad.map(k => [k, true]))
        }))
      }
      const entries = await Promise.all(keys.map(async (key) => {
        if (cache[key]) return [key, cache[key]]
        const label = await resolveLocationLabel(businessID, key)
        return [key, label]
      }))
      if (!cancelled) {
        const map = { ...cache }
        for (const [k, v] of entries) map[k] = v
        setLocationNames(map)
        if (toLoad.length) {
          setResolvingLocations(prev => {
            const next = { ...prev }
            toLoad.forEach(k => { delete next[k] })
            return next
          })
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [businessID, filteredItems])

  return { locationNames, resolvingLocations }
}

export default useLocationNames


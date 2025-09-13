import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

/**
 * Escucha stocks y productos activos; construye augmentedStocks que incluye
 * productos sin registros en productsStock (stock 0 sintético).
 */
export function useInventoryStocksProducts({ db, businessID }) {
  const [stocks, setStocks] = useState([])
  const [products, setProducts] = useState([])
  const [loadingStocks, setLoadingStocks] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Stocks listener
  useEffect(() => {
    if (!db || !businessID) { setStocks([]); return }
    setLoadingStocks(true)
    const ref = collection(db, 'businesses', businessID, 'productsStock')
    const q = query(ref, orderBy('updatedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const data = raw.filter(r => r.isDeleted !== true && r.status !== 'inactive')
      if (process.env.NODE_ENV !== 'production') {
        const inactive = raw.filter(r => r.status === 'inactive').length
        try { console.debug('[useInventoryStocksProducts] Stocks:', raw.length, 'Activos:', data.length, 'Inactivos omitidos:', inactive) } catch {}
      }
      setStocks(data)
      setLoadingStocks(false)
    }, (error) => {
      try { console.error('[useInventoryStocksProducts] Error listener productsStock:', error) } catch {}
      setLoadingStocks(false)
    })
    return () => unsub()
  }, [db, businessID])

  // Products listener (para entradas sintéticas)
  useEffect(() => {
    if (!db || !businessID) { setProducts([]); return }
    setLoadingProducts(true)
    const ref = collection(db, 'businesses', businessID, 'products')
    const unsub = onSnapshot(ref, (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const data = raw.filter(r => r.isDeleted !== true && r.status !== 'inactive')
      if (process.env.NODE_ENV !== 'production') {
        try { console.debug('[useInventoryStocksProducts] Products:', raw.length, 'Activos:', data.length) } catch {}
      }
      setProducts(data)
      setLoadingProducts(false)
    }, (error) => {
      try { console.error('[useInventoryStocksProducts] Error listener products:', error) } catch {}
      setLoadingProducts(false)
    })
    return () => unsub()
  }, [db, businessID])

  const augmentedStocks = useMemo(() => {
    if (!products.length) return stocks
    const productIdsWithStock = new Set(stocks.map(s => s.productId || s.productID || s.product?.id || s.idProduct || null).filter(Boolean))
    const synthetic = []
    for (const p of products) {
      const pid = p.id
      if (!pid || productIdsWithStock.has(pid)) continue
      synthetic.push({
        id: `productOnly:${pid}`,
        productId: pid,
        productName: p.name || p.productName || '',
        quantity: 0,
        stock: 0,
        isSynthetic: true,
      })
    }
    return [...stocks, ...synthetic]
  }, [stocks, products])

  return {
    stocks,
    products,
    augmentedStocks,
    loading: loadingStocks || loadingProducts,
  }
}

export default useInventoryStocksProducts


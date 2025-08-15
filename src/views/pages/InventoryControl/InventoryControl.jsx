import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import Typografy from '../../templates/system/Typografy/Typografy'
import { Button, InputNumber, message } from 'antd'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { collection, onSnapshot, orderBy, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/firebaseconfig'
import { useParams } from 'react-router-dom'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { AdvancedTable } from '../../templates/system/AdvancedTable/AdvancedTable'

export const InventoryControl = () => {
  const user = useSelector(selectUser)
  const { sessionId } = useParams()
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState({}) // conteo real por id de stock
  const [saving, setSaving] = useState(false)

  // Listener de todo el stock (filtra eliminados)
  useEffect(() => {
    if (!user?.businessID) {
      setStocks([])
      setLoading(false)
      return
    }

    setLoading(true)
    const ref = collection(db, 'businesses', user.businessID, 'productsStock')
    const q = query(ref, where('isDeleted', '==', false), orderBy('updatedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setStocks(data)
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [user?.businessID])

  // Cargar conteos guardados de la sesión
  useEffect(() => {
    if (!sessionId || !user?.businessID) return

    const countsRef = collection(db, 'businesses', user.businessID, 'inventorySessions', sessionId, 'counts')
    const unsub = onSnapshot(countsRef, (snap) => {
      const savedCounts = {}
      snap.docs.forEach(doc => {
        const data = doc.data()
        savedCounts[data.productStockId] = data.conteoReal
      })
      setCounts(savedCounts)
    })
    return () => unsub()
  }, [sessionId, user?.businessID])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return stocks
    return stocks.filter(it =>
      (it.productName || '').toLowerCase().includes(s) ||
      (it.batchNumberId || '').toString().toLowerCase().includes(s)
    )
  }, [stocks, search])

  const columns = [
    {
      Header: "Producto",
      accessor: "productName",
      minWidth: "200px",
      maxWidth: "2fr"
    },
    {
      Header: "Stock",
      accessor: "stock",
      align: "right",
      minWidth: "100px",
      maxWidth: "1fr"
    },
    {
      Header: "Conteo real",
      accessor: "conteoReal",
      minWidth: "140px",
      maxWidth: "1fr",
      cell: ({ value }) => {
        const itemId = value?.id
        const currentValue = value?.value ?? 0
        return (
          <InputNumber
            min={0}
            value={currentValue}
            onChange={(v) => itemId && setCounts(prev => ({ ...prev, [itemId]: v }))}
            style={{ width: '100%' }}
          />
        )
      }
    },
    {
      Header: "Diferencia",
      accessor: "diferencia",
      minWidth: "140px",
      maxWidth: "1fr",
      cell: ({ value }) => (
        <DiffCell $value={value}>{value}</DiffCell>
      )
    }
  ]

  const tableData = filtered.map(item => {
    const itemId = item?.id || item?.key
    const currentStock = (item?.quantity ?? item?.stock ?? 0) * 1
    const real = counts[itemId] ?? currentStock
    const diff = (real ?? 0) - currentStock
    return {
      ...item,
      key: itemId,
      stock: currentStock,
      conteoReal: { id: itemId, value: real },
      diferencia: diff,
    }
  })

  // Guardar conteos en la sesión
  const handleSaveCounts = async () => {
    if (!sessionId || !user?.businessID) return
    
    setSaving(true)
    try {
      const countsData = []
      Object.entries(counts).forEach(([stockId, conteoReal]) => {
        const stock = stocks.find(s => s.id === stockId)
        if (stock) {
          const stockSistema = (stock.quantity ?? stock.stock ?? 0) * 1
          const diferencia = (conteoReal ?? 0) - stockSistema
          countsData.push({
            productStockId: stockId,
            productName: stock.productName,
            stockSistema,
            conteoReal: conteoReal ?? stockSistema,
            diferencia,
            updatedAt: serverTimestamp(),
            updatedBy: user.id
          })
        }
      })

      // Guardar en Firestore
      for (const count of countsData) {
        const countRef = doc(db, 'businesses', user.businessID, 'inventorySessions', sessionId, 'counts', count.productStockId)
        await setDoc(countRef, count, { merge: true })
      }

      message.success('Conteos guardados exitosamente')
    } catch (error) {
      console.error('Error guardando conteos:', error)
      message.error('Error al guardar conteos')
    } finally {
      setSaving(false)
    }
  }

  // Nota: Se removió la acción de aplicar ajustes por solicitud del usuario.

  return (
    <Container>
      <MenuApp sectionName={'Control de Inventario'} />
      <Component>
      <HeaderBar>
        <div>
          <Typografy variant="h2">Control de Inventario</Typografy>
          <Typografy variant="body1" color="textSecondary">
            Realiza el conteo físico y guarda los conteos de esta sesión.
          </Typografy>
        </div>
        <Actions>
          <SearchInput
            type="text"
            placeholder="Buscar por producto o batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={handleSaveCounts} loading={saving} disabled={Object.keys(counts).length === 0}>
            Guardar Conteos
          </Button>
        </Actions>
      </HeaderBar>

      <TableContainer>
        <AdvancedTable
          columns={columns}
          data={tableData}
          loading={loading}
          numberOfElementsPerPage={15}
          emptyText="Sin registros"
          searchTerm={search}
          elementName="producto"
        />
      </TableContainer>
      </Component>
    </Container>
  )
}

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 1rem;
  height: 100%;
`

const Component = styled.div`
  width: 98vw;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 1em;
  margin: 0 auto;
  height: 100%;
  background-color: #ffffff;
  overflow: hidden;
  padding: 0 1em 1em;
`

const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: .5rem;
`

const SearchInput = styled.input`
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(0,0,0,.15);
  border-radius: 6px;
`

const TableContainer = styled.div`
  min-height: 0;
  height: 100%;
`

const DiffCell = styled.div`
  color: ${({ $value }) => $value === 0 ? '#374151' : ($value > 0 ? '#059669' : '#dc2626')};
  font-weight: ${({ $value }) => $value !== 0 ? 600 : 400};
`

export default InventoryControl

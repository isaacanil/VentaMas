import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import Typografy from '../../templates/system/Typografy/Typografy'
import { Button } from 'antd'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/firebaseconfig'
import { useNavigate } from 'react-router-dom'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { AdvancedTable } from '../../templates/system/AdvancedTable/AdvancedTable'
import DateUtils from '../../../utils/date/dateUtils'

export default function InventorySessionsList() {
  const user = useSelector(selectUser)
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.businessID) {
      setSessions([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    const ref = collection(db, 'businesses', user.businessID, 'inventorySessions')
    const q = query(ref, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [user?.businessID])

  const handleCreate = async () => {
    if (!user?.businessID) return
    const ref = collection(db, 'businesses', user.businessID, 'inventorySessions')
    const docRef = await addDoc(ref, {
      name: `Inventario ${new Date().toLocaleDateString()}`,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      status: 'open',
    })
    navigate(`/inventory/control/${docRef.id}`)
  }

  const handleRowClick = (session) => {
    navigate(`/inventory/control/${session.id}`)
  }

  const columns = [
    {
      Header: "Nombre",
      accessor: "name",
      minWidth: "200px",
      maxWidth: "2fr"
    },
    {
      Header: "Estado",
      accessor: "status",
      minWidth: "120px",
      maxWidth: "1fr",
      cell: ({ value }) => (
        <StatusBadge status={value}>
          {value === 'open' ? 'Abierto' : value === 'closed' ? 'Cerrado' : value || 'Abierto'}
        </StatusBadge>
      )
    },
    {
      Header: "Fecha de Creación",
      accessor: "createdAt",
      minWidth: "150px",
      maxWidth: "1fr",
      cell: ({ value }) => value ? DateUtils.convertMillisToISODate(value?.seconds * 1000) : 'N/A'
    },
    {
      Header: "Creado por",
      accessor: "createdBy",
      minWidth: "150px",
      maxWidth: "1fr"
    }
  ]

  const tableData = sessions.map(session => ({
    ...session,
    key: session.id
  }))

  return (
    <Container>
      <MenuApp sectionName={'Inventarios'} />
      <Component>
        <Header>
          <div>
            <Typografy variant="h2">Inventarios</Typografy>
            <Typografy variant="body1" color="textSecondary">Lista de versiones de inventario (conteos).</Typografy>
          </div>
          <Button type="primary" onClick={handleCreate}>Crear inventario</Button>
        </Header>

        <TableContainer>
          <AdvancedTable
            columns={columns}
            data={tableData}
            loading={loading}
            numberOfElementsPerPage={10}
            emptyText="No hay inventarios aún"
            onRowClick={handleRowClick}
            elementName="inventario"
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
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const TableContainer = styled.div`
  min-height: 0;
  height: 100%;
`
const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ status }) => status === 'open' ? '#e7f5e7' : status === 'closed' ? '#f5f5f5' : '#e7f5e7'};
  color: ${({ status }) => status === 'open' ? '#2e7d32' : status === 'closed' ? '#666' : '#2e7d32'};
`

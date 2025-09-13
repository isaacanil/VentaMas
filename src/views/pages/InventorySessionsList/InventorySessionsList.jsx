import React, { useEffect, useState, useMemo } from 'react'
import styled from 'styled-components'
import Typografy from '../../templates/system/Typografy/Typografy'
import { Button, Select, Space, Skeleton } from 'antd'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/firebaseconfig'
import { useNavigate } from 'react-router-dom'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { AdvancedTable } from '../../templates/system/AdvancedTable/AdvancedTable'
import DateUtils from '../../../utils/date/dateUtils'
import dayjs from 'dayjs'
import { DatePicker as RangeDatePicker } from '../../../components/common/DatePicker/DatePicker'

export default function InventorySessionsList() {
  const user = useSelector(selectUser)
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  // const [activeEditors, setActiveEditors] = useState({}) // removido: conteo de usuarios activos en tiempo real
  const [openSessionId, setOpenSessionId] = useState(null)
  const [userNameCache, setUserNameCache] = useState({}) 
  const [sessionEditors, setSessionEditors] = useState({}) // { sessionId: Array<{uid,name}> }
  const [resolvingUIDs, setResolvingUIDs] = useState({})  // { [uid]: true }
  const [loadingEditorsBySession, setLoadingEditorsBySession] = useState({}) // { [sessionId]: true }
  // Filters
  const [statusFilter, setStatusFilter] = useState('all') // all | open | closed
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]) // rango por defecto: mes actual
  // Cargar sesiones (sin listeners por subcolección de editingUsers)
  useEffect(() => {
    if (!user?.businessID) {
      setSessions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const ref = collection(db, 'businesses', user.businessID, 'inventorySessions')
    const qSessions = query(ref, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(qSessions, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setSessions(list)
      const open = list.find(s => s.status === 'open')
      setOpenSessionId(open ? open.id : null)
      setLoading(false)
      resolveMissingCreatorNames(list)
    }, () => setLoading(false))
    return () => unsub()
  }, [user?.businessID])

  // Cargar editores (usuarios que actualizaron algún conteo) por sesión (lazy, sólo una vez por sesión)
  useEffect(() => {
    if (!user?.businessID || !sessions?.length) return
    const pending = sessions.filter(s => !sessionEditors[s.id])
    if (!pending.length) return

    pending.forEach(async (s) => {
      try {
        setLoadingEditorsBySession(prev => ({ ...prev, [s.id]: true }))
        const countsRef = collection(db, 'businesses', user.businessID, 'inventorySessions', s.id, 'counts')
        const snap = await getDocs(countsRef)
        const editorsMap = new Map()
        snap.forEach(d => {
          const data = d.data() || {}
          const uid = data.updatedBy
          if (!uid) return
          if (!editorsMap.has(uid)) {
            const rawName = data.updatedByName || userNameCache[uid] || uid
            const name = formatUserDisplay(rawName)
            editorsMap.set(uid, { uid, name })
            // Cache nombre si aún no
            setUserNameCache(prev => prev[uid] ? prev : { ...prev, [uid]: name })
          }
        })
        setSessionEditors(prev => ({ ...prev, [s.id]: Array.from(editorsMap.values()) }))
      } catch { /* ignore */ }
      finally {
        setLoadingEditorsBySession(prev => {
          const { [s.id]: _, ...rest } = prev
          return rest
        })
      }
    })
  }, [sessions, user?.businessID, sessionEditors, userNameCache])

  // Eliminado listener de usuarios activos a pedido del usuario

  // Helper para elegir nombre desde un objeto user embebido
  const pickEmbeddedUserName = (u, fallbackUid) => {
    if (!u) return ''
    const candidates = [u.realName, u.name, u.displayName, u.fullName, u.email]
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim()
    }
    return fallbackUid || ''
  }

  const resolveMissingCreatorNames = async (list) => {
    if (!user?.businessID) return
    const updates = []
    for (const s of list) {
      const uid = s.createdBy
      if (!uid) continue
      // 1) Intentar primero con user embebido en el documento de la sesión
      const embeddedName = pickEmbeddedUserName(s.user, uid)
      if (embeddedName && embeddedName !== s.createdByName) {
        try {
          const sessionRef = doc(db, 'businesses', user.businessID, 'inventorySessions', s.id)
          await updateDoc(sessionRef, { createdByName: embeddedName })
        } catch { /* ignore */ }
        updates.push({ ...s, createdByName: embeddedName })
        // Ya tenemos el mejor nombre posible; evitamos fetch adicional
        continue
      }
      let display = userNameCache[uid]
      if (!display) {
        // marcar loading por-UID
        setResolvingUIDs(prev => ({ ...prev, [uid]: true }))
        try {
          display = await fetchUserDisplayName(uid, user.businessID)
        } finally {
          setResolvingUIDs(prev => {
            const { [uid]: _, ...rest } = prev
            return rest
          })
        }
        setUserNameCache(prev => ({ ...prev, [uid]: display }))
      }
      // Si encontramos un display distinto al almacenado (o no hay), lo actualizamos.
      if (display && s.createdByName !== display) {
        try {
          const sessionRef = doc(db, 'businesses', user.businessID, 'inventorySessions', s.id)
          await updateDoc(sessionRef, { createdByName: display })
        } catch { /* ignore */ }
        updates.push({ ...s, createdByName: display })
      }
    }
    if (updates.length) {
      setSessions(prev => prev.map(p => {
        const u = updates.find(x => x.id === p.id)
        return u || p
      }))
    }
  }

  const fetchUserDisplayName = async (uid, businessID) => {
    // Única ruta confirmada: users/{uid}. Se dejan otras rutas como fallback por si existen en algunos tenants.
    const tryPaths = [
      ['businesses', businessID, 'users', uid],
      ['businesses', businessID, 'staff', uid],
      ['users', uid],
      ['profiles', uid]
    ]
    for (const parts of tryPaths) {
      try {
        const ref = doc(db, ...parts)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data() || {}
          // Algunos documentos guardan el perfil dentro de 'user'. Priorizar realName sobre otros campos.
          const nested = data.user || {}
          const realName = (nested.realName || data.realName || '').trim()
          const resolved = realName
            || nested.name
            || nested.displayName
            || data.displayName
            || data.name
            || uid
          return formatUserDisplay(resolved)
        }
      } catch { /* ignore lookup errors */ }
    }
    return formatUserDisplay(uid)
  }

  const formatUserDisplay = (raw) => {
    if (!raw) return ''
    const val = String(raw).trim()
    // If it already looks like a proper name (contains space) or an email, keep it.
    if (val.includes('@') || /\s/.test(val)) return val
    // Heuristic: Firestore auth UIDs are usually long (>18) and opaque.
    if (val.length > 18) {
      return `${val.slice(0,6)}…${val.slice(-4)}`
    }
    return val
  }

  const handleCreate = async () => {
    if (!user?.businessID) return
    // If already an open session, just navigate
    if (openSessionId) {
      navigate(`/inventory/control/${openSessionId}`)
      return
    }
    const ref = collection(db, 'businesses', user.businessID, 'inventorySessions')
    // Double-check (race safety)
    const q = query(ref, where('status', '==', 'open'))
    const openSnap = await getDocs(q)
    if (!openSnap.empty) {
      const existing = openSnap.docs[0]
      setOpenSessionId(existing.id)
      navigate(`/inventory/control/${existing.id}`)
      return
    }
    // Crear objeto user solo con valores definidos para evitar errores de Firestore
    const userData = {
      uid: user.uid
    }
    if (user.realName) userData.realName = user.realName
    if (user.name) userData.name = user.name
    if (user.displayName) userData.displayName = user.displayName
    if (user.email) userData.email = user.email

    const docRef = await addDoc(ref, {
      name: `Inventario ${new Date().toLocaleDateString()}`,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      // Priorizar realName si existe; luego displayName, name, email y finalmente UID
      createdByName: (user?.realName && user.realName.trim()) || user.displayName || user.name || user.uid,
      // Embebido: guardar objeto user con los datos del usuario para uso futuro
      user: userData,
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
      Header: "Usuarios",
      accessor: "editorsList",
      minWidth: "220px",
      maxWidth: "2fr",
      // Nota: dependemos de row.original.* (react-table suele pasarlo)
      cell: ({ value, row }) => <EditorsList editors={value} loading={row?.original?.editorsLoading} />
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
      accessor: "createdByDisplay",
      minWidth: "160px",
      maxWidth: "1fr",
      cell: ({ value, row }) =>
        row?.original?.createdByLoading
          ? <Skeleton.Input active size="small" style={{ width: 140 }} />
          : <span>{value || '—'}</span>
    }
  ]

  const creatorOptions = useMemo(() => {
    const map = new Map()
    sessions.forEach(s => {
      if (!s.createdBy) return
      if (!map.has(s.createdBy)) {
  const display = formatUserDisplay(s.createdByName || userNameCache[s.createdBy] || s.createdBy)
        map.set(s.createdBy, display)
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [sessions, userNameCache])

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (creatorFilter !== 'all' && s.createdBy !== creatorFilter) return false
      if (dateRange && Array.isArray(dateRange) && dateRange[0] && dateRange[1]) {
        if (!s.createdAt?.seconds) return false
        const ts = s.createdAt.seconds * 1000
        const start = dateRange[0].startOf('day').valueOf()
        const end = dateRange[1].endOf('day').valueOf()
        if (ts < start || ts > end) return false
      }
      return true
    })
  }, [sessions, statusFilter, creatorFilter, dateRange])

  const clearFilters = () => {
    setStatusFilter('all')
    setCreatorFilter('all')
    setDateRange(null)
  }

  const tableData = filteredSessions.map(session => {
    // Nombre preferido: user embebido (realName > name) > createdByName persistido > cache > uid
    const embedded = pickEmbeddedUserName(session.user, session.createdBy)
    const createdByDisplay = formatUserDisplay(embedded || session.createdByName || userNameCache[session.createdBy] || session.createdBy || '')
    const createdByLoading = !!resolvingUIDs[session.createdBy]
    const editorsLoading = !!loadingEditorsBySession[session.id]
    return {
      ...session,
      key: session.id,
      editorsList: sessionEditors[session.id] || [],
      createdByDisplay,
      createdByLoading,
      editorsLoading
    }
  })

  return (
    <Container>
      <MenuApp sectionName={'Inventarios'} />
      <Component>
        <Header>
          <FiltersBar>
            <RangePickerWrapper>
              <RangeDatePicker
                mode='range'
                value={dateRange}
                onChange={setDateRange}
                placeholder='Rango de fechas'
                allowClear
              />
            </RangePickerWrapper>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'open', label: 'Abiertos' },
                { value: 'closed', label: 'Cerrados' }
              ]}
              placeholder='Estado'
            />
            <Select
              value={creatorFilter}
              onChange={setCreatorFilter}
              style={{ minWidth: 180 }}
              options={[{ value: 'all', label: 'Todos los usuarios' }, ...creatorOptions]}
              placeholder='Creado por'
              showSearch
              optionFilterProp='label'
            />
            <Button onClick={clearFilters} disabled={statusFilter==='all' && creatorFilter==='all' && !dateRange}>Limpiar</Button>
          </FiltersBar>
          <Space>
            <Button
              type={openSessionId ? 'default' : 'primary'}
              onClick={handleCreate}
              title={openSessionId ? 'Ya existe un inventario abierto. Haz clic para ir a él.' : 'Crear un nuevo inventario'}
            >
              {openSessionId ? 'Ver inventario abierto' : 'Crear inventario'}
            </Button>
          </Space>
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`
const FiltersBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`
const RangePickerWrapper = styled.div`
  min-width: 260px;
  max-width: 340px;
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
  background-color: ${({ status }) => (
    status === 'open' ? '#e7f5e7'
    : status === 'processing' ? '#fff7ed'
    : status === 'closed' ? '#f5f5f5'
    : '#e7f5e7'
  )};
  color: ${({ status }) => (
    status === 'open' ? '#2e7d32'
    : status === 'processing' ? '#d97706'
    : status === 'closed' ? '#666'
    : '#2e7d32'
  )};
`

// Badge de usuarios activos eliminado

// Lista de editores (máx 3 visibles + overflow)
const EditorsInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
`;

const EditorPill = styled.span`
  background: #f3f4f6;
  color: #111827;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  line-height: 1.2;
`;

const MorePill = styled(EditorPill)`
  background: #e5e7eb;
`;

const LoadingInline = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

function EditorsList({ editors, loading }) {
  if (loading) return <LoadingInline>Cargando…</LoadingInline>
  if (!editors || !editors.length) return <span style={{ color: '#6b7280' }}>—</span>
  const shown = editors.slice(0, 3)
  const extra = editors.length - shown.length
  return (
    <EditorsInline>
      {shown.map(e => <EditorPill key={e.uid}>{e.name}</EditorPill>)}
      {extra > 0 && <MorePill>+{extra}</MorePill>}
    </EditorsInline>
  )
}

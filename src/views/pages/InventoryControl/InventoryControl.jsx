import { message, Modal } from 'antd'
import { useMemo, useState, useCallback, useDeferredValue } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import { selectUser } from '../../../features/auth/userSlice'
import { db } from '../../../firebase/firebaseconfig'
import { MenuApp } from '../../templates/MenuApp/MenuApp'

import { Container, Component, TableContainer } from './components/InventoryControl.styles'
import InventoryFooterBar from './components/InventoryFooterBar'
import InventoryGroupedTable from './components/InventoryGroupedTable'
import InventoryHeaderBar from './components/InventoryHeaderBar'
import { useFinalizeInventory } from './hooks/useFinalizeInventory'
import { useInventoryCounts } from './hooks/useInventoryCounts'
import { useInventoryPresence } from './hooks/useInventoryPresence'
import { useInventorySession } from './hooks/useInventorySession'
import { useInventoryStocksProducts } from './hooks/useInventoryStocksProducts'
import { useLocationNames } from './hooks/useLocationNames'
import { useUserNamesCache } from './hooks/useUserNamesCache'
import { buildInventoryGroups } from './utils/buildInventoryGroups'
import { exportInventoryToExcel } from './utils/exportInventoryToExcel'

const consoleApi = typeof globalThis !== 'undefined' ? globalThis.console : undefined

const logError = (...args) => {
  if (consoleApi?.error) {
    consoleApi.error(...args)
  }
}

export const InventoryControl = () => {
  const user = useSelector(selectUser)
  const { sessionId } = useParams()
  const navigate = useNavigate()

  // Data hooks
  const { stocks, augmentedStocks, loading } = useInventoryStocksProducts({ db, businessID: user?.businessID })
  const { counts, setCounts, serverCounts, countsMeta, expirationEdits, setExpirationEdits, hasChanges, saving, saveCounts } = useInventoryCounts({ db, user, sessionId })
  const { session } = useInventorySession({ db, businessID: user?.businessID, sessionId })
  const { finalizing, finalize } = useFinalizeInventory({ db, user, sessionId, navigate })

  // UI state
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortDir, setSortDir] = useState('asc')

  // Defer search value to avoid recomputing on each keystroke
  const deferredSearch = useDeferredValue(search)

  // User names cache for table badges
  const { currentUserResolvedName, usersNameCache, resolvingUIDs } = useUserNamesCache({ db, user, countsMeta, session })

  // Presence indicator (active while session open)
  // Presence solo cuando la sesión está abierta (no en procesamiento ni cerrada)
  useInventoryPresence({ db, user, sessionId, currentUserResolvedName, enabled: !!sessionId && session?.status === 'open' })

  // Filtering
  const filtered = useMemo(() => {
    const s = deferredSearch.trim().toLowerCase()
    if (!s) return augmentedStocks
    return augmentedStocks.filter(it =>
      (it.productName || '').toLowerCase().includes(s) ||
      (it.batchNumberId || '').toString().toLowerCase().includes(s)
    )
  }, [augmentedStocks, deferredSearch])

  // Location names (resolved labels)
  const { locationNames, resolvingLocations } = useLocationNames({ businessID: user?.businessID, filteredItems: filtered })

  // Groups for table
  const groups = useMemo(() => buildInventoryGroups({
    items: filtered,
    counts,
    serverCounts,
    locationNames,
    stockFilter,
    sortDir,
    searchTerm: deferredSearch,
    session,
    expirationEdits,
    countsMeta,
  }), [filtered, counts, serverCounts, deferredSearch, locationNames, stockFilter, sortDir, session, expirationEdits, countsMeta])

  // Stable handlers to reduce child recalculations
  const handleChangeCount = useCallback((key, val) => {
    setCounts(prev => ({ ...prev, [key]: val }))
  }, [setCounts])

  const handleChangeExpiration = useCallback((key, val) => {
    setExpirationEdits(prev => ({ ...prev, [key]: val }))
  }, [setExpirationEdits])

  // Export helpers
  const handleExport = async (opts = {}) => {
    try {
      const filenameBase = session?.name ? `inventario_${session.name}` : 'inventario'
      await exportInventoryToExcel(
        groups,
        { filename: filenameBase, addSummarySheet: true, ...opts },
        countsMeta,
        counts,
        { id: session?.id || sessionId, name: session?.name }
      )
    } catch (e) {
      logError('[InventoryControl] Error exportando inventario:', e)
      message.error('No se pudo exportar el inventario')
    }
  }
  const exportMenuItems = [
    { key: 'full', label: 'Excel: Detalle completo' },
    { key: 'diffs', label: 'Excel: Solo diferencias' },
  ]
  const onExportMenuClick = async ({ key }) => {
    if (key === 'full') return handleExport({ onlyDifferences: false, includeBatchKey: false })
    if (key === 'diffs') return handleExport({ onlyDifferences: true, includeBatchKey: false })
  }

  const handleSaveCounts = async () => {
    try {
      const res = await saveCounts({ groups, stocks, currentUserResolvedName })
      if (!res || res.saved === 0) message.info('No hay cambios para guardar')
      else message.success('Conteos guardados exitosamente')
    } catch {
      message.error('Error al guardar conteos')
    }
  }

  const handleFinalize = () => {
    if (!sessionId || !user?.businessID) return
    if (session?.status === 'closed') return
    Modal.confirm({
      title: 'Finalizar inventario',
      content: '¿Deseas finalizar este inventario? Guardaremos cambios pendientes y luego se aplicarán ajustes de stock en el servidor. No podrás seguir editando.',
      okText: 'Finalizar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          // Si hay cambios, guardarlos antes de finalizar
          if (hasChanges) {
            await handleSaveCounts()
          }
          const summary = await finalize({ groups, counts, stocks, countsMeta })
          if (summary) message.success('Inventario finalizado')
        } catch (error) {
          logError('[InventoryControl] Error finalizando inventario:', error)
          message.error('No se pudo finalizar el inventario')
        }
      }
    })
  }

  return (
    <Container>
      <MenuApp sectionName={'Control de Inventario'} />
      <Component>
        <InventoryHeaderBar
          search={search}
          onSearchChange={setSearch}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          sortDir={sortDir}
          onToggleSort={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
          exportMenuItems={exportMenuItems}
          onExportMenuClick={onExportMenuClick}
        />

        <TableContainer>
          <InventoryGroupedTable
            groups={groups}
            counts={counts}
            rowSize={'large'}
            countsMeta={countsMeta}
            usersNameCache={usersNameCache}
            resolvingUIDs={resolvingUIDs}
            locationNamesMap={locationNames}
            resolvingLocations={resolvingLocations}
            loading={loading}
            readOnly={session?.status !== 'open'}
            onChangeCount={handleChangeCount}
            expirationEdits={expirationEdits}
            onChangeExpiration={handleChangeExpiration}
            onSave={handleSaveCounts}
            serverCounts={serverCounts}
            saving={saving}
          />
        </TableContainer>

        <InventoryFooterBar
          hasChanges={hasChanges}
          onSave={handleSaveCounts}
          saving={saving}
          onFinalize={handleFinalize}
          finalizing={finalizing}
          readOnly={session?.status !== 'open'}
        />
      </Component>
    </Container>
  )
}

export default InventoryControl

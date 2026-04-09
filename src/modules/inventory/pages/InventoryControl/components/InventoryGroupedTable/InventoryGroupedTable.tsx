import { Empty } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';

import { GroupedLotsModal } from '../GroupedLotsModal/GroupedLotsModal';
import { formatNumber } from '../inventoryTableUtils';

import { useBaselineSnapshot } from './hooks/useBaselineSnapshot';
import { useGroupedRowMeta } from './hooks/useGroupedRowMeta';

import type {
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryGroup,
  LocationNamesMap,
  ResolvingMap,
} from '@/utils/inventory/types';
import type { AdvancedTableColumn } from '@/components/ui/AdvancedTable/AdvancedTable';

type InventoryGroupRow = InventoryGroup & Record<string, unknown>;

const EMPTY_COUNTS_META: CountsMetaMap = {};
const EMPTY_STRING_RECORD: Record<string, string> = {};
const EMPTY_RESOLVING_MAP: ResolvingMap = {};
const EMPTY_LOCATION_NAMES_MAP: LocationNamesMap = {};
const EMPTY_EXPIRATION_EDITS: ExpirationEditsMap = {};
const EMPTY_COUNTS: CountsMap = {};

/**
 * InventoryGroupedTable
 * Props:
 * - groups: Array<{
 *     productId, productName, totalStock, totalReal, totalDiff,
 *     children: Array<{
 *       key, type: 'noexp' | 'batch', productId, productName,
 *       batchId?: string, batchNumberId?: number | string,
 *       expirationDate?: any, // Date | string | null
 *       stock: number,
 *       real: number,
 *       diff: number,
 *       locations: Array<{ location: string, locationKey?: string, locationLabel?: string, quantity: number }>
 *     }>
 *   }>
 * - counts: Record<string, number>
 * - onChangeCount: (key: string, value: number) => void
 * - loading: boolean
 */
interface InventoryGroupedTableProps {
  groups?: InventoryGroup[];
  counts: CountsMap;
  countsMeta?: CountsMetaMap;
  usersNameCache?: Record<string, string>;
  resolvingUIDs?: ResolvingMap;
  locationNamesMap?: LocationNamesMap;
  resolvingLocations?: ResolvingMap;
  onChangeCount: (key: string, value: number) => void;
  loading: boolean;
  readOnly?: boolean;
  expirationEdits?: ExpirationEditsMap;
  onChangeExpiration?: (key: string, value: string | null | undefined) => void;
  rowSize?: 'small' | 'medium' | 'large';
  onSave?: () => void;
  serverCounts?: CountsMap;
  saving?: boolean;
}

export default function InventoryGroupedTable({
  groups,
  counts,
  countsMeta = EMPTY_COUNTS_META,
  usersNameCache = EMPTY_STRING_RECORD,
  resolvingUIDs = EMPTY_RESOLVING_MAP,
  locationNamesMap = EMPTY_LOCATION_NAMES_MAP,
  resolvingLocations = EMPTY_RESOLVING_MAP,
  onChangeCount,
  loading,
  readOnly = false,
  expirationEdits = EMPTY_EXPIRATION_EDITS,
  onChangeExpiration,
  rowSize = 'medium',
  onSave,
  serverCounts = EMPTY_COUNTS,
  saving = false,
}: InventoryGroupedTableProps) {
  const [modalGroup, setModalGroup] = useState<InventoryGroup | null>(null); // grupo seleccionado para ver lotes
  // Eliminado noExpDetails y modal asociado; ya no se muestran detalles separados para "sin vencimiento".
  // Baseline para mantener indicador de cambios incluso tras guardar
  const baselineSnapshot = useBaselineSnapshot({
    groups,
    serverCounts,
    countsMeta,
  });

  const getRowMeta = useGroupedRowMeta({
    baselineSnapshot,
    groups,
    counts,
    countsMeta,
    expirationEdits,
    locationNamesMap,
    onChangeCount,
    onChangeExpiration,
    readOnly,
    resolvingLocations,
    resolvingUIDs,
    serverCounts,
    usersNameCache,
    setModalGroup,
  });

  // Columnas (incluye indicador de cambios en Producto)
  const columns = useMemo(
    () => [
      {
        Header: 'Producto',
        accessor: 'productName',
        sortable: true,
        align: 'left',
        minWidth: '220px',
        maxWidth: '1.3fr',
        cell: ({ row }: { row?: InventoryGroupRow }) =>
          row ? getRowMeta(row).productNameNode : null,
        sortableValue: (val) => String(val || '').toLowerCase(),
      },
      {
        Header: 'Vencimiento',
        accessor: 'expirationSortValue',
        sortable: true,
        align: 'left',
        minWidth: '140px',
        maxWidth: '1fr',
        cell: ({ row }: { row?: InventoryGroupRow }) =>
          row ? getRowMeta(row).expirationNode : null,
        sortableValue: (val) => val || '',
      },
      {
        Header: 'Ubicaciones',
        accessor: 'locationsNode',
        align: 'left',
        minWidth: '220px',
        maxWidth: '1.4fr',
        cell: ({ row }: { row?: InventoryGroupRow }) =>
          row ? getRowMeta(row).locationsNode : null,
      },
      {
        Header: 'Stock',
        accessor: 'totalStock',
        align: 'right',
        minWidth: '110px',
        maxWidth: '0.6fr',
        cell: ({ value }) => {
          const safe =
            typeof value === 'number' || typeof value === 'string' ? value : 0;
          return <strong>{formatNumber(safe)}</strong>;
        },
      },
      {
        Header: 'Conteo real',
        accessor: 'conteoNode',
        align: 'right',
        minWidth: '130px',
        maxWidth: '0.7fr',
        clickable: false,
        cell: ({ row }: { row?: InventoryGroupRow }) =>
          row ? getRowMeta(row).conteoNode : null,
      },
      {
        Header: 'Diferencia',
        accessor: 'diffNode',
        align: 'right',
        minWidth: '130px',
        maxWidth: '0.7fr',
        cell: ({ row }: { row?: InventoryGroupRow }) =>
          row ? getRowMeta(row).diffNode : null,
      },
      {
        Header: 'Editado por',
        accessor: 'userNode',
        align: 'left',
        minWidth: '180px',
        maxWidth: '1.2fr',
        clickable: false,
        cell: ({ row }: { row?: InventoryGroupRow }) =>
          row ? getRowMeta(row).userNode : null,
      },
      {
        Header: 'Acción',
        accessor: 'actionsNode',
        align: 'right',
        minWidth: '70px',
        maxWidth: '0.5fr',
        clickable: false,
        cell: ({ row }: { row?: InventoryGroupRow }) =>
          row ? getRowMeta(row).actionsNode : null,
      },
    ],
    [getRowMeta],
  ) as AdvancedTableColumn<InventoryGroupRow>[];

  const handleRowClick = useCallback(
    (row: InventoryGroup) => {
      if (!row || !Array.isArray(row._children)) return;
      let lotes = 0;
      for (const ch of row._children) {
        lotes += Array.isArray(ch.sources) && ch.sources.length > 0 ? ch.sources.length : 1;
        if (lotes > 1) break;
      }
      if (lotes > 1) setModalGroup(row);
    },
    [setModalGroup],
  );

  const rows = (groups || []) as InventoryGroupRow[];
  if (!loading && (!groups || groups.length === 0)) {
    return <Empty description="Sin registros" />;
  }

  return (
    <Wrapper>
      <AdvancedTable<InventoryGroupRow>
        data={rows}
        columns={columns}
        loading={loading}
        enableVirtualization
        paginateVirtualizedData
        showPagination
        numberOfElementsPerPage={50}
        tableName="inventory-grouped"
        rowSize={rowSize}
        rowBorder
        getRowId={(row) =>
          String(row.productKey ?? row.productId ?? row.key ?? '')
        }
        onRowClick={handleRowClick}
      />

      {/* Resumen removido según solicitud */}

      <GroupedLotsModal
        open={!!modalGroup}
        group={modalGroup}
        counts={counts}
        countsMeta={countsMeta}
        usersNameCache={usersNameCache}
        locationNamesMap={locationNamesMap}
        resolvingLocations={resolvingLocations}
        expirationEdits={expirationEdits}
        onChangeExpiration={onChangeExpiration}
        onChangeCount={onChangeCount}
        onClose={() => setModalGroup(null)}
        onSave={onSave}
        serverCounts={serverCounts}
        saving={saving}
        readOnly={readOnly}
        baselineSnapshot={baselineSnapshot}
      />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { useListenAllMovementsByDateRange } from '@/firebase/warehouse/productMovementService';
import { MovementReason } from '@/models/Warehouse/Movement';
import { getDateRange } from '@/utils/date/getDateRange';
import {
  AdvancedTable,
  type AdvancedTableProps,
} from '@/views/templates/system/AdvancedTable/AdvancedTable';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';
import MovementsFilterBar from './MovementsFilterBar';

// Reuse styles from MovementsTable for consistent look
type Movement = ReturnType<typeof useListenAllMovementsByDateRange>['data'][number];

type MovementRow = Movement & {
  key: string;
  date: string;
  time: string;
  product: string;
  location: Movement;
};

type MovementRange = {
  startDate?: number | null;
  endDate?: number | null;
};

type MovementFilterType = 'in' | 'out' | null;

const LocationCell = styled.div<{
  isEntry: boolean;
  isExternal?: boolean;
}>`
  display: flex;
  flex-direction: column;
  padding: 2px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ isEntry }) =>
    isEntry ? 'rgba(76, 175, 80, 0.08)' : 'rgba(239, 83, 80, 0.08)'};
  border-radius: 8px;
  border: 1px solid
    ${({ isEntry }) =>
      isEntry ? 'rgba(76, 175, 80, 0.25)' : 'rgba(239, 83, 80, 0.25)'};
  opacity: ${({ isExternal }) => (isExternal ? 0.85 : 1)};
  ${({ isExternal }) =>
    isExternal &&
    `
    background: #f5f5f5;
    border: 1px dashed #bdbdbd;
    &:hover { transform: none; box-shadow: none; }
  `}

  &:hover {
    background: ${({ isEntry }) =>
      isEntry ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)'};
    box-shadow: 0 2px 8px
      ${({ isEntry }) =>
        isEntry ? 'rgba(76, 175, 80, 0.2)' : 'rgba(239, 83, 80, 0.2)'};
    transform: translateY(-1px);
  }
`;

const LocationName = styled.div<{ isEntry: boolean }>`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1em;
  font-weight: 600;
  color: ${({ isEntry }) => (isEntry ? '#2E7D32' : '#C62828')};
  letter-spacing: -0.3px;
  white-space: nowrap;
`;

const DirectionWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const DirectionArrow = styled.span<{ isEntry: boolean }>`
  font-size: 1.1em;
  font-weight: bold;
  color: ${({ isEntry }) => (isEntry ? '#2E7D32' : '#C62828')};
`;

const DirectionLabel = styled.span<{ isEntry: boolean }>`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 0.85em;
  font-weight: 500;
  color: ${({ isEntry }) => (isEntry ? '#2E7D32' : '#C62828')};
  opacity: 0.9;
`;

const ReasonBadge = styled.span<{ reasonType?: MovementReason | string }>`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  white-space: nowrap;
  ${({ reasonType }) => {
    switch (reasonType) {
      case MovementReason.Purchase:
        return `background: rgba(25, 118, 210, 0.1); color: #1976D2; border: 1px solid rgba(25, 118, 210, 0.2);`;
      case MovementReason.Sale:
        return `background: rgba(76, 175, 80, 0.1); color: #388E3C; border: 1px solid rgba(76, 175, 80, 0.2);`;
      case MovementReason.Adjustment:
        return `background: rgba(255, 152, 0, 0.1); color: #F57C00; border: 1px solid rgba(255, 152, 0, 0.2);`;
      case MovementReason.Return:
        return `background: rgba(156, 39, 176, 0.1); color: #7B1FA2; border: 1px solid rgba(156, 39, 176, 0.2);`;
      case MovementReason.InitialStock:
        return `background: rgba(0, 150, 136, 0.1); color: #00796B; border: 1px solid rgba(0, 150, 136, 0.2);`;
      case MovementReason.Transfer:
        return `background: rgba(121, 134, 203, 0.1); color: #5C6BC0; border: 1px solid rgba(121, 134, 203, 0.2);`;
      case MovementReason.Damaged:
        return `background: rgba(244, 67, 54, 0.1); color: #D32F2F; border: 1px solid rgba(244, 67, 54, 0.2);`;
      case MovementReason.Expired:
        return `background: rgba(121, 85, 72, 0.1); color: #5D4037; border: 1px solid rgba(121, 85, 72, 0.2);`;
      case MovementReason.Lost:
        return `background: rgba(96, 125, 139, 0.1); color: #455A64; border: 1px solid rgba(96, 125, 139, 0.2);`;
      default:
        return `background: rgba(158, 158, 158, 0.1); color: #757575; border: 1px solid rgba(158, 158, 158, 0.2);`;
    }
  }}
`;

const formatMovementReason = (reason?: string | null) => {
  const map: Record<string, string> = {
    purchase: 'Compra',
    sale: 'Venta',
    adjustment: 'Ajuste',
    return: 'Devolución',
    initial_stock: 'Stock Inicial',
    transfer: 'Transferencia',
    damaged: 'Dañado',
    expired: 'Expirado',
    lost: 'Perdido',
    other: 'Otro',
  };
  if (!reason) return 'Desconocido';
  return map[reason] || 'Desconocido';
};

const generateRoute = (isEntry: boolean, movement: Movement): string | null => {
  const loc = isEntry ? movement.sourceLocation : movement.destinationLocation;
  if (!loc) return null;
  const segments = loc.split('/');
  let route = '/inventory/warehouses/warehouse';
  if (segments[0]) route += `/${segments[0]}`;
  if (segments[1]) route += `/shelf/${segments[1]}`;
  if (segments[2]) route += `/row/${segments[2]}`;
  if (segments[3]) route += `/segment/${segments[3]}`;
  return route;
};

const getLocationDisplay = (movement: Movement): string => {
  const specialCases = ['damaged', 'expired', 'lost', 'other'];
  const reason = String(movement.movementReason || '');
  if (specialCases.includes(reason)) return 'Baja de Inventario';
  if (reason === 'adjustment') {
    const internalLocationName = [
      movement.sourceLocation === 'adjustment'
        ? null
        : movement.sourceLocationName,
      movement.destinationLocation === 'adjustment'
        ? null
        : movement.destinationLocationName,
    ].find((n) => n && !/Ubicación no encontrada|N\/A|Error/i.test(n));
    return internalLocationName || 'Ajuste de Inventario';
  }
  const isEntry = movement.movementType === 'in';
  const locationName = isEntry
    ? movement.sourceLocationName
    : movement.destinationLocationName;
  const location = isEntry
    ? movement.sourceLocation
    : movement.destinationLocation;
  if (
    !location ||
    !locationName ||
    /Ubicación no encontrada|N\/A|Error/i.test(locationName)
  ) {
    switch (reason) {
      case 'purchase':
        return 'Proveedor Externo';
      case 'sale':
        return 'Cliente';
      case 'return':
        return movement.movementType === 'in'
          ? 'Devolución Cliente'
          : 'Devolución Proveedor';
      case 'initial_stock':
        return 'Inventario Inicial';
      case 'adjustment':
        return 'Ajuste de Inventario';
      default:
        return movement.movementType === 'in'
          ? 'Origen Externo'
          : 'Destino Externo';
    }
  }
  return locationName || 'Ubicación no encontrada';
};

const MovementTypeBadge = styled.span<{ isEntry: boolean }>`
  padding: 6px 12px;
  font-size: 0.9em;
  font-weight: 500;
  color: ${({ isEntry }) => (isEntry ? '#1976D2' : '#7B1FA2')};
  letter-spacing: -0.2px;
  background: ${({ isEntry }) =>
    isEntry ? 'rgba(33, 150, 243, 0.1)' : 'rgba(156, 39, 176, 0.1)'};
  border-radius: 8px;
`;

const AllMovements = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [dates, setDates] = useState<MovementRange>(() =>
    getDateRange('thisWeek'),
  );
  const [typeFilter, setTypeFilter] = useState<MovementFilterType>(null); // 'in' | 'out' | null (Todas)

  const { data, loading } = useListenAllMovementsByDateRange(user, dates);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null); // path like 'warehouseId/shelfId'

  const filteredData = useMemo<Movement[]>(() => {
    let arr = data ?? [];
    if (selectedLocation) {
      const prefix = `${selectedLocation}`;
      arr = arr.filter((mv) => {
        const src = mv.sourceLocation || '';
        const dst = mv.destinationLocation || '';
        return src.startsWith(prefix) || dst.startsWith(prefix);
      });
    }
    if (typeFilter) {
      arr = arr.filter((mv) => mv.movementType === typeFilter);
    }
    return arr;
  }, [data, selectedLocation, typeFilter]);

  const rows = useMemo<MovementRow[]>(() => {
    return (filteredData || []).map((mv) => {
      const dateObj = mv.createdAt?.toDate?.();
      const productName =
        typeof mv.productName === 'string' ? mv.productName : '';
      return {
        ...mv,
        key: mv.id,
        date: dateObj ? dateObj.toLocaleDateString() : 'Sin fecha',
        time: dateObj
          ? dateObj.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Sin hora',
        product: productName,
        location: mv,
      };
    });
  }, [filteredData]);

  const columns = useMemo<AdvancedTableProps<MovementRow>['columns']>(
    () => [
      { Header: 'Fecha', accessor: 'date', minWidth: '120px', keepWidth: true },
      { Header: 'Hora', accessor: 'time', minWidth: '90px', keepWidth: true },
      { Header: 'Producto', accessor: 'product', minWidth: '220px' },
      {
        Header: 'Tipo',
        accessor: 'movementType',
        minWidth: '110px',
        keepWidth: true,
        cell: ({ value }) => {
          const isEntry = value === 'in';
          return (
            <MovementTypeBadge isEntry={isEntry}>
              {isEntry ? 'Entrada' : 'Salida'}
            </MovementTypeBadge>
          );
        },
      },
      {
        Header: 'Ubicación',
        accessor: 'location',
        minWidth: '230px',
        cell: ({ value }) => {
          const movement = value as Movement | undefined;
          if (!movement) return null;
          const isEntry = movement.movementType === 'in';
          const route = generateRoute(isEntry, movement);
          const locationDisplay = getLocationDisplay(movement);
          const isExternal = !route;
          return (
            <LocationCell
              isEntry={isEntry}
              isExternal={isExternal}
              onClick={() => (route ? navigate(route) : null)}
              style={{ cursor: route ? 'pointer' : 'default' }}
            >
              <LocationName isEntry={isEntry}>{locationDisplay}</LocationName>
              <DirectionWrapper>
                <DirectionLabel isEntry={isEntry}>
                  <DirectionArrow isEntry={isEntry}>
                    {isEntry ? '←' : '→'}
                  </DirectionArrow>
                  {isEntry ? 'Origen' : 'Destino'}
                </DirectionLabel>
              </DirectionWrapper>
            </LocationCell>
          );
        },
      },
      {
        Header: 'Motivo',
        accessor: 'movementReason',
        minWidth: '140px',
        cell: ({ value }) => (
          <ReasonBadge reasonType={value as MovementReason | string}>
            {formatMovementReason(String(value))}
          </ReasonBadge>
        ),
      },
      {
        Header: 'Cantidad',
        accessor: 'quantity',
        align: 'right',
        minWidth: '100px',
        type: 'badge',
      },
    ],
    [navigate],
  );

  return (
    <Page>
      <MenuApp sectionName={'Movimientos'} />
      <MovementsFilterBar
        value={selectedLocation}
        onChange={setSelectedLocation}
        loading={loading}
        dates={dates}
        setDates={setDates}
        defaultDate={getDateRange('thisWeek')}
        type={typeFilter}
        onTypeChange={setTypeFilter}
      />
      <AdvancedTable
        columns={columns}
        data={rows}
        loading={loading}
        groupBy="date"
        elementName="movimientos"
        emptyText="No hay movimientos en este rango"
        numberOfElementsPerPage={30}
      />
    </Page>
  );
};

export default AllMovements;

const Page = styled.div`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  height: 100%;
`;

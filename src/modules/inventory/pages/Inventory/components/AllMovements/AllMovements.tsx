import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { useListenAllMovementsByDateRange } from '@/firebase/warehouse/productMovementService';
import { getDateRange } from '@/utils/date/getDateRange';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import {
  AdvancedTable,
  type AdvancedTableProps,
} from '@/components/ui/AdvancedTable';
import { MenuApp } from '@/modules/navigation/public';
import MovementsFilterBar from './MovementsFilterBar';
import type { InventoryUser, TimestampLike } from '@/utils/inventory/types';
import {
  formatInventoryMovementReason,
  getInventoryMovementLocationDisplay,
  getMovementReasonBadgeStyles,
  type MovementReasonType,
} from '../shared/movementDisplay';

// Reuse styles from MovementsTable for consistent look

type Movement = ReturnType<
  typeof useListenAllMovementsByDateRange
>['data'][number];

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
  background: ${({ isEntry }: { isEntry: boolean }) =>
    isEntry ? 'rgba(76, 175, 80, 0.08)' : 'rgba(239, 83, 80, 0.08)'};
  border-radius: 8px;
  border: 1px solid
    ${({ isEntry }: { isEntry: boolean }) =>
      isEntry ? 'rgba(76, 175, 80, 0.25)' : 'rgba(239, 83, 80, 0.25)'};
  opacity: ${({ isExternal }: { isExternal?: boolean }) =>
    isExternal ? 0.85 : 1};
  ${({ isExternal }: { isExternal?: boolean }) =>
    isExternal &&
    `
    background: #f5f5f5;
    border: 1px dashed #bdbdbd;
    &:hover { transform: none; box-shadow: none; }
  `}

  &:hover {
    background: ${({ isEntry }: { isEntry: boolean }) =>
      isEntry ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)'};
    box-shadow: 0 2px 8px
      ${({ isEntry }: { isEntry: boolean }) =>
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
  color: ${({ isEntry }: { isEntry: boolean }) =>
    isEntry ? '#2E7D32' : '#C62828'};
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
  color: ${({ isEntry }: { isEntry: boolean }) =>
    isEntry ? '#2E7D32' : '#C62828'};
`;

const DirectionLabel = styled.span<{ isEntry: boolean }>`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 0.85em;
  font-weight: 500;
  color: ${({ isEntry }: { isEntry: boolean }) =>
    isEntry ? '#2E7D32' : '#C62828'};
  opacity: 0.9;
`;

const ReasonBadge = styled.span<{ reasonType?: MovementReasonType }>`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  white-space: nowrap;
  ${({ reasonType }: { reasonType?: MovementReasonType }) =>
    getMovementReasonBadgeStyles(reasonType)}
`;

const MovementTypeBadge = styled.span<{ isEntry: boolean }>`
  padding: 6px 12px;
  font-size: 0.9em;
  font-weight: 500;
  color: ${({ isEntry }: { isEntry: boolean }) =>
    isEntry ? '#1976D2' : '#7B1FA2'};
  letter-spacing: -0.2px;
  background: ${({ isEntry }: { isEntry: boolean }) =>
    isEntry ? 'rgba(33, 150, 243, 0.1)' : 'rgba(156, 39, 176, 0.1)'};
  border-radius: 8px;
`;

const toDate = (value?: TimestampLike): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  return null;
};

const generateRoute = (isEntry: boolean, movement: Movement): string | null => {
  const location = isEntry
    ? movement.sourceLocation
    : movement.destinationLocation;
  if (!location) return null;

  const segments = String(location).split('/');
  let route = '/inventory/warehouses/warehouse';
  if (segments[0]) route += `/${segments[0]}`;
  if (segments[1]) route += `/shelf/${segments[1]}`;
  if (segments[2]) route += `/row/${segments[2]}`;
  if (segments[3]) route += `/segment/${segments[3]}`;

  return route;
};

const AllMovements = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const navigate = useNavigate();
  const [dates, setDates] = useState<MovementRange>(() =>
    getDateRange('thisWeek'),
  );
  const [typeFilter, setTypeFilter] = useState<MovementFilterType>(null);

  const { data, loading } = useListenAllMovementsByDateRange(user, dates);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

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
      const dateObj = toDate(mv.createdAt as TimestampLike | undefined);
      const productName =
        typeof mv.productName === 'string' ? mv.productName : '';
      return {
        ...mv,
        key: mv.id,
        date: dateObj ? formatLocaleDate(dateObj) : 'Sin fecha',
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
        cell: ({ value }: { value: unknown }) => {
          const isEntry = (value as string) === 'in';
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
        cell: ({ value }: { value: unknown }) => {
          const movement = value as Movement | undefined;
          if (!movement) return null;
          const isEntry = movement.movementType === 'in';
          const route = generateRoute(isEntry, movement);
          const locationDisplay = getInventoryMovementLocationDisplay(movement);
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
        cell: ({ value }: { value: unknown }) => (
          <ReasonBadge reasonType={value as MovementReasonType}>
            {formatInventoryMovementReason(String(value))}
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
    <>
      <MenuApp sectionName={'Movimientos'} />
      <Page>
        <MovementsFilterBar
          value={selectedLocation}
          onChange={setSelectedLocation}
          loading={loading}
          dates={dates}
          setDates={setDates}
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
    </>
  );
};

export default AllMovements;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

import { Button } from 'antd';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { useListenMovementsByLocation } from '@/firebase/warehouse/productMovementService';
import { MovementReason } from '@/models/Warehouse/Movement';
import ROUTES_NAME from '@/router/routes/routesName';
import {
  AdvancedTable,
  type AdvancedTableColumn,
} from '@/views/templates/system/AdvancedTable/AdvancedTable';

const StyledCard = styled.div`
  margin-top: 16px;
  display: grid;
  min-height: 300px;
`;

const LocationCell = styled.div<{ $isEntry: boolean; $isExternal: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 2px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $isEntry }) =>
    $isEntry
      ? 'rgba(76, 175, 80, 0.08)'
      : 'rgba(239, 83, 80, 0.08)'};
  border-radius: 8px;
  border: 1px solid
    ${({ $isEntry }) =>
      $isEntry ? 'rgba(76, 175, 80, 0.25)' : 'rgba(239, 83, 80, 0.25)'};
  opacity: ${({ $isExternal }) => ($isExternal ? 0.85 : 1)};
  ${({ $isExternal }) =>
    $isExternal &&
    `
    background: #f5f5f5;
    border: 1px dashed #bdbdbd;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  `}

  &:hover {
    transform: translateY(-1px);
    background: ${({ $isEntry }) =>
      $isEntry ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)'};
    box-shadow: 0 2px 8px
      ${({ $isEntry }) =>
        $isEntry ? 'rgba(76, 175, 80, 0.2)' : 'rgba(239, 83, 80, 0.2)'};
  }
`;

const LocationName = styled.div<{ $isEntry: boolean }>`
  font-weight: 600;
  color: ${({ $isEntry }) => ($isEntry ? '#2E7D32' : '#C62828')};
  font-size: 1em;
  white-space: nowrap;
  letter-spacing: -0.3px;
`;

const DirectionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DirectionArrow = styled.span<{ $isEntry: boolean }>`
  font-size: 1.1em;
  color: ${({ $isEntry }) => ($isEntry ? '#2E7D32' : '#C62828')};
  font-weight: bold;
`;

const DirectionLabel = styled.span<{ $isEntry: boolean }>`
  color: ${({ $isEntry }) => ($isEntry ? '#2E7D32' : '#C62828')};
  font-size: 0.85em;
  font-weight: 500;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MovementTypeBadge = styled.span<{ $isEntry: boolean }>`
  background: ${({ $isEntry }) =>
    $isEntry ? 'rgba(33, 150, 243, 0.1)' : 'rgba(156, 39, 176, 0.1)'};
  color: ${({ $isEntry }) => ($isEntry ? '#1976D2' : '#7B1FA2')};
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9em;
  letter-spacing: -0.2px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $isEntry }) =>
      $isEntry ? 'rgba(33, 150, 243, 0.15)' : 'rgba(156, 39, 176, 0.15)'};
  }
`;

type MovementReasonType = MovementReason | string | null | undefined;

const ReasonBadge = styled.span<{ $reasonType: MovementReasonType }>`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  white-space: nowrap;

  ${({ $reasonType }) => {
    switch ($reasonType) {
      case MovementReason.Purchase:
        return `
          background: rgba(25, 118, 210, 0.1);
          color: #1976D2;
          border: 1px solid rgba(25, 118, 210, 0.2);
        `;
      case MovementReason.Sale:
        return `
          background: rgba(76, 175, 80, 0.1);
          color: #388E3C;
          border: 1px solid rgba(76, 175, 80, 0.2);
        `;
      case 'adjustment':
        return `
          background: rgba(255, 152, 0, 0.1);
          color: #F57C00;
          border: 1px solid rgba(255, 152, 0, 0.2);
        `;
      case 'return':
        return `
          background: rgba(156, 39, 176, 0.1);
          color: #7B1FA2;
          border: 1px solid rgba(156, 39, 176, 0.2);
        `;
      case 'initial_stock':
        return `
          background: rgba(0, 150, 136, 0.1);
          color: #00796B;
          border: 1px solid rgba(0, 150, 136, 0.2);
        `;
      case 'transfer':
        return `
          background: rgba(121, 134, 203, 0.1);
          color: #5C6BC0;
          border: 1px solid rgba(121, 134, 203, 0.2);
        `;
      case 'damaged':
        return `
          background: rgba(244, 67, 54, 0.1);
          color: #D32F2F;
          border: 1px solid rgba(244, 67, 54, 0.2);
        `;
      case 'expired':
        return `
          background: rgba(121, 85, 72, 0.1);
          color: #5D4037;
          border: 1px solid rgba(121, 85, 72, 0.2);
        `;
      case 'lost':
        return `
          background: rgba(96, 125, 139, 0.1);
          color: #455A64;
          border: 1px solid rgba(96, 125, 139, 0.2);
        `;
      default:
        return `
          background: rgba(158, 158, 158, 0.1);
          color: #757575;
          border: 1px solid rgba(158, 158, 158, 0.2);
        `;
    }
  }}
`;

type MovementRecord = ReturnType<
  typeof useListenMovementsByLocation
>['data'][number];

type MovementRow = MovementRecord & {
  key: string;
  date: string;
  time: string;
  product: string;
  location: MovementRecord;
  quantity: number;
};

const getExternalLocationText = (movement: MovementRecord) => {
  const specialCases = ['damaged', 'expired', 'lost', 'other'];
  if (specialCases.includes(String(movement.movementReason ?? ''))) {
    return 'Baja de Inventario';
  }

  switch (movement.movementReason) {
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
      return movement.movementType === 'in' ? 'Origen Externo' : 'Destino Externo';
  }
};

const getLocationDisplay = (movement: MovementRecord) => {
  const specialCases = ['damaged', 'expired', 'lost', 'other'];
  if (specialCases.includes(String(movement.movementReason ?? ''))) {
    return 'Baja de Inventario';
  }

  if (movement.movementReason === 'adjustment') {
    const internalLocationName = [
      movement.sourceLocation === 'adjustment'
        ? null
        : movement.sourceLocationName,
      movement.destinationLocation === 'adjustment'
        ? null
        : movement.destinationLocationName,
    ].find((name) => name && !/Ubicación no encontrada|N\/A|Error/i.test(name));
    if (internalLocationName) return internalLocationName;
    return 'Ajuste de Inventario';
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
    /Ubicación no encontrada|N\/A|Error/i.test(String(locationName))
  ) {
    return getExternalLocationText(movement);
  }
  return locationName;
};

const formatMovementReason = (reason: string | null | undefined) => {
  const reasonMap: Record<string, string> = {
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
  return reason ? reasonMap[reason] || 'Desconocido' : 'Desconocido';
};

const generateRoute = (isEntry: boolean, movement: MovementRecord) => {
  const loc = isEntry ? movement.sourceLocation : movement.destinationLocation;
  if (!loc) return null;
  const segments = String(loc).split('/');
  let route = '/inventory/warehouses/warehouse';

  if (segments[0]) {
    route += `/${segments[0]}`;
  }
  if (segments[1]) {
    route += `/shelf/${segments[1]}`;
  }
  if (segments[2]) {
    route += `/row/${segments[2]}`;
  }
  if (segments[3]) {
    route += `/segment/${segments[3]}`;
  }

  return route;
};

type MovementsTableProps = {
  location?: string | null;
};

export const MovementsTable = ({ location }: MovementsTableProps) => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const { data: movementsData, loading } = useListenMovementsByLocation(
    user,
    location || null,
    location || null,
  );
  const { INVENTORY_MOVEMENTS } = ROUTES_NAME.INVENTORY_TERM;

  const transformedData = useMemo<MovementRow[]>(
    () =>
      movementsData.map((mov) => {
        const dateObj = (() => {
        const createdAt = mov.createdAt;
        if (createdAt instanceof Date) return createdAt;
        if (createdAt && typeof (createdAt as { toDate?: () => Date }).toDate === 'function') {
          return (createdAt as { toDate: () => Date }).toDate();
        }
        if (createdAt && typeof (createdAt as { seconds?: number }).seconds === 'number') {
          return new Date((createdAt as { seconds: number }).seconds * 1000);
        }
        return null;
      })();
        return {
          ...mov,
          key: String(mov.id ?? ''),
          date: dateObj ? dateObj.toLocaleDateString() : 'Sin fecha',
          time: dateObj
            ? dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Sin hora',
          product: mov.productName ? String(mov.productName) : 'Sin producto',
          location: mov,
          destinationLocationName: mov.destinationLocationName,
          sourceLocationName: mov.sourceLocationName,
          quantity: Number(mov.quantity ?? 0),
        };
      }),
    [movementsData],
  );

  const columns = useMemo<AdvancedTableColumn<MovementRow>[]>(
    () => [
      {
        Header: 'Hora',
        accessor: 'time',
        minWidth: '100px',
        keepWidth: true,
      },
      {
        Header: 'Producto',
        accessor: 'product',
        minWidth: '200px',
      },
      {
        Header: 'Tipo',
        accessor: 'movementType',
        minWidth: '120px',
        cell: ({ value }) => {
          const isEntry = value === 'in';
          return (
            <MovementTypeBadge $isEntry={isEntry}>
              {isEntry ? 'Entrada' : 'Salida'}
            </MovementTypeBadge>
          );
        },
      },
      {
        Header: 'Ubicación',
        accessor: 'location',
        minWidth: '200px',
        cell: ({ value }) => {
          const movement = value as MovementRecord;
          const isEntry = movement.movementType === 'in';
          const route = generateRoute(isEntry, movement);
          const locationDisplay = getLocationDisplay(movement);
          const isExternal = !route;

          return (
            <LocationCell
              $isEntry={isEntry}
              $isExternal={isExternal}
              onClick={() => (route ? navigate(route) : null)}
              style={{ cursor: route ? 'pointer' : 'default' }}
            >
              <LocationName $isEntry={isEntry}>{locationDisplay}</LocationName>
              <DirectionWrapper>
                <DirectionLabel $isEntry={isEntry}>
                  <DirectionArrow $isEntry={isEntry}>
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
        minWidth: '150px',
        cell: ({ value }) => (
          <ReasonBadge $reasonType={value as MovementReasonType}>
            {formatMovementReason(value as string | undefined)}
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

  const headerComponent = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        width: '100%',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '1rem' }}>
        Historial de Movimientos
      </div>
      <Button type="link" onClick={() => navigate(INVENTORY_MOVEMENTS)}>
        Ver todos los movimientos
      </Button>
    </div>
  );

  return (
    <StyledCard title="Últimos Movimientos">
      <AdvancedTable
        headerComponent={headerComponent}
        columns={columns}
        data={transformedData}
        loading={loading}
        groupBy="date"
        elementName="movimientos"
        numberOfElementsPerPage={8}
        emptyText="No hay movimientos para mostrar"
      />
    </StyledCard>
  );
};


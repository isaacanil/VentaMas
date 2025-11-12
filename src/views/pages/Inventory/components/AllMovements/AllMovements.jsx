import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import { useListenAllMovementsByDateRange } from '../../../../../firebase/warehouse/productMovementService';
import { MovementReason } from '../../../../../models/Warehouse/Movement';
import { getDateRange } from '../../../../../utils/date/getDateRange';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';
import { AdvancedTable } from '../../../../templates/system/AdvancedTable/AdvancedTable';

import MovementsFilterBar from './MovementsFilterBar';

// Reuse styles from MovementsTable for consistent look
const LocationCell = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ isEntry }) =>
    isEntry
      ? 'rgba(76, 175, 80, 0.08)'
      : 'rgba(239, 83, 80, 0.08)'};
  border-radius: 8px;
  border: 1px solid ${({ isEntry }) =>
    isEntry
      ? 'rgba(76, 175, 80, 0.25)'
      : 'rgba(239, 83, 80, 0.25)'};
  opacity: ${({ isExternal }) => isExternal ? 0.85 : 1};
  ${({ isExternal }) => isExternal && `
    background: #f5f5f5;
    border: 1px dashed #bdbdbd;
    &:hover { transform: none; box-shadow: none; }
  `}
  &:hover {
    transform: translateY(-1px);
    background: ${({ isEntry }) =>
      isEntry ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)'};
    box-shadow: 0 2px 8px ${({ isEntry }) =>
      isEntry ? 'rgba(76, 175, 80, 0.2)' : 'rgba(239, 83, 80, 0.2)'};
  }
`;
const LocationName = styled.div`
  font-weight: 600;
  color: ${({ isEntry }) => (isEntry ? '#2E7D32' : '#C62828')};
  font-size: 1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  letter-spacing: -0.3px;
`;
const DirectionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;
const DirectionArrow = styled.span`
  font-size: 1.1em;
  color: ${({ isEntry }) => (isEntry ? '#2E7D32' : '#C62828')};
  font-weight: bold;
`;
const DirectionLabel = styled.span`
  color: ${({ isEntry }) => (isEntry ? '#2E7D32' : '#C62828')};
  font-size: 0.85em;
  font-weight: 500;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
`;
const ReasonBadge = styled.span`
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
        return `background: rgba(255, 152, 0, 0.1); color: #F57C00; border: 1px solid rgba(255, 152, 0.2);`;
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

const formatMovementReason = (reason) => {
  const map = {
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
  return map[reason] || 'Desconocido';
};

const generateRoute = (isEntry, movement) => {
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

const getLocationDisplay = (movement) => {
  const specialCases = ['damaged', 'expired', 'lost', 'other'];
  if (specialCases.includes(movement.movementReason)) return 'Baja de Inventario';
  if (movement.movementReason === 'adjustment') {
    const internalLocationName = [
      movement.sourceLocation === 'adjustment' ? null : movement.sourceLocationName,
      movement.destinationLocation === 'adjustment' ? null : movement.destinationLocationName,
    ].find((n) => n && !/Ubicación no encontrada|N\/A|Error/i.test(n));
    return internalLocationName || 'Ajuste de Inventario';
  }
  const isEntry = movement.movementType === 'in';
  const locationName = isEntry ? movement.sourceLocationName : movement.destinationLocationName;
  const location = isEntry ? movement.sourceLocation : movement.destinationLocation;
  if (!location || !locationName || /Ubicación no encontrada|N\/A|Error/i.test(locationName)) {
    switch (movement.movementReason) {
      case 'purchase': return 'Proveedor Externo';
      case 'sale': return 'Cliente';
      case 'return': return movement.movementType === 'in' ? 'Devolución Cliente' : 'Devolución Proveedor';
      case 'initial_stock': return 'Inventario Inicial';
      case 'adjustment': return 'Ajuste de Inventario';
      default: return movement.movementType === 'in' ? 'Origen Externo' : 'Destino Externo';
    }
  }
  return locationName;
};

const MovementTypeBadge = styled.span`
  background: ${({ isEntry }) => (isEntry ? 'rgba(33, 150, 243, 0.1)' : 'rgba(156, 39, 176, 0.1)')};
  color: ${({ isEntry }) => (isEntry ? '#1976D2' : '#7B1FA2')};
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9em;
  letter-spacing: -0.2px;
`;

const AllMovements = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [dates, setDates] = useState(() => getDateRange('thisWeek'));
  const [typeFilter, setTypeFilter] = useState(null); // 'in' | 'out' | null (Todas)

  const { data, loading } = useListenAllMovementsByDateRange(user, dates);

  const [selectedLocation, setSelectedLocation] = useState(null); // path like 'warehouseId/shelfId'

  const filteredData = useMemo(() => {
    let arr = data || [];
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

  const rows = useMemo(() => {
    return (filteredData || []).map((mv) => {
      const dateObj = mv.createdAt?.toDate?.();
      return {
        ...mv,
        key: mv.id,
        date: dateObj ? dateObj.toLocaleDateString() : 'Sin fecha',
        time: dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sin hora',
        product: mv.productName,
        location: mv,
      };
    });
  }, [filteredData]);

  const columns = useMemo(() => ([
    { Header: 'Fecha', accessor: 'date', minWidth: '120px', keepWidth: true },
    { Header: 'Hora', accessor: 'time', minWidth: '90px', keepWidth: true },
    { Header: 'Producto', accessor: 'product', minWidth: '220px' },
    {
      Header: 'Tipo', accessor: 'movementType', minWidth: '110px', keepWidth: true,
      cell: ({ value }) => {
        const isEntry = value === 'in';
        return <MovementTypeBadge isEntry={isEntry}>{isEntry ? 'Entrada' : 'Salida'}</MovementTypeBadge>;
      }
    },
    {
      Header: 'Ubicación', accessor: 'location', minWidth: '230px',
      cell: ({ value }) => {
        const isEntry = value.movementType === 'in';
        const route = generateRoute(isEntry, value);
        const locationDisplay = getLocationDisplay(value);
        const isExternal = !route;
        return (
          <LocationCell
            isEntry={isEntry}
            isExternal={isExternal}
            onClick={() => route ? navigate(route) : null}
            style={{ cursor: route ? 'pointer' : 'default' }}
          >
            <LocationName isEntry={isEntry}>{locationDisplay}</LocationName>
            <DirectionWrapper>
              <DirectionLabel isEntry={isEntry}>
                <DirectionArrow isEntry={isEntry}>{isEntry ? '←' : '→'}</DirectionArrow>
                {isEntry ? 'Origen' : 'Destino'}
              </DirectionLabel>
            </DirectionWrapper>
          </LocationCell>
        );
      }
    },
    {
      Header: 'Motivo', accessor: 'movementReason', minWidth: '140px',
      cell: ({ value }) => <ReasonBadge reasonType={value}>{formatMovementReason(value)}</ReasonBadge>
    },
    { Header: 'Cantidad', accessor: 'quantity', align: 'right', minWidth: '100px', type: 'badge' },
  ]), [navigate]);

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
  height: 100%;
  display: grid;
  grid-template-rows: min-content min-content 1fr;
`;

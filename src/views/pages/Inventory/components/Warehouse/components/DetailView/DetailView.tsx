// @ts-nocheck
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectWarehouse } from '@/features/warehouse/warehouseSlice';
import type {
  DateRangeValue,
  WarehouseNode,
} from './components/InventoryTable/types';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { InventoryTable } from './components/InventoryTable/InventoryTable';
import { MovementsTable } from './components/MovementsTable';

const DetailContent = styled.div`
  margin-top: 10px;
  font-size: 1em;
  color: #333;
`;

type WarehouseState = ReturnType<typeof selectWarehouse> & {
  selectedProduct?: { id?: string | null } | null;
};

type LocationNode = {
  id?: string | null;
} & Record<string, unknown>;

export const DetailView = () => {
  const {
    selectedWarehouse,
    selectedShelf,
    selectedRowShelf,
    selectedSegment,
    selectedProduct,
    breadcrumbs,
  } = useSelector(selectWarehouse) as WarehouseState;
  const [searchTerm, setSearchTerm] = useState('');
  const [, setDateRange] = useState<DateRangeValue>(null);

  const selectedNode: LocationNode | null =
    (selectedProduct as unknown as LocationNode) ||
    (selectedSegment as unknown as LocationNode) ||
    (selectedRowShelf as unknown as LocationNode) ||
    (selectedShelf as unknown as LocationNode) ||
    (selectedWarehouse as unknown as LocationNode) ||
    null;

  const currentNode: WarehouseNode | null =
    selectedNode && selectedNode.id
      ? ({ ...selectedNode, id: String(selectedNode.id) } as WarehouseNode)
      : null;

  const location = [
    selectedWarehouse?.id,
    selectedShelf?.id,
    selectedRowShelf?.id,
    selectedSegment?.id,
    selectedProduct?.id,
  ]
    .filter(Boolean)
    .join('/');

  return (
    <div
      style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '1em',
      }}
    >
      <BreadcrumbNav breadcrumbs={breadcrumbs} />

      {!currentNode ? (
        <DetailContent>
          Selecciona un elemento para ver los productos
        </DetailContent>
      ) : (
        <>
          <InventoryTable
            currentNode={currentNode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setDateRange={setDateRange}
            location={location}
          />
          <MovementsTable location={location} />
        </>
      )}
    </div>
  );
};

export default DetailView;

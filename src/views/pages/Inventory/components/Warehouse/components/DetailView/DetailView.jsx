import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectWarehouse } from '@/features/warehouse/warehouseSlice';

import { BreadcrumbNav } from './components/BreadcrumbNav';
import { InventoryTable } from './components/InventoryTable/InventoryTable';
import { MovementsTable } from './components/MovementsTable';

const DetailContent = styled.div`
  margin-top: 10px;
  font-size: 1em;
  color: #333;
`;

export const DetailView = () => {
  const {
    selectedWarehouse,
    selectedShelf,
    selectedRowShelf,
    selectedSegment,
    selectedProduct,
    breadcrumbs,
  } = useSelector(selectWarehouse);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setDateRange] = useState(null);

  // Determinar el nodo actual basado en las selecciones
  const currentNode =
    selectedProduct ||
    selectedSegment ||
    selectedRowShelf ||
    selectedShelf ||
    selectedWarehouse ||
    null;

  // Construir la cadena de ubicación
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
            location={location} // Pasar la cadena de ubicación
          />
          <MovementsTable location={location} />{' '}
          {/* Asegurar que location se pasa correctamente */}
        </>
      )}
    </div>
  );
};

export default DetailView;

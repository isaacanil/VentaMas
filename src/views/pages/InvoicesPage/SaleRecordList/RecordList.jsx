import { faFileInvoice, faFilter, faPlus, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useMemo } from 'react';
import styled from 'styled-components';

import { filterData } from '../../../../hooks/search/useSearch';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';

import { InvoiceItem } from './InvoiceItem/InvoiceItem';
import { InvoiceItemWide } from './InvoiceItem/InvoiceItemWide';



export const SaleRecordList = ({ invoices, searchTerm }) => {
  const parentRef = useRef(null);
  
  // Detectar si la pantalla es >= 600px
  const isWideScreen = useMediaQuery('(min-width: 600px)');

  // Memoizar data filtrada para evitar cálculos innecesarios
  const data = useMemo(() => {
    return filterData(invoices, searchTerm).map(invoice => invoice.data);
  }, [invoices, searchTerm]);

  const count = data.length;

  // Memoizar componentes para evitar renders innecesarios
  const MemoInvoiceItem = React.useMemo(() => React.memo(InvoiceItem), []);
  const MemoInvoiceItemWide = React.useMemo(() => React.memo(InvoiceItemWide), []);

  // Configuración del virtualizador con tamaño ajustado según el diseño
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isWideScreen ? 130 : 115), // Ajuste fino basado en medición real
    overscan: 3, // Reducir overscan para mejorar rendimiento en listas grandes
  });

  const items = virtualizer.getVirtualItems();

  // Si no hay datos, mostrar mensaje vacío
  if (count === 0) {
    return (
      <EmptyContainer>
        <EmptyContent>
          <EmptyIcon>
            <FontAwesomeIcon icon={faFileInvoice} />
          </EmptyIcon>
          <EmptyTitle>No se encontraron facturas</EmptyTitle>
          <EmptyDescription>
            {searchTerm ? 
              `No hay facturas que coincidan con "${searchTerm}"` : 
              'No hay facturas para el período seleccionado'
            }
          </EmptyDescription>
          <SuggestionsList>
            <SuggestionItem>
              <SuggestionIcon>
                <FontAwesomeIcon icon={faFilter} />
              </SuggestionIcon>
              <SuggestionText>
                Usa los filtros para buscar en otras fechas
              </SuggestionText>
            </SuggestionItem>
            <SuggestionItem>
              <SuggestionIcon>
                <FontAwesomeIcon icon={faCalendarAlt} />
              </SuggestionIcon>
              <SuggestionText>
                Selecciona un rango de fechas más amplio
              </SuggestionText>
            </SuggestionItem>
            <SuggestionItem>
              <SuggestionIcon>
                <FontAwesomeIcon icon={faPlus} />
              </SuggestionIcon>
              <SuggestionText>
                Crea una nueva factura desde el punto de venta
              </SuggestionText>
            </SuggestionItem>
          </SuggestionsList>
        </EmptyContent>
      </EmptyContainer>
    );
  }

  return (
    <ListContainer
      ref={parentRef}
    >
      <VirtualContent style={{ height: virtualizer.getTotalSize() }}>
        <ItemsContainer
          style={{
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map(virtualItem => (
            <ItemWrapper
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
            >
              {isWideScreen ? (
                <MemoInvoiceItemWide data={data[virtualItem.index]} />
              ) : (
                <MemoInvoiceItem data={data[virtualItem.index]} />
              )}
            </ItemWrapper>
          ))}
        </ItemsContainer>
      </VirtualContent>
    </ListContainer>
  );
};

// Styled Components actualizados
const ListContainer = styled.div`
  overflow-y: auto;
  padding: 8px 12px 24px;
  height: 100%;
  
  /* Scrollbar personalizado para mejor UX */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }

  @media (min-width: 768px) {
    padding: 12px 16px 32px;
  }
`;

const VirtualContent = styled.div`
  width: 100%;
`;

const ItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 768px) {
    gap: 12px;
  }
`;

const ItemWrapper = styled.div`
  /* Contenedor para cada item virtualizado */
`;

const EmptyContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
`;

const EmptyContent = styled.div`
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  color: #d9d9d9;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 5rem;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #262626;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const EmptyDescription = styled.p`
  font-size: 0.875rem;
  color: #8c8c8c;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const SuggestionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: #e8e8e8;
  }

  @media (min-width: 768px) {
    padding: 1rem;
    gap: 1rem;
  }
`;

const SuggestionIcon = styled.div`
  font-size: 1rem;
  color: #1890ff;
  flex-shrink: 0;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const SuggestionText = styled.span`
  font-size: 0.875rem;
  color: #595959;
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

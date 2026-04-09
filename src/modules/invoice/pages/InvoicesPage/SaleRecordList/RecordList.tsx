import {
  faFileInvoice,
  faFilter,
  faPlus,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useMemo } from 'react';
import type { InvoiceData } from '@/types/invoice';
import type { InvoiceRecord } from '@/modules/invoice/pages/InvoicesPage/types';
import { Virtuoso } from 'react-virtuoso';
import styled from 'styled-components';

import { filterData } from '@/hooks/search/useSearch';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { InvoiceItem } from './InvoiceItem/InvoiceItem';
import { InvoiceItemWide } from './InvoiceItem/InvoiceItemWide';
type SaleRecordListProps = {
  invoices: InvoiceRecord[];
  searchTerm: string;
};

export const SaleRecordList = ({
  invoices,
  searchTerm,
}: SaleRecordListProps) => {
  // Detectar si la pantalla es >= 600px
  const isWideScreen = useMediaQuery('(min-width: 600px)');

  // Memoizar data filtrada para evitar cálculos innecesarios
  const data = useMemo(() => {
    return (filterData(invoices, searchTerm) as InvoiceRecord[]).map(
      (invoice) => invoice.data as InvoiceData,
    );
  }, [invoices, searchTerm]);

  const count = data.length;

  // Memoizar componentes para evitar renders innecesarios
  const MemoInvoiceItem = React.useMemo(() => React.memo(InvoiceItem), []);
  const MemoInvoiceItemWide = React.useMemo(
    () => React.memo(InvoiceItemWide),
    [],
  );

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
            {searchTerm
              ? `No hay facturas que coincidan con "${searchTerm}"`
              : 'No hay facturas para el período seleccionado'}
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
    <ListContainer>
      <Virtuoso
        data={data}
        style={{ height: '100%' }}
        itemContent={(_index, item) => (
          <ItemWrapper>
            {isWideScreen ? (
              <MemoInvoiceItemWide data={item} />
            ) : (
              <MemoInvoiceItem data={item} />
            )}
          </ItemWrapper>
        )}
      />
    </ListContainer>
  );
};

// Styled Components actualizados
const ListContainer = styled.div`
  height: 100%;
  padding: 8px 12px 24px;
  overflow-y: hidden; /* Virtuoso handles scroll */

  @media (width >= 768px) {
    padding: 12px 16px 32px;
  }
`;

const ItemWrapper = styled.div`
  /* Contenedor para cada item virtualizado con gap simulado via margin */
  margin-bottom: 8px;

  @media (width >= 768px) {
    margin-bottom: 12px;
  }
`;

const EmptyContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
`;

const EmptyContent = styled.div`
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  margin-bottom: 1rem;
  font-size: 4rem;
  color: #d9d9d9;

  @media (width >= 768px) {
    font-size: 5rem;
  }
`;

const EmptyTitle = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #262626;

  @media (width >= 768px) {
    font-size: 1.5rem;
  }
`;

const EmptyDescription = styled.p`
  margin: 0 0 1.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #8c8c8c;

  @media (width >= 768px) {
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
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: #e8e8e8;
  }

  @media (width >= 768px) {
    gap: 1rem;
    padding: 1rem;
  }
`;

const SuggestionIcon = styled.div`
  flex-shrink: 0;
  font-size: 1rem;
  color: #1890ff;

  @media (width >= 768px) {
    font-size: 1.125rem;
  }
`;

const SuggestionText = styled.span`
  font-size: 0.875rem;
  line-height: 1.4;
  color: #595959;

  @media (width >= 768px) {
    font-size: 0.9375rem;
  }
`;

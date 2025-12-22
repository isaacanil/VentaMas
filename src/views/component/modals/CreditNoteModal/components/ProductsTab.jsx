import { SearchOutlined } from '@ant-design/icons';
import { Alert, Checkbox, Input } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { ProductList } from './ProductList';

export const ProductsTab = ({
  currentInvoice,
  hasAvailableProducts,
  selectAll,
  effectiveIsView,
  onSelectAll,
  searchText,
  onSearchTextChange,
  isMobile,
  filteredProducts,
  columns,
  selectedInvoiceId,
  selectedItems,
  itemQuantities,
  existingItemQuantities,
  creditedQuantities,
  currentPage,
  pageSize,
  onPageChange,
  onItemChange,
  onQuantityChange,
  subtotal,
  totalItbis,
  totalAmount,
  formatPrice,
}) => {
  if (!currentInvoice) return null;

  const effectivePageSize = isMobile ? 3 : pageSize;

  return (
    <>
      {hasAvailableProducts && (
        <ProductsSection>
          <SectionHeader>
            <div>
              <SectionTitle>Productos a Acreditar</SectionTitle>
              <SelectAllContainer>
                <Checkbox
                  checked={selectAll}
                  disabled={effectiveIsView}
                  onChange={(e) => onSelectAll(e.target.checked)}
                >
                  Seleccionar todos los productos
                </Checkbox>
              </SelectAllContainer>
            </div>
            <SearchContainer>
              <Input
                placeholder="Buscar producto..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => onSearchTextChange(e.target.value)}
                style={{ width: isMobile ? '100%' : 200 }}
                disabled={effectiveIsView}
              />
            </SearchContainer>
          </SectionHeader>

          <ProductList
            key={selectedInvoiceId}
            products={filteredProducts}
            columns={columns}
            selectedItems={selectedItems}
            itemQuantities={itemQuantities}
            existingItemQuantities={existingItemQuantities}
            creditedQuantities={creditedQuantities}
            isMobile={isMobile}
            effectiveIsView={effectiveIsView}
            currentPage={currentPage}
            pageSize={effectivePageSize}
            onPageChange={onPageChange}
            onItemChange={onItemChange}
            onQuantityChange={onQuantityChange}
          />

          {selectedItems.length > 0 && (
            <TotalSection>
              <TotalInfo>
                <InfoRow>
                  <InfoLabel>Items Seleccionados:</InfoLabel>
                  <InfoValue>{selectedItems.length} productos</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Subtotal:</InfoLabel>
                  <InfoValue>{formatPrice(subtotal)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>ITBIS:</InfoLabel>
                  <InfoValue>{formatPrice(totalItbis)}</InfoValue>
                </InfoRow>
                <InfoRow className="total">
                  <InfoLabel>Total a Acreditar:</InfoLabel>
                  <InfoValue>{formatPrice(totalAmount)}</InfoValue>
                </InfoRow>
              </TotalInfo>
            </TotalSection>
          )}
        </ProductsSection>
      )}

      {!hasAvailableProducts && (
        <NoProductsMessage>
          <Alert
            type="info"
            showIcon
            message="Sin productos disponibles"
            description="Todos los productos de esta factura ya han sido acreditados en otras notas de crédito."
          />
        </NoProductsMessage>
      )}
    </>
  );
};

const ProductsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;

  @media (width <= 768px) {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme?.text?.primary || '#333'};

  @media (width <= 768px) {
    font-size: 0.9rem;
  }
`;

const SelectAllContainer = styled.div`
  margin-top: 0.5rem;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;

  @media (width <= 768px) {
    width: 100%;
  }
`;

const TotalSection = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  padding: 0.5rem 0;

  @media (width <= 768px) {
    justify-content: center;
  }
`;

const TotalInfo = styled.div`
  min-width: 300px;
  padding: 1rem;
  background-color: ${(props) =>
    props.theme?.background?.secondary || '#fafafa'};
  border: 1px solid ${(props) => props.theme?.border?.color || '#d9d9d9'};
  border-radius: 8px;

  @media (width <= 768px) {
    min-width: 100%;
    padding: 0.75rem;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;

  &.total {
    padding-top: 0.5rem;
    margin-top: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-top: 1px solid ${(props) => props.theme?.border?.color || '#d9d9d9'};
  }
`;

const InfoLabel = styled.span`
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const InfoValue = styled.span`
  font-family: monospace;
  font-weight: 500;
  color: ${(props) => props.theme?.text?.primary || '#333'};
`;

const NoProductsMessage = styled.div`
  margin-top: 1rem;
`;


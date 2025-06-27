import React from 'react';
import { Table, Pagination } from 'antd';
import { ProductCard } from './ProductCard';
import styled from 'styled-components';

export const ProductList = ({
  products,
  columns,
  selectedItems,
  itemQuantities,
  existingItemQuantities,
  creditedQuantities,
  isMobile,
  effectiveIsView,
  currentPage,
  pageSize,
  onPageChange,
  onItemChange,
  onQuantityChange
}) => {
  if (isMobile) {
    // Render as cards in mobile
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return (
      <MobileContainer>
        <CardsContainer>
          {paginatedProducts.map(product => {
            // Usar maxAvailableQty que ya incluye la lógica correcta para edición
            const maxQty = product.maxAvailableQty || 1;
            const originalQty = product.amountToBuy || 1;
            const quantity = itemQuantities[product.id] || existingItemQuantities[product.id] || 1;
            const isSelected = selectedItems.includes(product.id);
            const creditedByOthers = creditedQuantities[product.id] || 0;
            const existingQuantity = existingItemQuantities[product.id] || 0;

            return (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={isSelected}
                quantity={quantity}
                maxQuantity={maxQty}
                originalQuantity={originalQty}
                isView={effectiveIsView}
                onSelectionChange={onItemChange}
                onQuantityChange={(value) => onQuantityChange(product.id, value)}
                creditedByOthers={creditedByOthers}
                existingQuantity={existingQuantity}
              />
            );
          })}
        </CardsContainer>
        
        {products.length > pageSize && (
          <PaginationContainer>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={products.length}
              onChange={onPageChange}
              showSizeChanger={false}
              size="small"
            />
          </PaginationContainer>
        )}
      </MobileContainer>
    );
  }

  // Render as table in desktop
  return (
    <Table
      dataSource={products}
      columns={columns}
      rowKey="id"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: products.length,
        onChange: onPageChange,
        showSizeChanger: false,
      }}
      size="small"
    />
  );
};

const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
`; 
import { Table, Pagination } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { ProductCard } from './ProductCard';
import type { ColumnsType } from 'antd/es/table';
import type { InvoiceProduct, InvoiceProductAmount } from '@/types/invoice';

type CreditNoteProduct = InvoiceProduct & { maxAvailableQty?: number };

const resolveQuantity = (amount: InvoiceProduct['amountToBuy']): number => {
  if (typeof amount === 'number' && Number.isFinite(amount)) return amount;
  if (typeof amount === 'object' && amount !== null) {
    const amountObj = amount as InvoiceProductAmount;
    if (typeof amountObj.unit === 'number' && Number.isFinite(amountObj.unit)) {
      return amountObj.unit;
    }
    if (typeof amountObj.total === 'number' && Number.isFinite(amountObj.total)) {
      return amountObj.total;
    }
  }
  return 1;
};

interface ProductListProps {
  products: CreditNoteProduct[];
  columns: ColumnsType<CreditNoteProduct>;
  selectedItems: Array<string | undefined>;
  itemQuantities: Record<string, number>;
  existingItemQuantities: Record<string, number>;
  creditedQuantities: Record<string, number>;
  isMobile: boolean;
  effectiveIsView: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onItemChange: (itemId: string | undefined, checked: boolean) => void;
  onQuantityChange: (itemId: string | undefined, value: number | null) => void;
}

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
  onQuantityChange,
}: ProductListProps) => {
  if (isMobile) {
    // Render as cards in mobile
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return (
      <MobileContainer>
        <CardsContainer>
          {paginatedProducts.map((product, index) => {
            // Usar maxAvailableQty que ya incluye la lógica correcta para edición
            const maxQty = product.maxAvailableQty || 1;
            const originalQty = resolveQuantity(product.amountToBuy);
            const quantity =
              itemQuantities[String(product.id)] ||
              existingItemQuantities[String(product.id)] ||
              1;
            const isSelected = selectedItems.includes(product.id);
            const creditedByOthers = creditedQuantities[String(product.id)] || 0;
            const existingQuantity =
              existingItemQuantities[String(product.id)] || 0;

            return (
              <ProductCard
                key={product.id ?? index}
                product={product}
                isSelected={isSelected}
                quantity={quantity}
                maxQuantity={maxQty}
                originalQuantity={originalQty}
                isView={effectiveIsView}
                onSelectionChange={onItemChange}
                onQuantityChange={(value) =>
                  onQuantityChange(product.id, value)
                }
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

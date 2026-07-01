import { Table, Pagination } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { ProductCard } from './ProductCard';
import { getCreditNoteLineKey } from '../hooks/useCreditNoteSelection.helpers';
import { resolveCreditNoteLineQuantity } from '../utils/quantity';
import type { TableColumnsType as ColumnsType } from 'antd';
import type { InvoiceProduct } from '@/types/invoice';

type CreditNoteProduct = InvoiceProduct & { maxAvailableQty?: number };

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
            const productKey = getCreditNoteLineKey(product);
            // Usar maxAvailableQty que ya incluye la lógica correcta para edición
            const maxQty = product.maxAvailableQty || 1;
            const originalQty = resolveCreditNoteLineQuantity(product);
            const quantity =
              itemQuantities[String(productKey)] ||
              existingItemQuantities[String(productKey)] ||
              1;
            const isSelected = selectedItems.includes(productKey);
            const creditedByOthers =
              creditedQuantities[String(productKey)] || 0;
            const existingQuantity =
              existingItemQuantities[String(productKey)] || 0;

            return (
              <ProductCard
                key={productKey ?? index}
                product={product}
                isSelected={isSelected}
                quantity={quantity}
                maxQuantity={maxQty}
                originalQuantity={originalQty}
                isView={effectiveIsView}
                onSelectionChange={(_, selected) =>
                  onItemChange(productKey, selected)
                }
                onQuantityChange={(value) =>
                  onQuantityChange(productKey, value)
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
    <Table<CreditNoteProduct>
      dataSource={products}
      columns={columns}
      rowKey={(record) => getCreditNoteLineKey(record) ?? ''}
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

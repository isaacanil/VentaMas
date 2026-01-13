import { memo, useMemo } from 'react';
import styled from 'styled-components';

import { CustomProduct } from '@/components/ui/Product/CustomProduct';
import { Product } from '@/components/ui/Product/Product/Product';
import type { ProductRecord } from '@/types/products';

type VirtualRow = {
  index: number;
  start: number;
  [key: string]: unknown;
};

type ItemRowProps = {
  columns: number;
  top: number;
  height: number;
  products: ProductRecord[];
  virtualRow: VirtualRow;
  totalRows: number;
};

type RowLayoutProps = {
  top: number;
  columns: number;
  height: number;
};

const StyledItemRow = styled.div<RowLayoutProps>`
  position: absolute;
  top: ${({ top }) => `${top}px`};
  left: 0;
  display: grid;
  grid-template-columns: ${({ columns }) => `repeat(${columns}, 1fr)`};
  gap: 0.4em;
  width: 100%;
  height: ${({ height }) => `${height}px`};
`;

const EmptyRow = styled.div<RowLayoutProps>`
  position: absolute;
  top: ${({ top }) => `${top}px`};
  left: 0;
  display: grid;
  grid-template-columns: ${({ columns }) => `repeat(${columns}, 1fr)`};
  gap: 0.4em;
  width: 100%;
  height: ${({ height }) => `${height}px`};
  pointer-events: none;
`;

const ItemRow = memo(
  ({ columns, top, height, products, virtualRow, totalRows }: ItemRowProps) => {
    const columnArray = useMemo(
      () => Array.from({ length: columns }),
      [columns],
    );
    if (virtualRow.index >= totalRows) {
      return (
        <EmptyRow columns={columns} top={virtualRow.start} height={height} />
      );
    }
    return (
      <StyledItemRow columns={columns} top={top} height={height}>
        {columnArray.map((_, columnIndex) => {
          const itemIndex = virtualRow.index * columns + columnIndex;
          const product = products[itemIndex];
          if (product) {
            if (product.custom) {
              return (
                <CustomProduct
                  key={String(product.id ?? itemIndex)}
                  product={product}
                />
              );
            }
            return (
              <Product key={String(product.id ?? itemIndex)} product={product} />
            );
          }
          return null;
        })}
      </StyledItemRow>
    );
  },
);

ItemRow.displayName = 'ItemRow';

export default ItemRow;

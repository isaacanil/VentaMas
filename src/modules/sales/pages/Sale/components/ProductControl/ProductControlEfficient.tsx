import styled from 'styled-components';

import { ProductCategoryBar } from '@/modules/products/components/ProductCategoryBar/ProductCategoryBar';
import type { ProductRecord } from '@/types/products';

import { ProductList } from './components/ProductList';

type StatusMeta = {
  productCount?: number;
  visibleStockTotal?: number;
  filterActive?: boolean;
};

type ProductControlEfficientProps = {
  products: ProductRecord[];
  productsLoading: boolean;
  statusMeta?: StatusMeta;
  isLocked?: boolean;
  onLockedClick?: () => void;
};

export function ProductControlEfficient({
  products,
  productsLoading,
  statusMeta = {},
  isLocked,
  onLockedClick,
}: ProductControlEfficientProps) {
  return (
    <Container>
      <ProductCategoryBar />
      <ProductListWrapper>
        <ProductList
          products={products}
          productsLoading={productsLoading}
          statusMeta={statusMeta}
        />
        {isLocked && <BlockerOverlay onClick={onLockedClick} />}
      </ProductListWrapper>
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  background-color: ${(props) => props.theme.bg.color2};
`;

const ProductListWrapper = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
`;

const BlockerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 50;
  background-color: transparent; 
  cursor: not-allowed;
`;

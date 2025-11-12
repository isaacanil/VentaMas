import styled from 'styled-components';

import { ProductCategoryBar } from '../../../../component/ProductCategoryBar/ProductCategoryBar';

import { ProductList } from './components/ProductList';

export function ProductControlEfficient({
  products,
  productsLoading,
  statusMeta = {},
}) {
  return (
    <Container>
      <ProductCategoryBar />
      <ProductListWrapper>
        <ProductList
          products={products}
          productsLoading={productsLoading}
          statusMeta={statusMeta}
        />
      </ProductListWrapper>
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
  background-color: ${(props) => props.theme.bg.color2};
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
`;

const ProductListWrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

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
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  background-color: ${(props) => props.theme.bg.color2};
`;

const ProductListWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
`;

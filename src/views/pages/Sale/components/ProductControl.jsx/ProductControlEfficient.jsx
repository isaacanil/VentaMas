import styled from 'styled-components';

import { ProductCategoryBar } from '../../../../component/ProductCategoryBar/ProductCategoryBar';
import { StatusBar } from '../StatusBar/StatusBar';

import { ProductList } from './components/ProductList';

export function ProductControlEfficient({ products, productsLoading }) {
  return (
    <Container>
      <ProductCategoryBar />
      <ProductList products={products} productsLoading={productsLoading} />
      <StatusBar products={products} />
    </Container>
  );
}

const Container = styled.div`
  height: 100%;
  background-color: ${props => props.theme.bg.color2}; 
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
`

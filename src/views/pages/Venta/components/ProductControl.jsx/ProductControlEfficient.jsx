import styled from 'styled-components';
import { StatusBar } from '../StatusBar/StatusBar';
import { ProductCategoryBar } from '../../../../component/ProductCategoryBar/ProductCategoryBar';
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
  
  border-radius: var(--border-radius-light);
  display: flex;
  flex-direction: column;
  min-height: 0;

  border-top-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
  position: relative;
`

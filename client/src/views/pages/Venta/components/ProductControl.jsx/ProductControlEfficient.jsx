import styled from 'styled-components';
import { ShoppingItemsCounter } from '../ShoppingItemsCounter/ShoppingItemsCounter';
import { ProductCategoryBar } from '../../../../component/ProductCategoryBar/ProductCategoryBar';
import { ProductList } from './components/ProductList';

export function ProductControlEfficient({ products, productsLoading }) {
  return (
    <Container>
      <ProductCategoryBar />
      <ProductList products={products} productsLoading={productsLoading} />
      <ShoppingItemsCounter products={products} />
    </Container>
  );
}

const Container = styled.div`
  height: 100%;
  background-color: ${props => props.theme.bg.color2}; 
  overflow: hidden;
  border-radius: var(--border-radius-light);
  display: grid;
  grid-template-rows: min-content 1fr;
  border-top-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
  
  position: relative;
`

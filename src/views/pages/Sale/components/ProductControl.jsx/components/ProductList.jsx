import { Spin } from 'antd';
import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtuosoGrid } from 'react-virtuoso';
import styled from 'styled-components';

import ROUTES_NAME from '../../../../../../routes/routesName';
import { CenteredText } from '../../../../../templates/system/CentredText';
import { CustomProduct } from '../../../../../templates/system/Product/CustomProduct';
import { Product } from '../../../../../templates/system/Product/Product/Product';
import { StatusBar } from '../../StatusBar/StatusBar';

const GridList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  
  /* 1. GAP PEQUEÑO: Mantenemos el espacio reducido entre items */
  gap: 0.1em; 
  
  /* 2. SOLUCIÓN AL BORDE SUPERIOR: */
  /* Usamos border-top transparente de 30px. Esto actúa como un espaciador sólido
     que el navegador no puede ignorar ni colapsar. */
  border-top: 4px solid transparent; 
  border-bottom: 55px solid transparent;
  
  /* Padding lateral normal */
  padding: 0 0.3em;
  
  align-content: start;
  box-sizing: border-box;
`;

const GridItem = styled.div`
  display: flex;
  min-height: 82px;
  /* Padding de seguridad de 2px para que el borde de selección no se salga de la caja */
  padding: 2px; 
`;

const ListComponent = forwardRef((props, ref) => <GridList ref={ref} {...props} />);
ListComponent.displayName = 'ProductListGrid';

const ItemComponent = forwardRef((props, ref) => <GridItem ref={ref} {...props} />);
ItemComponent.displayName = 'ProductListItem';

const virtuosoComponents = {
  List: ListComponent,
  Item: ItemComponent,
};

export const ProductList = ({ products, productsLoading, statusMeta = {} }) => {
  const navigate = useNavigate();

  const handlerProducts = () => {
    const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM;
    navigate(INVENTORY_ITEMS);
  };

  const renderProduct = (_, product) => {
    if (!product) return null;
    if (product.custom) {
      return <CustomProduct product={product} />;
    }
    return <Product product={product} />;
  };

  return (
    <ProductsListContainer>
      {productsLoading ? (
        <Loader>
          <Spin spinning size="large" />
        </Loader>
      ) : products.length === 0 ? (
        <Fallback>
          <CenteredText
            text="No hay Productos"
            buttonText="Gestionar Productos"
            handleAction={handlerProducts}
          />
        </Fallback>
      ) : (
        <GridVirtuoso
          data={products}
          computeItemKey={(index, product) => product?.id || index}
          itemContent={renderProduct}
          components={virtuosoComponents}
          overscan={200}
        />
      )}
      <FloatingStatusBar products={products} statusMeta={statusMeta} />
    </ProductsListContainer>
  );
};

const ProductsListContainer = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  background-color: var(--colo2);
  border: 1px solid #ccc;
  border-right: none;
  border-left: none;
`;

const GridVirtuoso = styled(VirtuosoGrid)`
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: auto;
`;

const FloatingStatusBar = styled(StatusBar)`
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  z-index: 10;
  margin: 0;
`;

const Loader = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const Fallback = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 1em;
`;

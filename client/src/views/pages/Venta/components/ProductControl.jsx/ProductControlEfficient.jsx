import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';
import { Product } from '../../../../templates/system/Product/Product/Product';
import { Carrusel } from '../../../../component/Carrusel/Carrusel';
import styled from 'styled-components';
import { ShoppingItemsCounter } from '../ShoppingItemsCounter/ShoppingItemsCounter';
import { CustomProduct } from '../../../../templates/system/Product/CustomProduct';
import { CategorySelector } from '../../../../component/CategorySelector/CategorySelector';
import { ProductCategoryBar } from '../../../../component/ProductCategoryBar/ProductCategoryBar';

const getColumns = (width) => {
  if (width < 600) {
    return 1;
  }
  if (width < 900) {
    return 2;
  }
  if (width < 1200) {
    return 3;
  }
  if (width < 1500) {
    return 4;
  }
  if (width < 1800) {
    return 5;
  }
  return 3;
};

export function ProductControlEfficient({ products }) {
  const productLength = products.length;
  return (
    <Container>
      {/* <Carrusel /> */}
      <ProductCategoryBar  />
      <ProductList products={products} />
      <ShoppingItemsCounter itemLength={productLength} />
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

const ProductList = ({ products }) => {
  const parentRef = useRef();
  const [listContainerHeight, setListContainer] = useState();
  const [columns, setColumns] = useState(4);
  useEffect(() => {
    // Función para actualizar el número de columnas basado en el ancho actual
    const updateColumns = () => {
      if (parentRef.current) {
        setColumns(getColumns(parentRef.current.clientWidth));
        setListContainer(parentRef.current.clientWidth);
      }
    };

    // Actualiza las columnas al montar
    updateColumns();

    // Añade un listener para el evento resize para ajustar las columnas al cambiar el tamaño
    window.addEventListener('resize', updateColumns);

    // Limpieza del efecto
    return () => window.removeEventListener('resize', updateColumns);
  }, []); // Dependencias vacías para ejecutar solo una vez al montar

  // Configuración de la grilla
  // Configuraciones de la grilla
  const itemCount = products.length; // Total de elementos en la grilla
  const cellHeight = 90; // Altura de cada celda de la grilla

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(itemCount / columns), // Número total de "filas" virtuales
    getScrollElement: () => parentRef.current,
    estimateSize: () => cellHeight, // Altura estimada de cada "fila"
  });
  return (
    <ProductsListContainer
      ref={parentRef}
      listContainer={listContainerHeight}

    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {
          rowVirtualizer.getVirtualItems()
            .map(virtualRow => (
              <div
                key={virtualRow.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`, // Crea una grilla con N columnas
                  gap: '10px', // Espacio entre los elementos de la grilla
                  position: 'absolute',
                  top: `${virtualRow.start}px`,
                  left: 0,
                  width: '100%',
                  height: `${cellHeight}px`, // Asegúrate de que esto coincida con estimateSize
                }}
              >
                {Array.from({ length: columns }).map((_, columnIndex) => {
                  const itemIndex = virtualRow.index * columns + columnIndex;
                  const product = products[itemIndex];
                  if (product) {
                    if (product?.custom) {
                      return (
                        < CustomProduct key={product?.id} product={product} />
                      )
                    }
                    return (
                      <Product
                        key={product?.id}
                        product={product}
                      />
                    );
                  }
                  return null; // Renderiza un espacio en blanco o un marcador de posición si no hay producto
                })}
              </div>
            ))
        }
      </div>
    </ProductsListContainer>
  )
}

const ProductsListContainer = styled.div`
  gap: 10px;
  height: ${props => props.listContainer > 800 ? `calc(100vh - 5.3em)` : `calc(100vh - 8.41em)`};
  padding: 10px;
  overflow: auto;
  width: 100%;
  background-color: var(--color2);
`
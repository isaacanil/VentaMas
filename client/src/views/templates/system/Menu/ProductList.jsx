import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import styled from 'styled-components';

// Datos de productos agrupados por categoría
const products = Array.from({ length: 1400 }, (_, index) => {
  const categoryNumber = Math.floor(index / 20) + 1;
  const startRange = (categoryNumber - 1) * 20 + 1;
  const endRange = categoryNumber * 20;
  return {
    id: index,
    name: `Product ${index + 1}`,
    category: `Category ${startRange}-${endRange}`,
    price: (Math.random() * 100).toFixed(2),
    image: 'https://via.placeholder.com/150',
  };
});

// Agrupar productos por categoría
const groupedProducts = products.reduce((acc, product) => {
  if (!acc[product.category]) {
    acc[product.category] = [];
  }
  acc[product.category].push(product);
  return acc;
}, {});

// Crear un array de elementos con categorías y sus productos
const items = Object.entries(groupedProducts).map(([category, products]) => ({
  type: 'category',
  category,
  products,
}));

// Componentes estilizados
const GridContainer = styled.div`
  height: 100vh;
  width: 100%;
  overflow: auto;
`;

const GridInner = styled.div`
  position: relative;
  width: 100%;
`;

const CategorySection = styled.div`
  padding: 16px 0;
  width: 100%;
  display: flex;
  background-color: green;
  flex-direction: column;
  margin-bottom: 24px;
`;

const CategoryHeader = styled.div`
  font-size: 1.5em;
  font-weight: bold;
  padding: 16px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const ProductCard = styled.div`
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  img {
    width: 100%;
    height: 150px;
    object-fit: cover;
  }
`;

export function GridVirtualizerFixed() {
  const parentRef = useRef();

  // Virtualizador de filas con estimateSize
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 500, // Valor estimado inicial (ajusta según sea necesario)
    overscan: 5,
  });

  return (
    <GridContainer ref={parentRef}>
      <GridInner style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          const y = virtualRow.start;

          // Referencia para medir el elemento
          const rowRef = (el) => {
            if (el) {
              rowVirtualizer.measureElement(el);
            }
          };

          return (
            <CategorySection
              key={item.category}
              ref={rowRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${y}px)`,
              }}
            >
              <CategoryHeader>{item.category}</CategoryHeader>
              <ProductGrid>
                {item.products.map((product) => (
                  <ProductCard key={product.id}>
                    <img src={product.image} alt={product.name} loading="lazy" />
                    <div>
                      <h4>{product.name}</h4>
                      <p>Price: ${product.price}</p>
                    </div>
                  </ProductCard>
                ))}
              </ProductGrid>
            </CategorySection>
          );
        })}
      </GridInner>
    </GridContainer>
  );
}

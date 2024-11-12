import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';
import { Product } from '../../../../templates/system/Product/Product/Product';
import { Carrusel } from '../../../../component/Carrusel/Carrusel';
import styled from 'styled-components';
import { ShoppingItemsCounter } from '../ShoppingItemsCounter/ShoppingItemsCounter';
import { CustomProduct } from '../../../../templates/system/Product/CustomProduct';
import { CategorySelector } from '../../../../component/CategorySelector/CategorySelector';
import { ProductCategoryBar } from '../../../../component/ProductCategoryBar/ProductCategoryBar';

const columnByWidth =  {
  600: 1,
  900: 2,
  1100: 3,
  1500: 4,
  1800: 5,
  2100: 6,
  2400: 7,
  2700: 8,
}



const getColumns = (width) => {
  const columns = Object.keys(columnByWidth).find((w) => w > width);
  return columnByWidth[columns];
};

export function ProductControlEfficient({ products }) {
  const productLength = products.length;
  return (
    <Container>
      {/* <Carrusel /> */}
      <ProductCategoryBar />
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

  // Configuraciones de la grilla
  const itemCount = products.length; // Total de elementos en la grilla
  const cellHeight = 88; // Altura de cada celda de la grilla

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
              <ItemRow
                key={virtualRow.key}
                columns={columns}
                top={virtualRow.start}
                height={cellHeight}
                products={products}
                virtualRow={virtualRow}
              />
            ))
        }
      </div>
    </ProductsListContainer>
  )
}

const ProductsListContainer = styled.div`
  height:  calc(100vh - 8.41em);
  @media ( width > 800px){
    height: calc(100vh - 5.3em);
  }

  padding: 0.4em;
  gap: 0.4em;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: auto;
  width: 100%;
  background-color: var(--color2);
`
// import { useVirtualizer } from '@tanstack/react-virtual';
// import { useEffect, useRef, useState } from 'react';
// import { Product } from '../../../../templates/system/Product/Product/Product';
// import { Carrusel } from '../../../../component/Carrusel/Carrusel';
// import styled from 'styled-components';
// import { ShoppingItemsCounter } from '../ShoppingItemsCounter/ShoppingItemsCounter';
// import { CustomProduct } from '../../../../templates/system/Product/CustomProduct';
// import { CategorySelector } from '../../../../component/CategorySelector/CategorySelector';
// import { ProductCategoryBar } from '../../../../component/ProductCategoryBar/ProductCategoryBar';

// const columnByWidth =  {
//   600: 1,
//   900: 2,
//   1100: 3,
//   1500: 4,
//   1800: 5,
//   2100: 6,
//   2400: 7,
//   2700: 8,
// }



// const getColumns = (width) => {
//   const columns = Object.keys(columnByWidth).find((w) => w > width);
//   return columnByWidth[columns];
// };

// export function ProductControlEfficient({ products }) {
//   const productLength = products.length;
//   return (
//     <Container>
//       {/* <Carrusel /> */}
//       <ProductCategoryBar />
//       <ProductList products={products} />
//       <ShoppingItemsCounter itemLength={productLength} />
//     </Container>
//   );
// }

// const Container = styled.div`
//   height: 100%;
//   background-color: ${props => props.theme.bg.color2}; 
//   overflow: hidden;
//   border-radius: var(--border-radius-light);
//   display: grid;
//   grid-template-rows: min-content 1fr;
//   border-top-left-radius: 0;
//   border-bottom-right-radius: 0;
//   border-bottom-left-radius: 0;
  
//   position: relative;
// `

// const ProductList = ({ products }) => {
//   const parentRef = useRef();
//   const [listContainerHeight, setListContainer] = useState();
//   const [columns, setColumns] = useState(4);
//   useEffect(() => {
//     // Función para actualizar el número de columnas basado en el ancho actual
//     const updateColumns = () => {
//       if (parentRef.current) {
//         setColumns(getColumns(parentRef.current.clientWidth));
//         setListContainer(parentRef.current.clientWidth);
//       }
//     };

//     // Actualiza las columnas al montar
//     updateColumns();

//     // Añade un listener para el evento resize para ajustar las columnas al cambiar el tamaño
//     window.addEventListener('resize', updateColumns);

//     // Limpieza del efecto
//     return () => window.removeEventListener('resize', updateColumns);
//   }, []); // Dependencias vacías para ejecutar solo una vez al montar

//   // Configuraciones de la grilla
//   const itemCount = products.length; // Total de elementos en la grilla
//   const cellHeight = 88; // Altura de cada celda de la grilla

//   const rowVirtualizer = useVirtualizer({
//     count: Math.ceil(itemCount / columns), // Número total de "filas" virtuales
//     getScrollElement: () => parentRef.current,
//     estimateSize: () => cellHeight, // Altura estimada de cada "fila"
//   });
//   return (
//     <ProductsListContainer
//       ref={parentRef}
//       listContainer={listContainerHeight}

//     >
//       <div
//         style={{
//           height: `${rowVirtualizer.getTotalSize()}px`,
//           width: '100%',
//           position: 'relative',
//         }}
//       >
//         {
//           rowVirtualizer.getVirtualItems()
//             .map(virtualRow => (
//               <div
//                 key={virtualRow.key}
//                 style={{
//                   display: 'grid',
//                   gridTemplateColumns: `repeat(${columns}, 1fr)`, // Crea una grilla con N columnas
//                   gap: '0.4em', // Espacio entre los elementos de la grilla
//                   position: 'absolute',
//                   top: `${virtualRow.start}px`,
//                   left: 0,
//                   width: '100%',
//                   height: `${cellHeight}px`, // Asegúrate de que esto coincida con estimateSize
//                 }}
//               >
//                 {Array.from({ length: columns }).map((_, columnIndex) => {
//                   const itemIndex = virtualRow.index * columns + columnIndex;
//                   const product = products[itemIndex];
//                   if (product) {
//                     if (product?.custom) {
//                       return (
//                         < CustomProduct key={product?.id} product={product} />
//                       )
//                     }
//                     return (
//                       <Product
//                         key={product?.id}
//                         product={product}
//                       />
//                     );
//                   }
//                   return null; // Renderiza un espacio en blanco o un marcador de posición si no hay producto
//                 })}
//               </div>
//             ))
//         }
//       </div>
//     </ProductsListContainer>
//   )
// }

// const ProductsListContainer = styled.div`
//   height:  calc(100vh - 8.41em);
//   @media ( width > 800px){
//     height: calc(100vh - 5.3em);
//   }

//   padding: 0.4em;
//   gap: 0.4em;
//   border: 1px solid #ccc;
//   border-radius: 4px;
//   overflow: auto;
//   width: 100%;
//   background-color: var(--color2);
// `
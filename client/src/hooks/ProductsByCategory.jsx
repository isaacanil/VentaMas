import React from "react";

// Creamos el componente Products
export const ProductsByCategory = ({ products }) => {
  // Obtenemos las categorías únicas del array de productos
  console.log(products)
//   if(products.length === 0){
//     return;
//   }
//   const categories = [...new Set(products.map(product => product.category))];
//   // Creamos un elemento JSX para cada categoría
//   const categoryElements = categories.map(category => {
//     // Filtramos el array de productos por la categoría
//     const filteredProducts = products.filter(product => product.category === category);
//     // Creamos un elemento h2 con el nombre de la categoría
//     const h2 = <h2>{category}</h2>;
//     // Creamos una lista con los nombres de los productos
//     const list = <ul>{filteredProducts.map(product => <li>{product.name}</li>)}</ul>;
//     // Devolvemos el elemento JSX con el h2 y la lista
//     return <div>{h2}{list}</div>;
//   });
//   // Renderizamos los elementos JSX de cada categoría
//   return <div>{categoryElements}</div>;
}


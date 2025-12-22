import React, { useMemo } from 'react';

import { Grid } from '../../templates/system/Grid/Grid';
import { Product } from '../../templates/system/Product/Product/Product';

import style from './ControlSearchProductStyle.module.scss';

export const SearchList = ({ dataSearch = '', products = [] }) => {
  const searchTerm = dataSearch?.toString().trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(({ product }) =>
      product?.productName?.toLowerCase().includes(searchTerm),
    );
  }, [products, searchTerm]);

  return (
    <div className={style.container}>
      <Grid columns="4">
        {searchTerm ? (
          filteredProducts.length > 0 ? (
            filteredProducts.map(({ product }, index) => (
              <Product
                key={index}
                image={product.productImageURL}
                title={product.productName}
                price={product.totalPrice}
                view="row"
                product={product}
              />
            ))
          ) : (
            <h2>No hay Productos!</h2>
          )
        ) : null}
      </Grid>
    </div>
  );
};

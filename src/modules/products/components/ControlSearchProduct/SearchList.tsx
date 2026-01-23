import { useMemo } from 'react';

import { Grid } from '@/components/ui/Grid/Grid';
import { Product } from '@/components/ui/Product/Product/Product';
import type { ProductRecord } from '@/types/products';

import style from './ControlSearchProductStyle.module.scss';

interface SearchListItem {
  product: ProductRecord;
}

interface SearchListProps {
  dataSearch?: string | number | null;
  products?: SearchListItem[];
}

export const SearchList = ({
  dataSearch = '',
  products = [],
}: SearchListProps) => {
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

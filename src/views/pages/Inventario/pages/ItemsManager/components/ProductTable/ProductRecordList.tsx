// @ts-nocheck
import React from 'react';
import { useSelector } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';

import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { filterData } from '@/hooks/search/useSearch';

import { ProductItem } from './ProductCard/ProductItem';

export const ProductRecordList = ({ products, searchTerm }) => {
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

  // Preparación de los datos
  const data = filterData(products, searchTerm);

  return (
    <Virtuoso
      style={{ height: '100%', width: '100%' }}
      data={data}
      overscan={200}
      itemContent={(index, item) => (
        <div
          style={{
            marginBottom: '0.4em',
            // Replicating original padding: 0.4em 0.4em 1.4em
            // Top padding only on first item
            marginTop: index === 0 ? '0.4em' : 0,
            marginLeft: '0.4em',
            marginRight: '0.4em',
            width: 'calc(100% - 0.8em)', // Account for margins
            boxSizing: 'border-box',
          }}
        >
          <ProductItem
            data={item}
            taxReceiptEnabled={taxReceiptEnabled}
          />
        </div>
      )}
      components={{
        Footer: () => <div style={{ height: '1em' }} />, // Extra space at bottom
      }}
    />
  );
};

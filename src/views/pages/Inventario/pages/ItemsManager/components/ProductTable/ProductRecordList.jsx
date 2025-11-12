import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectTaxReceiptEnabled } from '../../../../../../../features/taxReceipt/taxReceiptSlice';
import { filterData } from '../../../../../../../hooks/search/useSearch';

import { ProductItem } from './ProductCard/ProductItem';

export const ProductRecordList = ({ products, searchTerm }) => {
  const parentRef = useRef(null);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

  // Preparación de los datos
  const data = filterData(products, searchTerm);
  const count = data.length;

  // Configuración del virtualizador
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Tamaño estimado más preciso para las tarjetas de productos
    overscan: 5, // Renderiza 5 elementos adicionales arriba y abajo para mejor rendimiento
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0.4em 0.4em 1.4em',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${items[0]?.start ?? 0}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
          }}
        >
          {items.map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                marginBottom: '0.4em',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <ProductItem
                data={data[virtualItem.index]}
                taxReceiptEnabled={taxReceiptEnabled}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

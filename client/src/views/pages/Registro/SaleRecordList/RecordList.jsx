import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { InvoiceItem } from './InvoiceItem/InvoiceItem';
import { filterData } from '../../../../hooks/search/useSearch';

export const SaleRecordList = ({ invoices, searchTerm }) => {
  const parentRef = useRef(null);

  // Preparación de los datos
  const data = filterData(invoices, searchTerm).map(invoice => invoice.data);
  const count = data.length;

  // Configuración del virtualizador
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // Ajusta este valor según el tamaño medio de tus elementos
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        overflowY: 'auto',
        contain: 'strict',
        padding: '0.4em 0.4em 1.4em',
      }}
    >
      <div style={{ height: virtualizer.getTotalSize(), width: '100%' }}>
        <div
          style={{
            transform: `translateY(${items[0]?.start ?? 0}px)`,
            display: 'grid',
            gap: '0.4em',
          }}
        >
          {items.map(virtualItem => (
            <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            >
              <InvoiceItem data={data[virtualItem.index]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

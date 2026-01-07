// @ts-nocheck
import { InfoCircleOutlined } from '@ant-design/icons';
import { Checkbox, InputNumber, Tooltip } from 'antd';
import { useMemo } from 'react';

import { getTotalPrice, getTax } from '@/utils/pricing';

export const useCreditNoteColumns = ({
  isMobile,
  selectedItems,
  itemQuantities,
  existingItemQuantities,
  creditedQuantities,
  effectiveIsView,
  handleItemChange,
  handleQuantityChange,
  formatPrice,
}) => {
  return useMemo(
    () => [
      {
        title: '',
        dataIndex: 'select',
        width: '50px',
        render: (_, record) => (
          <Checkbox
            checked={selectedItems.includes(record.id)}
            disabled={effectiveIsView}
            onChange={(e) => handleItemChange(record.id, e.target.checked)}
          />
        ),
      },
      {
        title: 'Producto',
        dataIndex: 'name',
        key: 'name',
        width: isMobile ? '30px' : '35%',
        ellipsis: isMobile ? { showTitle: true } : false,
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: 'Cantidad',
        dataIndex: 'creditQty',
        key: 'creditQty',
        width: isMobile ? '90px' : '110px',
        render: (_, record) => {
          const maxQty = record.maxAvailableQty < 0 ? 0 : record.maxAvailableQty;
          const originalQty = record.amountToBuy || 1;
          const creditedByOthers = creditedQuantities[record.id] || 0;
          const selected = selectedItems.includes(record.id);
          const value =
            itemQuantities[record.id] || existingItemQuantities[record.id] || 1;

          const qtyDisplay = (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: '500' }}>{value}</span>
              <span style={{ fontSize: '11px', color: '#999' }}>/{maxQty}</span>
            </div>
          );

          if (effectiveIsView || !selected) {
            return qtyDisplay;
          }

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <InputNumber
                min={1}
                max={maxQty}
                value={value}
                onChange={(val) => handleQuantityChange(record.id, val)}
                size="small"
                style={{ width: '60px' }}
              />
              <Tooltip
                title={
                  <div>
                    <div>
                      <strong>Cálculo de Cantidad Máxima</strong>
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      - Factura Original: {originalQty}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      - Acreditado en otras NC: {creditedByOthers}
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid #ddd',
                        paddingTop: '4px',
                        marginTop: '4px',
                      }}
                    >
                      <strong>Máximo disponible: {maxQty}</strong>
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#999',
                        marginTop: '4px',
                      }}
                    >
                      Fórmula: {originalQty} - {creditedByOthers} = {maxQty}
                    </div>
                  </div>
                }
                placement="topLeft"
              >
                <span style={{ fontSize: '11px', color: '#999', cursor: 'help' }}>
                  /{maxQty} <InfoCircleOutlined />
                </span>
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: 'Precio',
        dataIndex: 'pricing',
        key: 'price',
        width: '120px',
        align: 'right',
        responsive: ['md'],
        render: (_, record) => {
          const unitPrice = getTotalPrice(record, true, false);
          return formatPrice(unitPrice);
        },
        sorter: (a, b) =>
          getTotalPrice(a, true, false) - getTotalPrice(b, true, false),
      },
      {
        title: 'ITBIS',
        dataIndex: 'itbis',
        key: 'itbis',
        width: '120px',
        align: 'right',
        responsive: ['lg'],
        render: (_, record) => {
          const qty =
            itemQuantities[record.id] ||
            existingItemQuantities[record.id] ||
            record.amountToBuy ||
            1;
          const tempItem = { ...record, amountToBuy: qty };
          const itbis = getTax(tempItem, true);
          return formatPrice(itbis);
        },
      },
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        width: '120px',
        align: 'right',
        responsive: ['sm'],
        render: (_, record) => {
          const qty =
            itemQuantities[record.id] ||
            existingItemQuantities[record.id] ||
            record.amountToBuy ||
            1;
          const tempItem = { ...record, amountToBuy: qty };
          return formatPrice(getTotalPrice(tempItem));
        },
        sorter: (a, b) => {
          const qtyA =
            itemQuantities[a.id] ||
            existingItemQuantities[a.id] ||
            a.amountToBuy ||
            1;
          const qtyB =
            itemQuantities[b.id] ||
            existingItemQuantities[b.id] ||
            b.amountToBuy ||
            1;
          return (
            getTotalPrice({ ...a, amountToBuy: qtyA }) -
            getTotalPrice({ ...b, amountToBuy: qtyB })
          );
        },
      },
    ],
    [
      creditedQuantities,
      effectiveIsView,
      existingItemQuantities,
      formatPrice,
      handleItemChange,
      handleQuantityChange,
      isMobile,
      itemQuantities,
      selectedItems,
    ],
  );
};

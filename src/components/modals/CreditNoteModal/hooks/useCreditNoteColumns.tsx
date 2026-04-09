import { InfoCircleOutlined } from '@/constants/icons/antd';
import { Checkbox, InputNumber, Tooltip } from 'antd';
import { useMemo } from 'react';

import { getTotalPrice, getTax } from '@/utils/pricing';
import type { ColumnsType } from 'antd/es/table';
import type { InvoiceProduct, InvoiceProductAmount } from '@/types/invoice';
import type { NumberInput } from '@/utils/number/number';

type CreditNoteProduct = InvoiceProduct & { maxAvailableQty?: number };
type FormatPrice = (value: NumberInput) => string;

interface UseCreditNoteColumnsArgs {
  isMobile: boolean;
  selectedItems: Array<string | undefined>;
  itemQuantities: Record<string, number>;
  existingItemQuantities: Record<string, number>;
  creditedQuantities: Record<string, number>;
  effectiveIsView: boolean;
  handleItemChange: (itemId: string | undefined, checked: boolean) => void;
  handleQuantityChange: (
    itemId: string | undefined,
    value: number | null,
  ) => void;
  formatPrice: FormatPrice;
}

const resolveQuantity = (amount: InvoiceProduct['amountToBuy']): number => {
  if (typeof amount === 'number' && Number.isFinite(amount)) return amount;
  if (typeof amount === 'object' && amount !== null) {
    const amountObj = amount as InvoiceProductAmount;
    if (typeof amountObj.unit === 'number' && Number.isFinite(amountObj.unit)) {
      return amountObj.unit;
    }
    if (
      typeof amountObj.total === 'number' &&
      Number.isFinite(amountObj.total)
    ) {
      return amountObj.total;
    }
  }
  return 1;
};

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
}: UseCreditNoteColumnsArgs): ColumnsType<CreditNoteProduct> => {
  return useMemo(
    () => [
      {
        title: '',
        dataIndex: 'select',
        width: '50px',
        render: (_, record: CreditNoteProduct) => (
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
        sorter: (a: CreditNoteProduct, b: CreditNoteProduct) =>
          (a.name ?? '').localeCompare(b.name ?? ''),
      },
      {
        title: 'Cantidad',
        dataIndex: 'creditQty',
        key: 'creditQty',
        width: isMobile ? '90px' : '110px',
        render: (_, record: CreditNoteProduct) => {
          const maxQty =
            typeof record.maxAvailableQty === 'number'
              ? Math.max(0, record.maxAvailableQty)
              : 0;
          const originalQty = resolveQuantity(record.amountToBuy);
          const recordId = record.id;
          const creditedByOthers = creditedQuantities[String(recordId)] || 0;
          const selected = selectedItems.includes(record.id);
          const value =
            itemQuantities[String(recordId)] ||
            existingItemQuantities[String(recordId)] ||
            1;

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
                onChange={(val) =>
                  handleQuantityChange(
                    record.id,
                    typeof val === 'number' ? val : null,
                  )
                }
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
                <span
                  style={{ fontSize: '11px', color: '#999', cursor: 'help' }}
                >
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
        render: (_, record: CreditNoteProduct) => {
          const unitPrice = getTotalPrice(record, true, false);
          return formatPrice(unitPrice);
        },
        sorter: (a: CreditNoteProduct, b: CreditNoteProduct) =>
          getTotalPrice(a, true, false) - getTotalPrice(b, true, false),
      },
      {
        title: 'ITBIS',
        dataIndex: 'itbis',
        key: 'itbis',
        width: '120px',
        align: 'right',
        responsive: ['lg'],
        render: (_, record: CreditNoteProduct) => {
          const recordId = record.id;
          const qty =
            itemQuantities[String(recordId)] ||
            existingItemQuantities[String(recordId)] ||
            resolveQuantity(record.amountToBuy) ||
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
        render: (_, record: CreditNoteProduct) => {
          const recordId = record.id;
          const qty =
            itemQuantities[String(recordId)] ||
            existingItemQuantities[String(recordId)] ||
            resolveQuantity(record.amountToBuy) ||
            1;
          const tempItem = { ...record, amountToBuy: qty };
          return formatPrice(getTotalPrice(tempItem));
        },
        sorter: (a: CreditNoteProduct, b: CreditNoteProduct) => {
          const qtyA =
            itemQuantities[String(a.id)] ||
            existingItemQuantities[String(a.id)] ||
            resolveQuantity(a.amountToBuy) ||
            1;
          const qtyB =
            itemQuantities[String(b.id)] ||
            existingItemQuantities[String(b.id)] ||
            resolveQuantity(b.amountToBuy) ||
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

import { Checkbox } from 'antd';
import { useMemo } from 'react';

import { getTotalPrice, getTax } from '@/utils/pricing';
import type { TableColumnsType as ColumnsType } from 'antd';
import type { InvoiceProduct } from '@/types/invoice';
import type { NumberInput } from '@/utils/number/number';
import { CreditNoteQuantityControl } from '../components/CreditNoteQuantityControl';
import {
  applyCreditNoteLineQuantity,
  getCreditNoteQuantityInputConfig,
  resolveCreditNoteLineQuantity,
} from '../utils/quantity';
import { getCreditNoteLineKey } from './useCreditNoteSelection.helpers';

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
        render: (_, record: CreditNoteProduct) => {
          const recordId = getCreditNoteLineKey(record);
          return (
            <Checkbox
              checked={selectedItems.includes(recordId)}
              disabled={effectiveIsView}
              onChange={(e) => handleItemChange(recordId, e.target.checked)}
            />
          );
        },
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
          const originalQty = resolveCreditNoteLineQuantity(record);
          const recordId = getCreditNoteLineKey(record);
          const creditedByOthers = creditedQuantities[String(recordId)] || 0;
          const selected = selectedItems.includes(recordId);
          const value =
            itemQuantities[String(recordId)] ||
            existingItemQuantities[String(recordId)] ||
            1;
          const quantityInputConfig = getCreditNoteQuantityInputConfig(record);

          return (
            <CreditNoteQuantityControl
              quantity={value}
              displayQuantity={maxQty}
              originalQuantity={originalQty}
              creditedByOthers={creditedByOthers}
              maxQuantity={maxQty}
              minQuantity={quantityInputConfig.min}
              step={quantityInputConfig.step}
              isEditable={!effectiveIsView && selected}
              onQuantityChange={(value) =>
                handleQuantityChange(recordId, value)
              }
            />
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
          const recordId = getCreditNoteLineKey(record);
          const qty =
            itemQuantities[String(recordId)] ||
            existingItemQuantities[String(recordId)] ||
            resolveCreditNoteLineQuantity(record) ||
            1;
          const tempItem = applyCreditNoteLineQuantity(record, qty);
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
          const recordId = getCreditNoteLineKey(record);
          const qty =
            itemQuantities[String(recordId)] ||
            existingItemQuantities[String(recordId)] ||
            resolveCreditNoteLineQuantity(record) ||
            1;
          const tempItem = applyCreditNoteLineQuantity(record, qty);
          return formatPrice(getTotalPrice(tempItem));
        },
        sorter: (a: CreditNoteProduct, b: CreditNoteProduct) => {
          const aId = getCreditNoteLineKey(a);
          const bId = getCreditNoteLineKey(b);
          const qtyA =
            itemQuantities[String(aId)] ||
            existingItemQuantities[String(aId)] ||
            resolveCreditNoteLineQuantity(a) ||
            1;
          const qtyB =
            itemQuantities[String(bId)] ||
            existingItemQuantities[String(bId)] ||
            resolveCreditNoteLineQuantity(b) ||
            1;
          return (
            getTotalPrice(applyCreditNoteLineQuantity(a, qtyA)) -
            getTotalPrice(applyCreditNoteLineQuantity(b, qtyB))
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

import { DateTime } from 'luxon';

import {
  getProductsTax,
  getProductsTotalPrice,
} from '@/utils/pricing';
import { resolveInvoiceProductsQuantity } from '@/utils/invoice/product';
import type { InvoiceData } from '@/types/invoice';

import type { PreorderFirestoreDoc, PreorderRow } from '../../types';

const resolveDateSeconds = (value: InvoiceData['date']): number | null => {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }
  if (typeof value === 'object') {
    if (typeof value.seconds === 'number') return value.seconds;
    if (typeof value.toMillis === 'function') {
      const millis = value.toMillis();
      return Number.isFinite(millis) ? Math.floor(millis / 1000) : null;
    }
  }
  return null;
};

export const mapPreorderToRow = ({
  data,
}: PreorderFirestoreDoc): PreorderRow => {
  const ncf = data?.NCF ?? null;
  const taxReceiptEnabled = Boolean(
    ncf ||
      data?.selectedTaxReceiptType ||
      data?.preorderDetails?.selectedTaxReceiptType ||
      data?.preorderDetails?.taxReceipt?.type,
  );
  const dateSeconds = resolveDateSeconds(data?.preorderDetails?.date ?? null);
  const dateGroup = dateSeconds
    ? DateTime.fromSeconds(dateSeconds).toLocaleString(DateTime.DATE_FULL)
    : '';

  return {
    numberID: data?.preorderDetails?.numberID,
    ncf,
    client: data?.client?.name ?? '',
    date: dateSeconds,
    itbis: getProductsTax(data?.products ?? []),
    products: resolveInvoiceProductsQuantity(data?.products ?? []),
    status: data?.status,
    total: getProductsTotalPrice(
      data?.products ?? [],
      0,
      0,
      taxReceiptEnabled,
    ),
    accion: { data },
    dateGroup,
  };
};

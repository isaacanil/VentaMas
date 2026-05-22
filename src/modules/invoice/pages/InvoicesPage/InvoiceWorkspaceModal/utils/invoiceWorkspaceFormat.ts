import { DateTime } from 'luxon';

import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import {
  resolveInvoiceDisplayedTotal,
  resolveInvoiceDisplayedUnitPrice,
} from '@/utils/accounting/lineMonetary';
import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
import { convertInvoiceDateToMillis } from '@/utils/invoice';

export const formatWorkspaceAmount = (
  value: number | string | null | undefined,
  invoice?: InvoiceData | null,
) => formatInvoicePrice(value, invoice);

export const formatWorkspaceDate = (invoice?: InvoiceData | null) => {
  const millis = convertInvoiceDateToMillis(invoice?.date);
  if (!millis) return 'N/D';
  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy hh:mm a');
};

export const getWorkspaceProductQuantity = (
  product?: InvoiceProduct | null,
) => {
  if (!product) return 1;
  const { amountToBuy } = product;

  if (typeof amountToBuy === 'number') {
    return amountToBuy > 0 ? amountToBuy : 1;
  }

  if (amountToBuy && typeof amountToBuy === 'object') {
    const total = Number(amountToBuy.total);
    const unit = Number(amountToBuy.unit);

    if (Number.isFinite(total) && total > 0) return total;
    if (Number.isFinite(unit) && unit > 0) return unit;
  }

  return 1;
};

export const getWorkspaceProductTotal = (
  product: InvoiceProduct,
  invoice?: InvoiceData | null,
) => resolveInvoiceDisplayedTotal(product, invoice, true);

export const getWorkspaceProductUnitPrice = (
  product: InvoiceProduct,
  invoice?: InvoiceData | null,
) => resolveInvoiceDisplayedUnitPrice(product, invoice);

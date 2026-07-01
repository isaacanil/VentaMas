import { DateTime } from 'luxon';

import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import {
  resolveInvoiceDisplayedTotal,
  resolveInvoiceDisplayedUnitPrice,
} from '@/utils/accounting/lineMonetary';
import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
import { convertInvoiceDateToMillis } from '@/utils/invoice';
import { resolveInvoiceProductQuantity } from '@/utils/invoice/product';

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
  const quantity = resolveInvoiceProductQuantity(product);
  return quantity > 0 ? quantity : 1;
};

export const getWorkspaceProductTotal = (
  product: InvoiceProduct,
  invoice?: InvoiceData | null,
) => resolveInvoiceDisplayedTotal(product, invoice, true);

export const getWorkspaceProductUnitPrice = (
  product: InvoiceProduct,
  invoice?: InvoiceData | null,
) => resolveInvoiceDisplayedUnitPrice(product, invoice);

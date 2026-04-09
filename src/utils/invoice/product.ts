import type { InvoiceProduct } from '@/types/invoice';
import { toNumber } from '@/utils/number/toNumber';
import { resolveInvoiceAmount } from '@/utils/invoice/amount';

const resolvePricing = (product?: InvoiceProduct | null) =>
  product?.selectedSaleUnit?.pricing ?? product?.pricing ?? null;

export const resolveInvoiceProductQuantity = (
  product?: InvoiceProduct | null,
): number => resolveInvoiceAmount(product?.amountToBuy ?? null);

export const resolveInvoiceProductUnitPrice = (
  product?: InvoiceProduct | null,
): number => {
  const pricing = resolvePricing(product);
  if (pricing?.price !== undefined) return toNumber(pricing.price);
  return toNumber(product?.price?.unit ?? 0);
};

export const resolveInvoiceProductTaxRate = (
  product?: InvoiceProduct | null,
): number => {
  const pricing = resolvePricing(product);
  const rawTax = pricing?.tax;
  if (rawTax && typeof rawTax === 'object') {
    return toNumber((rawTax as { tax?: number | string | null }).tax ?? 0);
  }
  return toNumber(rawTax ?? 0);
};

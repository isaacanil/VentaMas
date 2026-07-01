import { DateTime } from 'luxon';

import { getActiveUnitPrice } from '@/utils/pricing';
import { toMillis } from '@/utils/date/dateUtils';
import type { TimestampLike } from '@/utils/date/types';
import { resolveInvoiceProductQuantity } from '@/utils/invoice/product';

import type { InvoicePdfData, InvoicePdfProduct } from '../types';

type DiscountProduct = Pick<
  InvoicePdfProduct,
  'amountToBuy' | 'discount' | 'price' | 'pricing' | 'selectedSaleUnit'
>;

type DiscountSource =
  | {
      discount?: InvoicePdfData['discount'] | null;
      products?: DiscountProduct[] | null;
    }
  | null
  | undefined;

export function money(value: number | string | null | undefined): string {
  return Number(value).toFixed(2);
}

export function formatDate(ts: TimestampLike): string {
  const millis = toMillis(ts);
  if (!millis) return '';
  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy');
}

export function getDiscount(d: DiscountSource): number {
  const products: DiscountProduct[] = Array.isArray(d?.products)
    ? d.products
    : [];
  const discountValue = Number(d?.discount?.value) || 0;

  if (!discountValue || products.length === 0) return 0;

  const subtotal = products.reduce((sum, p) => {
    const price = getActiveUnitPrice(p);
    const qty = resolveInvoiceProductQuantity(p);
    return sum + price * qty;
  }, 0);

  return subtotal * (discountValue / 100);
}

export function getProductIndividualDiscount(
  product: DiscountProduct | null | undefined,
): number {
  const discountValue = Number(product?.discount?.value) || 0;

  if (!product?.discount || discountValue <= 0) return 0;

  const price = getActiveUnitPrice(product);
  const quantity = resolveInvoiceProductQuantity(product) || 1;
  const subtotalBeforeDiscount = price * quantity;

  if (product.discount.type === 'percentage') {
    return subtotalBeforeDiscount * (discountValue / 100);
  }

  return Math.min(discountValue, subtotalBeforeDiscount);
}

export function getProductsIndividualDiscounts(
  products: DiscountProduct[] | null | undefined,
): number {
  return (products || []).reduce((total, product) => {
    return total + getProductIndividualDiscount(product);
  }, 0);
}

export function hasIndividualDiscounts(
  products: DiscountProduct[] | null | undefined,
): boolean {
  return (products || []).some(
    (product) => Number(product.discount?.value) > 0,
  );
}

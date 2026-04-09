import { DateTime } from 'luxon';

import { toMillis } from '@/utils/date/dateUtils';
import type { TimestampLike } from '@/utils/date/types';

import type { InvoicePdfData, InvoicePdfProduct } from '../types';

type DiscountSource =
  | Pick<InvoicePdfData, 'discount' | 'products'>
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
  const products: InvoicePdfProduct[] = Array.isArray(d?.products)
    ? d.products
    : [];
  const discountValue = Number(d?.discount?.value) || 0;

  if (!discountValue || products.length === 0) return 0;

  const subtotal = products.reduce((sum, p) => {
    const price = Number(p?.pricing?.price) || 0;
    const qty = Number(p?.amountToBuy) || 0;
    return sum + price * qty;
  }, 0);

  return subtotal * (discountValue / 100);
}

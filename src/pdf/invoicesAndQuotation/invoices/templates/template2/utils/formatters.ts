import { DateTime } from 'luxon';

import type { TimestampLike } from '@/utils/date/types';
import type { InvoiceProduct } from '@/types/invoice';
import type { InvoicePdfData } from '@/pdf/invoicesAndQuotation/types';

type DiscountSource = Pick<InvoicePdfData, 'discount' | 'products'> | null | undefined;

export function money(value: number | string | null | undefined): string {
  const num = Number(value) || 0;
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `RD$ ${parts.join('.')}`;
}

export function formatDate(ts: TimestampLike): string {
  if (!ts) return '';

  const ms =
    ts instanceof Date
      ? ts.getTime()
      : typeof ts?.toMillis === 'function'
        ? ts.toMillis()
        : ts?.seconds
          ? ts.seconds * 1000
          : Number(ts);

  if (isNaN(ms)) return '';
  return DateTime.fromMillis(ms).toFormat('dd/MM/yyyy');
}

export function getDiscount(d: DiscountSource): number {
  const products: InvoiceProduct[] = Array.isArray(d?.products)
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

export function getProductIndividualDiscount(product: InvoiceProduct): number {
  if (!product.discount || product.discount.value <= 0) return 0;

  const price = +product.pricing?.price || 0;
  const quantity = +product.amountToBuy || 1;
  const subtotalBeforeDiscount = price * quantity;

  if (product.discount.type === 'percentage') {
    return subtotalBeforeDiscount * (product.discount.value / 100);
  } else {
    // Para monto fijo
    return Math.min(product.discount.value, subtotalBeforeDiscount);
  }
}

export function getProductsIndividualDiscounts(
  products: InvoiceProduct[],
): number {
  return products.reduce((total, product) => {
    return total + getProductIndividualDiscount(product);
  }, 0);
}

export function hasIndividualDiscounts(products: InvoiceProduct[]): boolean {
  return products.some(
    (product) => product.discount && product.discount.value > 0,
  );
}

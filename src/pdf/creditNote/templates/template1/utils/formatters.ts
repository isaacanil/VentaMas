import { DateTime } from 'luxon';

import {
  getTotalPrice,
  getTax,
  getProductIndividualDiscount as getAppProductIndividualDiscount,
} from '@/utils/pricing.js';
import type { TimestampLike } from '@/utils/date/types';
import type { InvoiceProduct } from '@/types/invoice';

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

// Usar la función de la aplicación para mantener consistencia
export function getProductIndividualDiscount(product: InvoiceProduct): number {
  return getAppProductIndividualDiscount(product);
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

// Nuevas funciones para usar en el PDF que mantienen consistencia con la app
export function getProductTotalPrice(product: InvoiceProduct): number {
  return getTotalPrice(product, true, true);
}

export function getProductTax(product: InvoiceProduct): number {
  return getTax(product, true);
}

export function getProductSubtotal(product: InvoiceProduct): number {
  const { price, amountToBuy } = product?.pricing
    ? {
        price: product.pricing.price || 0,
        amountToBuy: product.amountToBuy || 1,
      }
    : { price: 0, amountToBuy: 1 };

  let subtotal = price * amountToBuy;

  // Aplicar descuento individual si existe
  if (product.discount && product.discount.value > 0) {
    const discountAmount = getProductIndividualDiscount(product);
    subtotal -= discountAmount;
  }

  return subtotal;
}

import type { InvoiceProduct } from '@/types/invoice';
import {
  convertDecimalToPercentage,
  getPriceWithoutTax,
} from '@/utils/pricing';

export type LegacyInvoiceProduct = Record<string, unknown>;

const trimIfString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const normalizeLegacyInvoiceProduct = (
  product: LegacyInvoiceProduct,
): InvoiceProduct | LegacyInvoiceProduct => {
  if (!product?.productName) return product;

  const price = (product as { price?: { unit?: number } })?.price?.unit ?? 0;
  const rawTax = (product as { tax?: { value?: number } })?.tax?.value ?? 0;
  const taxPercentage = convertDecimalToPercentage(rawTax) || 0;
  const total = getPriceWithoutTax(price, taxPercentage);

  return {
    id: product?.id as InvoiceProduct['id'],
    name: trimIfString(product?.productName) as InvoiceProduct['name'],
    category: (product as { category?: string })?.category || '',
    image: (product as { productImageURL?: string })?.productImageURL || '',
    pricing: {
      cost: (product as { cost?: { unit?: number } })?.cost?.unit ?? 0,
      listPrice: (product as { listPrice?: number })?.listPrice ?? total,
      avgPrice: (product as { averagePrice?: number })?.averagePrice ?? total,
      minPrice: (product as { minimumPrice?: number })?.minimumPrice ?? total,
      price: total || price,
      tax: rawTax * 100,
    },
    promotions: {
      isActive: false,
      discount: 0,
      start: null,
      end: null,
    },
    stock: (product as { stock?: number })?.stock ?? 0,
    barcode: (product as { barCode?: string })?.barCode || '',
    qrcode: (product as { qrCode?: string })?.qrCode || '',
    isVisible: (product as { isVisible?: boolean })?.isVisible ?? true,
    trackInventory:
      (product as { trackInventory?: boolean })?.trackInventory ?? true,
    netContent: (product as { netContent?: string })?.netContent || '',
    size: (trimIfString(product?.size) as string) || '',
    type: (trimIfString(product?.type) as string) || '',
    status: 'disponible',
    amountToBuy: (product as { amountToBuy?: { total?: number } })?.amountToBuy
      ?.total,
  };
};

import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import { toNumber } from '@/utils/number/toNumber';
import {
  getProductsIndividualDiscounts,
  getProductsPrice,
  getProductsTax,
  getTotalDiscount,
} from '@/utils/pricing';

export type InvoiceTotalsSnapshot = {
  subtotal: number;
  subtotalWithTax: number;
  totalWithoutTaxes: number;
  totalTaxes: number;
  totalPurchase: number;
  delivery: number;
  change: number;
  totalInsurance: number;
  generalDiscount: number;
  individualDiscounts: number;
};

export const getInvoiceSubtotal = (products?: InvoiceProduct[]): number =>
  toNumber(getProductsPrice(products ?? []));

export const getInvoiceTaxTotal = (products?: InvoiceProduct[]): number =>
  toNumber(getProductsTax(products ?? []));

export const getInvoiceSubtotalWithTax = (
  products?: InvoiceProduct[],
): number => getInvoiceSubtotal(products) + getInvoiceTaxTotal(products);

export const getInvoiceIndividualDiscounts = (
  products?: InvoiceProduct[],
): number => toNumber(getProductsIndividualDiscounts(products ?? []));

export const getInvoiceGeneralDiscount = (
  subtotal: number,
  discountValue?: number | string | null,
): number => toNumber(getTotalDiscount(subtotal, toNumber(discountValue)));

export const getInvoiceTotalsSnapshot = (
  data?: InvoiceData | null,
): InvoiceTotalsSnapshot => {
  const subtotal = getInvoiceSubtotal(data?.products);
  const subtotalWithTax = subtotal + getInvoiceTaxTotal(data?.products);
  const generalDiscount = getInvoiceGeneralDiscount(
    subtotalWithTax,
    data?.discount?.value,
  );
  return {
    subtotal,
    subtotalWithTax,
    totalWithoutTaxes: toNumber(data?.totalPurchaseWithoutTaxes?.value),
    totalTaxes: toNumber(data?.totalTaxes?.value),
    totalPurchase: toNumber(data?.totalPurchase?.value),
    delivery: toNumber(data?.delivery?.value),
    change: toNumber(data?.change?.value),
    totalInsurance: toNumber(data?.totalInsurance?.value),
    generalDiscount,
    individualDiscounts: getInvoiceIndividualDiscounts(data?.products),
  };
};

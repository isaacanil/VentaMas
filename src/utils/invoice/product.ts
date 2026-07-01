import type { InvoiceProduct } from '@/types/invoice';
import { toNumber } from '@/utils/number/toNumber';
import { resolveInvoiceAmount } from '@/utils/invoice/amount';

const resolvePricing = (product?: InvoiceProduct | null) =>
  product?.selectedSaleUnit?.pricing ?? product?.pricing ?? null;

const roundQuantity = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

const resolveWeightQuantity = (product?: InvoiceProduct | null): number => {
  if (product?.weightDetail?.isSoldByWeight !== true) return 0;
  const weight = toNumber(product.weightDetail.weight ?? 0);
  return weight > 0 ? roundQuantity(weight) : 0;
};

const hasSelectedSaleUnit = (product?: InvoiceProduct | null): boolean =>
  Boolean(
    product?.selectedSaleUnit ??
      (product as { saleUnit?: unknown } | null)?.saleUnit,
  );

const resolveProductAmountQuantity = (
  product?: InvoiceProduct | null,
): number => {
  const amount = product?.amountToBuy ?? null;
  if (
    hasSelectedSaleUnit(product) &&
    amount &&
    typeof amount === 'object' &&
    !Array.isArray(amount)
  ) {
    const structuredAmount = amount as {
      unit?: number | string | null;
      value?: number | string | null;
      quantity?: number | string | null;
      total?: number | string | null;
    };
    return toNumber(
      structuredAmount.unit ??
        structuredAmount.value ??
        structuredAmount.quantity ??
        structuredAmount.total ??
        0,
    );
  }

  return resolveInvoiceAmount(amount);
};

export const resolveInvoiceProductQuantity = (
  product?: InvoiceProduct | null,
): number => {
  const weightQuantity = resolveWeightQuantity(product);
  if (weightQuantity > 0) return weightQuantity;

  return roundQuantity(resolveProductAmountQuantity(product));
};

export const resolveInvoiceProductsQuantity = (
  products: ReadonlyArray<InvoiceProduct> = [],
): number =>
  roundQuantity(
    products.reduce(
      (total, product) => total + resolveInvoiceProductQuantity(product),
      0,
    ),
  );

export const resolveInvoiceProductUnitPrice = (
  product?: InvoiceProduct | null,
): number => {
  const pricing = resolvePricing(product);
  return toNumber(pricing?.price ?? 0);
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

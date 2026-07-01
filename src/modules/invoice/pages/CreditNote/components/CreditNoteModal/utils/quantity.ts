import type { InvoiceProduct } from '@/types/invoice';
import { resolveInvoiceAmount } from '@/utils/invoice/amount';
import { resolveInvoiceProductQuantity } from '@/utils/invoice/product';

export const resolveQuantity = (
  amount: InvoiceProduct['amountToBuy'],
): number => {
  const quantity = resolveInvoiceAmount(amount ?? null);
  return Number.isFinite(quantity) ? quantity : 1;
};

const roundQuantity = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

const toPositiveNumber = (value: unknown, fallback = 1): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveSaleUnitConversionFactor = (product: InvoiceProduct): number => {
  const saleUnit =
    product.selectedSaleUnit ??
    (product as InvoiceProduct & { saleUnit?: unknown }).saleUnit;

  if (!saleUnit || typeof saleUnit !== 'object' || Array.isArray(saleUnit)) {
    return 1;
  }

  return toPositiveNumber(
    (saleUnit as Record<string, unknown>).conversionFactorToBase,
    toPositiveNumber((saleUnit as Record<string, unknown>).quantity, 1),
  );
};

export const resolveCreditNoteLineQuantity = (
  product?: InvoiceProduct | null,
): number => {
  if (!product) return 1;
  const quantity = resolveInvoiceProductQuantity(product);
  return Number.isFinite(quantity) ? quantity : 1;
};

export const applyCreditNoteLineQuantity = (
  product: InvoiceProduct,
  quantityInput: number,
): InvoiceProduct => {
  const quantity = roundQuantity(toPositiveNumber(quantityInput, 1));

  if (product.weightDetail?.isSoldByWeight === true) {
    return {
      ...product,
      amountToBuy: product.amountToBuy ?? 1,
      baseQuantity: quantity,
      weightDetail: {
        ...product.weightDetail,
        weight: quantity,
      },
    };
  }

  return {
    ...product,
    amountToBuy: quantity,
    baseQuantity: roundQuantity(
      quantity * resolveSaleUnitConversionFactor(product),
    ),
  };
};

export const getCreditNoteQuantityInputConfig = (
  product?: InvoiceProduct | null,
) => {
  const allowsFractional =
    product?.weightDetail?.isSoldByWeight === true ||
    product?.selectedSaleUnit?.allowFractional === true;

  return {
    min: allowsFractional ? 0.01 : 1,
    step: allowsFractional ? 0.01 : 1,
  };
};

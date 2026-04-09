import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import type {
  AccountingCurrencyRateConfig,
  AccountingOperationType,
} from '@/types/accounting';
import {
  DEFAULT_FUNCTIONAL_CURRENCY,
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import {
  getAccountingRateValue,
  resolveAccountingRateTypeForOperation,
} from '@/utils/accounting/contracts';
import { resolveInvoiceDocumentCurrency } from '@/utils/invoice/documentCurrency';
import {
  getDiscount,
  getTax,
  getTotal,
  getTotalPrice,
  limit,
} from '@/utils/pricing';

export type MonetaryRateConfig = AccountingCurrencyRateConfig;

export interface ProductMonetarySnapshot {
  documentCurrency: SupportedDocumentCurrency;
  functionalCurrency: SupportedDocumentCurrency;
  exchangeRate: number;
  originalUnitPrice: number;
  functionalUnitPrice: number;
  source: 'functional' | 'settings-manual-sale' | 'settings-manual-purchase';
  effectiveAt: number;
}

type ProductLike = {
  pricing?: {
    currency?: SupportedDocumentCurrency;
    price?: number | string;
  } | null;
  selectedSaleUnit?: {
    pricing?: {
      currency?: SupportedDocumentCurrency;
      price?: number | string;
    } | null;
  } | null;
  monetary?: ProductMonetarySnapshot | null;
};

export interface ProductMonetaryContext {
  functionalCurrency?: SupportedDocumentCurrency;
  manualRatesByCurrency?: Partial<
    Record<SupportedDocumentCurrency, MonetaryRateConfig>
  >;
  operationType?: Extract<AccountingOperationType, 'sale' | 'purchase'>;
  effectiveAt?: number | null;
}

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveProductPricing = (product: ProductLike) =>
  product?.selectedSaleUnit?.pricing ?? product?.pricing ?? null;

export const resolveProductLineCurrency = (
  product: ProductLike | null | undefined,
  fallback: SupportedDocumentCurrency = DEFAULT_FUNCTIONAL_CURRENCY,
): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(
    resolveProductPricing(product)?.currency ??
      product?.monetary?.documentCurrency ??
      fallback,
    fallback,
  );

export const resolveProductFunctionalCurrency = (
  product: ProductLike | null | undefined,
  fallback: SupportedDocumentCurrency = DEFAULT_FUNCTIONAL_CURRENCY,
): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(
    product?.monetary?.functionalCurrency ?? fallback,
    fallback,
  );

export const resolveProductOriginalUnitPrice = (
  product: ProductLike | null | undefined,
): number =>
  toFiniteNumber(
    product?.monetary?.originalUnitPrice ?? resolveProductPricing(product)?.price,
  );

export const resolveProductFunctionalUnitPrice = (
  product: ProductLike | null | undefined,
): number => {
  const unitPrice = resolveProductOriginalUnitPrice(product);
  const exchangeRate = toFiniteNumber(product?.monetary?.exchangeRate) || 1;
  return limit(
    product?.monetary?.functionalUnitPrice ?? unitPrice * exchangeRate,
  );
};

export const buildProductMonetarySnapshot = (
  product: ProductLike | null | undefined,
  context: ProductMonetaryContext = {},
): ProductMonetarySnapshot | null => {
  if (!product) return null;

  const functionalCurrency = normalizeSupportedDocumentCurrency(
    context.functionalCurrency,
    DEFAULT_FUNCTIONAL_CURRENCY,
  );
  const documentCurrency = resolveProductLineCurrency(product, functionalCurrency);
  const originalUnitPrice = resolveProductOriginalUnitPrice(product);

  if (originalUnitPrice <= 0) {
    return null;
  }

  if (documentCurrency === functionalCurrency) {
    return {
      documentCurrency,
      functionalCurrency,
      exchangeRate: 1,
      originalUnitPrice,
      functionalUnitPrice: originalUnitPrice,
      source: 'functional',
      effectiveAt: context.effectiveAt ?? Date.now(),
    };
  }

  const rateType = resolveAccountingRateTypeForOperation(context.operationType);
  const exchangeRate = toFiniteNumber(
    getAccountingRateValue(
      context.manualRatesByCurrency?.[documentCurrency],
      rateType,
    ),
  );

  if (exchangeRate <= 0) {
    return null;
  }

  return {
    documentCurrency,
    functionalCurrency,
    exchangeRate,
    originalUnitPrice,
    functionalUnitPrice: limit(originalUnitPrice * exchangeRate),
    source:
      rateType === 'buy'
        ? 'settings-manual-purchase'
        : 'settings-manual-sale',
    effectiveAt: context.effectiveAt ?? Date.now(),
  };
};

export const getCartProductCurrencies = (
  products: Array<ProductLike | null | undefined> = [],
  fallback: SupportedDocumentCurrency = DEFAULT_FUNCTIONAL_CURRENCY,
): SupportedDocumentCurrency[] =>
  Array.from(
    new Set(
      products
        .filter(Boolean)
        .map((product) => resolveProductLineCurrency(product, fallback)),
    ),
  );

export const getFunctionalProductSubtotal = (product: ProductLike): number =>
  limit(
    getTotal(product as never) *
      (toFiniteNumber(product?.monetary?.exchangeRate) || 1),
  );

export const getFunctionalProductTax = (
  product: ProductLike,
  taxReceiptEnabled = true,
): number =>
  limit(
    getTax(product as never, taxReceiptEnabled) *
      (toFiniteNumber(product?.monetary?.exchangeRate) || 1),
  );

export const getFunctionalProductDiscount = (product: ProductLike): number =>
  limit(
    getDiscount(product as never) *
      (toFiniteNumber(product?.monetary?.exchangeRate) || 1),
  );

export const getFunctionalProductTotal = (
  product: ProductLike,
  taxReceiptEnabled = true,
): number =>
  limit(
    getTotalPrice(product as never, taxReceiptEnabled) *
      (toFiniteNumber(product?.monetary?.exchangeRate) || 1),
  );

export const resolveInvoiceProductCurrency = (
  product: InvoiceProduct | null | undefined,
  invoiceData?: InvoiceData | null,
): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(
    product?.monetary?.documentCurrency ??
      product?.pricing?.currency ??
      product?.selectedSaleUnit?.pricing?.currency ??
      invoiceData?.documentCurrency ??
      invoiceData?.monetary?.functionalCurrency?.code,
    DEFAULT_FUNCTIONAL_CURRENCY,
  );

const shouldUseFunctionalDisplayAmounts = (
  product: ProductLike | null | undefined,
  documentCurrency: SupportedDocumentCurrency,
): boolean => {
  if (!product) return false;

  const normalizedDocumentCurrency = normalizeSupportedDocumentCurrency(
    documentCurrency,
    DEFAULT_FUNCTIONAL_CURRENCY,
  );
  const lineCurrency = resolveProductLineCurrency(product, normalizedDocumentCurrency);
  const functionalCurrency = resolveProductFunctionalCurrency(
    product,
    normalizedDocumentCurrency,
  );

  return (
    lineCurrency !== normalizedDocumentCurrency &&
    functionalCurrency === normalizedDocumentCurrency
  );
};

export const resolveDisplayUnitPriceForCurrency = (
  product: ProductLike | null | undefined,
  documentCurrency: SupportedDocumentCurrency,
): number =>
  shouldUseFunctionalDisplayAmounts(product, documentCurrency)
    ? resolveProductFunctionalUnitPrice(product)
    : resolveProductOriginalUnitPrice(product);

export const resolveDisplayTaxForCurrency = (
  product: ProductLike | null | undefined,
  documentCurrency: SupportedDocumentCurrency,
  taxReceiptEnabled = true,
): number =>
  shouldUseFunctionalDisplayAmounts(product, documentCurrency)
    ? getFunctionalProductTax(product as ProductLike, taxReceiptEnabled)
    : getTax(product as never, taxReceiptEnabled);

export const resolveDisplayTotalForCurrency = (
  product: ProductLike | null | undefined,
  documentCurrency: SupportedDocumentCurrency,
  taxReceiptEnabled = true,
): number =>
  shouldUseFunctionalDisplayAmounts(product, documentCurrency)
    ? getFunctionalProductTotal(product as ProductLike, taxReceiptEnabled)
    : getTotalPrice(product as never, taxReceiptEnabled);

export const resolveInvoiceDisplayedUnitPrice = (
  product: InvoiceProduct | null | undefined,
  invoiceData?: InvoiceData | null,
): number =>
  resolveDisplayUnitPriceForCurrency(
    product,
    resolveInvoiceDocumentCurrency(invoiceData),
  );

export const resolveInvoiceDisplayedTax = (
  product: InvoiceProduct | null | undefined,
  invoiceData?: InvoiceData | null,
  taxReceiptEnabled = true,
): number =>
  resolveDisplayTaxForCurrency(
    product,
    resolveInvoiceDocumentCurrency(invoiceData),
    taxReceiptEnabled,
  );

export const resolveInvoiceDisplayedTotal = (
  product: InvoiceProduct | null | undefined,
  invoiceData?: InvoiceData | null,
  taxReceiptEnabled = true,
): number =>
  resolveDisplayTotalForCurrency(
    product,
    resolveInvoiceDocumentCurrency(invoiceData),
    taxReceiptEnabled,
  );

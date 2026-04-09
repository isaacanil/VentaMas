import type { Product } from '@/features/cart/types';
import {
  buildProductMonetarySnapshot,
  getCartProductCurrencies,
  type MonetaryRateConfig,
} from '@/utils/accounting/lineMonetary';
import {
  DEFAULT_FUNCTIONAL_CURRENCY,
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';

const normalizeCurrency = (value: unknown): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(value, DEFAULT_FUNCTIONAL_CURRENCY);

type PricingResolutionSource = 'product' | 'saleUnit';

interface DocumentPricingResolution {
  eligible: boolean;
  product: Product | null;
  reason: string | null;
  documentCurrency: SupportedDocumentCurrency;
  resolvedCurrency: SupportedDocumentCurrency;
  resolvedFrom: PricingResolutionSource;
  mixedCurrencySale: boolean;
}

interface DocumentPricingOptions {
  hasCartProducts?: boolean;
  functionalCurrency?: SupportedDocumentCurrency;
  manualRatesByCurrency?: Partial<
    Record<SupportedDocumentCurrency, MonetaryRateConfig>
  >;
  currentCartCurrencies?: SupportedDocumentCurrency[];
}

const resolveActivePricingSource = (
  product: Product,
): {
  source: PricingResolutionSource;
  currency: SupportedDocumentCurrency;
} => {
  const productCurrency = normalizeCurrency(product?.pricing?.currency);

  if (product?.selectedSaleUnit?.pricing) {
    return {
      source: 'saleUnit',
      currency: normalizeCurrency(
        product.selectedSaleUnit.pricing.currency ?? productCurrency,
      ),
    };
  }

  return {
    source: 'product',
    currency: productCurrency,
  };
};

export const resolveProductForCartDocumentCurrency = (
  product: Product,
  documentCurrency: SupportedDocumentCurrency,
  options: DocumentPricingOptions = {},
): DocumentPricingResolution => {
  const { source, currency } = resolveActivePricingSource(product);
  const hasCartProducts = options.hasCartProducts === true;
  const functionalCurrency = normalizeCurrency(
    options.functionalCurrency ?? documentCurrency,
  );
  const mixedCurrencies = getCartProductCurrencies(
    [
      ...(options.currentCartCurrencies ?? []),
      currency,
    ].map((value) => ({ pricing: { currency: value } })),
    functionalCurrency,
  );
  const mixedCurrencySale = mixedCurrencies.length > 1;
  const effectiveDocumentCurrency = mixedCurrencySale
    ? functionalCurrency
    : !hasCartProducts && documentCurrency === DEFAULT_FUNCTIONAL_CURRENCY
      ? currency
      : documentCurrency;
  const monetary = buildProductMonetarySnapshot(product, {
    functionalCurrency,
    manualRatesByCurrency: options.manualRatesByCurrency,
    operationType: 'sale',
  });

  if (!monetary) {
    const reason =
      currency === functionalCurrency
        ? `Este producto no tiene un precio valido en ${currency}.`
        : `No hay tasa de venta ${currency} -> ${functionalCurrency} configurada para agregar este producto.`;

    return {
      eligible: false,
      documentCurrency: effectiveDocumentCurrency,
      product: null,
      reason,
      resolvedCurrency: currency,
      resolvedFrom: source,
      mixedCurrencySale,
    };
  }

  return {
    eligible: true,
    documentCurrency: effectiveDocumentCurrency,
    reason: null,
    resolvedCurrency: currency,
    resolvedFrom: source,
    mixedCurrencySale,
    product: {
      ...product,
      monetary,
      pricing: product.pricing
        ? {
            ...product.pricing,
            currency: normalizeCurrency(product.pricing.currency ?? currency),
          }
        : product.pricing,
      selectedSaleUnit: product.selectedSaleUnit
        ? {
            ...product.selectedSaleUnit,
            pricing: {
              ...product.selectedSaleUnit.pricing,
              currency,
            },
          }
        : product.selectedSaleUnit,
      pricingSource: {
        mode: mixedCurrencySale ? 'mixed-currency' : 'direct-price',
        baseCurrency: currency,
        functionalCurrency,
        resolvedFrom: source,
      },
    },
  };
};

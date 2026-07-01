import {
  normalizeSaleUnitForCart,
  resolveProductBaseQuantity,
  resolveSaleUnitConversionFactor,
} from '@/domain/products/saleUnits';
import {
  PRODUCT_ITEM_TYPE_OPTIONS,
  initTaxes,
} from '@/domain/products/productDefaults';
import { normalizeSupportedDocumentCurrency } from '@/utils/accounting/currencies';
import type {
  ProductItemType,
  ProductPricing,
  ProductRecord,
  ProductSaleUnit,
  SupportedDocumentCurrency,
} from '@/types/products';

const DEFAULT_ITEM_TYPE: ProductItemType =
  (PRODUCT_ITEM_TYPE_OPTIONS[0]?.value as ProductItemType) || 'product';

export const toFiniteNumber = (rawValue: unknown, fallback = 0): number => {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeTaxPercentage = (value: unknown): number => {
  const numeric = toFiniteNumber(value, initTaxes[0]);
  if (numeric === 0) return 0;
  const scaled = Math.abs(numeric) < 1 ? numeric * 100 : numeric;
  return Math.round(scaled * 100) / 100;
};

export const parseBooleanValue = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['sí', 'si', 's\ufffd', 'yes', 'true', '1'].includes(normalized))
      return true;
    if (['no', 'false', '0'].includes(normalized)) return false;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return null;
};

export const normalizeItemType = (
  value: unknown,
  rawType?: unknown,
): ProductItemType => {
  const itemTypeValues = PRODUCT_ITEM_TYPE_OPTIONS.map(
    (option) => option.value,
  );
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if ((itemTypeValues as string[]).includes(normalized)) {
      return normalized as ProductItemType;
    }
    if (['producto', 'productos', 'product', 'products'].includes(normalized))
      return 'product';
    if (['servicio', 'servicios', 'service', 'services'].includes(normalized))
      return 'service';
    if (
      ['combo', 'combos', 'combinado', 'combinados', 'kit', 'bundle'].includes(
        normalized,
      )
    )
      return 'combo';
  }
  if (typeof rawType === 'string') {
    const lowered = rawType.trim().toLowerCase();
    if (lowered.includes('serv')) return 'service';
    if (lowered.includes('combo') || lowered.includes('kit')) return 'combo';
  }
  return DEFAULT_ITEM_TYPE;
};

export const normalizeTrackInventoryValue = (
  value: unknown,
  itemType: ProductItemType,
): boolean => {
  const parsed = parseBooleanValue(value);
  if (parsed !== null) return parsed;
  return itemType === 'service' ? false : true;
};

export const sanitizeValue = (value: unknown): unknown => {
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === 'object') {
    if (value instanceof Date) return value;
    if (
      typeof (value as { toDate?: unknown }).toDate === 'function' &&
      typeof (value as { toMillis?: unknown }).toMillis === 'function'
    ) {
      return value;
    }
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, val]) => {
        const sanitized = sanitizeValue(val);
        if (sanitized !== undefined) {
          acc[key] = sanitized;
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }
  return value;
};

export const normalizePricingForPersistence = (
  pricing: ProductPricing = {},
): ProductPricing => {
  if (!pricing || typeof pricing !== 'object') return {};
  const normalized: ProductPricing = {
    ...pricing,
  };
  normalized.currency = normalizeSupportedDocumentCurrency(
    normalized.currency,
  ) as SupportedDocumentCurrency;
  normalized.cost = toFiniteNumber(normalized.cost, 0);
  const canonicalListPrice = resolveCanonicalListPrice(normalized);
  normalized.listPrice = canonicalListPrice;
  normalized.price = canonicalListPrice;
  normalized.avgPrice = toFiniteNumber(normalized.avgPrice, canonicalListPrice);
  normalized.minPrice = toFiniteNumber(normalized.minPrice, canonicalListPrice);
  normalized.cardPrice = toFiniteNumber(normalized.cardPrice, 0);
  normalized.offerPrice = toFiniteNumber(normalized.offerPrice, 0);
  normalized.tax = normalizeTaxPercentage(normalized.tax);
  return normalized;
};

export const resolveCanonicalListPrice = (
  pricing: ProductPricing | null | undefined,
): number => {
  if (!pricing || typeof pricing !== 'object') return 0;
  const price = toFiniteNumber(pricing.price, 0);
  const listPrice = toFiniteNumber(pricing.listPrice, 0);
  return listPrice > 0 ? listPrice : price > 0 ? price : 0;
};

export const normalizePricingForRead = (
  pricing: ProductPricing = {},
): ProductPricing => normalizePricingForPersistence(pricing);

export const normalizeProductForPersistence = (
  rawProduct: ProductRecord,
): ProductRecord => {
  if (!rawProduct || typeof rawProduct !== 'object') return rawProduct;
  const normalizedProduct: ProductRecord = {
    ...rawProduct,
  };
  if (normalizedProduct.pricing) {
    normalizedProduct.pricing = normalizePricingForPersistence(
      normalizedProduct.pricing,
    );
  }
  if (Array.isArray(normalizedProduct.saleUnits)) {
    normalizedProduct.saleUnits = normalizedProduct.saleUnits.map((unit) => {
      if (!unit || typeof unit !== 'object') return unit as ProductSaleUnit;
      const normalizedUnit: ProductSaleUnit = normalizeSaleUnitForCart(unit);
      if (normalizedUnit.pricing) {
        normalizedUnit.pricing = normalizePricingForPersistence(
          normalizedUnit.pricing,
        );
      }
      return normalizedUnit;
    });
  }
  if (normalizedProduct.selectedSaleUnit) {
    normalizedProduct.selectedSaleUnit = {
      ...normalizeSaleUnitForCart(normalizedProduct.selectedSaleUnit),
      pricing: normalizePricingForPersistence(
        normalizedProduct.selectedSaleUnit.pricing || {},
      ),
    };
  }
  normalizedProduct.stock = toFiniteNumber(normalizedProduct.stock, 0);
  if (
    normalizedProduct.totalUnits !== null &&
    normalizedProduct.totalUnits !== undefined
  ) {
    normalizedProduct.totalUnits = toFiniteNumber(
      normalizedProduct.totalUnits,
      0,
    );
  }
  normalizedProduct.packSize = toFiniteNumber(normalizedProduct.packSize, 1);
  normalizedProduct.itemType = normalizeItemType(
    normalizedProduct.itemType,
    normalizedProduct.type,
  );
  normalizedProduct.trackInventory = normalizeTrackInventoryValue(
    normalizedProduct.trackInventory,
    normalizedProduct.itemType,
  );
  normalizedProduct.amountToBuy = toFiniteNumber(
    normalizedProduct.amountToBuy,
    1,
  );
  if (normalizedProduct.selectedSaleUnit) {
    normalizedProduct.selectedSaleUnit.conversionFactorToBase =
      resolveSaleUnitConversionFactor(normalizedProduct.selectedSaleUnit);
    normalizedProduct.selectedSaleUnit.quantity =
      normalizedProduct.selectedSaleUnit.conversionFactorToBase;
  }
  normalizedProduct.baseQuantity =
    resolveProductBaseQuantity(normalizedProduct);
  return normalizedProduct;
};

export const normalizeProductForRead = (
  rawProduct: ProductRecord,
): ProductRecord => normalizeProductForPersistence(rawProduct);

export const buildNormalizedProductSnapshot = (
  product: ProductRecord | null | undefined,
): ProductRecord | null | undefined => {
  if (!product) return product;
  return normalizeProductForPersistence({
    ...product,
    name: product?.name ?? product?.productName ?? '',
    qrcode: product?.qrcode ?? product?.qrCode ?? '',
  });
};

export const buildSanitizedProductForSubmit = (
  product: ProductRecord | null | undefined,
): ProductRecord | undefined => {
  if (!product) return undefined;
  const sanitized = sanitizeValue({
    ...product,
    name: product?.name ?? product?.productName ?? '',
    qrcode: product?.qrcode ?? product?.qrCode ?? '',
  }) as ProductRecord;
  return normalizeProductForPersistence(sanitized);
};

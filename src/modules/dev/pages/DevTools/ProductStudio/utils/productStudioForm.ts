import {
  normalizeProductBrandName,
  resolveBrandSelection,
  type ProductBrandOptionSource,
} from '@/domain/products/brandSelection';
import { normalizeSaleUnitForCart } from '@/domain/products/saleUnits';
import {
  buildNormalizedProductSnapshot,
  normalizeItemType,
  normalizeTrackInventoryValue,
} from '@/domain/products/normalization';
import {
  normalizeProductPricingCurrency,
  normalizeProductPricingTax,
  toProductPricingNumber,
  type ProductPricingFormValues,
} from '@/domain/products/pricingForm';
import type {
  PricingTax,
  ProductPricing,
  ProductRecord,
  ProductSaleUnit,
  ProductWarranty,
  ProductWeightDetail,
} from '@/types/products';
import type { UserWithBusiness } from '@/types/users';
import type {
  ProductFormValues,
  ProductSaleUnitFormValues,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/form/ProductForm';
import { isRecord } from '@/utils/object/record';
import { nanoid } from 'nanoid';

type ProductPatch = Partial<ProductRecord> & Record<string, unknown>;
import type { ProductSnapshot } from '@/modules/dev/pages/DevTools/ProductStudio/hooks/useProductPreviewMetrics';

type FormErrorField = { name?: (string | number)[]; errors?: string[] };

export const hasBusinessId = (value: unknown): value is UserWithBusiness => {
  if (!isRecord(value)) return false;
  const businessId = value.businessID;
  return typeof businessId === 'string' && businessId.trim().length > 0;
};

export const hasUserUid = (value: unknown): value is { uid: string } => {
  if (!isRecord(value)) return false;
  const uid = value.uid;
  return typeof uid === 'string' && uid.trim().length > 0;
};

export const isFormValidationError = (
  value: unknown,
): value is { errorFields: FormErrorField[] } => {
  if (!value || typeof value !== 'object') return false;
  const errorFields = (value as { errorFields?: unknown }).errorFields;
  return Array.isArray(errorFields);
};

export const normalizeTaxValue = (tax: PricingTax | null | undefined): number =>
  normalizeProductPricingTax(tax);

export const normalizePricingForForm = (
  pricing: ProductPricing | undefined,
): ProductPricingFormValues | undefined => {
  if (!pricing) return undefined;
  const { avgPrice, currency, tax, ...rest } = pricing;
  return {
    ...rest,
    currency: normalizeProductPricingCurrency(currency),
    tax: normalizeTaxValue(tax),
    midPrice: avgPrice ?? null,
  };
};

const hasNumericValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== '';

export const normalizePricingForUpdate = (
  pricing: ProductPricingFormValues,
): ProductPricing => {
  const {
    currency,
    midPrice,
    tax,
    cost,
    listPrice,
    minPrice,
    cardPrice,
    offerPrice,
    ...passthrough
  } = pricing;
  const result: ProductPricing = { ...passthrough };

  result.currency = normalizeProductPricingCurrency(currency);
  result.tax = normalizeTaxValue(tax);

  if (hasNumericValue(midPrice))
    result.avgPrice = toProductPricingNumber(midPrice);
  if (hasNumericValue(cost)) result.cost = toProductPricingNumber(cost);
  if (hasNumericValue(listPrice)) {
    const normalizedListPrice = toProductPricingNumber(listPrice);
    result.listPrice = normalizedListPrice;
    result.price = normalizedListPrice;
  }
  if (hasNumericValue(minPrice))
    result.minPrice = toProductPricingNumber(minPrice);
  if (hasNumericValue(cardPrice))
    result.cardPrice = toProductPricingNumber(cardPrice);
  if (hasNumericValue(offerPrice)) {
    result.offerPrice = toProductPricingNumber(offerPrice);
  }

  return result;
};

const readPositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeSaleUnitPricingForForm = (
  pricing: ProductPricing | undefined,
): ProductPricingFormValues | undefined => {
  const normalized = normalizePricingForForm(pricing);
  if (!normalized) return undefined;
  return {
    ...normalized,
    listPrice: normalized.listPrice ?? pricing?.price ?? 0,
  };
};

export const normalizeSaleUnitsForForm = (
  saleUnits: ProductSaleUnit[] | undefined,
): ProductSaleUnitFormValues[] => {
  if (!Array.isArray(saleUnits)) return [];
  return saleUnits.map((unit, index) => {
    const normalizedUnit = normalizeSaleUnitForCart({
      ...unit,
      id:
        typeof unit?.id === 'string' && unit.id.trim()
          ? unit.id
          : `sale-unit-${index + 1}`,
      pricing: unit?.pricing || {},
    });

    return {
      ...normalizedUnit,
      pricing: normalizeSaleUnitPricingForForm(normalizedUnit.pricing) || {},
    };
  });
};

export const normalizeSaleUnitsForUpdate = (
  value: unknown,
  product?: ProductRecord | null,
): ProductSaleUnit[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((rawUnit) => {
    const rawPricing = isRecord(rawUnit.pricing) ? rawUnit.pricing : {};
    const conversionFactorToBase = readPositiveNumber(
      rawUnit.conversionFactorToBase ?? rawUnit.quantity,
      1,
    );
    const pricing = normalizePricingForUpdate({
      ...(rawPricing as ProductPricingFormValues),
      currency: rawPricing.currency ?? product?.pricing?.currency,
      tax: rawPricing.tax ?? product?.pricing?.tax ?? 0,
    });
    const price = pricing.price ?? pricing.listPrice;

    return normalizeSaleUnitForCart(
      {
        ...(rawUnit as Partial<ProductSaleUnit>),
        id:
          typeof rawUnit.id === 'string' && rawUnit.id.trim()
            ? rawUnit.id
            : nanoid(),
        unitName:
          typeof rawUnit.unitName === 'string' ? rawUnit.unitName.trim() : '',
        quantity: conversionFactorToBase,
        conversionFactorToBase,
        allowFractional: rawUnit.allowFractional === true,
        active: rawUnit.active !== false,
        pricing,
      } as ProductSaleUnit,
      price,
    );
  });
};

export const normalizeProductForStudioSubmit = (
  product: ProductRecord | null | undefined,
): ProductRecord | null | undefined => {
  if (!product) return product;

  const pricingForForm = normalizePricingForForm(product.pricing);

  return {
    ...product,
    pricing: pricingForForm
      ? normalizePricingForUpdate(pricingForForm)
      : product.pricing,
    saleUnits: Array.isArray(product.saleUnits)
      ? normalizeSaleUnitsForUpdate(product.saleUnits, product)
      : product.saleUnits,
  };
};

export const getNormalizedProductValues = (
  product: ProductRecord | null | undefined,
): Partial<ProductFormValues> => {
  const snapshot = buildNormalizedProductSnapshot(product);
  if (!snapshot) return {};
  return {
    ...snapshot,
    pricing: normalizePricingForForm(product?.pricing),
    saleUnits: normalizeSaleUnitsForForm(snapshot.saleUnits),
    weightDetail: snapshot.weightDetail as ProductWeightDetail | undefined,
    warranty: snapshot.warranty as ProductWarranty | undefined,
  };
};

export const toProductPreviewSnapshot = (
  source: ProductRecord | null | undefined,
): ProductSnapshot | null | undefined => {
  if (!source) return undefined;
  const pricing = source.pricing;
  const rawTax = pricing?.tax;
  const computedTax = Number(rawTax || 0);
  const normalizedTax: number | string = Number.isNaN(computedTax)
    ? 'NaN'
    : computedTax;

  return {
    pricing: pricing ? { ...pricing, tax: normalizedTax } : undefined,
    stock: source.stock,
    trackInventory: source.trackInventory,
    image: source.image,
    name: source.name,
    brand: source.brand,
    category: source.category,
    type: source.type,
    isVisible: source.isVisible,
  };
};

export const getChangedProductPatch = ({
  key,
  value,
  product,
  productBrands,
}: {
  key: keyof ProductFormValues;
  value: unknown;
  product: ProductRecord | null | undefined;
  productBrands?: ProductBrandOptionSource[];
}): ProductPatch | null => {
  if (key === 'weightDetail') {
    return {
      weightDetail: {
        ...product?.weightDetail,
        ...(isRecord(value) ? (value as ProductWeightDetail) : {}),
      },
    };
  }

  if (key === 'warranty') {
    return {
      warranty: {
        ...product?.warranty,
        ...(isRecord(value) ? (value as ProductWarranty) : {}),
      },
    };
  }

  if (key === 'saleUnits') {
    return {
      saleUnits: normalizeSaleUnitsForUpdate(value, product),
    };
  }

  if (key === 'itemType') {
    const normalizedItemType = normalizeItemType(value);
    const trackInventoryValue =
      normalizedItemType === 'service'
        ? false
        : normalizeTrackInventoryValue(
            product?.trackInventory,
            normalizedItemType,
          );

    return {
      itemType: normalizedItemType,
      trackInventory: trackInventoryValue,
    };
  }

  if (key === 'brand') {
    return {
      brand: normalizeProductBrandName(value),
    };
  }

  if (key === 'brandId') {
    const resolvedBrand = resolveBrandSelection({
      value,
      product,
      productBrands,
    });

    return {
      brandId: resolvedBrand.brandId,
      brand: resolvedBrand.brand,
    };
  }

  return { [key]: value } as ProductPatch;
};

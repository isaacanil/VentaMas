import {
  normalizeProductBrandName,
  resolveBrandSelection,
  type ProductBrandOptionSource,
} from '@/domain/products/brandSelection';
import {
  buildNormalizedProductSnapshot,
  normalizeItemType,
  normalizeTrackInventoryValue,
} from '@/domain/products/normalization';
import {
  normalizeProductPricingTax,
  toProductPricingNumber,
  type ProductPricingFormValues,
} from '@/domain/products/pricingForm';
import type {
  PricingTax,
  ProductPricing,
  ProductRecord,
  ProductWarranty,
  ProductWeightDetail,
} from '@/types/products';
import type { UserWithBusiness } from '@/types/users';
import type { ProductFormValues } from '@/modules/dev/pages/DevTools/ProductStudio/components/form/ProductForm';
import { isRecord } from '@/utils/object/record';

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

export const normalizeTaxValue = (
  tax: PricingTax | null | undefined,
): number => normalizeProductPricingTax(tax);

export const normalizePricingForForm = (
  pricing: ProductPricing | undefined,
): ProductPricingFormValues | undefined => {
  if (!pricing) return undefined;
  const { avgPrice, tax, ...rest } = pricing;
  return {
    ...rest,
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

  result.tax = normalizeTaxValue(tax);

  if (hasNumericValue(midPrice)) result.avgPrice = toProductPricingNumber(midPrice);
  if (hasNumericValue(cost)) result.cost = toProductPricingNumber(cost);
  if (hasNumericValue(listPrice)) result.listPrice = toProductPricingNumber(listPrice);
  if (hasNumericValue(minPrice)) result.minPrice = toProductPricingNumber(minPrice);
  if (hasNumericValue(cardPrice)) result.cardPrice = toProductPricingNumber(cardPrice);
  if (hasNumericValue(offerPrice)) {
    result.offerPrice = toProductPricingNumber(offerPrice);
  }

  return result;
};

export const getNormalizedProductValues = (
  product: ProductRecord | null | undefined,
): Partial<ProductFormValues> => {
  const snapshot = buildNormalizedProductSnapshot(product);
  if (!snapshot) return {};
  return {
    ...snapshot,
    pricing: normalizePricingForForm(product?.pricing),
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

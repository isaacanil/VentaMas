import {
  BRAND_DEFAULT_OPTION_VALUE,
  BRAND_LEGACY_OPTION_VALUE,
} from '@/components/modals/ProductForm/constants/brandOptions';
import {
  PRODUCT_BRAND_DEFAULT,
  type ChangeProductData,
} from '@/features/updateProduct/updateProductSlice';
import {
  buildNormalizedProductSnapshot,
  normalizeItemType,
  normalizeTrackInventoryValue,
} from '@/utils/products/normalization';
import type {
  PricingTax,
  ProductPricing,
  ProductRecord,
  ProductWarranty,
  ProductWeightDetail,
} from '@/types/products';
import type { UserWithBusiness } from '@/types/users';
import type {
  PricingValues,
  ProductFormValues,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/form/ProductForm';
import type { ProductSnapshot } from '@/modules/dev/pages/DevTools/ProductStudio/hooks/useProductPreviewMetrics';

type FormErrorField = { name?: (string | number)[]; errors?: string[] };

type BrandOptionSource = { id?: string | null; name?: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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

const toNumberValue = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const normalizeTaxValue = (
  tax: PricingTax | null | undefined,
): number => {
  if (tax == null) return 0;
  if (typeof tax === 'object') {
    const nested = (tax as { tax?: unknown }).tax;
    return toNumberValue(nested);
  }
  return toNumberValue(tax);
};

export const normalizePricingForForm = (
  pricing: ProductPricing | undefined,
): PricingValues | undefined => {
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
  pricing: PricingValues,
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

  if (hasNumericValue(midPrice)) result.avgPrice = toNumberValue(midPrice);
  if (hasNumericValue(cost)) result.cost = toNumberValue(cost);
  if (hasNumericValue(listPrice)) result.listPrice = toNumberValue(listPrice);
  if (hasNumericValue(minPrice)) result.minPrice = toNumberValue(minPrice);
  if (hasNumericValue(cardPrice)) result.cardPrice = toNumberValue(cardPrice);
  if (hasNumericValue(offerPrice)) {
    result.offerPrice = toNumberValue(offerPrice);
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
  productBrands?: BrandOptionSource[];
}): ChangeProductData['product'] | null => {
  if (key === 'weightDetail') {
    return {
      weightDetail: {
        ...(product?.weightDetail ?? {}),
        ...(isRecord(value) ? (value as ProductWeightDetail) : {}),
      },
    };
  }

  if (key === 'warranty') {
    return {
      warranty: {
        ...(product?.warranty ?? {}),
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
    const normalizedBrand =
      typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
    return {
      brand: normalizedBrand || PRODUCT_BRAND_DEFAULT,
    };
  }

  if (key === 'brandId') {
    const normalizedId = typeof value === 'string' ? value.trim() : null;
    let resolvedBrand = PRODUCT_BRAND_DEFAULT;

    if (normalizedId && normalizedId !== BRAND_DEFAULT_OPTION_VALUE) {
      if (normalizedId === BRAND_LEGACY_OPTION_VALUE && product?.brand) {
        resolvedBrand = product.brand;
      } else {
        const brandMatch = productBrands?.find(
          (brand) => brand?.id === normalizedId,
        );
        if (typeof brandMatch?.name === 'string') {
          resolvedBrand = brandMatch.name.trim();
        }
      }
    }

    return {
      brandId: normalizedId,
      brand: resolvedBrand || PRODUCT_BRAND_DEFAULT,
    };
  }

  return { [key]: value } as ChangeProductData['product'];
};

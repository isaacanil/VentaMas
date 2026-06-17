import { PRODUCT_BRAND_DEFAULT } from './productDefaults';

export const BRAND_DEFAULT_OPTION_VALUE = '__brand_option_default__';
export const BRAND_LEGACY_OPTION_VALUE = '__brand_option_legacy__';

export interface BrandOption {
  value: string;
  label: string;
}

export interface ProductBrandInput {
  brandId?: string | null;
  brand?: string | null;
}

export interface ProductBrandOptionSource {
  id?: string | null;
  name?: string | null;
}

export interface ResolvedBrandSelection {
  brandId: string | null;
  brand: string;
}

export const normalizeProductBrandName = (value: unknown): string => {
  const normalizedBrand =
    typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

  return normalizedBrand || PRODUCT_BRAND_DEFAULT;
};

export const buildBrandOptions = (
  productBrands: ProductBrandOptionSource[] = [],
  product?: ProductBrandInput | null,
): BrandOption[] => {
  const normalizedBrands = Array.isArray(productBrands)
    ? productBrands
        .map(({ id, name }) => ({
          value: typeof id === 'string' ? id : '',
          label: typeof name === 'string' ? name.trim() : '',
        }))
        .filter(({ value, label }) => value && label)
    : [];

  const options = [
    {
      value: BRAND_DEFAULT_OPTION_VALUE,
      label: PRODUCT_BRAND_DEFAULT,
    },
    ...normalizedBrands,
  ];

  const hasLegacyBrand = Boolean(
    !product?.brandId &&
      product?.brand &&
      product.brand !== PRODUCT_BRAND_DEFAULT,
  );

  if (hasLegacyBrand) {
    options.push({
      value: BRAND_LEGACY_OPTION_VALUE,
      label: product?.brand || PRODUCT_BRAND_DEFAULT,
    });
  }

  return options;
};

export const resolveBrandSelection = ({
  value,
  product,
  productBrands = [],
}: {
  value: unknown;
  product?: ProductBrandInput | null;
  productBrands?: ProductBrandOptionSource[];
}): ResolvedBrandSelection => {
  const normalizedId = typeof value === 'string' ? value.trim() : null;
  let resolvedBrand = PRODUCT_BRAND_DEFAULT;

  if (normalizedId && normalizedId !== BRAND_DEFAULT_OPTION_VALUE) {
    if (normalizedId === BRAND_LEGACY_OPTION_VALUE && product?.brand) {
      resolvedBrand = product.brand;
    } else {
      const brandMatch = productBrands.find(
        (brand) => brand?.id === normalizedId,
      );
      resolvedBrand = normalizeProductBrandName(brandMatch?.name);
    }
  }

  return {
    brandId: normalizedId,
    brand: resolvedBrand || PRODUCT_BRAND_DEFAULT,
  };
};

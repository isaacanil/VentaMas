// @ts-nocheck
import { PRODUCT_BRAND_DEFAULT } from '@/features/updateProduct/updateProductSlice';
import {
  BRAND_DEFAULT_OPTION_VALUE,
  BRAND_LEGACY_OPTION_VALUE,
} from '@/views/component/modals/ProductForm/constants/brandOptions';

export const brandFieldMetaByType = (typeValue) => {
  const normalizedType = (typeValue || '').toLowerCase();
  if (
    normalizedType.includes('medic') ||
    normalizedType.includes('farm') ||
    normalizedType.includes('salud')
  ) {
    return {
      label: 'Marca / Laboratorio',
      placeholder: 'Pfizer, Genfar, Laboratorio ACME…',
      helper:
        'Indica la marca comercial o laboratorio responsable del producto.',
    };
  }
  if (
    normalizedType.includes('bebida') ||
    normalizedType.includes('alimento') ||
    normalizedType.includes('consumo')
  ) {
    return {
      label: 'Marca / Casa comercial',
      placeholder: 'Coca-Cola, La Costeña, Artesanal…',
      helper: 'Registra la casa comercial o fabricante.',
    };
  }
  if (
    normalizedType.includes('cosm') ||
    normalizedType.includes('higiene') ||
    normalizedType.includes('belleza')
  ) {
    return {
      label: 'Marca / Línea',
      placeholder: "L'Oréal, Dove, Genérico…",
      helper: 'Define la línea comercial o fabricante.',
    };
  }
  return {
    label: 'Marca',
    placeholder: 'Samsung, Genérico, Marca propia…',
    helper: 'Registra la marca o referencia principal.',
  };
};

export const buildBrandOptions = (productBrands = [], product) => {
  const normalizedBrands = Array.isArray(productBrands)
    ? productBrands
        .map(({ id, name }) => ({
          value: id,
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
      label: product.brand,
    });
  }

  return options;
};

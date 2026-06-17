import type { ProductItemType } from '@/types/products';

export const PRODUCT_BRAND_DEFAULT = 'Sin marca';

export const PRODUCT_ITEM_TYPE_OPTIONS: Array<{
  value: ProductItemType;
  label: string;
}> = [
  { value: 'product', label: 'Producto' },
  { value: 'service', label: 'Servicio' },
  { value: 'combo', label: 'Combo' },
];

export const DEFAULT_PRODUCT_ITEM_TYPE = PRODUCT_ITEM_TYPE_OPTIONS[0].value;

export type WarrantyOption = {
  value: string;
  label: string;
};

export const warrantyOptions: WarrantyOption[] = [
  {
    value: 'days',
    label: 'Días',
  },
  {
    value: 'weeks',
    label: 'Semanas',
  },
  {
    value: 'months',
    label: 'Meses',
  },
  {
    value: 'years',
    label: 'Años',
  },
];

const UNITS_MAP: Record<string, string> = {
  day: 'día',
  days: 'días',
  week: 'semana',
  weeks: 'semanas',
  month: 'mes',
  months: 'meses',
  year: 'año',
  years: 'años',
};

export const convertTimeToSpanish = (
  cantidad: number | string,
  unidad: string,
) => {
  if (!unidad) return 'Unidad no reconocida';

  const normalizedUnit = unidad.toLowerCase();
  const unidadEnEspanol = UNITS_MAP[normalizedUnit];

  if (!unidadEnEspanol) return 'Unidad no reconocida';

  const amount = Number(cantidad);
  if (Number.isNaN(amount)) return `0 ${unidadEnEspanol}`;

  return amount === 1 ? `1 ${unidadEnEspanol}` : `${amount} ${unidadEnEspanol}`;
};

export const initTaxes = [0, 16, 18];

export const taxLabel = (tax: number) => {
  switch (tax) {
    case 0:
      return 'Exento';
    case 16:
      return 'IVA 16%';
    case 18:
      return 'IVA 18%';
    default:
      return 'Exento';
  }
};

import { warrantyOptions } from '@/components/modals/ProductForm/components/sections/warranty.helpers';
import type { TransformConfig } from '@/utils/import/types';

type ProductItemType = 'product' | 'service' | 'combo';

const ITEM_TYPE_MAP: Record<string, ProductItemType> = {
  product: 'product',
  producto: 'product',
  products: 'product',
  service: 'service',
  servicio: 'service',
  servicios: 'service',
  combo: 'combo',
  combinado: 'combo',
  combinados: 'combo',
  kit: 'combo',
  bundle: 'combo',
};

const normalizeItemType = (value: unknown): ProductItemType => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (ITEM_TYPE_MAP[normalized]) {
      return ITEM_TYPE_MAP[normalized];
    }
  }
  return 'product';
};

const toNumberValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseCurrency = (value: unknown, stripPercent = false): number => {
  if (value === null || value === undefined || value === '') return 0;
  const raw = typeof value === 'string' ? value : String(value);
  const pattern = stripPercent
    ? /[$€£¥₩₹₽%]/g
    : /[$€£¥₩₹₽]/g;
  const cleaned = raw.replace(pattern, '').replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toInteger = (value: unknown, fallback = 0): number => {
  const parsed = toNumberValue(value);
  return parsed === null ? fallback : Math.trunc(parsed);
};

const toFloat = (value: unknown, fallback = 0): number => {
  const parsed = toNumberValue(value);
  return parsed === null ? fallback : parsed;
};

export const transformConfig: TransformConfig = [
  {
    field: 'name',
    transform: (value) => value || '',
  },
  {
    field: 'image',
    transform: (value) => value || '',
  },
  {
    field: 'category',
    transform: (value) => value || '',
  },
  {
    field: 'itemType',
    transform: normalizeItemType,
  },
  {
    field: 'pricing.cost',
    transform: (value) => parseCurrency(value),
  },
  {
    field: 'pricing.price',
    transform: (value) => parseCurrency(value),
  },
  {
    field: 'pricing.listPrice',
    transform: (value) => parseCurrency(value),
  },
  {
    field: 'pricing.avgPrice',
    transform: (value) => parseCurrency(value),
  },
  {
    field: 'pricing.minPrice',
    transform: (value) => parseCurrency(value),
  },
  {
    field: 'pricing.cardPrice',
    transform: (value) => parseCurrency(value),
  },
  {
    field: 'pricing.offerPrice',
    transform: (value) => parseCurrency(value),
  },
  {
    field: 'pricing.tax',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      const rawNumber =
        typeof value === 'string'
          ? parseCurrency(value, true)
          : toNumberValue(value);
      if (rawNumber === null || !Number.isFinite(rawNumber)) return 0;
      const adjusted =
        rawNumber > 0 && rawNumber < 1 ? rawNumber * 100 : rawNumber;
      const normalized = Number.isFinite(adjusted) ? adjusted : 0;
      return Number.isFinite(normalized) ? Number(normalized.toFixed(2)) : 0;
    },
  },
  {
    field: 'promotions.start',
    transform: (value) => value || null,
  },
  {
    field: 'promotions.end',
    transform: (value) => value || null,
  },
  {
    field: 'promotions.discount',
    transform: (value) => parseCurrency(value, true),
  },
  {
    field: 'promotions.isActive',
    transform: (value) =>
      ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || false,
  },
  {
    field: 'weightDetail.isSoldByWeight',
    transform: (value) =>
      ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || false,
  },
  {
    field: 'weightDetail.weight',
    transform: (value) => parseCurrency(value),
  },
  {
    field: 'weightDetail.weightUnit',
    transform: (value) => value || 'lb',
  },
  {
    field: 'warranty.status',
    transform: (value) =>
      ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || false,
  },
  {
    field: 'warranty.quantity',
    transform: (value) => toInteger(value, 1),
  },
  {
    field: 'warranty.unit',
    transform: (value) => value || warrantyOptions[1].value,
  },
  {
    field: 'size',
    transform: (value) => value || '',
  },
  {
    field: 'type',
    transform: (value) => value || '',
  },
  {
    field: 'stock', // Nuevo
    transform: (value) => toInteger(value, 0),
  },
  {
    field: 'netContent',
    transform: (value) => value || '',
  },
  {
    field: 'amountToBuy',
    transform: (value) => toFloat(value, 1),
  },
  {
    field: 'createdBy', // Puedes decidir si necesitas transformar esto
    transform: (value) => value || 'unknown',
  },
  {
    field: 'id', // Probablemente no necesites transformar el ID
    transform: (value) => value || '',
  },
  {
    field: 'order',
    transform: (value) => toInteger(value, 1),
  },
  {
    field: 'isVisible',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return true;
      const normalized = value.toString().trim().toLowerCase();
      if (['sí', 'si', 'yes', 'true', '1'].includes(normalized)) return true;
      if (['no', 'false', '0'].includes(normalized)) return false;
      return true;
    },
  },
  {
    field: 'footer',
    transform: (value) => value || '',
  },
  {
    field: 'measurement',
    transform: (value) => value || '',
  },
  {
    field: 'trackInventory',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return null;
      const normalized = value.toString().trim().toLowerCase();
      if (['sí', 'si', 'yes', 'true', '1'].includes(normalized)) return true;
      if (['no', 'false', '0'].includes(normalized)) return false;
      return null;
    },
  },
  {
    field: 'restrictSaleWithoutStock',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return false;
      const normalized = value.toString().trim().toLowerCase();
      return ['sí', 'si', 'yes', 'true', '1'].includes(normalized);
    },
  },
  {
    field: 'qrcode',
    transform: (value) => value || '',
  },
  {
    field: 'barcode',
    transform: (value) => value || '',
  },
  {
    field: 'activeIngredients',
    transform: (value) => value || '',
  },

  // ... other fields that can be null or have specific default values
];

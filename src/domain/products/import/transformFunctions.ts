import { warrantyOptions } from '@/domain/products/productDefaults';
import {
  normalizeItemType,
  parseBooleanValue,
} from '@/domain/products/normalization';
import { parseLocalizedNumber } from '@/utils/import/parseLocalizedNumber';
import type { TransformConfig } from '@/utils/import/types';

const toNumberValue = (value: unknown): number | null => {
  if (value === '') return null;
  return parseLocalizedNumber(value, {
    allowAccountingNegative: false,
    mode: 'strict',
    removeWhitespace: false,
  });
};

const parseCurrency = (value: unknown, stripPercent = false): number => {
  if (value === '') return 0;
  const parsed = parseLocalizedNumber(value, {
    allowAccountingNegative: false,
    mode: 'prefix',
    stripCurrencySymbols: true,
    stripPercent,
  });
  return parsed ?? 0;
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
    transform: (value) => parseBooleanValue(value) ?? true,
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
    transform: (value) => parseBooleanValue(value),
  },
  {
    field: 'restrictSaleWithoutStock',
    transform: (value) => parseBooleanValue(value) ?? false,
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

import { warrantyOptions } from '../../../views/component/modals/ProductForm/components/sections/warranty.helpers';

const ITEM_TYPE_MAP = {
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

const normalizeItemType = (value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (ITEM_TYPE_MAP[normalized]) {
      return ITEM_TYPE_MAP[normalized];
    }
  }
  return 'product';
};

export const transformConfig = [
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
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      // Eliminar símbolos de moneda y espacios
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
  },
  {
    field: 'pricing.price',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      // Eliminar símbolos de moneda y espacios
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
  },
  {
    field: 'pricing.listPrice',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      // Eliminar símbolos de moneda y espacios
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
  },
  {
    field: 'pricing.avgPrice',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      // Eliminar símbolos de moneda y espacios
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
  },
  {
    field: 'pricing.minPrice',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      // Eliminar símbolos de moneda y espacios
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
  },
  {
    field: 'pricing.cardPrice',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
  },
  {
    field: 'pricing.offerPrice',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
  },
  {
    field: 'pricing.tax',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      const normalizeRaw = (input) => {
        if (typeof input === 'number') return input;
        if (typeof input === 'string') {
          const cleaned = input.replace(/[%\s]/g, '').replace(',', '.');
          return parseFloat(cleaned);
        }
        return Number(input);
      };
      const rawNumber = normalizeRaw(value);
      if (!Number.isFinite(rawNumber)) return 0;
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
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      // Eliminar símbolos de moneda y espacios
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽%]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
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
    transform: (value) => {
      if (value === null || value === undefined || value === '') return 0;
      // Eliminar símbolos y espacios
      const cleanValue =
        typeof value === 'string'
          ? value.replace(/[$€£¥₩₹₽]/g, '').replace(/\s/g, '')
          : value;
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    },
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
    transform: (value) => parseInt(value) || 1,
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
    transform: (value) => parseInt(value) || 0,
  },
  {
    field: 'netContent',
    transform: (value) => value || '',
  },
  {
    field: 'amountToBuy',
    transform: (value) => parseFloat(value) || 1,
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
    transform: (value) => parseInt(value) || 1,
  },
  {
    field: 'isVisible',
    transform: (value) =>
      ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || true, // Valor por defecto: true
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

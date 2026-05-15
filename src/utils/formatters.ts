import { formatPrice } from './format/formatPrice';
import { formatDate } from './formatDate';

export { formatDate, formatPrice };

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const formatMoney = (amount: unknown): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(toFiniteNumber(amount));
};

export const formatNumber = (value: unknown, decimals = 2): string => {
  return new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toFiniteNumber(value));
};

export const formatPercentage = (value: unknown): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toFiniteNumber(value) / 100);
};

export const formatQuantity = (quantity: unknown, decimals = 2): string => {
  return new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toFiniteNumber(quantity));
};

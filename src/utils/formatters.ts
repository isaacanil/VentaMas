import { formatPrice } from './format/formatPrice';
import { formatLocaleCurrency } from './format/currency';
import {
  createCountFormatter,
  toFiniteDisplayNumber,
} from './formatCounts';
import { formatDate } from './formatDate';

export { formatDate, formatPrice };

export const formatMoney = (amount: unknown): string => {
  return formatLocaleCurrency(toFiniteDisplayNumber(amount), 'DOP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatNumber = (value: unknown, decimals = 2): string => {
  return createCountFormatter({
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toFiniteDisplayNumber(value));
};

export const formatPercentage = (value: unknown): string => {
  return createCountFormatter({
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toFiniteDisplayNumber(value) / 100);
};

export const formatQuantity = (quantity: unknown, decimals = 2): string => {
  return createCountFormatter({
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toFiniteDisplayNumber(quantity));
};

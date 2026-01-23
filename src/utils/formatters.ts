import { formatPrice } from './format/formatPrice';
import { formatDate } from './formatDate';

export { formatDate, formatPrice };

export const formatMoney = (amount) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (number, decimals = 2) => {
  return new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number || 0);
};

export const formatPercentage = (value) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value / 100 || 0);
};

export const formatQuantity = (quantity, decimals = 2) => {
  return new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(quantity || 0);
};

import type { CountryCode } from 'libphonenumber-js';
import {
  formatPhoneForInternationalDisplay,
  isPhoneInputValid,
  unformatPhoneForStorage,
} from '@/shared/phone/phoneNumber';
import {
  createCountFormatter,
  toFiniteDisplayNumber,
} from '@/utils/formatCounts';

import { formatLocaleCurrency } from './currency';

export * from './formatPrice';

export const formatPhoneNumber = (
  value: string,
  countryCode: CountryCode | string = 'DO',
): string => formatPhoneForInternationalDisplay(value, countryCode);

export const unformatPhoneNumber = (
  formattedValue: string,
  countryCode: CountryCode | string = 'DO',
): string => unformatPhoneForStorage(formattedValue, countryCode);

export const isValidPhoneNumber = (
  phoneNumber: string,
  countryCode: CountryCode | string = 'DO',
): boolean => isPhoneInputValid(phoneNumber, countryCode);

// Re-export de la función simple de formateo de telefono (sin libphonenumber-js)
export { formatPhoneNumber as formatPhoneNumberSimple } from './formatPhoneNumber';

export const formatMoney = (amount: unknown): string => {
  return formatLocaleCurrency(toFiniteDisplayNumber(amount), 'DOP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatFixedNumber = (value: unknown, decimals = 2): string => {
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
  return formatFixedNumber(quantity, decimals);
};

// Funciones de formato movidas desde hooks/
export function formatNumber(value: unknown, decimals: number): string;
export function formatNumber(
  numero: number | string,
  type?: 'string' | 'number',
  round?: boolean,
): string | number | null;
export function formatNumber(
  numero: unknown,
  type: 'string' | 'number' | number = 'string',
  round = false,
): string | number | null {
  if (typeof type === 'number') {
    return formatFixedNumber(numero, type);
  }

  const numericValue = typeof numero === 'number' ? numero : Number(numero);
  if (!Number.isFinite(numericValue)) {
    if (arguments.length === 1) {
      return formatFixedNumber(numero);
    }

    return null;
  }

  if (type === 'number') {
    return round ? parseFloat(numericValue.toFixed(2)) : numericValue;
  }

  if (arguments.length === 1 && !Number.isInteger(Math.abs(numericValue))) {
    return formatFixedNumber(numericValue);
  }

  const signo = Math.sign(numericValue) === -1 ? '-' : '';
  const numeroAbsoluto = Math.abs(numericValue);
  const esDecimal = !Number.isInteger(numeroAbsoluto);
  const numeroFormateado = new Intl.NumberFormat('en-US', {
    minimumIntegerDigits: 1,
    minimumFractionDigits: esDecimal ? 1 : 0,
    maximumFractionDigits: esDecimal ? 2 : 0,
  }).format(numeroAbsoluto);

  return (
    signo +
    (numeroAbsoluto < 10 && numeroAbsoluto > 0 ? '' : '') +
    numeroFormateado
  );
}

export function formatRNC(rnc: string): string {
  //Verificar si tiene el formato correcto (9 digitos)
  if (!/^\d{9}$/.test(rnc)) {
    return '9 digitos';
  }
  return 'listo';
}

type TimestampLike =
  | { seconds: number; nanoseconds?: number }
  | {
      toDate?: () => Date;
      toMillis?: () => number;
      seconds?: number;
      _seconds?: number;
      nanoseconds?: number;
      _nanoseconds?: number;
    }
  | number
  | string
  | Date
  | null
  | undefined;

export function formatTimestamp(timestamp: TimestampLike): string {
  let date: Date;
  if (!timestamp) return '';
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    const timestampObject = timestamp as {
      toDate?: () => Date;
      toMillis?: () => number;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof timestampObject.toMillis === 'function') {
      date = new Date(timestampObject.toMillis());
    } else if (typeof timestampObject.toDate === 'function') {
      date = timestampObject.toDate();
    } else if (typeof timestampObject._seconds === 'number') {
      date = new Date(timestampObject._seconds * 1000);
    } else {
      date = new Date((timestampObject.seconds ?? 0) * 1000);
    }
  }
  if (Number.isNaN(date.getTime())) return '';
  const formattedDate = date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return formattedDate;
}

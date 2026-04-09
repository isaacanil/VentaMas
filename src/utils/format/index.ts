import {
  parsePhoneNumberFromString,
  isValidPhoneNumber as isValidNumber,
  getCountryCallingCode,
} from 'libphonenumber-js/min';
import type { CountryCode } from 'libphonenumber-js';

export * from './formatPrice';

const normalizeCountryCode = (
  value: CountryCode | string | null | undefined,
): CountryCode => {
  const fallback = 'DO' as CountryCode;
  if (!value) return fallback;
  const normalized = String(value).trim().toUpperCase();
  return (normalized.length === 2 ? normalized : fallback) as CountryCode;
};

export const formatPhoneNumber = (
  value: string,
  countryCode: CountryCode | string = 'DO',
): string => {
  if (!value) return '';

  try {
    // Si no empieza con +, agregar el codigo del pais
    const resolvedCountry = normalizeCountryCode(countryCode);
    let phoneValue = value;
    if (!value.startsWith('+')) {
      const countryCallingCode = getCountryCallingCode(resolvedCountry);
      phoneValue = value.startsWith(countryCallingCode)
        ? `+${value}`
        : `+${countryCallingCode}${value.replace(/^0+/, '')}`;
    }

    const phoneNumber = parsePhoneNumberFromString(
      phoneValue,
      resolvedCountry,
    );
    if (!phoneNumber) return value;

    return phoneNumber.formatInternational();
  } catch (error) {
    console.warn('Error formatting phone number:', error);
    return value;
  }
};

export const unformatPhoneNumber = (
  formattedValue: string,
  countryCode: CountryCode | string = 'DO',
): string => {
  if (!formattedValue) return '';

  try {
    const resolvedCountry = normalizeCountryCode(countryCode);
    const phoneNumber = parsePhoneNumberFromString(
      formattedValue,
      resolvedCountry,
    );
    if (phoneNumber) {
      // Retornar el numero en formato E.164 (con codigo de pais)
      return phoneNumber.number;
    }
    // Si no se puede parsear, eliminar todo excepto digitos y +
    return formattedValue.replace(/[^\d+]/g, '');
  } catch (error) {
    console.warn('Error unformatting phone number:', error);
    return formattedValue.replace(/[^\d+]/g, '');
  }
};

export const isValidPhoneNumber = (
  phoneNumber: string,
  countryCode: CountryCode | string = 'DO',
): boolean => {
  if (!phoneNumber) return false;

  try {
    // Asegurarse de que el numero tenga el formato correcto para la Validacion
    const resolvedCountry = normalizeCountryCode(countryCode);
    let numberToValidate = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      const countryCallingCode = getCountryCallingCode(resolvedCountry);
      numberToValidate = `+${countryCallingCode}${phoneNumber.replace(/^0+/, '')}`;
    }

    return isValidNumber(numberToValidate, resolvedCountry);
  } catch (error) {
    console.warn('Error validating phone number:', error);
    return false;
  }
};

// Re-export de la función simple de formateo de telefono (sin libphonenumber-js)
export { formatPhoneNumber as formatPhoneNumberSimple } from './formatPhoneNumber';

// Funciones de formato movidas desde hooks/
export function formatNumber(
  numero: number | string,
  type: 'string' | 'number' = 'string',
  round = false,
): string | number | null {
  const numericValue = typeof numero === 'number' ? numero : Number(numero);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (type === 'number') {
    return round ? parseFloat(numericValue.toFixed(2)) : numericValue;
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

type TimestampLike = { seconds: number; nanoseconds?: number };

export function formatTimestamp(timestamp: TimestampLike): string {
  const formattedDate = new Date(timestamp.seconds * 1000).toLocaleString(
    'es-ES',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  return formattedDate;
}

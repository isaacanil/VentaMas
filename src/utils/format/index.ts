// @ts-nocheck
import {
  parsePhoneNumberFromString,
  isValidPhoneNumber as isValidNumber,
  getCountryCallingCode,
} from 'libphonenumber-js/min';

export * from './formatPrice';

export const formatPhoneNumber = (value, countryCode = 'DO') => {
  if (!value) return '';

  try {
    // Si no empieza con +, agregar el código del país
    let phoneValue = value;
    if (!value.startsWith('+')) {
      const countryCallingCode = getCountryCallingCode(countryCode);
      phoneValue = value.startsWith(countryCallingCode)
        ? `+${value}`
        : `+${countryCallingCode}${value.replace(/^0+/, '')}`;
    }

    const phoneNumber = parsePhoneNumberFromString(phoneValue, countryCode);
    if (!phoneNumber) return value;

    return phoneNumber.formatInternational();
  } catch (error) {
    console.warn('Error formatting phone number:', error);
    return value;
  }
};

export const unformatPhoneNumber = (formattedValue, countryCode = 'DO') => {
  if (!formattedValue) return '';

  try {
    const phoneNumber = parsePhoneNumberFromString(formattedValue, countryCode);
    if (phoneNumber) {
      // Retornar el número en formato E.164 (con código de país)
      return phoneNumber.number;
    }
    // Si no se puede parsear, eliminar todo excepto dígitos y +
    return formattedValue.replace(/[^\d+]/g, '');
  } catch (error) {
    console.warn('Error unformatting phone number:', error);
    return formattedValue.replace(/[^\d+]/g, '');
  }
};

export const isValidPhoneNumber = (phoneNumber, countryCode = 'DO') => {
  if (!phoneNumber) return false;

  try {
    // Asegurarse de que el número tenga el formato correcto para la validación
    let numberToValidate = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      const countryCallingCode = getCountryCallingCode(countryCode);
      numberToValidate = `+${countryCallingCode}${phoneNumber.replace(/^0+/, '')}`;
    }

    return isValidNumber(numberToValidate, countryCode);
  } catch (error) {
    console.warn('Error validating phone number:', error);
    return false;
  }
};

// Re-export de la función simple de formateo de teléfono (sin libphonenumber-js)
export { formatPhoneNumber as formatPhoneNumberSimple } from './formatPhoneNumber';

// Funciones de formato movidas desde hooks/
export function formatNumber(numero, type = 'string', round = false) {
  if (isNaN(numero)) {
    return null;
  }

  if (type === 'number') {
    return round ? parseFloat(numero.toFixed(2)) : numero;
  }

  const signo = Math.sign(numero) === -1 ? '-' : '';
  const numeroAbsoluto = Math.abs(numero);
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

export function formatRNC(rnc) {
  //Verificar si tiene el formato correcto (9 digitos)
  if (!/^\d{9}$/.test(rnc)) {
    return '9 dígitos';
  }
  return 'listo';
}

export function formatTimestamp(timestamp) {
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

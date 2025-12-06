import {
  parsePhoneNumberFromString,
  isValidPhoneNumber as isValidNumber,
  getCountryCallingCode,
} from 'libphonenumber-js';

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

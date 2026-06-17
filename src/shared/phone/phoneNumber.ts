import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber as isValidPhoneNumberLib,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min';
import type { CountryCode } from 'libphonenumber-js';

export type PhoneCountryCode = CountryCode;

export const DEFAULT_PHONE_COUNTRY: PhoneCountryCode = 'DO';

export const normalizePhoneCountryCode = (
  value: CountryCode | string | null | undefined,
  fallback: PhoneCountryCode = DEFAULT_PHONE_COUNTRY,
): PhoneCountryCode => {
  if (!value) return fallback;
  const normalized = String(value).trim().toUpperCase();
  return (normalized.length === 2 ? normalized : fallback) as PhoneCountryCode;
};

export const getSupportedPhoneCountries = (): PhoneCountryCode[] =>
  getCountries();

export const getPhoneCountryCallingCode = (
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): string => {
  try {
    return getCountryCallingCode(normalizePhoneCountryCode(countryCode));
  } catch {
    return getCountryCallingCode(DEFAULT_PHONE_COUNTRY);
  }
};

export const cleanPhoneInput = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[^\d+()\-\s.]/g, '');
};

export const getPhoneDigits = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\D/g, '');
};

export const normalizePhoneToE164 = (
  value: unknown,
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): string | null => {
  const cleaned = cleanPhoneInput(value);
  if (!cleaned) return null;

  try {
    const resolvedCountry = normalizePhoneCountryCode(countryCode);
    const phoneNumber = parsePhoneNumberFromString(cleaned, resolvedCountry);
    return phoneNumber?.isValid() ? phoneNumber.number : null;
  } catch {
    return null;
  }
};

export const isPhoneNumberValid = (
  value: unknown,
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): boolean => Boolean(normalizePhoneToE164(value, countryCode));

export const formatPhoneForInternationalDisplay = (
  value: string,
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): string => {
  if (!value) return '';

  try {
    const resolvedCountry = normalizePhoneCountryCode(countryCode);
    const countryCallingCode = getCountryCallingCode(resolvedCountry);
    const phoneValue = value.startsWith('+')
      ? value
      : value.startsWith(countryCallingCode)
        ? `+${value}`
        : `+${countryCallingCode}${value.replace(/^0+/, '')}`;

    const phoneNumber = parsePhoneNumberFromString(phoneValue, resolvedCountry);
    return phoneNumber ? phoneNumber.formatInternational() : value;
  } catch {
    return value;
  }
};

export const unformatPhoneForStorage = (
  formattedValue: string,
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): string => {
  if (!formattedValue) return '';

  try {
    const resolvedCountry = normalizePhoneCountryCode(countryCode);
    const phoneNumber = parsePhoneNumberFromString(
      formattedValue,
      resolvedCountry,
    );
    return phoneNumber
      ? phoneNumber.number
      : formattedValue.replace(/[^\d+]/g, '');
  } catch {
    return formattedValue.replace(/[^\d+]/g, '');
  }
};

export const isPhoneInputValid = (
  phoneNumber: string,
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): boolean => {
  if (!phoneNumber) return false;

  try {
    const resolvedCountry = normalizePhoneCountryCode(countryCode);
    const countryCallingCode = getCountryCallingCode(resolvedCountry);
    const numberToValidate = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+${countryCallingCode}${phoneNumber.replace(/^0+/, '')}`;

    return isValidPhoneNumberLib(numberToValidate, resolvedCountry);
  } catch {
    return false;
  }
};

export type PhoneDisplayFormatHint = string | boolean;

const formatSingleLegacyPhoneNumber = (number: string): string => {
  const digits = number.replace(/\D/g, '');

  if (digits.length > 10 && number.startsWith('+')) {
    const countryCode = digits.slice(0, -10);
    const rest = digits.slice(-10);
    return `+${countryCode} (${rest.substring(0, 3)}) ${rest.substring(3, 6)}-${rest.substring(6)}`;
  }

  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }

  if (digits.length === 11) {
    return `+${digits[0]} (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
  }

  return number;
};

export const formatPhoneForLegacyDisplay = (
  input = '',
  _formatHint?: PhoneDisplayFormatHint,
): string => {
  const phoneNumbers = input
    .split(/[,;.\s]+/)
    .filter((num) => num.replace(/\D/g, '').length > 0);
  const firstNumberDigits = phoneNumbers[0]?.replace(/\D/g, '').length;
  const allSameLength = phoneNumbers.every(
    (num) => num.replace(/\D/g, '').length === firstNumberDigits,
  );

  if (phoneNumbers.length > 1 && !allSameLength) {
    return phoneNumbers.join(' / ');
  }

  const formattedNumbers = phoneNumbers.map(formatSingleLegacyPhoneNumber);
  return formattedNumbers.length > 1
    ? formattedNumbers.join(' / ')
    : (formattedNumbers[0] ?? input);
};

export const formatDominicanPhoneForLegacyDisplay = (
  input: unknown,
): string => {
  if (input === null || input === undefined) return '';

  const value = String(input);
  const digits = getPhoneDigits(value);
  if (digits.length === 10) {
    return formatPhoneForLegacyDisplay(`1${digits}`);
  }

  return formatPhoneForLegacyDisplay(value);
};

export const formatPhoneForInput = (
  value: unknown,
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): string => {
  const cleaned = cleanPhoneInput(value);
  if (!cleaned) return '';

  try {
    const resolvedCountry = normalizePhoneCountryCode(countryCode);
    const digits = cleaned.replace(/\D/g, '');
    if (
      resolvedCountry === 'DO' &&
      !cleaned.startsWith('+') &&
      digits.length <= 3
    ) {
      return digits;
    }

    const phoneNumber = parsePhoneNumberFromString(cleaned, resolvedCountry);
    if (phoneNumber?.isValid()) {
      return phoneNumber.country === resolvedCountry
        ? phoneNumber.formatNational()
        : phoneNumber.formatInternational();
    }
    return new AsYouType(resolvedCountry).input(cleaned);
  } catch {
    return cleaned;
  }
};

export const getPhonePlaceholder = (
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): string => {
  const resolvedCountry = normalizePhoneCountryCode(countryCode);
  if (resolvedCountry === 'DO') return '809-000-0000';
  try {
    return `+${getCountryCallingCode(resolvedCountry)} ...`;
  } catch {
    return '+000 ...';
  }
};

export const getPhoneValidationMessage = (
  value: unknown,
  countryCode: CountryCode | string = DEFAULT_PHONE_COUNTRY,
): string | null => {
  const cleaned = cleanPhoneInput(value);
  if (!cleaned) return null;
  return isPhoneNumberValid(cleaned, countryCode) ? null : 'Telefono invalido.';
};

export const buildWhatsAppUrl = (
  phone: string | number | null | undefined,
  message: string,
): string | null => {
  const phoneDigits = getPhoneDigits(phone);
  if (!phoneDigits) return null;

  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
};

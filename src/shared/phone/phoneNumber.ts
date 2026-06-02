import {
  AsYouType,
  getCountryCallingCode,
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

export const cleanPhoneInput = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[^\d+()\-\s.]/g, '');
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
  return isPhoneNumberValid(cleaned, countryCode)
    ? null
    : 'Telefono invalido.';
};

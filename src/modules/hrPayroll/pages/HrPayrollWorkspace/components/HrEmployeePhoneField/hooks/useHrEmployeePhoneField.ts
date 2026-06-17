import { useMemo, useState } from 'react';

import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneForInput,
  getPhoneValidationMessage,
  normalizePhoneCountryCode,
  normalizePhoneToE164,
  type PhoneCountryCode,
} from '@/shared/phone/phoneNumber';

interface UsePhoneFieldArgs {
  countryCode?: PhoneCountryCode | string | null;
  value?: string | null;
}

export const useHrEmployeePhoneField = ({
  countryCode = DEFAULT_PHONE_COUNTRY,
  value,
}: UsePhoneFieldArgs) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const rawValue = value ?? '';
  const resolvedCountryCode = normalizePhoneCountryCode(countryCode);

  const displayValue = useMemo(
    () => formatPhoneForInput(rawValue, resolvedCountryCode),
    [rawValue, resolvedCountryCode],
  );
  const normalizedValue = useMemo(
    () => normalizePhoneToE164(rawValue, resolvedCountryCode),
    [rawValue, resolvedCountryCode],
  );
  const validationMessage = useMemo(
    () =>
      hasInteracted
        ? getPhoneValidationMessage(rawValue, resolvedCountryCode)
        : null,
    [hasInteracted, rawValue, resolvedCountryCode],
  );

  return {
    displayValue,
    hasError: Boolean(validationMessage),
    markInteracted: () => setHasInteracted(true),
    normalizedValue,
    resolvedCountryCode,
    validationMessage,
  };
};

import type { FocusEvent } from 'react';

import { VmInput } from '@/components/heroui';
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneForInput,
  getPhonePlaceholder,
  type PhoneCountryCode,
} from '@/shared/phone';

import { PhoneError, PhoneFieldRoot } from './HrEmployeePhoneField.styles';
import { useHrEmployeePhoneField } from './hooks/useHrEmployeePhoneField';

interface HrEmployeePhoneFieldProps {
  ariaLabel: string;
  autoComplete?: string;
  className?: string;
  countryCode?: PhoneCountryCode | string | null;
  disabled?: boolean;
  id?: string;
  name?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onValueChange: (value: string) => void;
  placeholder?: string;
  value?: string | null;
}

export function HrEmployeePhoneField({
  ariaLabel,
  autoComplete = 'tel',
  className,
  countryCode = DEFAULT_PHONE_COUNTRY,
  disabled = false,
  id,
  name,
  onBlur,
  onValueChange,
  placeholder,
  value,
}: HrEmployeePhoneFieldProps) {
  const {
    displayValue,
    hasError,
    markInteracted,
    resolvedCountryCode,
    validationMessage,
  } = useHrEmployeePhoneField({ countryCode, value });
  const errorId = id ? `${id}-error` : undefined;

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    markInteracted();
    const formattedValue = formatPhoneForInput(
      event.target.value,
      resolvedCountryCode,
    );
    if (formattedValue !== value) {
      onValueChange(formattedValue);
    }
    onBlur?.(event);
  };

  return (
    <PhoneFieldRoot className={className}>
      <VmInput
        id={id}
        name={name}
        aria-describedby={hasError ? errorId : undefined}
        aria-invalid={hasError || undefined}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
        disabled={disabled}
        inputMode="tel"
        placeholder={placeholder ?? getPhonePlaceholder(resolvedCountryCode)}
        type="tel"
        value={displayValue}
        onBlur={handleBlur}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {validationMessage ? (
        <PhoneError id={errorId} role="alert">
          {validationMessage}
        </PhoneError>
      ) : null}
    </PhoneFieldRoot>
  );
}

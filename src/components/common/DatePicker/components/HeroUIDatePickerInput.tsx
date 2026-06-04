import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';

import {
  ClearButton,
  InputShell,
  PrefixIcon,
  StyledInput,
} from './HeroUIDatePickerInput.styles';
import type { DatePickerInputProps } from '../types';

export const HeroUIDatePickerInput = ({
  value,
  placeholder,
  disabled,
  allowClear,
  hasValue,
  onClear,
  onClick,
}: DatePickerInputProps) => (
  <InputShell>
    <PrefixIcon>
      <CalendarOutlined />
    </PrefixIcon>
    <StyledInput
      aria-label={placeholder ?? 'Seleccionar fecha'}
      value={hasValue ? (value ?? '') : ''}
      placeholder={placeholder}
      readOnly
      disabled={disabled}
      onClick={() => !disabled && onClick?.()}
      $hasValue={hasValue}
    />
    {allowClear && hasValue ? (
      <ClearButton
        type="button"
        aria-label="Limpiar fecha"
        onClick={(event) => {
          event.stopPropagation();
          onClear?.(event);
        }}
      >
        <CloseOutlined />
      </ClearButton>
    ) : null}
  </InputShell>
);

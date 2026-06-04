import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';

import {
  ClearButton,
  InputWrapper,
  PrefixIcon,
  StyledVmInput,
  SuffixArea,
} from './DatePickerInput.styles';
import type { DatePickerInputProps } from '../types';

export const DatePickerInput = ({
  value,
  placeholder,
  disabled,
  allowClear,
  hasValue,
  onClear,
  onClick,
  className,
  style,
}: DatePickerInputProps) => {
  const showClear = allowClear && hasValue;

  return (
    <InputWrapper
      onClick={() => !disabled && onClick?.()}
      className={className}
      style={style}
    >
      <PrefixIcon>
        <CalendarOutlined />
      </PrefixIcon>

      <StyledVmInput
        value={hasValue ? (value ?? '') : ''}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        $hasClear={showClear}
      />

      {showClear ? (
        <SuffixArea>
          <ClearButton
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear?.(e);
            }}
          >
            <CloseOutlined />
          </ClearButton>
        </SuffixArea>
      ) : null}
    </InputWrapper>
  );
};

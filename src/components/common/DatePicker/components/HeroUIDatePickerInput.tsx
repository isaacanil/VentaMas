import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { Input } from '@heroui/react';
import React from 'react';
import styled from 'styled-components';

import type { DatePickerInputProps } from '../types';

const InputShell = styled.div`
  position: relative;
  width: 100%;
`;

const PrefixIcon = styled.span`
  position: absolute;
  top: 50%;
  left: 12px;
  z-index: 1;
  display: inline-flex;
  color: var(--ds-color-text-secondary);
  transform: translateY(-50%);
  pointer-events: none;
`;

const StyledInput = styled(Input)<{ $hasValue?: boolean }>`
  width: 100%;


  color: ${({ $hasValue }) =>
    $hasValue
      ? 'var(--ds-color-text-primary)'
      : 'var(--ds-color-text-secondary)'};
  cursor: pointer;

  &::placeholder {
    color: var(--ds-color-text-tertiary);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  top: 50%;
  right: 10px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--ds-color-text-tertiary);
  color: var(--ds-color-bg-surface);
  font-size: 10px;
  cursor: pointer;
  transform: translateY(-50%);

  &:hover {
    background: var(--ds-color-text-secondary);
  }
`;

const mapInputSize = (
  size: DatePickerInputProps['size'],
): 'sm' | 'md' | 'lg' => {
  if (size === 'small') return 'sm';
  if (size === 'large') return 'lg';
  return 'md';
};

export const HeroUIDatePickerInput = ({
  value,
  placeholder,
  size,
  disabled,
  allowClear,
  hasValue,
  onClear,
  onClick,
  ...props
}: DatePickerInputProps) => (
  <InputShell>
    <PrefixIcon>
      <CalendarOutlined />
    </PrefixIcon>
    <StyledInput
      aria-label={placeholder}
      value={hasValue ? value : ''}
      placeholder={placeholder}
      readOnly
      disabled={disabled}
      onClick={() => !disabled && onClick?.()}
      $hasValue={hasValue}
      {...props}
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

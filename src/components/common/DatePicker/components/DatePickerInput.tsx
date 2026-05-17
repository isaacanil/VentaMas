import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import React from 'react';
import styled from 'styled-components';

import { VmInput } from '@/components/heroui/Input';
import type { DatePickerInputProps } from '../types';

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const PrefixIcon = styled.span`
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #8c8c8c;
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
`;

const SuffixArea = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
`;

interface StyledVmInputProps {
  $hasClear?: boolean;
}

const StyledVmInput = styled(VmInput)<StyledVmInputProps>`
  width: 100%;
  padding-left: 32px !important;
  padding-right: ${({ $hasClear }: StyledVmInputProps) =>
    $hasClear ? '36px' : '12px'} !important;
  cursor: pointer !important;

  &::placeholder {
    color: var(--ds-color-text-placeholder);
  }
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: white;
  cursor: pointer;
  background: #bfbfbf;
  border: none;
  border-radius: 50%;
  transition: background 0.2s;

  &:hover {
    background: #8c8c8c;
  }
`;

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
              onClear?.(e as unknown as React.MouseEvent<HTMLElement>);
            }}
          >
            <CloseOutlined />
          </ClearButton>
        </SuffixArea>
      ) : null}
    </InputWrapper>
  );
};

import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import React from 'react';
import styled from 'styled-components';
import type { DatePickerInputProps } from '../types';

interface StyledInputProps {
  $hasValue?: boolean;
}

const StyledInput = styled(Input)<StyledInputProps>`
  cursor: pointer;

  input {
    color: ${(props) => (props.$hasValue ? 'inherit' : '#bfbfbf')} !important;
    cursor: pointer !important;
  }

  &:hover {
    border-color: #40a9ff;
  }

  &:focus-within {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgb(24 144 255 / 20%);
  }
`;

const ClearIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: white;
  cursor: pointer;
  background: #bfbfbf;
  border-radius: 50%;
  transition: all 0.3s;

  &:hover {
    background: #8c8c8c;
  }
`;

export const DatePickerInput = ({
  value,
  placeholder,
  size,
  disabled,
  allowClear,
  hasValue,
  onClear,
  onClick,
  ...props
}: DatePickerInputProps) => {
  return (
    <StyledInput
      value={hasValue ? value : ''}
      placeholder={placeholder}
      readOnly
      onClick={() => !disabled && onClick?.()}
      size={size}
      disabled={disabled}
      prefix={<CalendarOutlined />}
      suffix={
        allowClear && hasValue ? (
          <ClearIcon onClick={onClear}>
            <CloseOutlined />
          </ClearIcon>
        ) : null
      }
      $hasValue={hasValue}
      {...props}
    />
  );
};

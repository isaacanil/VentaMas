import styled from 'styled-components';

import { VmInput } from '@/components/heroui/Input';

export const InputShell = styled.div`
  position: relative;
  width: 100%;
`;

export const PrefixIcon = styled.span`
  position: absolute;
  top: 50%;
  left: 10px;
  z-index: 1;
  display: inline-flex;
  font-size: 13px;
  color: var(--ds-color-text-secondary);
  pointer-events: none;
  transform: translateY(-50%);
`;

interface StyledInputProps {
  $hasValue?: boolean;
}

export const StyledInput = styled(VmInput)<StyledInputProps>`
  width: 100%;
  /* leave room for the prefix calendar icon */
  padding-left: 32px !important;
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

export const ClearButton = styled.button`
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
  font-size: 10px;
  color: var(--ds-color-bg-surface);
  cursor: pointer;
  background: var(--ds-color-text-tertiary);
  border: none;
  border-radius: 50%;
  transform: translateY(-50%);

  &:hover {
    background: var(--ds-color-text-secondary);
  }
`;

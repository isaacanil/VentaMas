import styled from 'styled-components';

import { VmInput } from '@/components/heroui/Input';

export const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const PrefixIcon = styled.span`
  position: absolute;
  top: 50%;
  left: 11px;
  z-index: 1;
  font-size: 14px;
  color: #8c8c8c;
  pointer-events: none;
  transform: translateY(-50%);
`;

export const SuffixArea = styled.div`
  position: absolute;
  top: 50%;
  right: 8px;
  z-index: 1;
  transform: translateY(-50%);
`;

interface StyledVmInputProps {
  $hasClear?: boolean;
}

export const StyledVmInput = styled(VmInput)<StyledVmInputProps>`
  width: 100%;
  padding-right: ${({ $hasClear }) => ($hasClear ? '36px' : '12px')} !important;
  padding-left: 32px !important;
  cursor: pointer !important;

  &::placeholder {
    color: var(--ds-color-text-placeholder);
  }
`;

export const ClearButton = styled.button`
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

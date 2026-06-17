import { InputNumber } from 'antd';
import styled from 'styled-components';

export const QuantityDisplay = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

export const QuantityValue = styled.span`
  font-weight: 500;
`;

export const QuantityLimit = styled.span`
  font-size: 11px;
  color: #999;
`;

export const QuantityEditor = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const QuantityInput = styled(InputNumber)`
  width: 60px;
`;

export const TooltipTitle = styled.div`
  font-weight: 600;
`;

export const TooltipLine = styled.div`
  margin-bottom: 4px;
`;

export const TooltipDivider = styled.div`
  padding-top: 4px;
  margin-top: 4px;
  border-top: 1px solid #ddd;
`;

export const TooltipFormula = styled.div`
  margin-top: 4px;
  font-size: 11px;
  color: #999;
`;

export const HintTrigger = styled.span<{ $compact?: boolean }>`
  font-size: ${({ $compact }) => ($compact ? '10px' : '11px')};
  color: #999;
  cursor: help;
`;

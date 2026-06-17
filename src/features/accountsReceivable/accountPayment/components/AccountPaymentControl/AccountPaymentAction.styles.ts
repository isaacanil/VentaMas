import { Button } from 'antd';
import styled from 'styled-components';

export const PaymentContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;

  @media (width <= 480px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
`;

export const PaymentInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 3px;
`;

export const ProgressFill = styled.div<{ $percentage: number }>`
  width: ${({ $percentage }) => $percentage}%;
  height: 100%;
  background: #2e7d32;
  border-radius: 3px;
  transition: width 0.3s ease;
`;

export const PaymentActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;

  @media (width <= 480px) {
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
`;

export const BalanceAmount = styled.div<{ $isPaid: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $isPaid }) => ($isPaid ? '#2e7d32' : '#cf1322')};
  text-align: right;

  @media (width <= 480px) {
    font-size: 14px;
  }
`;

export const PaymentButton = styled(Button)`
  display: flex;
  gap: 6px;
  align-items: center;
  height: 32px;
  font-weight: 500;
  border-radius: 6px;

  &:disabled {
    opacity: 0.5;
  }

  svg {
    font-size: 12px;
  }
`;

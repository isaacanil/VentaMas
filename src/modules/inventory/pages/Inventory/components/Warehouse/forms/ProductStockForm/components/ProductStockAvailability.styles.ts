import { Alert, InputNumber } from 'antd';
import styled from 'styled-components';

export const AvailabilityWarning = styled(Alert)`
  margin-bottom: 16px;
`;

export const StockInputRow = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;

export const FullWidthInputNumber = styled(InputNumber)`
  width: 100%;
`;

export const RemainingStockLimit = styled.span<{ $isExceeded: boolean }>`
  color: ${({ $isExceeded }) => ($isExceeded ? 'red' : 'black')};
  white-space: nowrap;
`;

export const StockExceededAlert = styled(Alert)`
  margin-top: 8px;
`;

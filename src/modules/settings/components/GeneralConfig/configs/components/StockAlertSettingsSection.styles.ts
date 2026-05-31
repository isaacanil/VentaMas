import { Input, InputNumber } from 'antd';
import styled from 'styled-components';

export const ConfigItem = styled.div<{ $level?: number; $spaced?: boolean }>`
  margin-bottom: 8px;
  padding-left: ${({ $level }) => ($level || 0) * 16}px;
  ${({ $spaced }) => ($spaced ? 'margin-top: 8px;' : '')}
`;

export const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: min-content min-content;
  gap: 16px;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ThresholdInput = styled(InputNumber)`
  width: 140px;

  @media (width <= 768px) {
    width: 100%;
  }
`;

export const EmailInput = styled(Input)`
  width: 100%;
  max-width: 480px;
`;

export const SectionLabel = styled.strong`
  font-weight: 600;
`;

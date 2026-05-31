import { m } from 'framer-motion';
import styled from 'styled-components';

export const ProductGroupContainer = styled(m.div)`
  overflow: hidden;
  background: white;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
`;

export const GroupHeader = styled.div`
  background: white;
`;

export const GroupHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
`;

export const ProductIdentity = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const ProductName = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

export const SummaryActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const QuantitySummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  line-height: 1.1;
`;

export const QuantityLabel = styled.span`
  font-size: 12px;
  color: #8c8c8c;
`;

export const QuantityValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #262626;
`;

export const ReservedValue = styled.span`
  font-size: 12px;
  color: #096dd9;
`;

export const ProgressTrack = styled.div`
  width: 140px;
  height: 6px;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 999px;
`;

export const ProgressFill = styled.div<{ $progress: number }>`
  width: ${({ $progress }) => $progress}%;
  height: 100%;
  background: #1890ff;
`;

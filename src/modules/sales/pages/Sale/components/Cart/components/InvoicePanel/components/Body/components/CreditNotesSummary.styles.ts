import { Card, Divider } from 'antd';
import styled from 'styled-components';

export const SummaryCard = styled(Card)`
  .ant-card-body {
    padding: 0;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

export const CardTitle = styled.h4`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

export const TotalAmount = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1890ff;
`;

export const CardContent = styled.div`
  padding: 12px 16px;
`;

export const CreditNoteItem = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
`;

export const NCF = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 500;
  color: #333;
`;

export const Amount = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1890ff;
`;

export const SummaryDivider = styled(Divider)`
  && {
    margin: 8px 0;
  }
`;

export const SummaryInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const SummaryLabel = styled.span`
  font-size: 0.75rem;
  color: #666;
`;

export const SummaryValue = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
`;

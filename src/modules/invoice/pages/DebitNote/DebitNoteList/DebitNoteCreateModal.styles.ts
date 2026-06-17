import styled from 'styled-components';

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`;

export const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

export const InvoiceSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 12px;
  margin-bottom: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryLabel = styled.div`
  margin-bottom: 2px;
  font-size: 12px;
  color: #7a8494;
`;

export const SummaryValue = styled.div`
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

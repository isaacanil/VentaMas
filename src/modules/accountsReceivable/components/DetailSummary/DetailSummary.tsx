import React from 'react';
import styled from 'styled-components';

interface DetailSummaryItem {
  label?: React.ReactNode;
  value?: React.ReactNode;
}

interface DetailSummaryProps {
  items?: DetailSummaryItem[];
}

const EMPTY_DETAIL_SUMMARY_ITEMS: DetailSummaryItem[] = [];
const detailSummaryObjectKeys = new WeakMap<DetailSummaryItem, React.Key>();
let detailSummaryObjectKeySequence = 0;

const resolveDetailSummaryKey = (item: DetailSummaryItem): React.Key => {
  if (typeof item.label === 'string' || typeof item.label === 'number') {
    return item.label;
  }
  if (typeof item.value === 'string' || typeof item.value === 'number') {
    return item.value;
  }
  const existingKey = detailSummaryObjectKeys.get(item);
  if (existingKey) {
    return existingKey;
  }
  detailSummaryObjectKeySequence += 1;
  const nextKey = `detail-summary-${detailSummaryObjectKeySequence}`;
  detailSummaryObjectKeys.set(item, nextKey);
  return nextKey;
};

export const DetailSummary: React.FC<DetailSummaryProps> = ({
  items = EMPTY_DETAIL_SUMMARY_ITEMS,
}) => {
  return (
    <AccountSection>
      {items.map((item) => (
        <InfoRow key={resolveDetailSummaryKey(item)}>
          <Label>{item?.label}</Label>
          <Value>{item?.value}</Value>
        </InfoRow>
      ))}
    </AccountSection>
  );
};

const AccountSection = styled.div`
  max-width: 500px;
  padding: 1.2em;
  background-color: white;
  border-radius: 8px;
`;
const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;

  :not(:last-child) {
    border-bottom: 1px solid #d7d7db;
  }
`;

const Label = styled.span`
  font-weight: 600;
  color: #333;
`;

const Value = styled.span`
  color: #555;
`;

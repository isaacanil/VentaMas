import React from 'react';
import styled from 'styled-components';

import { Paragraph } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate1/Style';

interface ReceiptListProps<TItem> {
  title: string;
  list?: TItem[];
  formatReceipt: (item: TItem) => React.ReactNode;
}
export function ReceiptList<TItem>({
  title,
  list = [],
  formatReceipt,
}: ReceiptListProps<TItem>) {
  return (
    <Group>
      <Paragraph>{title}</Paragraph>
      <ul>
        {list.map((item, idx) => (
          <li key={idx}>{formatReceipt(item)}</li>
        ))}
      </ul>
    </Group>
  );
}

const Group = styled.div`
  /* Group container */
`;



import React from 'react';
import styled from 'styled-components';

import { Paragraph } from '@/modules/invoice/components/Quotation/templates/Invoicing/InvoiceTemplate1/Style';

type ReceiptListProps<T> = {
  title: string;
  list?: T[];
  formatReceipt: (item: T) => React.ReactNode;
};

const EMPTY_RECEIPTS: unknown[] = [];

export function ReceiptList<T>({
  title,
  list = EMPTY_RECEIPTS as T[],
  formatReceipt,
}: ReceiptListProps<T>) {
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

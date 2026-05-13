import React from 'react';
import styled from 'styled-components';

import { Paragraph } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate1/Style';

interface ReceiptListProps<TItem> {
  title: string;
  list?: TItem[];
  formatReceipt: (item: TItem) => React.ReactNode;
}

const EMPTY_RECEIPTS: unknown[] = [];
const receiptObjectKeys = new WeakMap<object, string>();
let receiptObjectKeyCounter = 0;

const resolveReceiptItemKey = (item: unknown): React.Key => {
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const explicitKey = record.id ?? record.key ?? record.ref ?? record.number;
    if (explicitKey != null) {
      return String(explicitKey);
    }
    const existingKey = receiptObjectKeys.get(item);
    if (existingKey) {
      return existingKey;
    }
    receiptObjectKeyCounter += 1;
    const generatedKey = `receipt-${receiptObjectKeyCounter}`;
    receiptObjectKeys.set(item, generatedKey);
    return generatedKey;
  }

  return `${typeof item}:${String(item)}`;
};

export function ReceiptList<TItem>({
  title,
  list = EMPTY_RECEIPTS as TItem[],
  formatReceipt,
}: ReceiptListProps<TItem>) {
  return (
    <Group>
      <Paragraph>{title}</Paragraph>
      <ul>
        {list.map((item) => (
          <li key={resolveReceiptItemKey(item)}>{formatReceipt(item)}</li>
        ))}
      </ul>
    </Group>
  );
}

const Group = styled.div`
  /* Group container */
`;

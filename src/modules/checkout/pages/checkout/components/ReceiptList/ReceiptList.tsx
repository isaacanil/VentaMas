import React from 'react';
import styled from 'styled-components';
import { Paragraph } from '@/modules/checkout/pages/checkout/Style';

type ReceiptListProps<T> = {
  title: string;
  list?: T[];
  formatReceipt: (item: T) => React.ReactNode;
};

const EMPTY_RECEIPT_LIST: unknown[] = [];

export function ReceiptList<T>({
  title,
  list = EMPTY_RECEIPT_LIST as T[],
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

const Group = styled.div``;
